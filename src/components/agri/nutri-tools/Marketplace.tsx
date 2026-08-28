'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart, Search, Plus, Minus, Trash2, Download, Star,
  TrendingDown, CheckCircle2, Truck, X,
} from 'lucide-react';
import {
  PRODUCTS, CATEGORY_LABELS, CATEGORY_COLORS, searchProducts, bestPrice, cartTotal,
  type ProductCategory, type Product, type CartItem,
} from '@/lib/marketplace-data';
import { useTranslation, type Language } from '@/lib/language-store';

const CATEGORY_LABEL_FR: Record<ProductCategory, string> = {
  fertilizer: 'Engrais',
  amendment: 'Amendements',
  micronutrient: 'Oligoéléments',
  pesticide: 'Produits phytosanitaires',
  seed: 'Semences',
  irrigation: 'Irrigation',
};

const CATEGORY_LABEL_AR: Record<ProductCategory, string> = {
  fertilizer: 'أسمدة',
  amendment: 'معدّلات',
  micronutrient: 'عناصر صغرى',
  pesticide: 'مبيدات',
  seed: 'بذور',
  irrigation: 'ري',
};

const PRODUCT_AR: Record<string, { name: string; description: string; activeIngredient?: string }> = {
  urea: { name: 'اليوريا (46-0-0)', activeIngredient: 'نيتروجين 46%', description: 'سماد نيتروجيني صلب عالي التركيز وسريع الإطلاق. يُفضّل استخدامه مع مثبط اليورياز أو دمجه في التربة.' },
  dap: { name: 'DAP (18-46-0)', activeIngredient: 'نيتروجين 18%، فوسفات 46%', description: 'فوسفات ثنائي الأمونيوم؛ مصدر مرتفع للفوسفور مع نيتروجين متوسط، ومناسب للجرعة الأساسية لمعظم المحاصيل.' },
  map: { name: 'MAP (11-52-0)', activeIngredient: 'نيتروجين 11%، فوسفات 52%', description: 'فوسفات أحادي الأمونيوم؛ أعلى تركيز للفوسفور مع نيتروجين أقل من DAP، ومناسب للترب الفقيرة بالفوسفور.' },
  sop: { name: 'كبريتات البوتاسيوم (0-0-50)', activeIngredient: 'K₂O 50%، كبريت 18%', description: 'مصدر بوتاسيوم خالٍ من الكلوريد مع الكبريت، ومناسب للمحاصيل الحساسة للكلوريد مثل البطاطس والطماطم والفراولة.' },
  mop: { name: 'كلوريد البوتاسيوم (0-0-60)', activeIngredient: 'K₂O 60%', description: 'مصدر اقتصادي للبوتاسيوم، لكنه يحتوي على الكلوريد؛ تجنّبه مع المحاصيل الحساسة للملوحة.' },
  kno3: { name: 'نترات البوتاسيوم (13-0-46)', activeIngredient: 'نيتروجين 13%، K₂O 46%', description: 'قابل للذوبان تماماً، ومثالي للتسميد بالري والرش الورقي، ويوفّر البوتاسيوم والنترات دون كلوريد أو كبريتات.' },
  can: { name: 'نترات الكالسيوم (15.5-0-0 + 19 Ca)', activeIngredient: 'نيتروجين 15.5%، كالسيوم 19%', description: 'مصدر للنيتروجين والكالسيوم، يساعد على الوقاية من عفن الطرف الزهري، وقابل للذوبان تماماً للتسميد بالري.' },
  mkp: { name: 'فوسفات أحادي البوتاسيوم (0-52-34)', activeIngredient: 'فوسفات 52%، K₂O 34%', description: 'مصدر فوسفور وبوتاسيوم قابل للذوبان تماماً للتسميد بالري، ويساعد رقمه الهيدروجيني الحمضي على تنظيف خطوط التنقيط.' },
  gypsum: { name: 'الجبس الزراعي (CaSO₄·2H₂O)', activeIngredient: 'كالسيوم 23%، كبريت 18%', description: 'معدّل يضيف الكالسيوم والكبريت دون رفع الرقم الهيدروجيني، ويحسّن بنية التربة ويزيح الصوديوم.' },
  lime: { name: 'الجير الزراعي (CaCO₃)', activeIngredient: 'CaCO₃ 95%، كالسيوم 40%', description: 'يرفع الرقم الهيدروجيني للتربة ويزوّدها بالكالسيوم. يُستخدم عند pH أقل من 6 ويُدمج قبل الزراعة بشهرين أو ثلاثة.' },
  dolomite: { name: 'الجير الدولوميتي (CaCO₃+MgCO₃)', activeIngredient: 'كالسيوم 22%، مغنيسيوم 13%', description: 'يرفع الرقم الهيدروجيني مع تزويد التربة بالكالسيوم والمغنيسيوم عند وجود نقص في العنصرين.' },
  mgso4: { name: 'كبريتات المغنيسيوم (ملح إبسوم)', activeIngredient: 'مغنيسيوم 10%، كبريت 13%', description: 'مصدر ذائب للمغنيسيوم والكبريت للتسميد بالري أو الرش الورقي، ويصحّح نقص المغنيسيوم سريعاً.' },
  'fe-edta': { name: 'حديد EDTA (Fe 13%)', activeIngredient: 'حديد 13% (مخلّب بـ EDTA)', description: 'حديد مخلّب للرش الورقي أو التسميد بالري، يصحّح اصفرار الحديد في الترب الكلسية ويستقر عند pH أقل من 7.' },
  'fe-eddha': { name: 'حديد EDDHA (Fe 6%)', activeIngredient: 'حديد 6% (مخلّب بـ EDDHA)', description: 'حديد مخلّب ممتاز ومستقر حتى pH 9، وهو الخيار الأفضل للاصفرار الشديد في الترب الكلسية القلوية.' },
  znso4: { name: 'كبريتات الزنك (Zn 36%)', activeIngredient: 'زنك 36%، كبريت 17%', description: 'تصحّح نقص الزنك الشائع في الترب عالية الفوسفور والقلوية، وتُستخدم مع التربة أو بالرش الورقي.' },
  boron: { name: 'حمض البوريك (B 17%)', activeIngredient: 'بورون 17%', description: 'مصدر للبورون الضروري للإزهار وحيوية حبوب اللقاح والعقد، خاصة في الأفوكادو والتفاح والكانولا.' },
  chlorothalonil: { name: 'كلوروثالونيل 720 SC', activeIngredient: 'كلوروثالونيل 720 غ/ل', description: 'مبيد فطري تلامسي واسع الطيف لمكافحة اللفحة المبكرة والمتأخرة والأنثراكنوز، من مجموعة FRAC M05.' },
  mancozeb: { name: 'مانكوزيب 80 WP', activeIngredient: 'مانكوزيب 80%', description: 'مبيد فطري تلامسي متعدد المواقع لمكافحة البياض الزغبي واللفحة المتأخرة والبوتريتس، من مجموعة FRAC M03.' },
  copper: { name: 'هيدروكسيد النحاس 77 WP', activeIngredient: 'نحاس 77%', description: 'مبيد بكتيري وفطري وقائي لمكافحة التبقع البكتيري واللفحة النارية والبياض الزغبي، ومدرج لدى OMRI.' },
  imidacloprid: { name: 'إيميداكلوبريد 350 SC', activeIngredient: 'إيميداكلوبريد 350 غ/ل', description: 'مبيد حشري جهازي من النيونيكوتينويدات لمكافحة المن والذبابة البيضاء ونطاطات الأوراق، بالمعاملة الأرضية أو الرش الورقي.' },
  'tomato-seed': { name: 'بذور طماطم هجينة (F1)', description: 'هجين F1 غير محدد عالي الإنتاجية، مقاوم لفيروسات TYLCV وToMV والفيوزاريوم، ونسبة إنباته 95%.' },
  'maize-seed': { name: 'بذور ذرة هجينة (F1)', description: 'ذرة حبوب مبكرة النضج بإمكان إنتاج يصل إلى 12 طن/هكتار، متحملة للجفاف، وتحتوي على 32000 بذرة/كغ.' },
};

const CART_KEY = 'nutriplant_marketplace_cart_v1';

function copyFor(language: Language, en: string, fr: string, ar: string) {
  return language === 'ar' ? ar : language === 'fr' ? fr : en;
}

export function Marketplace() {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const { language } = useTranslation();

  const productDisplay = (product: Product) => language === 'ar' ? (PRODUCT_AR[product.id] ?? { name: product.name, description: product.description, activeIngredient: product.activeIngredient }) : { name: product.name, description: product.description, activeIngredient: product.activeIngredient };

  const categoryLabel = (cat: ProductCategory | 'all') => {
    if (cat === 'all') return copyFor(language, 'All Products', 'Tous les produits', 'كل المنتجات');
    return language === 'ar' ? CATEGORY_LABEL_AR[cat] : language === 'fr' ? CATEGORY_LABEL_FR[cat] : CATEGORY_LABELS[cat];
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setCart(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try { localStorage.setItem(CART_KEY, JSON.stringify(newCart)); } catch { /* ignore */ }
  };

  const filtered = useMemo(() => {
    let results = searchQuery.trim() ? searchProducts(searchQuery) : PRODUCTS;
    if (activeCategory !== 'all') results = results.filter(p => p.category === activeCategory);
    return results;
  }, [searchQuery, activeCategory]);

  const addToCart = (product: Product, supplierIndex = 0) => {
    const supplier = product.suppliers[supplierIndex];
    const existing = cart.find(c => c.productId === product.id && c.supplierName === supplier.name);
    if (existing) {
      saveCart(cart.map(c => c.productId === product.id && c.supplierName === supplier.name
        ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      saveCart([...cart, {
        productId: product.id, productName: product.name,
        supplierName: supplier.name, price: supplier.price,
        unit: supplier.unit, quantity: 1, emoji: product.emoji,
      }]);
    }
  };

  const updateQty = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
    saveCart(newCart);
  };

  const removeItem = (index: number) => saveCart(cart.filter((_, i) => i !== index));

  const total = cartTotal(cart);
  const categories: (ProductCategory | 'all')[] = ['all', 'fertilizer', 'amendment', 'micronutrient', 'pesticide', 'seed'];

  const exportOrder = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = cart.map((c, i) =>
      `<tr><td>${i + 1}</td><td>${c.emoji} ${language === 'ar' ? productDisplay(PRODUCTS.find(p => p.id === c.productId) ?? ({ id: c.productId, name: c.productName, description: '' } as Product)).name : c.productName}</td><td>${c.supplierName}</td><td style="text-align:right">${c.quantity}</td><td>${c.unit}</td><td style="text-align:right">$${c.price}</td><td style="text-align:right">$${(c.price * c.quantity).toFixed(2)}</td></tr>`
    ).join('');
    const titleText = copyFor(language, 'Farm Purchase Order', 'Bon de commande de la ferme', 'أمر شراء مزرعة');
    const dateText = copyFor(language, 'Date', 'Date', 'التاريخ');
    const itemsText = copyFor(language, 'items', 'articles', 'عناصر');
    const thText = language === 'ar'
      ? ['#', 'المنتج', 'المورد', 'الكمية', 'الوحدة', 'سعر الوحدة', 'المجموع']
      : language === 'fr'
        ? ['#', 'Produit', 'Fournisseur', 'Qté', 'Unité', 'Prix unitaire', 'Sous-total']
        : ['#', 'Product', 'Supplier', 'Qty', 'Unit', 'Unit Price', 'Subtotal'];
    const totalText = copyFor(language, 'Total', 'Total', 'الإجمالي');
    win.document.write(`<!DOCTYPE html><html><head><title>${titleText}</title><style>
      body{font-family:system-ui,sans-serif;margin:24px;color:#0f172a}
      h1{color:#16a34a;font-size:20px} .meta{color:#475569;font-size:12px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;font-size:11px} th{background:#ecfdf5;color:#047857;padding:6px;border:1px solid #a7f3d0;text-align:left}
      td{padding:4px 6px;border:1px solid #d1fae5} .total{font-size:16px;font-weight:bold;text-align:right;margin-top:12px;color:#16a34a}
      @page{size:landscape;margin:12mm}
    </style></head><body>
      <h1>🌱 ${titleText}</h1>
      <div class="meta">${dateText}: ${new Date().toLocaleDateString(language === 'ar' ? 'ar' : language === 'fr' ? 'fr-FR' : undefined)} · ${cart.length} ${itemsText}</div>
      <table><thead><tr>${thText.map(t => `<th>${t}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
      <div class="total">${totalText}: $${total.toFixed(2)}</div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  return (
    <Card dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Search + Cart bar */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={copyFor(language, 'Search fertilizers, amendments, pesticides...', 'Rechercher des engrais, amendements, produits phytosanitaires…', 'ابحث عن أسمدة، معدّلات، مبيدات...')} className="h-9 pl-8 text-sm" />
        </div>
        <Button variant={cart.length > 0 ? 'default' : 'outline'} size="sm" onClick={() => setShowCart(!showCart)} className="gap-1.5">
          <ShoppingCart className="h-4 w-4" />
          {cart.length > 0 ? `${copyFor(language, 'Cart', 'Panier', 'السلة')} (${cart.length})` : copyFor(language, 'Cart', 'Panier', 'السلة')}
          {total > 0 && <span className="ml-1 font-mono">${total.toFixed(0)}</span>}
        </Button>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-xs px-3 py-1.5 rounded-md border transition-all ${activeCategory === cat ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-background border-border text-muted-foreground hover:border-emerald-300'}`}
          >
            {categoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Shopping cart panel */}
      {showCart && cart.length > 0 && (
        <div className="rounded-xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold flex items-center gap-1.5"><ShoppingCart className="h-4 w-4 text-emerald-600" /> {copyFor(language, `Shopping Cart (${cart.length})`, `Panier (${cart.length})`, `سلة التسوق (${cart.length})`)}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportOrder} className="gap-1.5 text-xs"><Download className="h-3 w-3" /> {copyFor(language, 'Export Order', 'Exporter la commande', 'تصدير الطلب')}</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCart(false)} className="text-xs"><X className="h-3 w-3" /></Button>
            </div>
          </div>
          {cart.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-1.5 border-b border-emerald-100 dark:border-emerald-900/50 last:border-0">
              <span className="text-lg">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{language === 'ar' ? productDisplay(PRODUCTS.find(p => p.id === item.productId) ?? ({ id: item.productId, name: item.productName, description: '' } as Product)).name : item.productName}</div>
                <div className="text-[10px] text-muted-foreground">{item.supplierName} · ${item.price}/{item.unit}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(i, -1)} className="w-5 h-5 rounded border flex items-center justify-center hover:bg-muted"><Minus className="h-3 w-3" /></button>
                <span className="w-8 text-center font-mono">{item.quantity}</span>
                <button onClick={() => updateQty(i, 1)} className="w-5 h-5 rounded border flex items-center justify-center hover:bg-muted"><Plus className="h-3 w-3" /></button>
              </div>
              <span className="font-mono font-bold w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
              <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-emerald-200 dark:border-emerald-800">
            <span className="text-sm font-bold">{copyFor(language, 'Total', 'Total', 'الإجمالي')}</span>
            <span className="text-xl font-bold text-emerald-600">${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(product => {
          const best = bestPrice(product);
          const worst = [...product.suppliers].sort((a, b) => b.price - a.price)[0];
          const savings = worst.price - best.price;
          const savingsPct = Math.round((savings / worst.price) * 100);

          const display = productDisplay(product);

          return (
            <div key={product.id} className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="p-3 border-b border-border/50" style={{ background: `${CATEGORY_COLORS[product.category]}10` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{product.emoji}</span>
                    <div>
                      <div className="text-sm font-semibold leading-tight">{display.name}</div>
                      {display.activeIngredient && <div className="text-[10px] text-muted-foreground">{display.activeIngredient}</div>}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] flex-shrink-0" style={{ color: CATEGORY_COLORS[product.category], borderColor: `${CATEGORY_COLORS[product.category]}60` }}>
                    {categoryLabel(product.category)}
                  </Badge>
                </div>
              </div>

              {/* Body */}
              <div className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{display.description}</p>
                {product.applicationRate && (
                  <div className="text-[10px] bg-muted/30 rounded p-1.5">
                    <span className="font-semibold">{copyFor(language, 'Rate:', 'Dose :', 'المعدل:')}</span> {product.applicationRate}
                  </div>
                )}

                {/* Supplier prices */}
                <div className="space-y-1">
                  {product.suppliers.map((s, si) => (
                    <div key={s.name} className={`flex items-center justify-between text-xs rounded p-1.5 ${s.price === best.price ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800' : 'border border-transparent'}`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {s.price === best.price && <TrendingDown className="h-3 w-3 text-emerald-600 flex-shrink-0" />}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{s.name}</div>
                          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                            <Star className="h-2 w-2 text-amber-400" fill="currentColor" />
                            {s.rating} · <Truck className="h-2 w-2" /> {s.deliveryDays}{copyFor(language, 'd', 'j', 'ي')}
                            {!s.inStock && <span className="text-red-500">{copyFor(language, 'Out of stock', 'Rupture de stock', 'غير متوفّر')}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono font-bold">${s.price}</span>
                        <span className="text-[9px] text-muted-foreground">/{s.unit}</span>
                        <Button size="sm" variant={s.price === best.price ? 'default' : 'outline'} onClick={() => addToCart(product, si)} disabled={!s.inStock}
                          className="h-6 w-6 p-0" title={copyFor(language, 'Add to cart', 'Ajouter au panier', 'أضف إلى السلة')}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Savings badge */}
                {savings > 0 && (
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {copyFor(language, `Save ${savingsPct}% ($${savings.toFixed(2)}) by choosing best price`, `Économisez ${savingsPct} % ($${savings.toFixed(2)}) en choisissant le meilleur prix`, `وفّر ${savingsPct}% ($${savings.toFixed(2)}) باختيار أفضل سعر`)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8">
          <Search className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <div className="text-sm text-muted-foreground">{copyFor(language, 'No products match your search.', 'Aucun produit ne correspond à votre recherche.', 'لا توجد منتجات مطابقة لبحثك.')}</div>
        </div>
      )}
    </Card>
  );
}
