import { WeeklyDietPlan, MealSlot, DayPlan } from '../types';

function makeMeal(id: string, name: string, description: string, calories: number, protein: number, carbs: number, fat: number, ingredients: string[], prepTimeMin: number, steps: string[], cuisineTag: string, wasteReduction = false): MealSlot {
  return {
    id,
    name,
    description,
    macros: { calories, protein, carbs, fat },
    ingredients,
    prepTimeMin,
    recipeSteps: steps,
    status: 'upcoming',
    cuisineTag,
    wasteReduction,
  };
}

export function MOCK_DIET_PLAN(userId: string): WeeklyDietPlan {
  return {
    userId,
    weekStartDate: new Date().toISOString().split('T')[0],
    days: {
      monday: {
        targetCalories: 1800,
        breakfast: makeMeal('mon_b', 'Oats Upma with Vegetables', 'Savory oats cooked with seasonal vegetables and spices', 320, 12, 52, 7, ['Oats 80g', 'Onion', 'Tomato', 'Peas', 'Mustard seeds', 'Curry leaves', 'Oil'], 15, ['Dry roast oats for 3 min', 'Temper mustard seeds and curry leaves', 'Add vegetables and sauté', 'Add oats and water', 'Cook on low heat for 5 min', 'Serve hot'], 'Indian'),
        lunch: makeMeal('mon_l', 'Dal Tadka with Brown Rice', 'Protein-rich yellow lentils with aromatic tempering on brown rice', 520, 22, 88, 9, ['Toor dal 100g', 'Brown rice 80g', 'Onion', 'Tomato', 'Garlic', 'Cumin', 'Ghee 5g'], 30, ['Pressure cook dal', 'Cook brown rice separately', 'Prepare tempering with cumin and garlic', 'Add onion-tomato masala', 'Mix with dal', 'Serve over rice'], 'Indian'),
        dinner: makeMeal('mon_d', 'Grilled Paneer with Roti & Sabzi', 'Marinated paneer with whole wheat roti and seasonal vegetable curry', 480, 28, 55, 14, ['Paneer 100g', 'Whole wheat roti x2', 'Mixed vegetables', 'Yogurt', 'Spices'], 25, ['Marinate paneer in yogurt and spices', 'Grill or pan-cook paneer', 'Prepare vegetable sabzi', 'Make fresh rotis', 'Plate together'], 'Indian'),
        snack: makeMeal('mon_s', 'Mixed Nuts & Greek Yogurt', 'A mix of almonds, walnuts with protein-rich yogurt', 280, 14, 22, 16, ['Greek yogurt 150g', 'Almonds 15g', 'Walnuts 10g', 'Honey 5g'], 2, ['Scoop yogurt into bowl', 'Top with mixed nuts', 'Drizzle honey', 'Serve immediately'], 'Healthy'),
      } as DayPlan,
      tuesday: {
        targetCalories: 1800,
        breakfast: makeMeal('tue_b', 'Moong Dal Chilla', 'High-protein green moong pancakes', 290, 18, 38, 6, ['Moong dal 80g', 'Ginger', 'Green chili', 'Coriander', 'Oil'], 20, ['Soak and grind moong dal', 'Add spices', 'Make thin pancakes on tawa', 'Serve with chutney'], 'Indian'),
        lunch: makeMeal('tue_l', 'Rajma Chawal', 'Classic kidney beans curry with rice', 550, 20, 92, 8, ['Rajma 100g', 'Rice 80g', 'Onion', 'Tomato', 'Spices', 'Oil'], 40, ['Soak rajma overnight', 'Pressure cook rajma', 'Prepare masala', 'Mix and simmer', 'Serve with rice'], 'Indian'),
        dinner: makeMeal('tue_d', 'Palak Tofu', 'Spinach gravy with tofu (vegan paneer alternative)', 380, 22, 28, 18, ['Tofu 150g', 'Spinach 200g', 'Onion', 'Garlic', 'Cream 20ml'], 30, ['Blanch and puree spinach', 'Pan-fry tofu cubes', 'Prepare onion-garlic base', 'Add spinach puree', 'Add tofu and simmer'], 'Indian', true),
        snack: makeMeal('tue_s', 'Fruit Chaat', 'Seasonal fruits with chaat masala', 180, 3, 44, 1, ['Apple', 'Banana', 'Pomegranate', 'Chaat masala', 'Lemon'], 5, ['Chop fruits', 'Mix with chaat masala and lemon juice', 'Serve fresh'], 'Healthy'),
      } as DayPlan,
      wednesday: {
        targetCalories: 1800,
        breakfast: makeMeal('wed_b', 'Poha with Peanuts', 'Flattened rice with peanuts and spices', 310, 10, 55, 8, ['Poha 80g', 'Peanuts 20g', 'Onion', 'Curry leaves', 'Turmeric', 'Mustard seeds'], 15, ['Wash and drain poha', 'Temper spices with peanuts', 'Add onion and cook', 'Mix poha', 'Cook for 5 min'], 'Indian'),
        lunch: makeMeal('wed_l', 'Chole with Phulka', 'Spiced chickpea curry with soft whole wheat rotis', 530, 21, 86, 10, ['Chickpeas 120g', 'Phulka x3', 'Onion', 'Tomato', 'Amchur', 'Spices'], 35, ['Pressure cook chickpeas', 'Prepare masala base', 'Add chickpeas and simmer', 'Make phulkas', 'Serve together'], 'Indian'),
        dinner: makeMeal('wed_d', 'Vegetable Khichdi', 'Wholesome one-pot dal-rice with vegetables', 430, 18, 72, 9, ['Moong dal 60g', 'Rice 60g', 'Carrot', 'Beans', 'Peas', 'Ghee 5g', 'Cumin'], 25, ['Dry roast dal', 'Add rice and water', 'Add vegetables', 'Pressure cook 3 whistles', 'Temper with cumin and ghee'], 'Indian', true),
        snack: makeMeal('wed_s', 'Roasted Makhana', 'Air-popped lotus seeds with light seasoning', 180, 5, 32, 3, ['Makhana 40g', 'Ghee 3g', 'Salt', 'Pepper', 'Chaat masala'], 8, ['Heat pan with ghee', 'Add makhana', 'Roast until crispy', 'Season and serve'], 'Healthy'),
      } as DayPlan,
      thursday: {
        targetCalories: 1800,
        breakfast: makeMeal('thu_b', 'Idli with Sambar', 'Steamed rice cakes with lentil vegetable soup', 320, 12, 62, 4, ['Idli x3', 'Sambar 200ml', 'Coconut chutney', 'Tomato chutney'], 10, ['Steam idlis', 'Heat sambar', 'Serve with chutneys'], 'South Indian'),
        lunch: makeMeal('thu_l', 'Aloo Matar Curry with Roti', 'Potato and peas curry with whole wheat roti', 490, 15, 82, 11, ['Potato 150g', 'Peas 80g', 'Roti x2', 'Onion', 'Tomato', 'Spices'], 30, ['Boil potatoes', 'Prepare masala', 'Add peas', 'Simmer 15 min', 'Serve with roti'], 'Indian'),
        dinner: makeMeal('thu_d', 'Baingan Bharta with Roti', 'Smoky roasted eggplant mash with whole wheat roti', 360, 9, 52, 13, ['Eggplant 300g', 'Roti x2', 'Onion', 'Tomato', 'Green chili', 'Garlic'], 30, ['Roast eggplant on flame', 'Mash and peel', 'Sauté with onion-tomato masala', 'Mix together', 'Serve with roti'], 'Indian', true),
        snack: makeMeal('thu_s', 'Banana with Peanut Butter', 'Energy-dense snack with healthy fats', 240, 8, 36, 10, ['Banana 1 large', 'Peanut butter 15g'], 2, ['Slice banana', 'Spread peanut butter', 'Serve'], 'Healthy'),
      } as DayPlan,
      friday: {
        targetCalories: 1800,
        breakfast: makeMeal('fri_b', 'Besan Chilla with Chutney', 'Chickpea flour savory pancakes', 280, 15, 36, 9, ['Besan 80g', 'Onion', 'Tomato', 'Coriander', 'Green chili', 'Oil'], 15, ['Make smooth batter', 'Add vegetables', 'Cook on tawa', 'Serve with chutney'], 'Indian'),
        lunch: makeMeal('fri_l', 'Paneer Bhurji with Brown Rice', 'Scrambled spiced paneer on brown rice', 510, 26, 62, 17, ['Paneer 120g', 'Brown rice 80g', 'Onion', 'Tomato', 'Bell pepper', 'Spices'], 25, ['Crumble paneer', 'Sauté vegetables', 'Add paneer and spices', 'Cook 5 min', 'Serve over rice'], 'Indian'),
        dinner: makeMeal('fri_d', 'Mixed Dal with Jeera Rice', 'Five-lentil blend served with cumin rice', 480, 24, 76, 8, ['Mixed dal 100g', 'Rice 70g', 'Jeera', 'Ghee', 'Spices'], 35, ['Cook mixed dal', 'Prepare jeera rice', 'Temper dal', 'Plate together'], 'Indian'),
        snack: makeMeal('fri_s', 'Sprouts Chaat', 'Germinated moong sprouts with tangy dressing', 160, 10, 28, 2, ['Moong sprouts 100g', 'Onion', 'Tomato', 'Lemon', 'Chaat masala'], 5, ['Rinse sprouts', 'Chop vegetables', 'Mix with dressing', 'Serve fresh'], 'Healthy', true),
      } as DayPlan,
      saturday: {
        targetCalories: 1900,
        breakfast: makeMeal('sat_b', 'Masala Dosa with Sambar', 'Crispy rice crepe with spiced potato filling', 420, 10, 78, 8, ['Dosa batter', 'Potato 150g', 'Onion', 'Curry leaves', 'Sambar', 'Coconut chutney'], 20, ['Spread dosa batter', 'Cook until crispy', 'Add potato masala filling', 'Fold and serve with sambar'], 'South Indian'),
        lunch: makeMeal('sat_l', 'Vegetable Biryani', 'Fragrant basmati rice with mixed vegetables', 580, 15, 105, 11, ['Basmati rice 100g', 'Mixed vegetables 200g', 'Whole spices', 'Saffron', 'Fried onions', 'Ghee'], 50, ['Parboil rice', 'Cook vegetable masala', 'Layer rice and masala', 'Dum cook 20 min', 'Garnish with fried onions'], 'Indian'),
        dinner: makeMeal('sat_d', 'Paneer Tikka Masala', 'Grilled paneer in rich tomato-cream gravy', 520, 26, 42, 22, ['Paneer 150g', 'Tomatoes', 'Cream 30ml', 'Whole spices', 'Kasuri methi'], 40, ['Marinate and grill paneer', 'Prepare tomato base', 'Add cream and spices', 'Add paneer', 'Simmer 10 min'], 'Indian'),
        snack: makeMeal('sat_s', 'Homemade Granola Bar', 'Oat, nuts and honey energy bar', 280, 8, 40, 11, ['Oats', 'Almonds', 'Honey', 'Jaggery', 'Seeds'], 30, ['Mix ingredients', 'Press into tray', 'Bake 20 min at 170C', 'Cool and cut'], 'Healthy'),
      } as DayPlan,
      sunday: {
        targetCalories: 1900,
        breakfast: makeMeal('sun_b', 'Aloo Paratha with Curd', 'Stuffed whole wheat flatbread with spiced potato', 420, 12, 72, 10, ['Whole wheat flour', 'Potato 150g', 'Curd 100g', 'Spices', 'Ghee 5g'], 25, ['Make dough', 'Prepare potato filling', 'Stuff and roll paratha', 'Cook with ghee', 'Serve with curd'], 'Indian'),
        lunch: makeMeal('sun_l', 'Punjabi Kadhi Chawal', 'Yogurt-besan curry with rice', 490, 18, 80, 12, ['Curd 200g', 'Besan 30g', 'Rice 80g', 'Onion', 'Spices', 'Mustard seeds'], 35, ['Make curd-besan paste', 'Cook kadhi on low heat 30 min', 'Prepare tempering', 'Cook rice', 'Serve together'], 'Indian'),
        dinner: makeMeal('sun_d', 'Mushroom Pea Stir Fry with Roti', 'Quick stir-fried mushrooms and peas with roti', 380, 18, 52, 12, ['Mushrooms 200g', 'Peas 100g', 'Roti x2', 'Onion', 'Garlic', 'Spices'], 20, ['Sauté garlic and onion', 'Add mushrooms on high heat', 'Add peas', 'Season well', 'Serve with roti'], 'Indian', true),
        snack: makeMeal('sun_s', 'Coconut Water & Dates', 'Natural hydration with energy-dense dates', 180, 2, 44, 1, ['Coconut water 300ml', 'Dates 4 pcs'], 1, ['Serve chilled coconut water', 'Pair with 4 dates'], 'Healthy'),
      } as DayPlan,
    },
  };
}
