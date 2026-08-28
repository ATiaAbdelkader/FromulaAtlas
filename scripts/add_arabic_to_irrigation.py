"""
Update the irrigation formulas in agri_formulas.json to include Arabic content
(name_ar, purpose_ar, variables_ar) from the source data.

This is a PATCH script — it reads the current agri_formulas.json (which already
has the 100 irrigation formulas with English content), reads the source irrigation
data, and adds the Arabic fields to each irrigation formula.
"""

import json

# Load both data sources
with open('/home/z/my-project/scripts/irrigation_equations_raw.json') as f:
    irr_data = json.load(f)

with open('/home/z/my-project/src/data/agri_formulas.json') as f:
    existing = json.load(f)

# Build a lookup from source equations by matching name_en to our formula name
source_lookup = {}
for eq in irr_data['equations']:
    source_lookup[eq['n_en']] = eq

# Category to section number mapping (must match the merge script)
category_meta = {
    'Hydraulics': 1, 'PipeFlow': 2, 'HeadLoss': 3, 'OpenChannel': 4,
    'Pumps': 5, 'Groundwater': 6, 'Drip': 7, 'Sprinkler': 8,
    'Scheduling': 9, 'Crop': 10, 'Soil': 11, 'WaterQuality': 12,
    'Fertigation': 13, 'Tanks': 14, 'Conversions': 15,
}

# Build source lookup by code: IRR-{section}.{index}
source_by_code = {}
for cat_key, section_num in category_meta.items():
    cat_eqs = [eq for eq in irr_data['equations'] if eq['cat'] == cat_key]
    for idx, eq in enumerate(cat_eqs, 1):
        code = f'IRR-{section_num}.{idx}'
        source_by_code[code] = eq

# Update all_formulas entries
updated_count = 0
for formula in existing['all_formulas']:
    if formula['code'] in source_by_code:
        eq = source_by_code[formula['code']]
        formula['name_ar'] = eq['n_ar']
        formula['purpose_ar'] = eq['d_ar']
        # Build Arabic variables string
        formula['variables_ar'] = '\n'.join(
            f'{v[0]} = {v[1]}' for v in eq.get('v', [])
        )
        updated_count += 1

# Also update the part structure (chapters and formulas inside)
for part in existing['parts']:
    if part['title'] == 'Irrigation Engineering':
        for chapter in part['chapters']:
            for formula in chapter['formulas']:
                if formula['code'] in source_by_code:
                    eq = source_by_code[formula['code']]
                    formula['name_ar'] = eq['n_ar']
                    formula['purpose_ar'] = eq['d_ar']
                    formula['variables_ar'] = '\n'.join(
                        f'{v[0]} = {v[1]}' for v in eq.get('v', [])
                    )

# Write back
with open('/home/z/my-project/src/data/agri_formulas.json', 'w', encoding='utf-8') as f:
    json.dump(existing, f, ensure_ascii=False, indent=2)

print(f'Updated {updated_count} irrigation formulas with Arabic content')

# Verify a sample
for formula in existing['all_formulas']:
    if formula['code'] == 'IRR-1.1':
        print()
        print('Sample (IRR-1.1):')
        print(f'  name_en: {formula["name"]}')
        print(f'  name_ar: {formula.get("name_ar", "MISSING")}')
        print(f'  purpose_en: {formula["purpose"]}')
        print(f'  purpose_ar: {formula.get("purpose_ar", "MISSING")}')
        print(f'  variables_ar: {formula.get("variables_ar", "MISSING")[:80]}')
        break
