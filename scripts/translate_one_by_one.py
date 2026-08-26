"""Translate remaining formulas to Arabic one at a time using z-ai CLI."""
import json, subprocess, re, sys

DATA_PATH = '/home/z/my-project/src/data/agri_formulas.json'

with open(DATA_PATH) as f:
    data = json.load(f)

needing = [f for f in data['all_formulas'] if not f.get('name_ar')]
print(f'Need translation: {len(needing)}')

done = 0
for formula in needing:
    formula_data = {
        'code': formula['code'],
        'name': formula['name'],
        'purpose': formula['purpose'],
        'variables': formula['variables'],
    }

    prompt = f"""Translate these agricultural terms from English to Arabic. Keep math symbols and units unchanged. Respond with ONLY valid JSON (no markdown, no backticks).

{json.dumps(formula_data, ensure_ascii=False)}

Respond exactly: {{"code":"{formula['code']}","name_ar":"Arabic name","purpose_ar":"Arabic purpose","variables_ar":"Symbol = Arabic desc"}}"""

    try:
        result = subprocess.run(
            ['z-ai', 'chat', '--system', 'You are a professional agricultural translator. Respond with valid JSON only.', '--prompt', prompt, '-o', '/tmp/single_translation.json'],
            capture_output=True, text=True, timeout=30
        )

        with open('/tmp/single_translation.json') as f:
            resp = json.load(f)

        content = ''
        if 'choices' in resp:
            content = resp['choices'][0]['message']['content']
        elif 'content' in resp:
            content = resp['content']
        else:
            content = str(resp)

        # Extract JSON from response
        content = content.strip().replace('```json', '').replace('```', '').strip()
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            translation = json.loads(match.group(0))
            formula['name_ar'] = translation.get('name_ar', formula['name'])
            formula['purpose_ar'] = translation.get('purpose_ar', formula['purpose'])
            formula['variables_ar'] = translation.get('variables_ar', formula['variables'])
            done += 1
            print(f'  ✓ {formula["code"]}: {formula["name_ar"][:40]}')

            # Save after every 5 translations
            if done % 5 == 0:
                with open(DATA_PATH, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f'  Saved ({done} done)')
        else:
            print(f'  ✗ {formula["code"]}: No JSON in response')
    except Exception as e:
        print(f'  ✗ {formula["code"]}: {e}')

# Final save
with open(DATA_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

has_ar = sum(1 for f in data['all_formulas'] if f.get('name_ar'))
print(f'\nDone: {done} translated. Total with Arabic: {has_ar}/{len(data["all_formulas"])}')
