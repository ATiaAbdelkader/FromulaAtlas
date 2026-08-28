/**
 * Marketplace product database — fertilizers, amendments, micronutrients, seeds, pesticides.
 * Each product has 2-3 suppliers with prices for comparison.
 * Prices are illustrative (USD per unit) and would be replaced by real supplier APIs in production.
 */

export type ProductCategory = 'fertilizer' | 'amendment' | 'micronutrient' | 'pesticide' | 'seed' | 'irrigation';

export interface Supplier {
  name: string;
  price: number;      // USD per unit
  unit: string;       // e.g. '50kg bag', '1L', '1kg'
  inStock: boolean;
  deliveryDays: number;
  rating: number;     // 0-5
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  activeIngredient?: string;
  npkRatio?: string;       // e.g. '46-0-0'
  emoji: string;
  description: string;
  applicationRate?: string; // e.g. '50-100 kg/ha'
  suppliers: Supplier[];
  tags: string[];
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  fertilizer: 'Fertilizers',
  amendment: 'Soil Amendments',
  micronutrient: 'Micronutrients',
  pesticide: 'Crop Protection',
  seed: 'Seeds',
  irrigation: 'Irrigation Supplies',
};

export const CATEGORY_COLORS: Record<ProductCategory, string> = {
  fertilizer: '#16a34a',
  amendment: '#8b5cf6',
  micronutrient: '#0891b2',
  pesticide: '#dc2626',
  seed: '#f59e0b',
  irrigation: '#0ea5e9',
};

export const PRODUCTS: Product[] = [
  // === Fertilizers ===
  { id: 'urea', name: 'Urea (46-0-0)', category: 'fertilizer', activeIngredient: 'Nitrogen 46%', npkRatio: '46-0-0', emoji: '🧪',
    description: 'Highest concentration solid nitrogen fertilizer. Rapid release. Best applied with urease inhibitor or incorporated.',
    applicationRate: '50-150 kg/ha (split into 2-3 applications)',
    suppliers: [
      { name: 'AgriSupply Co.', price: 385, unit: '50kg bag', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 372, unit: '50kg bag', inStock: true, deliveryDays: 3, rating: 4.2 },
      { name: 'BulkFertilizer Ltd', price: 365, unit: '50kg bag', inStock: true, deliveryDays: 5, rating: 4.0 },
    ],
    tags: ['nitrogen', 'N', 'top-dressing', 'urea'] },
  { id: 'dap', name: 'DAP (18-46-0)', category: 'fertilizer', activeIngredient: 'N 18%, P₂O₅ 46%', npkRatio: '18-46-0', emoji: '🧪',
    description: 'Di-ammonium phosphate — high phosphorus source with moderate nitrogen. Ideal basal dose for most crops.',
    applicationRate: '50-100 kg/ha as basal dose',
    suppliers: [
      { name: 'AgriSupply Co.', price: 520, unit: '50kg bag', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 510, unit: '50kg bag', inStock: true, deliveryDays: 3, rating: 4.2 },
      { name: 'BulkFertilizer Ltd', price: 498, unit: '50kg bag', inStock: false, deliveryDays: 7, rating: 3.8 },
    ],
    tags: ['phosphorus', 'P', 'basal', 'DAP'] },
  { id: 'map', name: 'MAP (11-52-0)', category: 'fertilizer', activeIngredient: 'N 11%, P₂O₅ 52%', npkRatio: '11-52-0', emoji: '🧪',
    description: 'Mono-ammonium phosphate — highest phosphorus concentration. Lower N than DAP, better for P-deficient soils.',
    applicationRate: '50-100 kg/ha as basal dose',
    suppliers: [
      { name: 'AgriSupply Co.', price: 545, unit: '50kg bag', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 538, unit: '50kg bag', inStock: true, deliveryDays: 3, rating: 4.2 },
    ],
    tags: ['phosphorus', 'P', 'basal', 'MAP'] },
  { id: 'sop', name: 'Sulfate of Potash (0-0-50)', category: 'fertilizer', activeIngredient: 'K₂O 50%, S 18%', npkRatio: '0-0-50', emoji: '🧪',
    description: 'Chloride-free potassium source with sulfur. Premium choice for chloride-sensitive crops (potato, tomato, strawberry).',
    applicationRate: '50-150 kg/ha',
    suppliers: [
      { name: 'AgriSupply Co.', price: 680, unit: '50kg bag', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 665, unit: '50kg bag', inStock: true, deliveryDays: 3, rating: 4.2 },
      { name: 'BulkFertilizer Ltd', price: 650, unit: '50kg bag', inStock: true, deliveryDays: 5, rating: 4.0 },
    ],
    tags: ['potassium', 'K', 'S', 'chloride-free', 'SOP'] },
  { id: 'mop', name: 'Muriate of Potash (0-0-60)', category: 'fertilizer', activeIngredient: 'K₂O 60%', npkRatio: '0-0-60', emoji: '🧪',
    description: 'Most economical potassium source. Contains chloride — avoid on salt-sensitive crops.',
    applicationRate: '50-150 kg/ha',
    suppliers: [
      { name: 'AgriSupply Co.', price: 480, unit: '50kg bag', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 470, unit: '50kg bag', inStock: true, deliveryDays: 3, rating: 4.2 },
      { name: 'BulkFertilizer Ltd', price: 455, unit: '50kg bag', inStock: true, deliveryDays: 5, rating: 4.0 },
    ],
    tags: ['potassium', 'K', 'MOP', 'KCl'] },
  { id: 'kno3', name: 'Potassium Nitrate (13-0-46)', category: 'fertilizer', activeIngredient: 'N 13%, K₂O 46%', npkRatio: '13-0-46', emoji: '🧪',
    description: 'Fully water-soluble — ideal for fertigation and foliar. Provides K + NO₃ without chloride or sulfate.',
    applicationRate: '2-5 kg/m³ stock solution; 0.5-1% foliar',
    suppliers: [
      { name: 'AgriSupply Co.', price: 890, unit: '25kg bag', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 875, unit: '25kg bag', inStock: true, deliveryDays: 3, rating: 4.2 },
    ],
    tags: ['potassium', 'K', 'nitrogen', 'N', 'fertigation', 'foliar', 'soluble'] },
  { id: 'can', name: 'Calcium Nitrate (15.5-0-0 + 19 Ca)', category: 'fertilizer', activeIngredient: 'N 15.5%, Ca 19%', npkRatio: '15.5-0-0', emoji: '🧪',
    description: 'Nitrogen + calcium source. Prevents blossom-end rot in tomato/pepper. Fully soluble for fertigation.',
    applicationRate: '50-100 kg/ha soil; 0.5-1% foliar for Ca',
    suppliers: [
      { name: 'AgriSupply Co.', price: 420, unit: '25kg bag', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 410, unit: '25kg bag', inStock: true, deliveryDays: 3, rating: 4.2 },
      { name: 'BulkFertilizer Ltd', price: 398, unit: '25kg bag', inStock: true, deliveryDays: 5, rating: 4.0 },
    ],
    tags: ['calcium', 'Ca', 'nitrogen', 'N', 'fertigation', 'BER'] },
  { id: 'mkp', name: 'MKP (0-52-34)', category: 'fertilizer', activeIngredient: 'P₂O₅ 52%, K₂O 34%', npkRatio: '0-52-34', emoji: '🧪',
    description: 'Monopotassium phosphate — fully soluble P+K source for fertigation. Acidic pH helps clean drip lines.',
    applicationRate: '1-3 kg/m³ stock solution',
    suppliers: [
      { name: 'AgriSupply Co.', price: 950, unit: '25kg bag', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 935, unit: '25kg bag', inStock: true, deliveryDays: 3, rating: 4.2 },
    ],
    tags: ['phosphorus', 'P', 'potassium', 'K', 'fertigation', 'soluble', 'MKP'] },

  // === Soil Amendments ===
  { id: 'gypsum', name: 'Agricultural Gypsum (CaSO₄·2H₂O)', category: 'amendment', activeIngredient: 'Ca 23%, S 18%', emoji: '🪨',
    description: 'Calcium + sulfur amendment without raising pH. Improves soil structure, displaces Na, reduces Al toxicity.',
    applicationRate: '500-2000 kg/ha (based on CEC and Ca deficit)',
    suppliers: [
      { name: 'AgriSupply Co.', price: 12, unit: '50kg bag', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 11, unit: '50kg bag', inStock: true, deliveryDays: 3, rating: 4.2 },
      { name: 'BulkFertilizer Ltd', price: 10, unit: '50kg bag', inStock: true, deliveryDays: 5, rating: 4.0 },
    ],
    tags: ['calcium', 'Ca', 'sulfur', 'S', 'amendment', 'gypsum', 'soil-structure'] },
  { id: 'lime', name: 'Agricultural Lime (CaCO₃)', category: 'amendment', activeIngredient: 'CaCO₃ 95%, Ca 40%', emoji: '🪨',
    description: 'Raises soil pH and supplies calcium. Apply when pH < 6.0. Incorporate 2-3 months before planting.',
    applicationRate: '500-3000 kg/ha (based on pH buffer capacity)',
    suppliers: [
      { name: 'AgriSupply Co.', price: 15, unit: '50kg bag', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 14, unit: '50kg bag', inStock: true, deliveryDays: 3, rating: 4.2 },
      { name: 'BulkFertilizer Ltd', price: 12, unit: '50kg bag', inStock: true, deliveryDays: 5, rating: 4.0 },
    ],
    tags: ['calcium', 'Ca', 'pH', 'amendment', 'lime', 'acidic-soil'] },
  { id: 'dolomite', name: 'Dolomitic Lime (CaCO₃+MgCO₃)', category: 'amendment', activeIngredient: 'Ca 22%, Mg 13%', emoji: '🪨',
    description: 'Raises pH while supplying both Ca and Mg. Use when both Ca and Mg are deficient.',
    applicationRate: '500-2000 kg/ha',
    suppliers: [
      { name: 'AgriSupply Co.', price: 18, unit: '50kg bag', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 17, unit: '50kg bag', inStock: true, deliveryDays: 3, rating: 4.2 },
    ],
    tags: ['calcium', 'Ca', 'magnesium', 'Mg', 'pH', 'amendment', 'dolomite'] },
  { id: 'mgso4', name: 'Magnesium Sulfate (Epsom Salt)', category: 'amendment', activeIngredient: 'Mg 10%, S 13%', emoji: '🧂',
    description: 'Soluble Mg + S source for fertigation or foliar. Quick correction of Mg deficiency.',
    applicationRate: '25-50 kg/ha soil; 1-2% foliar',
    suppliers: [
      { name: 'AgriSupply Co.', price: 35, unit: '25kg bag', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 33, unit: '25kg bag', inStock: true, deliveryDays: 3, rating: 4.2 },
    ],
    tags: ['magnesium', 'Mg', 'sulfur', 'S', 'soluble', 'fertigation'] },

  // === Micronutrients ===
  { id: 'fe-edta', name: 'Iron EDTA (Fe 13%)', category: 'micronutrient', activeIngredient: 'Fe 13% (EDTA chelated)', emoji: '⚗️',
    description: 'Chelated iron for foliar or fertigation. Corrects iron chlorosis in calcareous soils. EDTA stable at pH < 7.',
    applicationRate: '0.5-1 kg/ha foliar; 1-2 g/m³ fertigation',
    suppliers: [
      { name: 'AgriSupply Co.', price: 45, unit: '1kg pack', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 42, unit: '1kg pack', inStock: true, deliveryDays: 3, rating: 4.2 },
    ],
    tags: ['iron', 'Fe', 'chelate', 'EDTA', 'chlorosis', 'foliar'] },
  { id: 'fe-eddha', name: 'Iron EDDHA (Fe 6%)', category: 'micronutrient', activeIngredient: 'Fe 6% (EDDHA chelated)', emoji: '⚗️',
    description: 'Premium chelated iron — stable at pH up to 9. Best choice for severe chlorosis in high-pH calcareous soils.',
    applicationRate: '0.5-2 kg/ha soil/fertigation',
    suppliers: [
      { name: 'AgriSupply Co.', price: 85, unit: '1kg pack', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 80, unit: '1kg pack', inStock: true, deliveryDays: 3, rating: 4.2 },
    ],
    tags: ['iron', 'Fe', 'chelate', 'EDDHA', 'calcareous', 'high-pH'] },
  { id: 'znso4', name: 'Zinc Sulfate (Zn 36%)', category: 'micronutrient', activeIngredient: 'Zn 36%, S 17%', emoji: '⚗️',
    description: 'Corrects zinc deficiency — common in high-P soils and alkaline pH. Apply soil or foliar.',
    applicationRate: '10-25 kg/ha soil; 0.5% foliar',
    suppliers: [
      { name: 'AgriSupply Co.', price: 28, unit: '5kg pack', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 26, unit: '5kg pack', inStock: true, deliveryDays: 3, rating: 4.2 },
    ],
    tags: ['zinc', 'Zn', 'sulfur', 'S', 'foliar', 'soil'] },
  { id: 'boron', name: 'Boric Acid (B 17%)', category: 'micronutrient', activeIngredient: 'B 17%', emoji: '⚗️',
    description: 'Boron source for flowering, pollen viability, and fruit set. Critical for avocado, apple, canola.',
    applicationRate: '1-3 kg/ha soil; 0.2% foliar',
    suppliers: [
      { name: 'AgriSupply Co.', price: 22, unit: '1kg pack', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 20, unit: '1kg pack', inStock: true, deliveryDays: 3, rating: 4.2 },
    ],
    tags: ['boron', 'B', 'flowering', 'pollination', 'foliar'] },

  // === Crop Protection ===
  { id: 'chlorothalonil', name: 'Chlorothalonil 720 SC', category: 'pesticide', activeIngredient: 'Chlorothalonil 720g/L', emoji: '🛡️',
    description: 'Broad-spectrum contact fungicide. Controls early blight, late blight, anthracnose. FRAC Group M05.',
    applicationRate: '1.5-2.5 L/ha every 7-10 days',
    suppliers: [
      { name: 'AgriSupply Co.', price: 45, unit: '1L bottle', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 42, unit: '1L bottle', inStock: true, deliveryDays: 3, rating: 4.2 },
    ],
    tags: ['fungicide', 'blight', 'contact', 'FRAC-M05'] },
  { id: 'mancozeb', name: 'Mancozeb 80 WP', category: 'pesticide', activeIngredient: 'Mancozeb 80%', emoji: '🛡️',
    description: 'Multi-site contact fungicide. Controls downy mildew, late blight, botrytis. FRAC Group M03.',
    applicationRate: '2-3 kg/ha every 7-10 days',
    suppliers: [
      { name: 'AgriSupply Co.', price: 18, unit: '1kg pack', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 16, unit: '1kg pack', inStock: true, deliveryDays: 3, rating: 4.2 },
      { name: 'BulkFertilizer Ltd', price: 15, unit: '1kg pack', inStock: true, deliveryDays: 5, rating: 4.0 },
    ],
    tags: ['fungicide', 'blight', 'mildew', 'contact', 'FRAC-M03'] },
  { id: 'copper', name: 'Copper Hydroxide 77 WP', category: 'pesticide', activeIngredient: 'Copper 77%', emoji: '🛡️',
    description: 'Protectant bactericide + fungicide. Controls bacterial spot, fire blight, downy mildew. OMRI listed.',
    applicationRate: '1.5-3 kg/ha every 7 days',
    suppliers: [
      { name: 'AgriSupply Co.', price: 25, unit: '1kg pack', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 23, unit: '1kg pack', inStock: true, deliveryDays: 3, rating: 4.2 },
    ],
    tags: ['bactericide', 'fungicide', 'copper', 'organic', 'bacterial-spot'] },
  { id: 'imidacloprid', name: 'Imidacloprid 350 SC', category: 'pesticide', activeIngredient: 'Imidacloprid 350g/L', emoji: '🛡️',
    description: 'Systemic insecticide (neonicotinoid). Controls aphids, whiteflies, psyllids. Soil drench or foliar.',
    applicationRate: '0.3-0.5 L/ha foliar; 0.5-1 L/ha drench',
    suppliers: [
      { name: 'AgriSupply Co.', price: 55, unit: '1L bottle', inStock: true, deliveryDays: 2, rating: 4.5 },
      { name: 'FarmDirect', price: 52, unit: '1L bottle', inStock: true, deliveryDays: 3, rating: 4.2 },
    ],
    tags: ['insecticide', 'aphids', 'whiteflies', 'systemic', 'neonicotinoid'] },

  // === Seeds ===
  { id: 'tomato-seed', name: 'Tomato Hybrid Seeds (F1)', category: 'seed', emoji: '🌱',
    description: 'High-yielding indeterminate F1 hybrid. Resistant to TYLCV, ToMV, Fusarium. 95% germination.',
    applicationRate: '150-200g/ha (transplant)',
    suppliers: [
      { name: 'AgriSupply Co.', price: 120, unit: '1000 seeds', inStock: true, deliveryDays: 3, rating: 4.5 },
      { name: 'FarmDirect', price: 115, unit: '1000 seeds', inStock: true, deliveryDays: 4, rating: 4.2 },
    ],
    tags: ['tomato', 'hybrid', 'F1', 'TYLCV-resistant'] },
  { id: 'maize-seed', name: 'Maize Hybrid Seeds (F1)', category: 'seed', emoji: '🌱',
    description: 'Early-maturity dent maize. 12 t/ha potential. Drought-tolerant. 32,000 seeds/kg.',
    applicationRate: '20-25 kg/ha',
    suppliers: [
      { name: 'AgriSupply Co.', price: 8.5, unit: '1kg pack', inStock: true, deliveryDays: 3, rating: 4.5 },
      { name: 'FarmDirect', price: 8.0, unit: '1kg pack', inStock: true, deliveryDays: 4, rating: 4.2 },
      { name: 'BulkFertilizer Ltd', price: 7.5, unit: '1kg pack', inStock: true, deliveryDays: 5, rating: 4.0 },
    ],
    tags: ['maize', 'hybrid', 'F1', 'drought-tolerant'] },
];

export interface CartItem {
  productId: string;
  productName: string;
  supplierName: string;
  price: number;
  unit: string;
  quantity: number;
  emoji: string;
}

/** Get products by category. */
export function getProductsByCategory(category: ProductCategory): Product[] {
  return PRODUCTS.filter(p => p.category === category);
}

/** Search products by name, tags, or active ingredient. */
export function searchProducts(query: string): Product[] {
  if (!query.trim()) return PRODUCTS;
  const q = query.toLowerCase();
  return PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.tags.some(t => t.includes(q)) ||
    p.activeIngredient?.toLowerCase().includes(q)
  );
}

/** Get the best (lowest) price for a product. */
export function bestPrice(product: Product): Supplier {
  return [...product.suppliers].sort((a, b) => a.price - b.price)[0];
}

/** Calculate cart total. */
export function cartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
