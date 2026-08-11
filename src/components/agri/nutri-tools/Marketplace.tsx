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
import { useTranslation } from '@/lib/language-store';

const CATEGORY_LABEL_AR: Record<ProductCategory, string> = {
  fertilizer: 'أسمدة',
  amendment: 'معدّلات',
  micronutrient: 'عناصر صغرى',
  pesticide: 'مبيدات',
  seed: 'بذور',
  irrigation: 'ري',
};

const CART_KEY = 'nutriplant_marketplace_cart_v1';

export function Marketplace() {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const { isRTL } = useTranslation();

  const categoryLabel = (cat: ProductCategory | 'all') => {
    if (cat === 'all') return isRTL ? 'كل المنتجات' : 'All Products';
    return isRTL ? CATEGORY_LABEL_AR[cat] : CATEGORY_LABELS[cat];
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
      `<tr><td>${i + 1}</td><td>${c.emoji} ${c.productName}</td><td>${c.supplierName}</td><td style="text-align:right">${c.quantity}</td><td>${c.unit}</td><td style="text-align:right">$${c.price}</td><td style="text-align:right">$${(c.price * c.quantity).toFixed(2)}</td></tr>`
    ).join('');
    const titleText = isRTL ? 'أمر شراء مزرعة' : 'Farm Purchase Order';
    const dateText = isRTL ? 'التاريخ' : 'Date';
    const itemsText = isRTL ? 'عناصر' : 'items';
    const thText = isRTL ? ['#', 'المنتج', 'المورد', 'الكمية', 'الوحدة', 'سعر الوحدة', 'المجموع'] : ['#', 'Product', 'Supplier', 'Qty', 'Unit', 'Unit Price', 'Subtotal'];
    const totalText = isRTL ? 'الإجمالي' : 'Total';
    win.document.write(`<!DOCTYPE html><html><head><title>${titleText}</title><style>
      body{font-family:system-ui,sans-serif;margin:24px;color:#0f172a}
      h1{color:#16a34a;font-size:20px} .meta{color:#475569;font-size:12px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;font-size:11px} th{background:#ecfdf5;color:#047857;padding:6px;border:1px solid #a7f3d0;text-align:left}
      td{padding:4px 6px;border:1px solid #d1fae5} .total{font-size:16px;font-weight:bold;text-align:right;margin-top:12px;color:#16a34a}
      @page{size:landscape;margin:12mm}
    </style></head><body>
      <h1>🌱 ${titleText}</h1>
      <div class="meta">${dateText}: ${new Date().toLocaleDateString(isRTL ? 'ar' : undefined)} · ${cart.length} ${itemsText}</div>
      <table><thead><tr>${thText.map(t => `<th>${t}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
      <div class="total">${totalText}: $${total.toFixed(2)}</div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="space-y-4">
      {/* Search + Cart bar */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={isRTL ? 'ابحث عن أسمدة، معدّلات، مبيدات...' : 'Search fertilizers, amendments, pesticides...'} className="h-9 pl-8 text-sm" />
        </div>
        <Button variant={cart.length > 0 ? 'default' : 'outline'} size="sm" onClick={() => setShowCart(!showCart)} className="gap-1.5">
          <ShoppingCart className="h-4 w-4" />
          {cart.length > 0 ? `${isRTL ? 'السلة' : 'Cart'} (${cart.length})` : (isRTL ? 'السلة' : 'Cart')}
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
            <span className="text-sm font-bold flex items-center gap-1.5"><ShoppingCart className="h-4 w-4 text-emerald-600" /> {isRTL ? `سلة التسوق (${cart.length})` : `Shopping Cart (${cart.length})`}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportOrder} className="gap-1.5 text-xs"><Download className="h-3 w-3" /> {isRTL ? 'تصدير الطلب' : 'Export Order'}</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCart(false)} className="text-xs"><X className="h-3 w-3" /></Button>
            </div>
          </div>
          {cart.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-1.5 border-b border-emerald-100 dark:border-emerald-900/50 last:border-0">
              <span className="text-lg">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.productName}</div>
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
            <span className="text-sm font-bold">{isRTL ? 'الإجمالي' : 'Total'}</span>
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

          return (
            <div key={product.id} className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="p-3 border-b border-border/50" style={{ background: `${CATEGORY_COLORS[product.category]}10` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{product.emoji}</span>
                    <div>
                      <div className="text-sm font-semibold leading-tight">{product.name}</div>
                      {product.activeIngredient && <div className="text-[10px] text-muted-foreground">{product.activeIngredient}</div>}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] flex-shrink-0" style={{ color: CATEGORY_COLORS[product.category], borderColor: `${CATEGORY_COLORS[product.category]}60` }}>
                    {CATEGORY_LABELS[product.category]}
                  </Badge>
                </div>
              </div>

              {/* Body */}
              <div className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{product.description}</p>
                {product.applicationRate && (
                  <div className="text-[10px] bg-muted/30 rounded p-1.5">
                    <span className="font-semibold">{isRTL ? 'المعدل:' : 'Rate:'}</span> {product.applicationRate}
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
                            {s.rating} · <Truck className="h-2 w-2" /> {s.deliveryDays}{isRTL ? 'ي' : 'd'}
                            {!s.inStock && <span className="text-red-500">{isRTL ? 'غير متوفّر' : 'Out of stock'}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono font-bold">${s.price}</span>
                        <span className="text-[9px] text-muted-foreground">/{s.unit}</span>
                        <Button size="sm" variant={s.price === best.price ? 'default' : 'outline'} onClick={() => addToCart(product, si)} disabled={!s.inStock}
                          className="h-6 w-6 p-0" title={isRTL ? 'أضف إلى السلة' : 'Add to cart'}>
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
                    {isRTL ? `وفّر ${savingsPct}% ($${savings.toFixed(2)}) باختيار أفضل سعر` : `Save ${savingsPct}% ($${savings.toFixed(2)}) by choosing best price`}
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
          <div className="text-sm text-muted-foreground">{isRTL ? 'لا توجد منتجات مطابقة لبحثك.' : 'No products match your search.'}</div>
        </div>
      )}
    </div>
  );
}
