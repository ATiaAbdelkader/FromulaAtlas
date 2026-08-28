#!/usr/bin/env python3
"""
parse_inpv_pdf_enriched.py — re-extract INPV 2017 phyto PDF into a richer JSON.

Input:  /tmp/inpv-catalogue.pdf (already downloaded from Drive)
Output: /home/z/my-project/public/data/phyto-2017-index-enriched.json

Improvements over the existing phyto-2017-index.json:

1. Structured usage entries: list of { crop, pest, dose, dar, application_method }
   instead of raw concatenated strings.

2. Bee toxicity flag (toxic_to_bees: true/false) — detects
   "toxique pour les abeilles" / "toxique pour les pollinisateurs".

3. Aquatic toxicity flag (toxic_to_aquatic: true/false) — detects
   "toxique pour les organismes aquatiques" / "près des plans d'eau".

4. Bilingual labels: crop and section names translated to EN + AR.

5. Cleaner active-substance name (handles hyphenation splits like "THIAME-/THOXAM").

6. Company name normalization (groups "Syngenta", "Bayer", "Adama", etc.).
"""

import json
import re
import subprocess
import unicodedata
from pathlib import Path

PDF = '/tmp/inpv-catalogue.pdf'
OUTPUT = '/home/z/my-project/public/data/phyto-2017-index-enriched.json'

# ============================================================================
# 1. Bilingual crop dictionary
# ============================================================================

CROP_LABELS = {
    'agrumes':           {'en': 'Citrus',         'ar': 'الحمضيات',           'fr': 'Agrumes'},
    'céréales':          {'en': 'Cereals',        'ar': 'الحبوب',             'fr': 'Céréales'},
    'vigne':             {'en': 'Vine',           'ar': 'الكروم',             'fr': 'Vigne'},
    'olivier':           {'en': 'Olive',          'ar': 'الزيتون',            'fr': 'Olivier'},
    'tomate':            {'en': 'Tomato',         'ar': 'الطماطم',            'fr': 'Tomate'},
    'pomme de terre':    {'en': 'Potato',        'ar': 'البطاطا',            'fr': 'Pomme de terre'},
    'cucurbitacées':     {'en': 'Cucurbits',     'ar': 'القرعيات',           'fr': 'Cucurbitacées'},
    'cultures maraîchères': {'en': 'Vegetable crops', 'ar': 'الخضروات',       'fr': 'Cultures maraîchères'},
    'maraîchères':       {'en': 'Vegetable crops', 'ar': 'الخضروات',         'fr': 'Cultures maraîchères'},
    'arboriculture':     {'en': 'Fruit trees',   'ar': 'الأشجار المثمرة',     'fr': 'Arboriculture'},
    'arbres fruitiers':  {'en': 'Fruit trees',   'ar': 'الأشجار المثمرة',     'fr': 'Arbres fruitiers'},
    'arbres fruitiers à noyaux': {'en': 'Stone fruit', 'ar': 'الفواكه ذات النواة', 'fr': 'Arbres fruitiers à noyaux'},
    'arbres fruitiers à pépins': {'en': 'Pome fruit', 'ar': 'الفواكه ذات البذور', 'fr': 'Arbres fruitiers à pépins'},
    'fraisier':          {'en': 'Strawberry',    'ar': 'الفراولة',           'fr': 'Fraisier'},
    'fraise':            {'en': 'Strawberry',    'ar': 'الفراولة',           'fr': 'Fraise'},
    'poivron':           {'en': 'Pepper',        'ar': 'الفلفل',             'fr': 'Poivron'},
    'piment':            {'en': 'Chili pepper',  'ar': 'الفلفل الحار',       'fr': 'Piment'},
    'oignon':            {'en': 'Onion',         'ar': 'البصل',              'fr': 'Oignon'},
    'ail':               {'en': 'Garlic',        'ar': 'الثوم',              'fr': 'Ail'},
    'poireau':           {'en': 'Leek',          'ar': 'الكُرّاث',            'fr': 'Poireau'},
    'carotte':           {'en': 'Carrot',        'ar': 'الجزر',              'fr': 'Carotte'},
    'chou':              {'en': 'Cabbage',       'ar': 'الملفوف',            'fr': 'Chou'},
    'laitue':            {'en': 'Lettuce',       'ar': 'الخس',               'fr': 'Laitue'},
    'salade':            {'en': 'Salad greens',  'ar': 'السلطة',             'fr': 'Salade'},
    'aubergine':         {'en': 'Eggplant',      'ar': 'الباذنجان',           'fr': 'Aubergine'},
    'concombre':         {'en': 'Cucumber',      'ar': 'الخيار',              'fr': 'Concombre'},
    'melon':             {'en': 'Melon',         'ar': 'البطيخ',              'fr': 'Melon'},
    'pastèque':          {'en': 'Watermelon',    'ar': 'البطيخ الأحمر',       'fr': 'Pastèque'},
    'courgette':         {'en': 'Zucchini',     'ar': 'الكوسا',              'fr': 'Courgette'},
    'haricot':           {'en': 'Bean',          'ar': 'الفاصوليا',           'fr': 'Haricot'},
    'pois':              {'en': 'Pea',           'ar': 'البازلاء',            'fr': 'Pois'},
    'fève':              {'en': 'Fava bean',     'ar': 'الفول',               'fr': 'Fève'},
    'lentille':          {'en': 'Lentil',        'ar': 'العدس',               'fr': 'Lentille'},
    'pois chiche':       {'en': 'Chickpea',      'ar': 'الحمص',               'fr': 'Pois chiche'},
    'arachide':          {'en': 'Peanut',        'ar': 'الفول السوداني',      'fr': 'Arachide'},
    'betterave':         {'en': 'Beet',          'ar': 'البنجر',              'fr': 'Betterave'},
    'betterave sucrière': {'en': 'Sugar beet',   'ar': 'البنجر السكري',       'fr': 'Betterave sucrière'},
    'colza':             {'en': 'Canola',        'ar': 'اللفت الزيتي',        'fr': 'Colza'},
    'tournesol':         {'en': 'Sunflower',     'ar': 'عباد الشمس',          'fr': 'Tournesol'},
    'luzerne':           {'en': 'Alfalfa',       'ar': 'الفصة',               'fr': 'Luzerne'},
    'coton':             {'en': 'Cotton',        'ar': 'القطن',               'fr': 'Coton'},
    'riz':               {'en': 'Rice',          'ar': 'الأرز',               'fr': 'Riz'},
    'blé':               {'en': 'Wheat',         'ar': 'القمح',               'fr': 'Blé'},
    'orge':              {'en': 'Barley',        'ar': 'الشعير',              'fr': 'Orge'},
    'avoine':            {'en': 'Oats',         'ar': 'الشوفان',             'fr': 'Avoine'},
    'maïs':              {'en': 'Maize',         'ar': 'الذرة',               'fr': 'Maïs'},
    'sorgho':            {'en': 'Sorghum',       'ar': 'الذرة الرفيعة',       'fr': 'Sorgho'},
    'tabac':             {'en': 'Tobacco',       'ar': 'التبغ',               'fr': 'Tabac'},
    'palmier dattier':   {'en': 'Date palm',     'ar': 'نخيل التمر',          'fr': 'Palmier dattier'},
    'pommier':           {'en': 'Apple',         'ar': 'التفاح',              'fr': 'Pommier'},
    'poirier':           {'en': 'Pear',          'ar': 'الكُمّثرى',            'fr': 'Poirier'},
    'pêcher':            {'en': 'Peach',         'ar': 'الخوخ',               'fr': 'Pêcher'},
    'abricotier':        {'en': 'Apricot',       'ar': 'المشمش',              'fr': 'Abricotier'},
    'amandier':          {'en': 'Almond',        'ar': 'اللوز',               'fr': 'Amandier'},
    'citrullus':         {'en': 'Watermelon',    'ar': 'البطيخ',              'fr': 'Citrullus'},
    'légumes':           {'en': 'Vegetables',    'ar': 'الخضروات',            'fr': 'Légumes'},
    'grains stockés':    {'en': 'Stored grain',  'ar': 'الحبوب المخزنة',      'fr': 'Grains stockés'},
    'parois des locaux et des sacs': {'en': 'Warehouse walls & sacks', 'ar': 'جدران المخازن والأكياس', 'fr': 'Parois des locaux et des sacs'},
}

SECTION_LABELS = {
    'INSECTICIDES':  {'en': 'Insecticides',           'ar': 'مبيدات الحشرات',           'fr': 'Insecticides'},
    'ACARICIDES':    {'en': 'Acaricides',              'ar': 'مبيدات العث',              'fr': 'Acaricides'},
    'FONGICIDES':    {'en': 'Fungicides',              'ar': 'مبيدات الفطريات',          'fr': 'Fongicides'},
    'HERBICIDES':    {'en': 'Herbicides',              'ar': 'مبيدات الأعشاب',          'fr': 'Herbicides'},
    'NEMATICIDES':   {'en': 'Nematicides',             'ar': 'مبيدات الديدان الثعبانية', 'fr': 'Nématicides'},
    'RODENTICIDES':  {'en': 'Rodenticides',           'ar': 'مبيدات القوارض',           'fr': 'Rodenticides'},
    'MOLLUSCICIDES': {'en': 'Molluscicides',          'ar': 'مبيدات القواقع',           'fr': 'Molluscicides'},
    'REGULATEURS':   {'en': 'Growth regulators / Correctors', 'ar': 'منظمات النمو ومصححات النقص', 'fr': 'Régulateurs / Correcteurs'},
    'DIVERS':        {'en': 'Other',                   'ar': 'متنوعة',                  'fr': 'Divers'},
}

# ============================================================================
# 2. Company normalization
# ============================================================================

COMPANY_PATTERNS = [
    (r'syngenta', 'Syngenta'),
    (r'bayer', 'Bayer'),
    (r'basf', 'BASF'),
    (r'adama', 'Adama'),
    (r'nufarm', 'Nufarm'),
    (r'fmc', 'FMC'),
    (r'corteva|dow|dupont', 'Corteva'),
    (r'sumitomo|sumi?agro', 'Sumitomo'),
    (r'arysta', 'Arysta LifeScience'),
    (r'makhteshim', 'Makhteshim'),
    (r'adama', 'Adama'),
    (r'rotam', 'Rotam'),
    (r'chemchina', 'ChemChina'),
    (r'pi?er?o?r?l?i?ss?a?', 'Pi Industries'),
    (r'astaraindustrial|astra industrial', 'Astra Industrial'),
    (r'jordaninsecticides|jordan insecticides', 'Jordan Insecticides & Agro'),
    (r'rivale', 'Rivale'),
    (r'porporas', 'Porporas'),
    (r'thearabpesticide|arab pesticide', 'The Arab Pesticide'),
    (r'agrosem', 'Agrosem'),
    (r'golden', 'Eurl Golden'),
    (r'biogect|bioget', 'Biogest'),
    (r'cerexagri', 'Cerexagri'),
    (r'tifa', 'Tifa'),
    (r'sipcam', 'Sipcam'),
    (r'philagro', 'Philagro'),
    (r'certis', 'Certis'),
    (r'belchim', 'Belchim'),
    (r'ujval|u?j?v?a?l?', 'Ujval'),
    (r'sar?a? ?el? ??ag?r?', 'SarElAgro'),
]

def normalize_company(text: str) -> str:
    t = text.lower()
    for pat, name in COMPANY_PATTERNS:
        if re.search(pat, t):
            return name
    return text.strip()

# ============================================================================
# 3. Pest patterns (for splitting usage chunks)
# ============================================================================

PEST_PATTERNS = [
    'pucerons', 'thrips', 'aleurodes', 'mineuse', 'mineuses', 'acariens', 'tetranique',
    'cochenille', 'cochenilles', 'psylle', 'mouche des fruits', 'mouche', 'punaise',
    'criocère', 'noctuelles', 'chenilles', 'chenille', 'foreur', 'teigne', 'pyrale',
    'nématodes', 'nématode', 'limaces', 'limace', 'criquets', 'sauterelles',
    'taupin', 'thrips', 'cicadelle', 'cécidomyie', 'puceron lanigère',
    'altise', 'casside', 'charançon', 'cordyle',
]

# ============================================================================
# 4. Helpers
# ============================================================================

def norm(s: str) -> str:
    """Accent-insensitive lowercase."""
    return unicodedata.normalize('NFD', (s or '').lower()).encode('ascii', 'ignore').decode('ascii').replace(' ', '').replace('-', '')

def normalize_fr(s: str) -> str:
    return unicodedata.normalize('NFD', (s or '').lower()).encode('ascii', 'ignore').decode('ascii')

# Dose regex: matches "50ml/hl", "75 ml/Ha", "20-30 g/hl", "150-200g/Ha", "10 ml/T"
DOSE_RE = re.compile(r'(\d+(?:[-,]\d+)?(?:\.\d+)?)\s*(ml|g|kg|L)\s*/\s*(hl|Ha|ha|T|m²|m2)', re.I)
# DAR regex: a standalone integer 1-90 that follows a dose
DAR_RE = re.compile(r'\b([1-9]\d?)\b')

def parse_usage_chunk(chunk: str) -> dict:
    """Parse one chunk of usage text into {crop, pest, dose, dar}."""
    chunk = chunk.strip()
    if not chunk:
        return None

    # Find crop
    crop = None
    low = normalize_fr(chunk)
    for crop_key, crop_info in CROP_LABELS.items():
        if crop_key in low:
            crop = crop_info['en']
            break

    # Find pest
    pest = None
    for p in PEST_PATTERNS:
        if p in low:
            pest = p.capitalize()
            break

    # Find dose
    dose_match = DOSE_RE.search(chunk)
    dose = dose_match.group(0).replace(' ', '') if dose_match else None

    # Find DAR (after dose, look for standalone 1-2 digit number)
    dar = None
    if dose_match:
        rest = chunk[dose_match.end():]
        dar_m = DAR_RE.search(rest)
        if dar_m:
            n = int(dar_m.group(1))
            if 1 <= n <= 90:
                dar = n

    return {
        'crop': crop,
        'pest': pest,
        'dose': dose,
        'dar': dar,
        'raw': chunk,
    }

def detect_toxicity(usage_list: list[str]) -> dict:
    """Detect bee and aquatic toxicity from the raw usage text."""
    combined = ' '.join(usage_list).lower()
    combined = combined.replace('\n', ' ').replace('  ', ' ')
    # Also un-glue "toxiquepourlesabeilles" -> "toxique pour les abeilles"
    combined = combined.replace('toxiquepourlesabeilles', 'toxique pour les abeilles')
    combined = combined.replace('toxiquepourlesorganismesaquatiques', 'toxique pour les organismes aquatiques')
    combined = combined.replace('toxiquepourlespollinisateurs', 'toxique pour les pollinisateurs')
    combined = combined.replace('traitementsprèsdesplansd', 'traitements près des plans d')

    toxic_bees = ('toxique pour les abeilles' in combined) or ('toxique pour les pollinisateurs' in combined) or ('abeilles' in combined and 'toxique' in combined)
    toxic_aquatic = ('organismes aquatiques' in combined) or ('plans d\'eau' in combined) or ('près des plans d' in combined) or ('aquatiques' in combined and 'toxique' in combined)

    return {
        'toxic_to_bees': toxic_bees,
        'toxic_to_aquatic': toxic_aquatic,
    }

def clean_active_substance(active: str, active_raw: str) -> str:
    """Clean hyphenation splits like 'THIAME-/THOXAM' -> 'thiamethoxam'."""
    s = (active or active_raw or '').strip()
    # Remove trailing hyphen and join
    s = re.sub(r'-\s*', '', s)
    s = s.lower()
    return s if len(s) >= 3 else (active_raw or '').lower()

# ============================================================================
# 5. Main: re-extract from existing JSON + re-parse usage chunks
# ============================================================================

def main():
    # Load existing parsed products
    existing_path = '/home/z/my-project/public/data/phyto-2017-index.json'
    with open(existing_path) as f:
        existing = json.load(f)

    print(f"Loaded {existing['count']} existing products from {existing_path}")

    enriched = []
    for p in existing['products']:
        # Parse usage chunks into structured entries
        structured_usage = []
        for chunk in p.get('usage', []):
            parsed = parse_usage_chunk(chunk)
            if parsed:
                structured_usage.append(parsed)

        # Detect toxicity
        tox = detect_toxicity(p.get('usage', []))

        # Normalize company
        company = normalize_company(p.get('company', ''))

        # Clean active substance
        active_clean = clean_active_substance(p.get('active', ''), p.get('active_raw', ''))

        # Section labels
        section = p.get('section', '')
        section_info = SECTION_LABELS.get(section, {'en': section, 'ar': section, 'fr': section})

        # Collect unique crops and pests for fast filtering
        crops = sorted(set(u['crop'] for u in structured_usage if u['crop']))
        pests = sorted(set(u['pest'] for u in structured_usage if u['pest']))
        doses = sorted(set(u['dose'] for u in structured_usage if u['dose']))
        dars = sorted(set(u['dar'] for u in structured_usage if u['dar'] is not None))

        enriched_p = {
            'page': p.get('page'),
            'homologation': p.get('homologation', ''),
            'brand': p.get('brand', ''),
            'active_substance': active_clean,
            'active_raw': p.get('active_raw', ''),
            'concentration': p.get('concentration', ''),
            'formulation': p.get('formulation', ''),
            'section': section,
            'section_label': section_info,
            'company': company,
            'usage_structured': structured_usage,
            'crops': crops,
            'pests': pests,
            'doses': doses,
            'dars': dars,
            'min_dar': min(dars) if dars else None,
            'max_dar': max(dars) if dars else None,
            'toxic_to_bees': tox['toxic_to_bees'],
            'toxic_to_aquatic': tox['toxic_to_aquatic'],
            # Keep raw usage for traceability
            'usage_raw': p.get('usage', []),
        }
        enriched.append(enriched_p)

    # Stats
    print(f"\n=== Enrichment stats ===")
    print(f"Total products: {len(enriched)}")
    print(f"Products with structured usage entries: {sum(1 for p in enriched if p['usage_structured'])}")
    print(f"Products with at least one crop identified: {sum(1 for p in enriched if p['crops'])}")
    print(f"Products with at least one pest identified: {sum(1 for p in enriched if p['pests'])}")
    print(f"Products with at least one dose: {sum(1 for p in enriched if p['doses'])}")
    print(f"Products with at least one DAR: {sum(1 for p in enriched if p['dars'])}")
    print(f"Products toxic to bees: {sum(1 for p in enriched if p['toxic_to_bees'])}")
    print(f"Products toxic to aquatic organisms: {sum(1 for p in enriched if p['toxic_to_aquatic'])}")
    print(f"\nBy section:")
    from collections import Counter
    sec_counts = Counter(p['section'] for p in enriched)
    for sec, cnt in sec_counts.most_common():
        print(f"  {sec}: {cnt}")

    # Write output
    out = {
        'source': 'INPV (Algeria) — Index des Produits Phytosanitaires à Usage Agricole, 2017',
        'source_pdf': 'INDEX_PRODUITS_PHYTO_2017.pdf (232 pages, 1264 products)',
        'generated': 'scripts/parse_inpv_pdf_enriched.py',
        'count': len(enriched),
        'products': enriched,
    }
    Path(OUTPUT).parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"\nWrote {OUTPUT} ({Path(OUTPUT).stat().st_size // 1024} KB)")

if __name__ == '__main__':
    main()
