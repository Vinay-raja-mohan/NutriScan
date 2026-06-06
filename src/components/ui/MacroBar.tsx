import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/typography';
import { Radius, Spacing } from '../../theme/spacing';
import { Macros } from '../../types';

interface MacroBarProps {
  macros: Macros;
  style?: object;
}

export const MacroBar: React.FC<MacroBarProps> = ({ macros, style }) => {
  const { calories, protein, carbs, fat } = macros;
  const total = protein * 4 + carbs * 4 + fat * 9;

  const proteinPct = total > 0 ? (protein * 4 / total) * 100 : 33;
  const carbsPct = total > 0 ? (carbs * 4 / total) * 100 : 33;
  const fatPct = total > 0 ? (fat * 9 / total) * 100 : 34;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.bar}>
        <View style={[styles.segment, { width: `${proteinPct}%`, backgroundColor: Colors.protein }]} />
        <View style={[styles.segment, { width: `${carbsPct}%`, backgroundColor: Colors.carbs }]} />
        <View style={[styles.segment, { width: `${fatPct}%`, backgroundColor: Colors.fat }]} />
      </View>
      <View style={styles.legend}>
        <MacroLegendItem label="Protein" value={protein} unit="g" color={Colors.protein} />
        <MacroLegendItem label="Carbs" value={carbs} unit="g" color={Colors.carbs} />
        <MacroLegendItem label="Fat" value={fat} unit="g" color={Colors.fat} />
      </View>
    </View>
  );
};

const MacroLegendItem: React.FC<{
  label: string;
  value: number;
  unit: string;
  color: string;
}> = ({ label, value, unit, color }) => (
  <View style={styles.legendItem}>
    <View style={[styles.dot, { backgroundColor: color }]} />
    <View>
      <Text style={styles.legendValue}>{value}{unit}</Text>
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: Spacing[2],
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: Colors.border,
    gap: 1,
  },
  segment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  legendValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  legendLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
});
