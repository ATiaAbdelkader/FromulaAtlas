"""
Enhance algeria-crop-calendar.tsx to surface month.source.* fields that
were defined in the data but never displayed:
  - month.source.institution       (issuing body, often multi-line)
  - month.source.documentTitle     (the source document title)
  - month.source.language          (source language: French / Arabic)
  - month.source.extractionStatus  (how the data was extracted)
  - month.source.interpretationRule (notation rules like `u`, `q/ha`)

Adds a new "Source provenance" Card section AFTER the existing "Month
source notes and boundaries" Card, so users can see exactly which
institution produced the source PDF and how to interpret its notation.
"""

import subprocess

FILE = 'src/components/agri/algeria-crop-calendar.tsx'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the closing of the existing amber "Month source notes and boundaries" Card.
# It ends with `</Card>` immediately followed by the safety-boundary div.
ANCHOR = """        </CardContent>
      </Card>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 p-3 text-[10px] leading-relaxed text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /><p>{copyFor(language, 'Safety boundary: phytosanitary entries point to the source annex or leaflet when no product, active ingredient, or dose is printed. Use the INPV-aware safety tools for product decisions; this calendar does not invent treatments.', 'حد السلامة: تشير إدخالات وقاية النبات إلى الملحق أو النشرة المصدرية عندما لا يطبع المصدر منتجاً أو مادة فعالة أو جرعة. استخدم أدوات السلامة المرتبطة بفهرس INPV لقرارات المنتجات؛ هذا التقويم لا يخترع علاجات.', 'Limite de sécurité : les entrées phytosanitaires renvoient à l’annexe ou à la fiche source lorsque produit, matière active ou dose ne sont pas imprimés. Utilisez les outils de sécurité liés à l’INPV ; ce calendrier n’invente pas de traitements.')}</p></div>"""

assert ANCHOR in content, "Anchor block not found — file structure has changed"

NEW_BLOCK = """        </CardContent>
      </Card>

      <Card className="border-sky-200/80 dark:border-sky-900/70">
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><BookOpen className="h-4 w-4 text-sky-600" />{copyFor(language, 'Source provenance', 'مصدر البيانات', 'Provenance de la source')}</CardTitle><p className="text-[11px] leading-relaxed text-muted-foreground">{copyFor(language, 'Original institution, document title, source language, and extraction method for this month’s data.', 'الجهة الأصلية وعنوان الوثيقة ولغة المصدر وطريقة استخراج بيانات هذا الشهر.', 'Institution d’origine, titre du document, langue source et méthode d’extraction pour les données de ce mois.')}</p></CardHeader>
        <CardContent className="grid gap-4 p-4 pt-0 lg:grid-cols-2">
          <div><h4 className="text-[11px] font-semibold">{copyFor(language, 'Institution', 'الجهة', 'Institution')}</h4><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{month.source.institution}</p></div>
          <div><h4 className="text-[11px] font-semibold">{copyFor(language, 'Document title', 'عنوان الوثيقة', 'Titre du document')}</h4><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{month.source.documentTitle}</p><div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]"><Badge variant="outline" className="gap-1 border-sky-300 bg-sky-50/70 text-sky-800 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300"><MapPin className="h-2.5 w-2.5" />{month.source.language}</Badge><Badge variant="outline" className="gap-1 text-[10px]">{month.source.pdfLength}</Badge><Badge variant="outline" className="gap-1 text-[10px]">{month.source.printedPages}</Badge></div></div>
          <div><h4 className="text-[11px] font-semibold">{copyFor(language, 'Extraction status', 'حالة الاستخراج', 'Statut d’extraction')}</h4><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{month.source.extractionStatus}</p></div>
          <div><h4 className="text-[11px] font-semibold">{copyFor(language, 'Interpretation rule', 'قاعدة التفسير', 'Règle d’interprétation')}</h4><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{month.source.interpretationRule}</p></div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 p-3 text-[10px] leading-relaxed text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /><p>{copyFor(language, 'Safety boundary: phytosanitary entries point to the source annex or leaflet when no product, active ingredient, or dose is printed. Use the INPV-aware safety tools for product decisions; this calendar does not invent treatments.', 'حد السلامة: تشير إدخالات وقاية النبات إلى الملحق أو النشرة المصدرية عندما لا يطبع المصدر منتجاً أو مادة فعالة أو جرعة. استخدم أدوات السلامة المرتبطة بفهرس INPV لقرارات المنتجات؛ هذا التقويم لا يخترع علاجات.', 'Limite de sécurité : les entrées phytosanitaires renvoient à l’annexe ou à la fiche source lorsque produit, matière active ou dose ne sont pas imprimés. Utilisez les outils de sécurité liés à l’INPV ; ce calendrier n’invente pas de traitements.')}</p></div>"""

content = content.replace(ANCHOR, NEW_BLOCK)
print("✓ Inserted Source provenance Card section")

# Verify all referenced fields exist in the data type
data_check = subprocess.run(
    ['grep', '-c', 'institution\\|documentTitle\\|extractionStatus\\|interpretationRule',
     'src/lib/algeria-crop-calendar.ts'],
    capture_output=True, text=True,
)
print(f"✓ Data file references: {data_check.stdout.strip()} occurrences")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"✓ Wrote enhanced {FILE}")
