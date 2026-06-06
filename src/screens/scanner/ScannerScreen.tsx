import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, StatusBar, Modal, Alert, ActivityIndicator,
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
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights, FontFamily } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { useUserStore } from '../../store/userStore';
import { callGeminiVisionJSON, callGeminiJSON } from '../../services/geminiApi';
import { ScannedLabelItem, Recipe, DetectedIngredient } from '../../types';
import { generateId } from '../../utils/helpers';

type Tab = 'label' | 'ingredient';

export const ScannerScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('label');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState<ScannedLabelItem | null>(null);
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showRecipes, setShowRecipes] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const { profile } = useUserStore();
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
    transform: [{ translateY: laserPosition.value * 200 }], // Adjust 200 based on viewfinder height
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

  const captureImageBase64 = async (): Promise<string | null> => {
    if (!cameraRef.current) return null;
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.4,
      base64: true,
    });
    return photo.base64 || null;
  };

  const handleLabelScan = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsScanning(true);
      const base64 = await captureImageBase64();
      if (!base64) {
        setIsScanning(false);
        return;
      }

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze label.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFridgeScan = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsScanning(true);
      const base64 = await captureImageBase64();
      if (!base64) {
        setIsScanning(false);
        return;
      }

      const fridgePrompt = `Look at this image of food items/fridge/kitchen counter. Identify all visible food ingredients.
Return a JSON array of objects, each with:
- name: string
- confidence: number 0.0-1.0
- expiringSoon: boolean`;

      const result = await callGeminiVisionJSON<DetectedIngredient[]>(base64, fridgePrompt);
      setDetectedIngredients(result);
      setShowRecipes(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze fridge.');
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

  const verdictColor = (verdict: string) => verdict === 'safe' ? Colors.success : verdict === 'caution' ? Colors.warning : Colors.danger;
  const verdictBg = (verdict: string) => verdict === 'safe' ? Colors.successLight : verdict === 'caution' ? Colors.warningLight : Colors.dangerLight;
  const verdictEmoji = (verdict: string) => verdict === 'safe' ? '✅' : verdict === 'caution' ? '⚠️' : '❌';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      
      {/* Floating Header */}
      <SafeAreaView style={styles.safeArea}>
        <BlurView intensity={30} tint="dark" style={styles.headerGlass}>
          <Text style={styles.title}>Scanner</Text>
          <View style={styles.tabRow}>
            {(['label', 'ingredient'] as Tab[]).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => { setActiveTab(tab); setScannedItem(null); setDetectedIngredients([]); setShowRecipes(false); Haptics.selectionAsync(); }}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'label' ? '🏷️ Food' : '🥦 Recipe'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>
      </SafeAreaView>

      {/* AR Viewfinder */}
      <View style={styles.viewfinderContainer}>
        <View style={styles.viewfinderBox}>
          <View style={styles.scanCornerTL} />
          <View style={styles.scanCornerTR} />
          <View style={styles.scanCornerBL} />
          <View style={styles.scanCornerBR} />
          <Animated.View style={[styles.laserLine, laserStyle]} />
        </View>
      </View>

      {/* Floating Bottom Sheet */}
      <View style={styles.bottomSheetWrapper}>
        <BlurView intensity={50} tint="dark" style={styles.bottomSheet}>
          <ScrollView contentContainerStyle={styles.bottomSheetScroll} showsVerticalScrollIndicator={false}>
            {activeTab === 'label' ? (
              <View style={styles.section}>
                {!scannedItem && (
                  <Button
                    label={isScanning ? 'Analyzing Food...' : 'Scan Food'}
                    onPress={handleLabelScan}
                    loading={isScanning}
                    disabled={isScanning}
                    size="lg"
                    fullWidth
                  />
                )}
                {scannedItem && (
                  <View style={styles.resultContainer}>
                    <View style={styles.resultHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{scannedItem.itemName}</Text>
                        {scannedItem.brand && <Text style={styles.brandName}>{scannedItem.brand}</Text>}
                      </View>
                      <View style={[styles.scoreBadge, { backgroundColor: verdictBg(scannedItem.verdict) }]}>
                        <Text style={styles.scoreEmoji}>{verdictEmoji(scannedItem.verdict)}</Text>
                        <Text style={[styles.scoreNum, { color: verdictColor(scannedItem.verdict) }]}>
                          {scannedItem.safetyScore}/100
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.verdictBanner, { backgroundColor: verdictBg(scannedItem.verdict) }]}>
                      <Text style={[styles.verdictText, { color: verdictColor(scannedItem.verdict) }]}>
                        {verdictEmoji(scannedItem.verdict)} {scannedItem.verdict.toUpperCase()}
                      </Text>
                    </View>
                    <Button label="Scan Another" onPress={() => setScannedItem(null)} variant="secondary" style={{ marginTop: Spacing[4] }} />
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.section}>
                {detectedIngredients.length === 0 && (
                  <Button
                    label={isScanning ? 'Detecting...' : 'Scan Ingredients'}
                    onPress={handleFridgeScan}
                    loading={isScanning}
                    disabled={isScanning}
                    size="lg"
                    fullWidth
                  />
                )}
                {detectedIngredients.length > 0 && !showRecipes && (
                  <View style={styles.resultContainer}>
                    <Text style={styles.flagsTitle}>✅ Detected {detectedIngredients.length} Ingredients</Text>
                    <View style={styles.ingredientGrid}>
                      {detectedIngredients.map((ing, i) => (
                        <View key={i} style={[styles.ingredientChip, ing.expiringSoon && styles.ingredientExpiring]}>
                          <Text style={styles.ingredientName}>{ing.name}</Text>
                          {ing.expiringSoon && <Text style={styles.expiringTag}>🕐</Text>}
                        </View>
                      ))}
                    </View>
                    <Button label="🍳 Generate Recipes" onPress={handleGenerateRecipes} loading={isScanning} disabled={isScanning} size="lg" fullWidth style={{ marginTop: Spacing[4] }} />
                    <Button label="Scan Again" onPress={() => setDetectedIngredients([])} variant="secondary" style={{ marginTop: Spacing[2] }} />
                  </View>
                )}
                {showRecipes && (
                  <View style={{ gap: Spacing[3] }}>
                    <Text style={styles.flagsTitle}>🍛 Recipes for your ingredients</Text>
                    {recipes.map(recipe => (
                      <TouchableOpacity key={recipe.id} onPress={() => setSelectedRecipe(recipe)} activeOpacity={0.85}>
                        <View style={styles.recipeCard}>
                          <Text style={styles.recipeEmoji}>{recipe.emoji}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.recipeName}>{recipe.name}</Text>
                            <Text style={styles.recipeMeta}>⏱ {recipe.prepTimeMin} min  🔥 {recipe.macros.calories} cal</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                    <Button label="Scan Again" onPress={() => { setDetectedIngredients([]); setShowRecipes(false); }} variant="secondary" style={{ marginTop: Spacing[4] }} />
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </BlurView>
      </View>

      <Modal visible={!!selectedRecipe} animationType="slide" onRequestClose={() => setSelectedRecipe(null)}>
        {selectedRecipe && (
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <ScrollView contentContainerStyle={{ padding: Spacing[5] }}>
              <TouchableOpacity onPress={() => setSelectedRecipe(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕ Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalEmoji}>{selectedRecipe.emoji}</Text>
              <Text style={styles.modalTitle}>{selectedRecipe.name}</Text>
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
  tabActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabText: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: 'rgba(255,255,255,0.7)' },
  tabTextActive: { color: '#FFFFFF', fontWeight: FontWeights.bold },
  viewfinderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  viewfinderBox: { width: 260, height: 260, position: 'relative' },
  scanCornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: Colors.primary, borderTopLeftRadius: 16 },
  scanCornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: Colors.primary, borderTopRightRadius: 16 },
  scanCornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: Colors.primary, borderBottomLeftRadius: 16 },
  scanCornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: Colors.primary, borderBottomRightRadius: 16 },
  laserLine: { width: '100%', height: 2, backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 5 },
  bottomSheetWrapper: { position: 'absolute', bottom: 0, width: '100%', padding: Spacing[4] },
  bottomSheet: { borderRadius: Radius['2xl'], overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', maxHeight: 400 },
  bottomSheetScroll: { padding: Spacing[5] },
  section: { gap: Spacing[3] },
  resultContainer: { gap: Spacing[3] },
  resultHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] },
  itemName: { fontFamily: FontFamily.display, fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  brandName: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 2 },
  scoreBadge: { borderRadius: Radius.xl, padding: Spacing[3], alignItems: 'center', minWidth: 72 },
  scoreEmoji: { fontSize: 20 },
  scoreNum: { fontFamily: FontFamily.display, fontSize: FontSizes.sm, fontWeight: FontWeights.bold, marginTop: 2 },
  verdictBanner: { borderRadius: Radius.lg, padding: Spacing[3], alignItems: 'center' },
  verdictText: { fontFamily: FontFamily.display, fontSize: FontSizes.base, fontWeight: FontWeights.bold },
  flagsTitle: { fontFamily: FontFamily.display, fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.textPrimary },
  ingredientGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginTop: Spacing[2] },
  ingredientChip: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  ingredientExpiring: { backgroundColor: Colors.warningLight },
  ingredientName: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.textPrimary },
  expiringTag: { fontSize: FontSizes.xs },
  recipeCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: 'rgba(255,255,255,0.05)', padding: Spacing[3], borderRadius: Radius.lg },
  recipeEmoji: { fontSize: 32 },
  recipeName: { fontFamily: FontFamily.display, fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  recipeMeta: { fontFamily: FontFamily.body, fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  closeBtn: { alignSelf: 'flex-start', marginBottom: Spacing[4] },
  closeBtnText: { fontFamily: FontFamily.body, fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.primary },
  modalEmoji: { fontSize: 56, textAlign: 'center', marginBottom: Spacing[2] },
  modalTitle: { fontFamily: FontFamily.display, fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.textPrimary, textAlign: 'center' },
});
