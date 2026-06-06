import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, StatusBar, Modal, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights, FontFamily } from '../../theme/typography';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { useUserStore } from '../../store/userStore';
import { callGeminiVisionJSON, callGeminiJSON } from '../../services/geminiApi';
import { ScannedLabelItem, Recipe, DetectedIngredient } from '../../types';
import { generateId } from '../../utils/helpers';

type Tab = 'label' | 'ingredient';

const MacroBadge: React.FC<{ label: string; color: string; bg: string }> = ({ label, color, bg }) => (
  <View style={[styles.macroBadge, { backgroundColor: bg }]}>
    <Text style={[styles.macroBadgeText, { color }]}>{label}</Text>
  </View>
);

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

  // Pulsing glow on the scan button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    if (isScanning) {
      const laser = Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(laserAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
        ])
      );
      laser.start();
      return () => laser.stop();
    } else {
      laserAnim.setValue(0);
    }
  }, [isScanning]);

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.permEmoji}>📷</Text>
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permSub}>NutriScan needs camera access to scan food labels and ingredients</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const captureImageBase64 = async (): Promise<string | null> => {
    if (!cameraRef.current) return null;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.4, base64: true });
    return photo.base64 || null;
  };

  const handleLabelScan = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsScanning(true);
      const base64 = await captureImageBase64();
      if (!base64) { setIsScanning(false); return; }

      const result = await callGeminiVisionJSON<any>(base64, `Analyze this food product label.
User allergies: ${profile?.allergies?.join(', ') || 'none'}
User diet: ${profile?.dietType || 'none'}
Return JSON: { itemName, brand, nutrition: {calories,protein,carbs,fat,fiber,sugar,sodium,servingSize}, safetyScore (0-100), allergenFlags: [{allergen,severity,message}], healthFlags: [{icon,label,severity:'good'|'warning'|'danger'}], verdict: 'safe'|'caution'|'avoid', alternatives: string[] }`);

      setScannedItem({ ...result, id: generateId(), userId: profile?.id || '', timestamp: new Date().toISOString(), type: 'label', addedToLog: false });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Scan Failed', 'Could not read the label. Try again with better lighting.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleIngredientScan = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsScanning(true);
      const base64 = await captureImageBase64();
      if (!base64) { setIsScanning(false); return; }

      const result = await callGeminiVisionJSON<DetectedIngredient[]>(base64,
        'Identify all visible food ingredients in this image. Return JSON array: [{name, confidence (0-1), expiringSoon (boolean)}]');
      setDetectedIngredients(result);
      setShowRecipes(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Scan Failed', 'Could not detect ingredients. Try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateRecipes = async () => {
    try {
      setIsScanning(true);
      const names = detectedIngredients.map(i => i.name).join(', ');
      const expiring = detectedIngredients.filter(i => i.expiringSoon).map(i => i.name).join(', ');
      const result = await callGeminiJSON<Recipe[]>(`Ingredients: ${names}. Expiring: ${expiring}.
Diet: ${profile?.dietType}. Allergies: ${profile?.allergies?.join(', ') || 'none'}.
Generate 3 Indian recipes. Return JSON array: [{id,name,emoji,prepTimeMin,macros:{calories,protein,carbs,fat,fiber},ingredients[],missingIngredients[],steps[],matchesDietPlan,usesExpiringItems,cuisineTag,dietTags[]}]`);
      setRecipes(result);
      setShowRecipes(true);
    } catch {
      Alert.alert('Error', 'Failed to generate recipes.');
    } finally {
      setIsScanning(false);
    }
  };

  const verdictColor = (v: string) => v === 'safe' ? Colors.primary : v === 'caution' ? Colors.warning : Colors.danger;
  const verdictBg = (v: string) => v === 'safe' ? Colors.successLight : v === 'caution' ? Colors.warningLight : Colors.dangerLight;
  const verdictEmoji = (v: string) => v === 'safe' ? '✅' : v === 'caution' ? '⚠️' : '❌';

  const resetScan = () => { setScannedItem(null); setDetectedIngredients([]); setShowRecipes(false); };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* Dark overlay gradient for readability */}
      <View style={styles.topOverlay} />
      <View style={styles.bottomOverlay} />

      {/* ── Top Header ── */}
      <SafeAreaView style={styles.safeTop}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scanner</Text>
          {/* Tab toggle */}
          <View style={styles.tabRow}>
            {(['label', 'ingredient'] as Tab[]).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => { setActiveTab(tab); resetScan(); Haptics.selectionAsync(); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'label' ? '🏷️  Food Scanner' : '🥦  Recipe Scanner'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>

      {/* ── AR Viewfinder ── */}
      {!scannedItem && detectedIngredients.length === 0 && !showRecipes && (
        <View style={styles.viewfinderArea}>
          <View style={styles.viewfinder}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {/* Scanning laser */}
            {isScanning && (
              <Animated.View style={[styles.laser, {
                top: laserAnim.interpolate({ inputRange: [0, 1], outputRange: ['5%', '90%'] }),
              }]} />
            )}
            {!isScanning && (
              <Text style={styles.viewfinderHint}>
                {activeTab === 'label' ? 'Point at food label or packaging' : 'Point at your ingredients'}
              </Text>
            )}
            {isScanning && (
              <View style={styles.scanningCenter}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.scanningText}>
                  {activeTab === 'label' ? 'Analyzing food...' : 'Detecting ingredients...'}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── Bottom Sheet ── */}
      <View style={styles.bottomSheet}>
        <BlurView intensity={60} tint="dark" style={styles.blurSheet}>
          <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>

            {/* FOOD SCANNER */}
            {activeTab === 'label' && !scannedItem && (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[styles.scanBtn, isScanning && styles.scanBtnDisabled, Shadow.primaryGlow]}
                  onPress={handleLabelScan}
                  disabled={isScanning}
                  activeOpacity={0.85}
                >
                  <Text style={styles.scanBtnText}>{isScanning ? '⏳  Analyzing...' : '📷  Scan Food Label'}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Food scan result */}
            {scannedItem && (
              <View style={styles.resultBox}>
                <View style={styles.resultTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{scannedItem.itemName}</Text>
                    {scannedItem.brand && <Text style={styles.resultBrand}>{scannedItem.brand}</Text>}
                  </View>
                  <View style={[styles.verdictBadge, { backgroundColor: verdictBg(scannedItem.verdict) }]}>
                    <Text style={styles.verdictEmoji}>{verdictEmoji(scannedItem.verdict)}</Text>
                    <Text style={[styles.verdictScore, { color: verdictColor(scannedItem.verdict) }]}>{scannedItem.safetyScore}/100</Text>
                  </View>
                </View>
                <View style={[styles.verdictBanner, { backgroundColor: verdictBg(scannedItem.verdict) }]}>
                  <Text style={[styles.verdictText, { color: verdictColor(scannedItem.verdict) }]}>
                    {verdictEmoji(scannedItem.verdict)}  {scannedItem.verdict.toUpperCase()} for your profile
                  </Text>
                </View>
                {scannedItem.healthFlags && (
                  <View style={styles.flagsRow}>
                    {scannedItem.healthFlags.slice(0, 4).map((f: any, i: number) => (
                      <View key={i} style={[styles.flagChip, { backgroundColor: f.severity === 'good' ? Colors.successLight : f.severity === 'warning' ? Colors.warningLight : Colors.dangerLight }]}>
                        <Text style={styles.flagChipText}>{f.icon} {f.label}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.nutritionRow}>
                  <MacroBadge label={`🔥 ${scannedItem.nutrition?.calories ?? '--'} kcal`} color={Colors.calories} bg={Colors.caloriesMuted} />
                  <MacroBadge label={`P: ${scannedItem.nutrition?.protein ?? '--'}g`} color={Colors.protein} bg={Colors.proteinMuted} />
                  <MacroBadge label={`C: ${scannedItem.nutrition?.carbs ?? '--'}g`} color={Colors.carbs} bg={Colors.carbsMuted} />
                  <MacroBadge label={`F: ${scannedItem.nutrition?.fat ?? '--'}g`} color={Colors.fat} bg={Colors.fatMuted} />
                </View>
                <TouchableOpacity style={styles.scanAgainBtn} onPress={resetScan}>
                  <Text style={styles.scanAgainText}>↩  Scan Another</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* RECIPE SCANNER */}
            {activeTab === 'ingredient' && detectedIngredients.length === 0 && (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[styles.scanBtn, isScanning && styles.scanBtnDisabled, Shadow.primaryGlow]}
                  onPress={handleIngredientScan}
                  disabled={isScanning}
                  activeOpacity={0.85}
                >
                  <Text style={styles.scanBtnText}>{isScanning ? '⏳  Detecting...' : '📷  Scan Ingredients'}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Ingredients detected */}
            {detectedIngredients.length > 0 && !showRecipes && (
              <View style={styles.resultBox}>
                <Text style={styles.resultName}>✅  {detectedIngredients.length} Ingredients Detected</Text>
                <View style={styles.chipGrid}>
                  {detectedIngredients.map((ing, i) => (
                    <View key={i} style={[styles.ingredientChip, ing.expiringSoon && styles.ingredientChipExpiring]}>
                      <Text style={styles.ingredientChipText}>{ing.name}</Text>
                      {ing.expiringSoon && <Text style={styles.expiringDot}>🕐</Text>}
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.scanBtn, isScanning && styles.scanBtnDisabled, Shadow.primaryGlow]}
                  onPress={handleGenerateRecipes}
                  disabled={isScanning}
                >
                  <Text style={styles.scanBtnText}>{isScanning ? '⏳  Generating...' : '🍳  Generate Recipes'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.scanAgainBtn} onPress={resetScan}>
                  <Text style={styles.scanAgainText}>↩  Scan Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Recipes */}
            {showRecipes && (
              <View style={{ gap: Spacing[3] }}>
                <Text style={styles.resultName}>🍛  Recipes for Your Ingredients</Text>
                {recipes.map(recipe => (
                  <TouchableOpacity key={recipe.id} style={styles.recipeCard} onPress={() => setSelectedRecipe(recipe)} activeOpacity={0.8}>
                    <Text style={styles.recipeEmoji}>{recipe.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recipeName}>{recipe.name}</Text>
                      <View style={styles.recipeMeta}>
                        <MacroBadge label={`⏱ ${recipe.prepTimeMin}m`} color={Colors.textSecondary} bg={Colors.surface} />
                        <MacroBadge label={`🔥 ${recipe.macros.calories}`} color={Colors.calories} bg={Colors.caloriesMuted} />
                        {recipe.matchesDietPlan && <MacroBadge label="✅ Matches Plan" color={Colors.primary} bg={Colors.successLight} />}
                        {recipe.usesExpiringItems > 0 && <MacroBadge label="♻️ Expiring" color={Colors.warning} bg={Colors.warningLight} />}
                      </View>
                    </View>
                    <Text style={styles.arrowIcon}>›</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.scanAgainBtn} onPress={resetScan}>
                  <Text style={styles.scanAgainText}>↩  Scan Again</Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </BlurView>
      </View>

      {/* Recipe Detail Modal */}
      <Modal visible={!!selectedRecipe} animationType="slide" onRequestClose={() => setSelectedRecipe(null)}>
        {selectedRecipe && (
          <SafeAreaView style={styles.modalSafe}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedRecipe(null)}>
                <Text style={styles.closeBtnText}>✕  Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalEmoji}>{selectedRecipe.emoji}</Text>
              <Text style={styles.modalTitle}>{selectedRecipe.name}</Text>
              <View style={styles.recipeMeta}>
                <MacroBadge label={`⏱ ${selectedRecipe.prepTimeMin} min`} color={Colors.textSecondary} bg={Colors.surface} />
                <MacroBadge label={`🔥 ${selectedRecipe.macros.calories} kcal`} color={Colors.calories} bg={Colors.caloriesMuted} />
                <MacroBadge label={`P: ${selectedRecipe.macros.protein}g`} color={Colors.protein} bg={Colors.proteinMuted} />
              </View>
              <Text style={styles.modalSection}>Ingredients</Text>
              {selectedRecipe.ingredients.map((ing, i) => <Text key={i} style={styles.modalItem}>• {ing}</Text>)}
              {selectedRecipe.missingIngredients.length > 0 && (
                <Text style={styles.missingText}>Also need: {selectedRecipe.missingIngredients.join(', ')}</Text>
              )}
              <Text style={styles.modalSection}>Steps</Text>
              {selectedRecipe.steps.map((step, i) => <Text key={i} style={styles.modalStep}>{i + 1}. {step}</Text>)}
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </View>
  );
};

const VFSIZE = 240;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Permission screen
  permContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing[6], gap: Spacing[3] },
  permEmoji: { fontSize: 64 },
  permTitle: { fontFamily: FontFamily.display, fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.textPrimary, textAlign: 'center' },
  permSub: { fontFamily: FontFamily.body, fontSize: FontSizes.base, color: Colors.textSecondary, textAlign: 'center' },
  permBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing[4], paddingHorizontal: Spacing[8], marginTop: Spacing[3], ...Shadow.primaryGlow },
  permBtnText: { fontFamily: FontFamily.display, fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.textInverse },

  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 200, backgroundColor: 'rgba(13,31,15,0.7)' },
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 360, backgroundColor: 'rgba(13,31,15,0.7)' },

  // Header
  safeTop: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  header: { padding: Spacing[4], gap: Spacing[3] },
  headerTitle: { fontFamily: FontFamily.display, fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.textPrimary, textAlign: 'center' },
  tabRow: { flexDirection: 'row', backgroundColor: 'rgba(13,31,15,0.7)', borderRadius: Radius.full, padding: 4, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  tab: { flex: 1, paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], borderRadius: Radius.full, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary, ...Shadow.primaryGlow },
  tabText: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: 'rgba(255,255,255,0.6)' },
  tabTextActive: { color: Colors.textInverse, fontWeight: FontWeights.bold },

  // Viewfinder
  viewfinderArea: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 120 },
  viewfinder: { width: VFSIZE, height: VFSIZE, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: Colors.primary, borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 10 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 10 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 10 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 10 },
  laser: {
    position: 'absolute', left: 8, right: 8, height: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 10,
  },
  viewfinderHint: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.5)', textAlign: 'center', paddingHorizontal: Spacing[4] },
  scanningCenter: { alignItems: 'center', gap: Spacing[2] },
  scanningText: { fontFamily: FontFamily.display, fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.primary },

  // Bottom Sheet
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  blurSheet: { borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, maxHeight: 380 },
  sheetContent: { padding: Spacing[5] },

  // Scan button
  scanBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing[4], alignItems: 'center' },
  scanBtnDisabled: { opacity: 0.6 },
  scanBtnText: { fontFamily: FontFamily.display, fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.textInverse },

  // Results
  resultBox: { gap: Spacing[3] },
  resultTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] },
  resultName: { fontFamily: FontFamily.display, fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  resultBrand: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, color: Colors.textSecondary },
  verdictBadge: { borderRadius: Radius.xl, padding: Spacing[3], alignItems: 'center', minWidth: 70 },
  verdictEmoji: { fontSize: 20 },
  verdictScore: { fontFamily: FontFamily.display, fontSize: FontSizes.sm, fontWeight: FontWeights.bold },
  verdictBanner: { borderRadius: Radius.lg, paddingVertical: Spacing[2], paddingHorizontal: Spacing[4], alignItems: 'center' },
  verdictText: { fontFamily: FontFamily.display, fontSize: FontSizes.sm, fontWeight: FontWeights.bold },
  flagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  flagChip: { borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] },
  flagChipText: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.textPrimary },
  nutritionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  macroBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] },
  macroBadgeText: { fontFamily: FontFamily.body, fontSize: 11, fontWeight: FontWeights.semibold },
  scanAgainBtn: { alignItems: 'center', paddingVertical: Spacing[3] },
  scanAgainText: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.primary },

  // Ingredients
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  ingredientChip: { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border },
  ingredientChipExpiring: { borderColor: Colors.warning, backgroundColor: Colors.warningLight },
  ingredientChipText: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, color: Colors.textPrimary },
  expiringDot: { fontSize: 12 },

  // Recipes
  recipeCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing[3], borderWidth: 1, borderColor: Colors.border },
  recipeEmoji: { fontSize: 36 },
  recipeName: { fontFamily: FontFamily.display, fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginBottom: 4 },
  recipeMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[1] },
  arrowIcon: { fontSize: 24, color: Colors.primary, fontWeight: FontWeights.bold },

  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalScroll: { padding: Spacing[5], gap: Spacing[3] },
  closeBtn: { alignSelf: 'flex-start', marginBottom: Spacing[2] },
  closeBtnText: { fontFamily: FontFamily.body, fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.primary },
  modalEmoji: { fontSize: 64, textAlign: 'center' },
  modalTitle: { fontFamily: FontFamily.display, fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.textPrimary, textAlign: 'center' },
  modalSection: { fontFamily: FontFamily.display, fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginTop: Spacing[3] },
  modalItem: { fontFamily: FontFamily.body, fontSize: FontSizes.base, color: Colors.textSecondary, paddingVertical: 2 },
  missingText: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, color: Colors.textMuted, fontStyle: 'italic' },
  modalStep: { fontFamily: FontFamily.body, fontSize: FontSizes.base, color: Colors.textSecondary, paddingVertical: Spacing[2], lineHeight: 22 },
});
