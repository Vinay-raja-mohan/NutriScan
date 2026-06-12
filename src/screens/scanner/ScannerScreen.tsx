import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, StatusBar, Modal, Alert, ActivityIndicator, Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights, FontFamily } from '../../theme/typography';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { useUserStore } from '../../store/userStore';
import { useWasteStore } from '../../store/wasteStore';
import { callGeminiVisionJSON, callGeminiJSON } from '../../services/geminiApi';
import { ScannedLabelItem, Recipe, DetectedIngredient } from '../../types';
import { generateId } from '../../utils/helpers';
import { useRoute } from '@react-navigation/native';

type Tab = 'label' | 'ingredient';

export const ScannerScreen: React.FC = () => {
  const route = useRoute<any>();
  const initialTab = route.params?.initialTab as Tab | undefined;
  
  const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'label');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [scannedItem, setScannedItem] = useState<ScannedLabelItem | null>(null);
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showRecipes, setShowRecipes] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);

  const { profile } = useUserStore();
  const { addWasteSaved } = useWasteStore();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  // Laser animation
  const laserPosition = useSharedValue(0);
  useEffect(() => {
    if (isScanning) {
      laserPosition.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      laserPosition.value = withSpring(0);
    }
  }, [isScanning]);

  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserPosition.value * 200 }],
    opacity: isScanning ? 1 : 0,
  }));

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <Button label="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  const captureImageBase64 = async (useCrop: boolean = false): Promise<string | null> => {
    if (useCrop) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return null;
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.4,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setCapturedImageUri(result.assets[0].uri);
        return result.assets[0].base64 || null;
      }
      return null;
    }

    if (!cameraRef.current) return null;
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.4,
      base64: true,
    });
    setCapturedImageUri(photo.uri);
    return photo.base64 || null;
  };

  const resetScanner = () => {
    setScannedItem(null);
    setDetectedIngredients([]);
    setShowRecipes(false);
    setCapturedImageUri(null);
  };

  const handleScan = async (type: Tab, useCrop: boolean = false) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsScanning(true);
      const base64 = await captureImageBase64(useCrop);
      if (!base64) {
        setIsScanning(false);
        return;
      }

      if (type === 'label') {
        const labelPrompt = `Analyze this food product label/packaging image. Extract nutrition information and assess health safety.
User allergies: ${profile?.allergies?.join(', ') || 'none'}
User conditions: ${profile?.conditions?.join(', ') || 'none'}
User diet type: ${profile?.dietType || 'no restriction'}

Return a JSON object with:
- itemName: string (product name)
- brand: string or null
- nutrition: { calories, protein, carbs, fat, fiber, sugar, sodium, servingSize }
- safetyScore: number 0-100
- allergenFlags: array of { allergen, severity: 'warning'|'danger', message }
- healthFlags: array of { icon (emoji), label, severity: 'good'|'warning'|'danger' }
- verdict: 'safe' | 'caution' | 'avoid'
- alternatives: string[]`;

        const result = await callGeminiVisionJSON<any>(base64, labelPrompt);
        setScannedItem({
          ...result,
          id: generateId(),
          userId: profile?.id || '',
          timestamp: new Date().toISOString(),
          type: 'label',
          addedToLog: false,
        });
      } else {
        const fridgePrompt = `Look at this image of food items/fridge/kitchen counter. Identify all visible food ingredients.
Return a JSON array of objects, each with:
- name: string
- confidence: number 0.0-1.0
- expiringSoon: boolean`;

        const result = await callGeminiVisionJSON<DetectedIngredient[]>(base64, fridgePrompt);
        setDetectedIngredients(result);
        setShowRecipes(false);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateRecipes = async () => {
    try {
      setIsScanning(true);
      const ingredientNames = detectedIngredients.map((i) => i.name).join(', ');
      const expiringItems = detectedIngredients.filter((i) => i.expiringSoon).map((i) => i.name).join(', ');

      const recipePrompt = `I have these ingredients: ${ingredientNames}. Expiring soon: ${expiringItems}.
User diet: ${profile?.dietType || 'none'}. Allergies: ${profile?.allergies?.join(', ') || 'none'}.
Generate 3-4 Indian recipes using these ingredients.
Return a JSON array of recipe objects with: id, name, emoji, prepTimeMin, macros {calories, protein, carbs, fat, fiber}, ingredients[], missingIngredients[], steps[], matchesDietPlan, usesExpiringItems, cuisineTag, dietTags[]`;

      const result = await callGeminiJSON<Recipe[]>(recipePrompt);
      setRecipes(result);
      setShowRecipes(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate recipes.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCookRecipe = async () => {
    if (!selectedRecipe) return;
    
    // Assume 1 meal, 150g of ingredients saved, and 45 INR saved.
    // In a real app this would be calculated dynamically.
    await addWasteSaved(1, 150, 45);
    
    Alert.alert(
      "Eco-Warrior!", 
      "You just cooked a meal from your fridge!\nYou saved 150g of food and reduced CO2 emissions.\n\nCheck your Diet Planner > Waste tab for stats."
    );
    setSelectedRecipe(null);
  };

  const verdictColor = (verdict: string) => verdict === 'safe' ? Colors.success : verdict === 'caution' ? Colors.warning : Colors.danger;
  const verdictBg = (verdict: string) => verdict === 'safe' ? Colors.successLight : verdict === 'caution' ? Colors.warningLight : Colors.dangerLight;
  const verdictIconName = (verdict: string): keyof typeof Ionicons.glyphMap => verdict === 'safe' ? 'checkmark-circle' : verdict === 'caution' ? 'warning' : 'close-circle';

  const hasResults = scannedItem || detectedIngredients.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* CAMERA / VIEWFINDER (Hidden when showing results) */}
      {!hasResults && !isScanning && (
        <>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
          
          <SafeAreaView style={styles.safeArea}>
            <BlurView intensity={30} tint="dark" style={styles.headerGlass}>
              <Text style={styles.title}>Scanner</Text>
              <View style={styles.tabRow}>
                {(['label', 'ingredient'] as Tab[]).map(tab => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.tabActive]}
                    onPress={() => { setActiveTab(tab); resetScanner(); Haptics.selectionAsync(); }}
                  >
                    <View style={styles.tabContent}>
                      <Ionicons
                        name={tab === 'label' ? 'pricetag' : 'restaurant'}
                        size={16}
                        color={activeTab === tab ? '#FFFFFF' : 'rgba(255,255,255,0.7)'}
                      />
                      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                        {tab === 'label' ? 'Food' : 'Recipe'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </BlurView>
          </SafeAreaView>

          <View style={styles.viewfinderContainer}>
            <View style={styles.viewfinderBox}>
              <View style={styles.scanCornerTL} />
              <View style={styles.scanCornerTR} />
              <View style={styles.scanCornerBL} />
              <View style={styles.scanCornerBR} />
              <Animated.View style={[styles.laserLine, laserStyle]} />
            </View>
          </View>

          <View style={styles.actionRowWrapper}>
            <Button
              label={activeTab === 'label' ? 'Scan Food' : 'Scan Ingredients'}
              onPress={() => handleScan(activeTab, true)}
              size="lg"
              style={{ flex: 1 }}
            />
          </View>
        </>
      )}

      {/* FULL SCREEN RESULTS OVERLAY */}
      {(hasResults || isScanning) && (
        <View style={styles.fullScreenResults}>
          {capturedImageUri && (
            <Image source={{ uri: capturedImageUri }} style={StyleSheet.absoluteFill} blurRadius={10} />
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(9, 9, 11, 0.85)' }]} />
          
          <SafeAreaView style={{ flex: 1 }}>
            {isScanning ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Analyzing Image...</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.resultsScroll} showsVerticalScrollIndicator={false}>
                
                {/* Captured Image Preview Thumbnail */}
                {capturedImageUri && (
                  <Image source={{ uri: capturedImageUri }} style={styles.previewThumbnail} />
                )}

                {/* LABEL RESULTS */}
                {activeTab === 'label' && scannedItem && (
                  <View style={styles.resultContainer}>
                    <View style={styles.resultHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{scannedItem.itemName}</Text>
                        {scannedItem.brand && <Text style={styles.brandName}>{scannedItem.brand}</Text>}
                      </View>
                      <View style={[styles.scoreBadge, { backgroundColor: verdictBg(scannedItem.verdict) }]}>
                        <Ionicons
                          name={verdictIconName(scannedItem.verdict)}
                          size={20}
                          color={verdictColor(scannedItem.verdict)}
                        />
                        <Text style={[styles.scoreNum, { color: verdictColor(scannedItem.verdict) }]}>
                          {scannedItem.safetyScore}/100
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.verdictBanner, { backgroundColor: verdictBg(scannedItem.verdict) }]}>
                      <View style={styles.verdictRow}>
                        <Ionicons
                          name={verdictIconName(scannedItem.verdict)}
                          size={18}
                          color={verdictColor(scannedItem.verdict)}
                        />
                        <Text style={[styles.verdictText, { color: verdictColor(scannedItem.verdict) }]}>
                          {scannedItem.verdict.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Nutrition Info */}
                    {scannedItem.nutrition && (
                       <View style={styles.nutritionBox}>
                         <Text style={styles.nutritionTitle}>Nutrition per {scannedItem.nutrition.servingSize}</Text>
                         <Text style={styles.nutritionText}>Calories: {scannedItem.nutrition.calories} kcal</Text>
                         <Text style={styles.nutritionText}>Protein: {scannedItem.nutrition.protein}g  |  Carbs: {scannedItem.nutrition.carbs}g</Text>
                         <Text style={styles.nutritionText}>Fat: {scannedItem.nutrition.fat}g</Text>
                       </View>
                    )}

                    <Button label="Scan Another" onPress={resetScanner} variant="secondary" style={{ marginTop: Spacing[4] }} />
                  </View>
                )}

                {/* RECIPE RESULTS */}
                {activeTab === 'ingredient' && detectedIngredients.length > 0 && !showRecipes && (
                  <View style={styles.resultContainer}>
                    <View style={styles.detectedHeader}>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                      <Text style={styles.flagsTitle}>Detected {detectedIngredients.length} Ingredients</Text>
                    </View>
                    <View style={styles.ingredientGrid}>
                      {detectedIngredients.map((ing, i) => (
                        <View key={i} style={[styles.ingredientChip, ing.expiringSoon && styles.ingredientExpiring]}>
                          <Text style={styles.ingredientName}>{ing.name}</Text>
                          {ing.expiringSoon && (
                            <Ionicons name="time-outline" size={12} color={Colors.warning} />
                          )}
                        </View>
                      ))}
                    </View>
                    <Button label="Generate Recipes" onPress={handleGenerateRecipes} size="lg" fullWidth style={{ marginTop: Spacing[4] }} />
                    <Button label="Scan Again" onPress={resetScanner} variant="secondary" style={{ marginTop: Spacing[2] }} />
                  </View>
                )}

                {/* GENERATED RECIPES */}
                {activeTab === 'ingredient' && showRecipes && (
                  <View style={{ gap: Spacing[3] }}>
                    <View style={styles.detectedHeader}>
                      <Ionicons name="restaurant" size={20} color={Colors.primary} />
                      <Text style={styles.flagsTitle}>Recipes for your ingredients</Text>
                    </View>
                    {recipes.map(recipe => (
                      <TouchableOpacity key={recipe.id} onPress={() => setSelectedRecipe(recipe)} activeOpacity={0.85}>
                        <View style={styles.recipeCard}>
                          <Ionicons name="restaurant" size={28} color={Colors.primary} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.recipeName}>{recipe.name}</Text>
                            <View style={styles.recipeMetaRow}>
                              <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                              <Text style={styles.recipeMeta}>{recipe.prepTimeMin} min</Text>
                              <Ionicons name="flame-outline" size={12} color={Colors.textMuted} />
                              <Text style={styles.recipeMeta}>{recipe.macros.calories} cal</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                    <Button label="Scan Again" onPress={resetScanner} variant="secondary" style={{ marginTop: Spacing[4] }} />
                  </View>
                )}
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      )}

      {/* RECIPE DETAILS MODAL */}
      <Modal visible={!!selectedRecipe} animationType="slide" onRequestClose={() => setSelectedRecipe(null)}>
        {selectedRecipe && (
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <ScrollView contentContainerStyle={{ padding: Spacing[5] }}>
              <TouchableOpacity onPress={() => setSelectedRecipe(null)} style={styles.closeBtn}>
                <Ionicons name="close-circle" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <View style={styles.modalIconContainer}>
                <Ionicons name="restaurant" size={56} color={Colors.primary} />
              </View>
              <Text style={styles.modalTitle}>{selectedRecipe.name}</Text>
              
              <Text style={styles.recipeSubTitle}>Ingredients</Text>
              {selectedRecipe.ingredients.map((ing, i) => <Text key={i} style={styles.recipeStepText}>{'\u2022'} {ing}</Text>)}
              
              <Text style={[styles.recipeSubTitle, { marginTop: Spacing[4] }]}>Instructions</Text>
              {selectedRecipe.steps.map((step, i) => <Text key={i} style={styles.recipeStepText}>{i + 1}. {step}</Text>)}
              
              <Button 
                label="Log as Cooked" 
                onPress={handleCookRecipe} 
                style={{ marginTop: Spacing[6], marginBottom: Spacing[8] }}
              />
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 },
  permissionText: { color: 'white', marginBottom: 20, textAlign: 'center', fontFamily: FontFamily.body },
  safeArea: { position: 'absolute', top: 0, width: '100%', zIndex: 10 },
  headerGlass: { margin: Spacing[4], padding: Spacing[4], borderRadius: Radius['2xl'], overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  title: { fontFamily: FontFamily.display, fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: '#FFFFFF', marginBottom: Spacing[3], textAlign: 'center' },
  tabRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.lg, padding: 4 },
  tab: { flex: 1, paddingVertical: Spacing[2], borderRadius: Radius.md, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary, ...Shadow.primaryGlow },
  tabContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabText: { fontFamily: FontFamily.body, fontSize: FontSizes.base, fontWeight: FontWeights.medium, color: 'rgba(255,255,255,0.7)' },
  tabTextActive: { color: '#FFFFFF', fontWeight: FontWeights.bold },
  viewfinderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  viewfinderBox: { width: 260, height: 260, position: 'relative' },
  scanCornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: Colors.primary, borderTopLeftRadius: 16 },
  scanCornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: Colors.primary, borderTopRightRadius: 16 },
  scanCornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: Colors.primary, borderBottomLeftRadius: 16 },
  scanCornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: Colors.primary, borderBottomRightRadius: 16 },
  laserLine: { width: '100%', height: 2, backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 5 },
  actionRowWrapper: { position: 'absolute', bottom: 110, left: Spacing[4], right: Spacing[4], flexDirection: 'row', gap: Spacing[3] },
  fullScreenResults: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.background, zIndex: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: FontFamily.body, fontSize: FontSizes.base, color: '#FFFFFF', marginTop: Spacing[4] },
  resultsScroll: { padding: Spacing[5], paddingBottom: 120 },
  previewThumbnail: { width: '100%', height: 200, borderRadius: Radius.xl, marginBottom: Spacing[4], borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  resultContainer: { gap: Spacing[3], backgroundColor: Colors.surface, padding: Spacing[5], borderRadius: Radius['2xl'], borderWidth: 1, borderColor: Colors.border },
  resultHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] },
  itemName: { fontFamily: FontFamily.display, fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  brandName: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 2 },
  scoreBadge: { borderRadius: Radius.xl, padding: Spacing[3], alignItems: 'center', minWidth: 72 },
  scoreNum: { fontFamily: FontFamily.display, fontSize: FontSizes.sm, fontWeight: FontWeights.bold, marginTop: 2 },
  verdictBanner: { borderRadius: Radius.lg, padding: Spacing[3], alignItems: 'center', marginTop: Spacing[2] },
  verdictRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verdictText: { fontFamily: FontFamily.display, fontSize: FontSizes.base, fontWeight: FontWeights.bold },
  nutritionBox: { backgroundColor: 'rgba(255,255,255,0.05)', padding: Spacing[4], borderRadius: Radius.lg, marginTop: Spacing[2] },
  nutritionTitle: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, color: Colors.textMuted, marginBottom: Spacing[3], textTransform: 'uppercase', letterSpacing: 1 },
  nutritionText: { fontFamily: FontFamily.display, fontSize: FontSizes.lg, color: Colors.textPrimary, marginBottom: 8, fontWeight: FontWeights.medium },
  detectedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flagsTitle: { fontFamily: FontFamily.display, fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.textPrimary },
  ingredientGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginTop: Spacing[2] },
  ingredientChip: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  ingredientExpiring: { backgroundColor: Colors.warningLight },
  ingredientName: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.textPrimary },
  recipeCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.surface, padding: Spacing[4], borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  recipeName: { fontFamily: FontFamily.display, fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  recipeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  recipeMeta: { fontFamily: FontFamily.body, fontSize: FontSizes.xs, color: Colors.textMuted },
  closeBtn: { alignSelf: 'flex-start', marginBottom: Spacing[4] },
  modalIconContainer: { alignItems: 'center', marginBottom: Spacing[2] },
  modalTitle: { fontFamily: FontFamily.display, fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.textPrimary, textAlign: 'center' },
  recipeSubTitle: { fontFamily: FontFamily.display, fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing[2] },
  recipeStepText: { fontFamily: FontFamily.body, fontSize: FontSizes.base, color: Colors.textSecondary, marginBottom: Spacing[2], lineHeight: 24 },
});
