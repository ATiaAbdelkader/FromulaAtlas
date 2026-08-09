"""
Build the client-side E-Phy (Anses) catalogues used by the Active Matter
Selector tool. Source: "Données ouvertes du catalogue E-Phy des produits
phytopharmaceutiques, matières fertilisantes et supports de culture, adjuvants,
produits mixtes et mélanges" — data.gouv.fr (Licence Ouverte 2.0), ANSES.

Raw CSVs are NOT committed (several MB, and refreshed regularly). Point this
script at an extraction of the "csv_utf8" archive:

    EPHY_DATA_DIR=<dir containing *utf8.csv> python scripts/build_ephy_index.py

Outputs (committed to the repo):
    public/data/ephy-ppp-index.json   — PPP / adjuvants / produits mixtes / mélanges
    public/data/ephy-mfsc-index.json  — matières fertilisantes & supports de culture
"""
import csv
import json
import os
import re
import sys
from collections import defaultdict

DATA_DIR = os.environ.get(
    "EPHY_DATA_DIR",
    r"C:\Users\PC\AppData\Local\Temp\opencode\ephy\xu",
)
OUT_PPP = os.path.join(os.path.dirname(__file__), "..", "public", "data", "ephy-ppp-index.json")
OUT_MFSC = os.path.join(os.path.dirname(__file__), "..", "public", "data", "ephy-mfsc-index.json")

SOURCE_URL = (
    "https://www.data.gouv.fr/datasets/donnees-ouvertes-du-catalogue-e-phy-des-"
    "produits-phytopharmaceutiques-matieres-fertilisantes-et-supports-de-culture-"
    "adjuvants-produits-mixtes-et-melanges"
)

ACTIVE_RE = re.compile(r"^(.*?)\s*\([^)]*\)\s*([\d.,]+)\s*(\S+)$")
TYPE_PPP = {"PPP", "ADJUVANT", "PRODUIT-MIXTE", "MELANGE"}


def read_csv(name: str) -> list[list[str]]:
    path = os.path.join(DATA_DIR, name)
    with open(path, encoding="utf-8", newline="") as fh:
        rows = list(csv.reader(fh, delimiter=";"))
    return rows


def split_actives(field: str) -> list[dict]:
    out = []
    for part in (field or "").split("|"):
        part = part.strip()
        if not part:
            continue
        m = ACTIVE_RE.match(part)
        if m:
            out.append({"name": m.group(1).strip(), "conc": f"{m.group(2)} {m.group(3)}"})
        else:
            out.append({"name": part, "conc": ""})
    return out


def main() -> int:
    produits_rows = read_csv("produits_utf8.csv")
    header = produits_rows[0]
    idx = {name: i for i, name in enumerate(header)}

    ppp: list[dict] = []
    mfsc: list[dict] = []
    type_counts: dict[str, int] = defaultdict(int)

    for row in produits_rows[1:]:
        if len(row) < len(header) - 1:  # tolerate missing trailing empty column
            continue
        t = (row[idx["type produit"]] or "").strip().upper()
        type_counts[t] += 1
        rec = {
            "amm": (row[idx["numero AMM"]] or "").strip(),
            "name": (row[idx["nom produit"]] or "").strip(),
            "alt": [n.strip() for n in (row[idx["seconds noms commerciaux"]] or "").split("|") if n.strip()],
            "titulaire": (row[idx["titulaire"]] or "").strip(),
            "etat": (row[idx["Etat d’autorisation"]] or "").strip(),
            "premiereAutorisation": (row[idx["Date de première autorisation"]] or "").strip(),
        }
        if t in TYPE_PPP:
            rec["actives"] = split_actives(row[idx["Substances actives"]])
            rec["fonctions"] = [f.strip() for f in (row[idx["fonctions"]] or "").split("|") if f.strip()]
            rec["formulations"] = [f.strip() for f in (row[idx["formulations"]] or "").split("|") if f.strip()]
            ppp.append(rec)
        elif t == "MFSC":
            mfsc.append(rec)

    # ---- merge MFSC compositions (Composition / Dénomination de classe) ----
    comp_rows = read_csv("mfsc_et_mixte_composition_utf8.csv")
    ci = {name: i for i, name in enumerate(comp_rows[0])}
    comp_by_amm: dict[str, dict] = {}
    for row in comp_rows[1:]:
        amm = row[ci["numero AMM"]].strip() if len(row) > ci["numero AMM"] else ""
        if not amm:
            continue
        comp_by_amm[amm] = {
            "composition": row[ci["Composition"]].strip(),
            "classe": row[ci["Dénomination de classe"]].strip(),
            "revendication": row[ci["Revendication"]].strip(),
        }
    seen = set()
    merged_mfsc: list[dict] = []
    for rec in mfsc:
        key = rec["amm"]
        seen.add(key)
        extra = comp_by_amm.get(key, {})
        rec["composition"] = extra.get("composition", "")
        rec["classe"] = extra.get("classe", "")
        rec["revendication"] = extra.get("revendication", "")
        merged_mfsc.append(rec)
    # compositions not present in the produits file (orphans)
    for amm, extra in comp_by_amm.items():
        if amm in seen:
            continue
        merged_mfsc.append({
            "amm": amm, "name": "", "alt": [], "titulaire": "", "etat": "",
            "premiereAutorisation": "",
            "composition": extra["composition"], "classe": extra["classe"],
            "revendication": extra["revendication"],
        })

    ppp.sort(key=lambda r: r["amm"])
    merged_mfsc.sort(key=lambda r: r["amm"])

    with open(OUT_PPP, "w", encoding="utf-8") as fh:
        json.dump({
            "source": "E-Phy (Anses) — catalogue ouvert, Licence Ouverte 2.0",
            "origin": SOURCE_URL,
            "generated": "scripts/build_ephy_index.py",
            "count": len(ppp),
            "products": ppp,
        }, fh, ensure_ascii=False, separators=(",", ":"))
    with open(OUT_MFSC, "w", encoding="utf-8") as fh:
        json.dump({
            "source": "E-Phy (Anses) — MFSC & supports de culture, Licence Ouverte 2.0",
            "origin": SOURCE_URL,
            "generated": "scripts/build_ephy_index.py",
            "count": len(merged_mfsc),
            "products": merged_mfsc,
        }, fh, ensure_ascii=False, separators=(",", ":"))

    print("type counts:", dict(type_counts))
    print(f"PPP+Adjuvants+Mixtes: {len(ppp)}  ({os.path.getsize(OUT_PPP)/1024:.0f} KB)")
    print(f"MFSC: {len(merged_mfsc)}  ({os.path.getsize(OUT_MFSC)/1024:.0f} KB)")
    print("MFSC orphans (composition without produits row):", len(merged_mfsc) - len(mfsc))
    autorises = sum(1 for r in ppp if r["etat"] == "AUTORISE")
    print(f"PPP AUTORISE: {autorises}  RETIRE: {len(ppp) - autorises}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
