import { ScannedLabelItem } from '../types';

export const MOCK_SCANNED_ITEMS: ScannedLabelItem[] = [
  {
    id: 'scan_1',
    userId: 'demo',
    timestamp: new Date().toISOString(),
    type: 'label',
    itemName: "Lay's Classic Salted Chips",
    brand: "Lay's",
    nutrition: {
      calories: 153,
      protein: 2,
      carbs: 15,
      fat: 10,
      sodium: 780,
      sugar: 1,
      servingSize: '28g (1 oz)',
    },
    safetyScore: 42,
    allergenFlags: [
      { allergen: 'gluten', severity: 'danger', message: 'Contains wheat derivatives — matches your gluten allergy' },
    ],
    healthFlags: [
      { icon: '❌', label: 'High Sodium (780mg)', severity: 'danger' },
      { icon: '❌', label: 'High Saturated Fat', severity: 'warning' },
      { icon: '✅', label: 'No added MSG', severity: 'good' },
    ],
    verdict: 'avoid',
    alternatives: ['Roasted Makhana (88/100)', 'Baked Multigrain Chips (74/100)'],
    addedToLog: false,
  },
  {
    id: 'scan_2',
    userId: 'demo',
    timestamp: new Date().toISOString(),
    type: 'label',
    itemName: 'Saffola Gold Oats',
    brand: 'Saffola',
    nutrition: {
      calories: 149,
      protein: 5,
      carbs: 23,
      fat: 3,
      sodium: 8,
      sugar: 1,
      servingSize: '40g',
    },
    safetyScore: 88,
    allergenFlags: [],
    healthFlags: [
      { icon: '✅', label: 'Low Sodium (8mg)', severity: 'good' },
      { icon: '✅', label: 'High Fiber', severity: 'good' },
      { icon: '✅', label: 'Low Sugar', severity: 'good' },
    ],
    verdict: 'safe',
    alternatives: [],
    addedToLog: true,
  },
];

export const MOCK_DETECTED_INGREDIENTS = [
  { name: 'Spinach', confidence: 0.94, expiringSoon: true },
  { name: 'Paneer', confidence: 0.91, expiringSoon: true },
  { name: 'Tomatoes', confidence: 0.97, expiringSoon: false },
  { name: 'Onions', confidence: 0.95, expiringSoon: false },
  { name: 'Garlic', confidence: 0.88, expiringSoon: false },
  { name: 'Green Chilies', confidence: 0.82, expiringSoon: false },
];
