#!/usr/bin/env python3
"""
Add a 'lithosol' entry to every soilClassMultipliers block in
algeria-soil-zones-data.ts to satisfy the Record<AlgeriaSoilClass, ...>
type after 'lithosol' was added to the union.

Strategy: regex-match each `soilClassMultipliers: { ... },` block
and inject a `lithosol: {...}` entry right before the closing brace.
"""
import re
from pathlib import Path

LITHOSOL_ENTRY = """      lithosol: { multiplier: 0.60, compatibility: 'challenging', reason: { en: 'Shallow lithosols over bedrock limit root volume and water holding capacity; supplemental drip irrigation and organic matter are required.', ar: 'التربة الحجرية الضحلة فوق الصخر الأم تقيّد حجم الجذور ومخزون المياه؛ يتطلب الري بالتنقيط الداعم وتحسين المادة العضوية.', fr: 'Lithosols peu profonds sur roche mère limitant l’enracinement et la RU ; irrigation goutte-à-goutte et matière organique nécessaires.' } },"""

path = Path('/home/z/my-project/src/lib/algeria-soil-zones-data.ts')
text = path.read_text()

# Find every `soilClassMultipliers: { ... }` block (greedy matching the closing `    },`)
# The block ends with `\n    },` (newline + 4 spaces + `},`)
pattern = re.compile(
    r"(    soilClassMultipliers:\s*\{\n)"
    r"((?:.+\n)+?)"
    r"(    \},\n)",
    re.MULTILINE,
)

def has_lithosol(block: str) -> bool:
    return re.search(r"^\s*lithosol:", block, re.MULTILINE) is not None

def inject(m: re.Match) -> str:
    open_line = m.group(1)
    body = m.group(2)
    close_line = m.group(3)
    if has_lithosol(body):
        return m.group(0)  # already has lithosol, skip
    # The body ends with `\n` (last line is the closing entry line). We want to
    # insert the lithosol entry on its own line before the close brace.
    # Strip trailing newline, append lithosol entry + newline, then close.
    return f"{open_line}{body}{LITHOSOL_ENTRY}\n{close_line}"

new_text, count = pattern.subn(inject, text)
print(f"Patched {count} soilClassMultipliers blocks")

path.write_text(new_text)
