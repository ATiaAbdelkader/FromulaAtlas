"""Merge 100 irrigation equations into agri_formulas.json with Arabic content."""
import json, re
from collections import defaultdict

with open('/home/z/my-project/scripts/irrigation_equations_raw.json') as f:
    irr_data = json.load(f)
with open('/home/z/my-project/src/data/agri_formulas.json') as f:
    existing = json.load(f)

category_meta = {
    'Hydraulics': {'section': 1, 'title': 'Hydraulics Fundamentals'},
    'PipeFlow': {'section': 2, 'title': 'Pipe Flow'},
    'HeadLoss': {'section': 3, 'title': 'Head Loss & Friction'},
    'OpenChannel': {'section': 4, 'title': 'Open Channel Flow'},
    'Pumps': {'section': 5, 'title': 'Pumps & Pumping'},
    'Groundwater': {'section': 6, 'title': 'Groundwater & Wells'},
    'Drip': {'section': 7, 'title': 'Drip Irrigation'},
    'Sprinkler': {'section': 8, 'title': 'Sprinkler Irrigation'},
    'Scheduling': {'section': 9, 'title': 'Irrigation Scheduling'},
    'Crop': {'section': 10, 'title': 'Crop Water Requirements'},
    'Soil': {'section': 11, 'title': 'Soil Physics & Moisture'},
    'WaterQuality': {'section': 12, 'title': 'Water Quality'},
    'Fertigation': {'section': 13, 'title': 'Fertigation'},
    'Tanks': {'section': 14, 'title': 'Reservoirs & Tanks'},
    'Conversions': {'section': 15, 'title': 'Conversions & Constants'},
}

def latex_to_text(latex):
    s = latex
    s = s.replace('\\times', '×').replace('\\div', '÷')
    s = re.sub(r'\\frac\{([^}]+)\}\{([^}]+)\}', r'(\1)/(\2)', s)
    s = re.sub(r'\\sqrt\{([^}]+)\}', r'√(\1)', s)
    s = s.replace('\\cdot', '·').replace('\\pi', 'π').replace('\\Delta', 'Δ')
    s = re.sub(r'_\{([^}]+)\}', r'_\1', s)
    s = re.sub(r'\^\{([^}]+)\}', r'^\1', s)
    s = s.replace('\\leq', '≤').replace('\\geq', '≥').replace('\\neq', '≠')
    s = s.replace('\\approx', '≈').replace('\\sum', 'Σ').replace('\\prod', 'Π')
    s = s.replace('\\', '')
    s = re.sub(r'\s+', ' ', s).strip()
    return s

eqs_by_cat = defaultdict(list)
for eq in irr_data['equations']:
    eqs_by_cat[eq['cat']].append(eq)

new_part = {'roman': 'XVIII', 'title': 'Irrigation Engineering', 'chapters': []}
irrigation_formulas = []

for cat_key, cat_info in category_meta.items():
    section_num = cat_info['section']
    section_title = cat_info['title']
    cat_eqs = eqs_by_cat.get(cat_key, [])
    chapter = {
        'number': section_num, 'title': section_title,
        'intro': f'Irrigation engineering equations for {section_title.lower()} — sourced from the Irrigation Atlas (irrigationatlas.com).',
        'sub_sections': [], 'formulas': [], 'summary_tables': [],
        'sustainability_notes': [], 'decision_boxes': []
    }
    for idx, eq in enumerate(cat_eqs, 1):
        code = f'IRR-{section_num}.{idx}'
        formula_text = latex_to_text(eq['form'])
        variables_en = '\n'.join(f'{v[0]} = {v[2]}' for v in eq.get('v', []))
        variables_ar = '\n'.join(f'{v[0]} = {v[1]}' for v in eq.get('v', []))
        formula_obj = {
            'code': code, 'name': eq['n_en'], 'formula': formula_text,
            'variables': variables_en, 'purpose': eq['d_en'],
            'example': '', 'pitfall': '', 'decision': '', 'notes': '',
            'name_ar': eq['n_ar'], 'purpose_ar': eq['d_ar'], 'variables_ar': variables_ar,
        }
        chapter['formulas'].append(formula_obj)
        irrigation_formulas.append({**formula_obj, 'part': 'Irrigation Engineering', 'part_roman': 'XVIII', 'chapter': section_title, 'chapter_number': section_num})
    new_part['chapters'].append(chapter)

# Check if Part XVIII already exists
if not any(p['title'] == 'Irrigation Engineering' for p in existing['parts']):
    existing['parts'].append(new_part)
    existing['all_formulas'].extend(irrigation_formulas)
else:
    # Replace existing Part XVIII
    existing['parts'] = [p if p['title'] != 'Irrigation Engineering' else new_part for p in existing['parts']]
    existing['all_formulas'] = [f for f in existing['all_formulas'] if not f['code'].startswith('IRR-')]
    existing['all_formulas'].extend(irrigation_formulas)

existing['meta']['total_parts'] = len(existing['parts'])
existing['meta']['total_chapters'] = sum(len(p['chapters']) for p in existing['parts'])
existing['meta']['total_formulas'] = len(existing['all_formulas'])
if 'Irrigation Engineering' not in existing['meta']['categories']:
    existing['meta']['categories']['Irrigation Engineering'] = len(irrigation_formulas)

with open('/home/z/my-project/src/data/agri_formulas.json', 'w', encoding='utf-8') as f:
    json.dump(existing, f, ensure_ascii=False, indent=2)

print(f'Merged {len(irrigation_formulas)} irrigation formulas')
print(f'Totals: {existing["meta"]["total_parts"]} parts, {existing["meta"]["total_chapters"]} sections, {existing["meta"]["total_formulas"]} formulas')
