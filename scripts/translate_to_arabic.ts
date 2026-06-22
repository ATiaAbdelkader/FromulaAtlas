/**
 * Translate remaining formulas to Arabic using LLM.
 * Processes in small batches (10 at a time) and saves after each batch.
 */

import ZAI from 'z-ai-web-dev-sdk';
import { readFileSync, writeFileSync } from 'fs';

const DATA_PATH = '/home/z/my-project/src/data/agri_formulas.json';
const BATCH_SIZE = 10;

async function main() {
  const data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  const zai = await ZAI.create();

  const needing = data.all_formulas.filter((f: any) => !f.name_ar);
  console.log(`Need translation: ${needing.length}`);

  if (needing.length === 0) {
    console.log('Done - all have Arabic.');
    return;
  }

  let done = 0;
  const batches: any[][] = [];
  for (let i = 0; i < needing.length; i += BATCH_SIZE) {
    batches.push(needing.slice(i, i + BATCH_SIZE));
  }

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    console.log(`Batch ${bi+1}/${batches.length} (${batch.length} formulas)...`);

    const formulaData = batch.map(f => ({
      code: f.code, name: f.name, purpose: f.purpose, variables: f.variables
    }));

    const prompt = `Translate these agricultural formulas from English to Arabic. Keep mathematical symbols and units unchanged. Respond with ONLY a JSON array.

${JSON.stringify(formulaData, null, 2)}

Format: [{"code":"2.1","name_ar":"...","purpose_ar":"...","variables_ar":"Symbol = Arabic desc\\n..."}]`;

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'You are a professional agricultural translator. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        thinking: { type: 'disabled' },
      });

      let resp = completion.choices[0]?.message?.content || '';
      resp = resp.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

      const translations = JSON.parse(resp);
      const tMap: Record<string, any> = {};
      for (const t of translations) {
        tMap[t.code] = t;
      }

      // Update data
      for (const f of data.all_formulas) {
        if (tMap[f.code]) {
          f.name_ar = tMap[f.code].name_ar;
          f.purpose_ar = tMap[f.code].purpose_ar;
          f.variables_ar = tMap[f.code].variables_ar;
        }
      }
      for (const part of data.parts) {
        for (const ch of part.chapters) {
          for (const f of ch.formulas) {
            if (tMap[f.code]) {
              f.name_ar = tMap[f.code].name_ar;
              f.purpose_ar = tMap[f.code].purpose_ar;
              f.variables_ar = tMap[f.code].variables_ar;
            }
          }
          for (const sub of ch.sub_sections || []) {
            for (const f of sub.formulas) {
              if (tMap[f.code]) {
                f.name_ar = tMap[f.code].name_ar;
                f.purpose_ar = tMap[f.code].purpose_ar;
                f.variables_ar = tMap[f.code].variables_ar;
              }
            }
          }
        }
      }

      done += translations.length;
      console.log(`  ✓ ${translations.length} translated (${done}/${needing.length} total)`);

      // Save after each batch
      writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');

      if (bi < batches.length - 1) await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`  ✗ Batch ${bi+1} failed:`, e.message);
    }
  }

  const final = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  const withAr = final.all_formulas.filter((f: any) => f.name_ar).length;
  console.log(`\n✓ Complete: ${withAr}/${final.all_formulas.length} formulas have Arabic translations`);
}

main().catch(console.error);
