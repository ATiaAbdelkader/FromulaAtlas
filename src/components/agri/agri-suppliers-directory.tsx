'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Store,
  MapPin,
  Phone,
  MessageSquare,
  Search,
  CheckCircle,
  Tag,
  Clock,
  ExternalLink,
  Navigation,
  Sparkles,
  Layers,
  Filter,
  ShieldCheck,
  Map as MapIcon,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTranslation, copyFor } from '@/lib/language-store';
import { ALGERIAN_AGRI_STORES, type AgriStore } from '@/lib/algerian-agri-stores-data';
import dynamic from 'next/dynamic';

// Leaflet accesses `window` at import time — must be loaded client-side only.
const AgriDealerMap = dynamic(
  () => import('@/components/agri/agri-dealer-map').then((m) => m.AgriDealerMap),
  { ssr: false, loading: () => <div className="h-[500px] flex items-center justify-center text-muted-foreground text-sm">Loading map…</div> },
);

interface AgriSuppliersDirectoryProps {
  initialWilaya?: string;
  sunMode?: boolean;
}

export function AgriSuppliersDirectory({ initialWilaya = 'All', sunMode = false }: AgriSuppliersDirectoryProps) {
  const { language } = useTranslation();
  const tr = (en: string, ar: string, fr: string) => copyFor(language, en, ar, fr);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState<string>(initialWilaya);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStore, setSelectedStore] = useState<AgriStore | null>(ALGERIAN_AGRI_STORES[0]);

  const filteredStores = ALGERIAN_AGRI_STORES.filter((st) => {
    const matchSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.commune.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.stockedBrands.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase())) ||
      st.servicesOffered.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchWilaya = selectedWilaya === 'All' || st.wilaya.toLowerCase().includes(selectedWilaya.toLowerCase());
    const matchCat = selectedCategory === 'All' || st.category === selectedCategory;

    return matchSearch && matchWilaya && matchCat;
  });

  const handleWhatsAppContact = (store: AgriStore) => {
    const phone = store.whatsappPhone || store.phone.replace(/[^0-9]/g, '');
    const message = `Bonjour ${store.name},\nJe vous contacte via AgroVision / Formula Atlas pour demander la disponibilité de produits homologués INPV pour mon exploitation à ${store.wilaya}. Merci !`;
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <Card className={`border shadow-md overflow-hidden ${sunMode ? 'border-foreground bg-background text-foreground' : 'border-border bg-card'}`}>
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-extrabold tracking-tight">
                  {tr('Algerian Certified Input & Phyto Store Locator', 'دليل المحلات والموزعين المعتمدين للمبيدات والمدخلات بالجزائر', 'Annuaire des Distributeurs & Fournisseurs Agricoles (Algérie)')}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <ShieldCheck className="h-3 w-3 inline mr-1 text-emerald-600" />
                  {tr('INPV Approved Retailers', 'محلات معتمدة من INPV', 'Agréés INPV')}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {tr(
                  'Locate certified local suppliers for fungicides, bio-controls, seeds, and drip irrigation gear with direct WhatsApp inquiries.',
                  'ابحث عن أقرب موزع معتمد للبذور والمبيدات وأجهزة التقطير مع التواصل المباشر عبر واتساب وهاتف.',
                  'Trouvez les points de vente agréés pour semences, phytosanitaires et fertigation avec contact direct WhatsApp.'
                )}
              </CardDescription>
            </div>
          </div>
          {/* Map / List toggle */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="h-8 gap-1 text-xs"
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tr('Map', 'خريطة', 'Carte')}</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 gap-1 text-xs"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tr('List', 'قائمة', 'Liste')}</span>
            </Button>
          </div>
        </div>

        {/* Interactive Map View */}
        {viewMode === 'map' && (
          <div className="pt-3">
            <AgriDealerMap />
          </div>
        )}

        {/* Search and Filters Bar — only in list view */}
        {viewMode === 'list' && (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-3 border-t mt-3 text-xs">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tr('Search store name, brand (Syngenta, Bayer), or seed...', 'ابحث باسم المحل أو العلامة أو المبيد...', 'Rechercher magasin, marque, semence...')}
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedWilaya}
              onChange={(e) => setSelectedWilaya(e.target.value)}
              className="w-full h-8 px-2.5 rounded-xl border bg-background text-xs font-medium"
            >
              <option value="All">{tr('All Wilayas', 'كل الولايات', 'Toutes les Wilayas')}</option>
              <option value="Blida">Blida (البليدة)</option>
              <option value="Biskra">Biskra (بسكرة)</option>
              <option value="El Oued">El Oued (الوادي)</option>
              <option value="Mostaganem">Mostaganem (مستغانم)</option>
              <option value="Mascara">Mascara (معسكر)</option>
              <option value="Sétif">Sétif (سطيف)</option>
              <option value="Aïn Defla">Aïn Defla (عين الدفلى)</option>
              <option value="Tizi Ouzou">Tizi Ouzou (تيزي وزو)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-8 px-2.5 rounded-xl border bg-background text-xs font-medium"
            >
              <option value="All">{tr('All Categories', 'جميع التخصصات', 'Toutes Catégories')}</option>
              <option value="phyto_chem">{tr('Phyto & Crop Protection', 'مبيدات ووقاية النبات', 'Phyto & Traitements')}</option>
              <option value="bio_inputs">{tr('Biological & IPM Control', 'مكافحة بيولوجية ومصائد', 'Bio-contrôle & IPM')}</option>
              <option value="irrigation_tech">{tr('Irrigation & Solar Tech', 'ري، محاور وطاقة شمسية', 'Irrigation & Solaire')}</option>
              <option value="seeds_seedlings">{tr('Certified Seeds & Plants', 'بذور وشتلات معتمدة', 'Semences Certifiées')}</option>
            </select>
          </div>
        </div>
        )}

      </CardHeader>

      {viewMode === 'list' && (
      <CardContent className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List of Retailers */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-1">
              <span>{filteredStores.length} {tr('Certified Outlets Found', 'محل وموزع متوفر', 'points de vente trouvés')}</span>
              <span>{tr('Click to view catalog & contact', 'انقر للاطلاع على المخزون والتواصل', 'Cliquez pour détails')}</span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredStores.map((st) => {
                const isSelected = selectedStore?.id === st.id;
                return (
                  <motion.div
                    key={st.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedStore(st)}
                    className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/60 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-card border-border hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-foreground">
                            {language === 'ar' ? st.name_ar : st.name}
                          </h4>
                          {st.verifiedInpvDealer && (
                            <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-800 border-emerald-300">
                              ✓ INPV Agréé
                            </Badge>
                          )}
                        </div>

                        <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                          <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                          <span>{st.wilaya} · {st.commune}</span>
                        </p>

                        <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                          {language === 'ar' ? st.category_ar : st.category_fr}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {st.wilaya}
                        </Badge>
                      </div>
                    </div>

                    {/* Stocked Brands Chips */}
                    <div className="pt-2.5 mt-2 border-t flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground font-bold">Brands:</span>
                      {st.stockedBrands.slice(0, 3).map((brand) => (
                        <span key={brand} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium">
                          {brand}
                        </span>
                      ))}
                      {st.stockedBrands.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{st.stockedBrands.length - 3}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {filteredStores.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-xs border rounded-2xl">
                  {tr('No agricultural input retailers match your current filter.', 'لا توجد محلات مطابقة لمعايير البحث الحالية.', 'Aucun point de vente ne correspond à vos filtres.')}
                </div>
              )}
            </div>
          </div>

          {/* Detailed Selected Store View */}
          <div className="lg:col-span-5 space-y-4">
            {selectedStore ? (
              <div className="p-5 rounded-2xl border bg-card shadow-sm space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-400">
                      🛡️ {tr('Official INPV Partner Store', 'شريك معتمد لحماية النباتات', 'Distributeur Agréé')}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {selectedStore.openingHours}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-foreground mt-2">
                    {language === 'ar' ? selectedStore.name_ar : selectedStore.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <span>{selectedStore.address}</span>
                  </p>
                </div>

                {/* Stocked Brands & Certifications */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-foreground block">{tr('Stocked Brands & Formulations:', 'العلامات التجارية والشركات المتوفرة:', 'Marques & Produits Distribués :')}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStore.stockedBrands.map((b) => (
                      <Badge key={b} variant="secondary" className="text-xs font-semibold py-1 px-2.5 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
                        ✓ {b}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Services Offered */}
                <div className="p-3 rounded-xl bg-muted/40 border space-y-1.5 text-xs">
                  <span className="font-bold text-foreground block">{tr('Agronomic Services Provided:', 'الخدمات الفلاحية الميدانية المقدمة:', 'Services Spécialisés :')}</span>
                  <ul className="space-y-1 text-muted-foreground text-[11px]">
                    {selectedStore.servicesOffered.map((srv, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>{srv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons: Phone & WhatsApp */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => handleWhatsAppContact(selectedStore)}
                    className="h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>{tr('WhatsApp Order', 'طلب عبر واتساب', 'Devis WhatsApp')}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(`tel:${selectedStore.phone}`, '_self')}
                    className="h-10 text-xs font-bold gap-1.5 border-border hover:bg-muted"
                  >
                    <Phone className="h-4 w-4 text-emerald-600" />
                    <span>{tr('Direct Call', 'اتصال هاتفي', 'Appeler')}</span>
                  </Button>
                </div>

                <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>GPS: {selectedStore.lat.toFixed(4)}, {selectedStore.lng.toFixed(4)}</span>
                  <button
                    type="button"
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedStore.lat},${selectedStore.lng}`, '_blank')}
                    className="text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Navigation className="h-3 w-3" />
                    <span>{tr('Google Maps Directions', 'الاتجاهات في خرائط غوغل', 'Itinéraire Maps')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-xs border rounded-2xl">
                {tr('Select a store to view inventory details', 'اختر محلا لعرض أرقام الاتصال والمنتجات', 'Sélectionnez un magasin')}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      )}
    </Card>
  );
}
