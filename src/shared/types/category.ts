export interface ProductCategory {
  id: string;
  name: string;
  hindiName: string;
  description?: string;
  icon?: string;
  isEnabled: boolean;
  order: number;
  aliases: string[];
}

/**
 * Authoritative 14 Product Categories for Dooars Daily Basket
 * Preserves stable IDs and bilingual labels.
 */
export const CANONICAL_CATEGORIES: ProductCategory[] = [
  {
    id: 'chicken_poultry',
    name: 'Chicken & Poultry',
    hindiName: 'चिकन एवं पोल्ट्री',
    description: 'Fresh country chicken, broiler, dressed poultry, and local farm fowl.',
    icon: '🍗',
    isEnabled: true,
    order: 1,
    aliases: ['Chicken & Poultry', 'Chicken', 'Poultry', 'Chicken and Poultry', 'Fresh Chicken'],
  },
  {
    id: 'meat',
    name: 'Meat',
    hindiName: 'ताज़ा मीट / गोश्त',
    description: 'Fresh mutton, goat meat, and fresh cuts direct from certified suppliers.',
    icon: '🥩',
    isEnabled: true,
    order: 2,
    aliases: ['Meat', 'Fresh Meat', 'Mutton', 'Raw Meat', 'Goat Meat'],
  },
  {
    id: 'fish_seafood',
    name: 'Fish & Seafood',
    hindiName: 'मछली और सीफूड',
    description: 'Fresh river Rohu, Katla, Hilsa, prawns, and freshwater Dooars catch.',
    icon: '🐟',
    isEnabled: true,
    order: 3,
    aliases: ['Fish & Seafood', 'Fish', 'Seafood', 'Fresh Fish', 'Prawns', 'River Fish'],
  },
  {
    id: 'restaurants',
    name: 'Restaurants',
    hindiName: 'रेस्टोरेंट भोजन',
    description: 'Prepared meals, lunch and dinner thalis, gravies, and restaurant dishes.',
    icon: '🍽️',
    isEnabled: true,
    order: 4,
    aliases: ['Restaurants', 'Restaurant', 'Prepared Meals', 'Thali', 'Cooked Food', 'Hotel Dishes'],
  },
  {
    id: 'fast_food',
    name: 'Fast Food',
    hindiName: 'फास्ट फूड',
    description: 'Momos, chowmein, rolls, burgers, fried snacks, and evening street food.',
    icon: '🍔',
    isEnabled: true,
    order: 5,
    aliases: ['Fast Food', 'Snacks', 'Bakery & Local Snacks', 'Momos', 'Chowmein', 'Rolls'],
  },
  {
    id: 'grocery',
    name: 'Grocery',
    hindiName: 'किराना और राशन',
    description: 'Atta, rice, pulses, mustard oil, spices, tea leaves, salt, and farm staples.',
    icon: '🛒',
    isEnabled: true,
    order: 6,
    aliases: [
      'Grocery',
      'Oils & Spices',
      'Farm Staples & Grains',
      'Staples, Rice & Grains',
      'Groceries',
      'Kirana',
      'Ration',
      'Spices',
      'Pulses',
    ],
  },
  {
    id: 'egg',
    name: 'Egg',
    hindiName: 'अंडे',
    description: 'Farm brown eggs, white eggs, desi country eggs, and poultry trays.',
    icon: '🥚',
    isEnabled: true,
    order: 7,
    aliases: ['Egg', 'Eggs', 'Farm Eggs', 'Desi Eggs', 'Ande'],
  },
  {
    id: 'milk',
    name: 'Milk',
    hindiName: 'दूध और डेयरी',
    description: 'Fresh cow milk, pouch milk, paneer, curd, butter, and daily dairy items.',
    icon: '🥛',
    isEnabled: true,
    order: 8,
    aliases: [
      'Milk',
      'Dairy & Bakery',
      'Daily Dairy, Milk & Eggs',
      'Dairy',
      'Fresh Milk',
      'Paneer',
      'Curd',
    ],
  },
  {
    id: 'cold_drink',
    name: 'Cold Drink',
    hindiName: 'कोल्ड ड्रिंक्स एवं पेय',
    description: 'Soft drinks, fruit juices, packaged water, iced tea, and cold beverages.',
    icon: '🥤',
    isEnabled: true,
    order: 9,
    aliases: [
      'Cold Drink',
      'Cold Drinks',
      'Snacks & Beverages',
      'Beverages & Dooars Tea',
      'Beverages',
      'Soft Drinks',
      'Juices',
    ],
  },
  {
    id: 'vegetable',
    name: 'Vegetable',
    hindiName: 'ताज़ी सब्जियां',
    description: 'Farm-fresh local greens, potatoes, tomatoes, onions, seasonal hill vegetables.',
    icon: '🥦',
    isEnabled: true,
    order: 10,
    aliases: [
      'Vegetable',
      'Vegetables',
      'Fresh Vegetables',
      'Fresh Vegetables & Fruits',
      'Organic Produce',
      'Organic Farm Produce',
      'Green Vegetables',
      'Sabji',
    ],
  },
  {
    id: 'fruit',
    name: 'Fruit',
    hindiName: 'ताज़े फल',
    description: 'Darjeeling oranges, bananas, apples, seasonal mangoes, papayas, and berries.',
    icon: '🍎',
    isEnabled: true,
    order: 11,
    aliases: ['Fruit', 'Fruits', 'Fresh Fruits', 'Seasonal Fruits', 'Hill Fruits'],
  },
  {
    id: 'cosmetic',
    name: 'Cosmetic',
    hindiName: 'कॉस्मेटिक्स',
    description: 'Daily skincare, lotions, face creams, powders, lip balms, and makeup essentials.',
    icon: '💄',
    isEnabled: true,
    order: 12,
    aliases: ['Cosmetic', 'Cosmetics', 'Makeup', 'Skincare', 'Beauty Products'],
  },
  {
    id: 'beauty_health',
    name: 'Beauty & Health',
    hindiName: 'ब्यूटी और स्वास्थ्य',
    description: 'Personal hygiene, soaps, shampoos, herbal health, oral care, and wellness.',
    icon: '✨',
    isEnabled: true,
    order: 13,
    aliases: [
      'Beauty & Health',
      'Health & Beauty',
      'Personal Care',
      'Health & Wellness',
      'Wellness',
      'Hygiene',
    ],
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    hindiName: 'ई-कॉमर्स और जनरल',
    description: 'Household essentials, kitchenware, plasticware, batteries, and general merchandise.',
    icon: '📦',
    isEnabled: true,
    order: 14,
    aliases: ['E-commerce', 'Ecommerce', 'General Store', 'Household', 'Electronics', 'General'],
  },
];

/**
 * Direct legacy string to canonical 14 category mapping dictionary
 */
export const LEGACY_CATEGORY_MAPPINGS: Record<string, string> = {
  'Fresh Vegetables': 'Vegetable',
  'Fresh Vegetables & Fruits': 'Vegetable',
  'Vegetables': 'Vegetable',
  'Fruits': 'Fruit',
  'Dairy & Bakery': 'Milk',
  'Daily Dairy, Milk & Eggs': 'Milk',
  'Dairy': 'Milk',
  'Oils & Spices': 'Grocery',
  'Farm Staples & Grains': 'Grocery',
  'Staples, Rice & Grains': 'Grocery',
  'Organic Produce': 'Vegetable',
  'Organic Farm Produce': 'Vegetable',
  'Snacks & Beverages': 'Cold Drink',
  'Beverages & Dooars Tea': 'Cold Drink',
  'Bakery & Local Snacks': 'Fast Food',
};

/**
 * Resolves any category string (legacy, ID, or variant) into one of the 14 canonical names
 */
export function normalizeCategoryName(raw: string | undefined | null): string {
  if (!raw) return 'Grocery';
  const trimmed = raw.trim();

  // 1. Direct canonical name or ID exact match
  const direct = CANONICAL_CATEGORIES.find(
    (c) =>
      c.name.toLowerCase() === trimmed.toLowerCase() ||
      c.id.toLowerCase() === trimmed.toLowerCase() ||
      c.id.replace(/_/g, '-').toLowerCase() === trimmed.toLowerCase()
  );
  if (direct) return direct.name;

  // 2. Direct lookup in legacy mapping
  if (LEGACY_CATEGORY_MAPPINGS[trimmed]) {
    return LEGACY_CATEGORY_MAPPINGS[trimmed];
  }

  // 3. Case-insensitive legacy check
  const lower = trimmed.toLowerCase();
  for (const [legacyKey, targetName] of Object.entries(LEGACY_CATEGORY_MAPPINGS)) {
    if (lower === legacyKey.toLowerCase()) return targetName;
  }

  // 4. Check aliases in canonical categories
  for (const cat of CANONICAL_CATEGORIES) {
    if (cat.aliases.some((a) => a.toLowerCase() === lower)) {
      return cat.name;
    }
  }

  // 5. Semantic keyword fallback
  if (lower.includes('vegetable') || lower.includes('sabji') || lower.includes('saag')) return 'Vegetable';
  if (lower.includes('fruit')) return 'Fruit';
  if (lower.includes('chicken') || lower.includes('poultry')) return 'Chicken & Poultry';
  if (lower.includes('fish') || lower.includes('seafood') || lower.includes('machli')) return 'Fish & Seafood';
  if (lower.includes('meat') || lower.includes('mutton') || lower.includes('goat')) return 'Meat';
  if (lower.includes('egg') || lower.includes('anda')) return 'Egg';
  if (lower.includes('milk') || lower.includes('dairy') || lower.includes('doodh') || lower.includes('paneer')) return 'Milk';
  if (lower.includes('drink') || lower.includes('beverage') || lower.includes('soda') || lower.includes('juice')) return 'Cold Drink';
  if (lower.includes('restaurant') || lower.includes('thali') || lower.includes('meal')) return 'Restaurants';
  if (lower.includes('fast food') || lower.includes('burger') || lower.includes('pizza') || lower.includes('momo') || lower.includes('snack')) return 'Fast Food';
  if (lower.includes('cosmetic') || lower.includes('makeup')) return 'Cosmetic';
  if (lower.includes('beauty') || lower.includes('health') || lower.includes('soap') || lower.includes('shampoo')) return 'Beauty & Health';
  if (lower.includes('ecommerce') || lower.includes('electronic') || lower.includes('household')) return 'E-commerce';
  if (lower.includes('grocery') || lower.includes('grain') || lower.includes('spice') || lower.includes('oil') || lower.includes('rice') || lower.includes('atta')) return 'Grocery';

  return trimmed;
}

/**
 * Returns canonical category ID given any category input
 */
export function mapCategoryToId(raw: string | undefined | null): string {
  const canonicalName = normalizeCategoryName(raw);
  const found = CANONICAL_CATEGORIES.find((c) => c.name.toLowerCase() === canonicalName.toLowerCase());
  return found ? found.id : 'grocery';
}

/**
 * Bidirectional check whether a product belongs to a filter category.
 * Supports legacy product categories matching both old and new filters seamlessly.
 */
export function isProductInCategory(
  productCategory: string | undefined | null,
  filterCategory: string | undefined | null
): boolean {
  if (!filterCategory || filterCategory === 'All' || filterCategory === 'all') return true;
  if (!productCategory) return false;

  const pRaw = productCategory.trim();
  const fRaw = filterCategory.trim();

  // Direct string equality
  if (pRaw.toLowerCase() === fRaw.toLowerCase()) return true;

  const pNorm = normalizeCategoryName(pRaw);
  const fNorm = normalizeCategoryName(fRaw);

  if (pNorm.toLowerCase() === fNorm.toLowerCase()) return true;

  // Also check if filter matches any alias of product's canonical category
  const targetCat = CANONICAL_CATEGORIES.find((c) => c.name.toLowerCase() === fNorm.toLowerCase());
  if (targetCat) {
    if (targetCat.aliases.some((a) => a.toLowerCase() === pRaw.toLowerCase())) return true;
    if (targetCat.id === pRaw.toLowerCase()) return true;
  }

  // Also check if product matches any alias of filter category
  const prodCat = CANONICAL_CATEGORIES.find((c) => c.name.toLowerCase() === pNorm.toLowerCase());
  if (prodCat) {
    if (prodCat.aliases.some((a) => a.toLowerCase() === fRaw.toLowerCase())) return true;
    if (prodCat.id === fRaw.toLowerCase()) return true;
  }

  return false;
}
