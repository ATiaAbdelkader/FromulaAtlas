"""
Extract the Algerian INDEX_PRODUITS_PHYTO_2017.pdf (rotated pages)
into plain text.

The product-table pages are physically rotated 180 degrees and the text
layer is fully mirrored, so each extracted line must be reversed both
character-wise and line-order-wise to read correctly.
"""
import sys

import pdfplumber

SRC = "INDEX_PRODUITS_PHYTO_2017.pdf"
OUT = "phyto_2017_extracted.txt"


def fix_rotated_text(text: str) -> str:
    lines = text.split("\n")
    # Remove trailing empty lines caused by reversed newlines
    while lines and lines[-1] == "":
        lines.pop()
    reversed_lines = [line[::-1] for line in lines]
    return "\n".join(reversed(reversed_lines))


def main() -> int:
    start = 0
    if len(sys.argv) > 1:
        start = int(sys.argv[1])
    end = 10**9
    if len(sys.argv) > 2:
        end = int(sys.argv[2])
    append = len(sys.argv) > 3 and sys.argv[3] == "--append"

    mode = "a" if append else "w"
    with pdfplumber.open(SRC) as pdf:
        with open(OUT, mode, encoding="utf-8") as fh:
            for i, page in enumerate(pdf.pages):
                if i < start or i > end:
                    continue
                raw = page.extract_text() or ""
                fixed = fix_rotated_text(raw)
                fh.write(f"\n===== PAGE {i + 1} =====\n")
                fh.write(fixed)
                fh.write("\n")
    print(f"done: pages {start}-{end} -> {OUT} (append={append})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
