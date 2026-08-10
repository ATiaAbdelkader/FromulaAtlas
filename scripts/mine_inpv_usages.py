"""
Mine the parsed INPV 2017 index (public/data/phyto-2017-index.json) usage lines
for real crop <-> target (disease/pest/weed) <-> active-substance links.

The usage lines are noisy OCR reconstructions like:
    "Cératite Agrumes 0,5L/Ha 14"
    "Cycloconium Olivier 6L/Ha 14"
    "Pyrale Vigne 14"

We scan each line for crop tokens and target tokens, then attach the product's
parsed active substance. Output is an aggregation report (JSON + text) used to
curate ALGERIA_CROPS / PLANT_PROBLEMS / ALGERIAN_ACTIVE_MATTERS.

Usage: python scripts/mine_inpv_usages.py [OUT.json]
"""
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict

INDEX = r"E:\FromulaAtlas-main\FromulaAtlas-main\public\data\phyto-2017-index.json"

def norm(s: str) -> str:
    return unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode("ascii")

# crop token -> canonical crop id (existing ids + proposed new ones)
CROPS = {
    "agrumes": "citrus", "oranger": "citrus", "citronnier": "citrus", "mandariniers": "citrus",
    "vigne": "vine", "raisin": "vine",
    "pommedeterre": "potato", "pomme de terre": "potato",
    "olivier": "olive", "oliviers": "olive",
    "palmierdattier": "datepalm", "palmier": "datepalm",
    "tomate": "tomato", "tomates": "tomato",
    "poivron": "pepper", "piment": "pepper",
    "oignon": "onion", "ail": "onion", "poireau": "leek", "poireaux": "leek",
    "cereales": "cereal", "ble": "wheat", "bles": "wheat", "ble dur": "wheat",
    "orge": "barley", "avoine": "oats",
    "betteravesucriere": "sugarbeet", "betterave": "sugarbeet",
    "fraise": "strawberry", "fraisier": "strawberry",
    "melon": "cucurbits", "pasteque": "cucurbits", "concombre": "cucurbits",
    "courgette": "cucurbits", "cucurbitacees": "cucurbits",
    "pommier": "apple", "poirier": "apple", "pommiers": "apple", "poiriers": "apple",
    "pecher": "stonefruit", "abricotier": "stonefruit", "cerisier": "stonefruit",
    "prunier": "stonefruit", "noyaux": "stonefruit", "noyau": "stonefruit",
    "amandier": "almond", "amandiers": "almond",
    "haricot": "legumes", "haricots": "legumes", "feve": "legumes", "feverole": "legumes",
    "poischiche": "chickpea", "poissec": "legumes", "lentille": "legumes", "pois": "legumes",
    "mais": "maize", "arachide": "peanut",
    "laitue": "lettuce", "artichaut": "artichoke", "aubergine": "eggplant",
    "asperge": "asparagus", "asperges": "asparagus", "chou": "brassicas", "choux": "brassicas",
    "carotte": "carrot", "tabac": "tobacco",
    "arbresfruitiers": "arboriculture", "arborefruitiers": "arboriculture",
    "arboricul": "arboriculture", "fruitiere": "arboriculture", "fruitiers": "arboriculture",
    "arboriculture": "arboriculture",
    "maraicheres": "market-garden",
}

# target token -> (type, canonical name)
TARGETS = {
    # diseases
    "mildiou": ("disease", "mildiou"),
    "oidium": ("disease", "oidium"),
    "tavelure": ("disease", "tavelure"), "tavlure": ("disease", "tavelure"),
    "croute": ("disease", "tavelure-poire"),
    "moniliose": ("disease", "moniliose"),
    "botrytis": ("disease", "botrytis"), "pourrituregrise": ("disease", "botrytis"),
    "alternaria": ("disease", "alternaria"), "alteriose": ("disease", "alternaria"),
    "septori": ("disease", "septoriose"),
    "rouille": ("disease", "rouille"),
    "blackrot": ("disease", "black-rot"), "black-rot": ("disease", "black-rot"),
    "excoriose": ("disease", "excoriose"),
    "cloque": ("disease", "cloque"),
    "gommose": ("disease", "gommose"),
    "cycloconium": ("disease", "oeil-de-paon"), "cyclonium": ("disease", "oeil-de-paon"),
    "oeilde paon": ("disease", "oeil-de-paon"),
    "anthracnose": ("disease", "anthracnose"), "antrachnose": ("disease", "anthracnose"),
    "fusarium": ("disease", "fusarium"), "fusariose": ("disease", "fusarium"),
    "carie": ("disease", "carie"), "charbon": ("disease", "charbon"),
    "feu bacterien": ("disease", "feu-bacterien"),
    "tacheangulaire": ("disease", "tache-angulaire"),
    "bacteriose": ("disease", "bacteriose"),
    "fente des semis": ("disease", "fonte-des-semis"),
    "phytophtora": ("disease", "phytophthora"),
    "helminthospori": ("disease", "helminthosporiose"),
    "rhizoctonia": ("disease", "rhizoctone"),
    "pourriturebrune": ("disease", "pourriture-brune"),
    "vertilliu": ("disease", "verticillium"),
    # pests
    "cochenille": ("pest", "cochenilles"),
    "mineuse": ("pest", "mineuses"),
    "puceron": ("pest", "pucerons"),
    "aleurode": ("pest", "aleurodes"), "moucheblanche": ("pest", "aleurodes"),
    "acarien": ("pest", "acariens"),
    "carpocapse": ("pest", "carpocapse"), "capocapse": ("pest", "carpocapse"),
    "psylla": ("pest", "psylle"), "psylle": ("pest", "psylle"),
    "ceratite": ("pest", "ceratite"),
    "dacus": ("pest", "olivefly"), "mouche de l olivier": ("pest", "olivefly"),
    "mouche l olivier": ("pest", "olivefly"), "mouche olivier": ("pest", "olivefly"),
    "mouche mediterraneenne": ("pest", "ceratite"),
    "teigne": ("pest", "teigne"),
    "pyrale": ("pest", "pyrale"), "tordeuse": ("pest", "tordeuse"),
    "eudemis": ("pest", "eudemis"), "ver de la grappe": ("pest", "ver-de-la-grappe"),
    "myelois": ("pest", "pyrale-dattes"), "mylois": ("pest", "pyrale-dattes"),
    "boufaroua": ("pest", "dubas"), "dubas": ("pest", "dubas"),
    "punaise": ("pest", "punaises"),
    "criocere": ("pest", "criocere"), "lemas": ("pest", "criocere"),
    "altise": ("pest", "altise"),
    "cicadelle": ("pest", "cicadelle"),
    "vers blancs": ("pest", "vers-blancs"), "taupin": ("pest", "vers-blancs"),
    "noctuelle": ("pest", "noctuelles"), "noctuelle": ("pest", "noctuelles"),
    "helio": ("pest", "helio"), "spodoptera": ("pest", "spodoptera"),
    "thrips": ("pest", "thrips"),
    "capnodis": ("pest", "capnodis"), "capnodes": ("pest", "capnodis"),
    "pou san jose": ("pest", "pou-de-san-jose"),
    "limaces": ("pest", "limaces"), "escargot": ("pest", "limaces"),
    "rongeurs": ("pest", "rongeurs"), "souris": ("pest", "rongeurs"),
    "mouche des fruits": ("pest", "ceratite"),
    # weeds
    "adventices": ("weed", "adventices"),
    "dicotyledones": ("weed", "dicotyledones"),
    "graminees": ("weed", "graminees"), "gramin": ("weed", "graminees"),
    "folleavoine": ("weed", "folle-avoine"), "folle avoine": ("weed", "folle-avoine"),
    "ray-grass": ("weed", "raygrass"), "raygrass": ("weed", "raygrass"),
    "ivraie": ("weed", "raygrass"),
    "chiendent": ("weed", "chiendent"), "vulpin": ("weed", "vulpin"),
    "gaillet": ("weed", "gaillet"),
    "orobanche": ("weed", "orobanche"),
    "liseron": ("weed", "liseron"),
    "laiteron": ("weed", "laiteron"),
    "rumex": ("weed", "rumex"),
}

def main() -> int:
    data = json.load(open(INDEX, encoding="utf-8"))
    prods = data["products"]

    # per (crop, target) -> Counter(active)
    links = defaultdict(Counter)
    crop_count = Counter()
    target_count = Counter()
    crop_target_count = defaultdict(Counter)
    unmatched = Counter()  # sample lines that hit no crop token

    crop_items = sorted(CROPS.items(), key=lambda kv: -len(kv[0]))
    tgt_items = sorted(TARGETS.items(), key=lambda kv: -len(kv[0]))

    for p in prods:
        active = p["active"] or ""
        brand = p["brand"] or ""
        for line in p["usage"]:
            n = norm(line)
            if not n:
                continue
            crops_hit = set()
            for tok, cid in crop_items:
                if tok in n:
                    crops_hit.add(cid)
            if not crops_hit:
                unmatched[line.strip()[:60]] += 1
                continue
            tgt_hit = None
            for tok, (typ, canon) in tgt_items:
                if tok in n:
                    tgt_hit = canon
                    break
            for cid in crops_hit:
                crop_count[cid] += 1
                if tgt_hit:
                    target_count[tgt_hit] += 1
                    crop_target_count[cid][tgt_hit] += 1
                    key = (cid, tgt_hit)
                    links[key][active] += 1

    out = {
        "crop_tokens_seen": {k: v for k, v in crop_count.most_common()},
        "targets_seen": {k: v for k, v in target_count.most_common()},
        "links": {
            f"{c} <-> {t}": {
                "n": sum(v.values()),
                "actives": {a: n for a, n in sorted(v.items(), key=lambda kv: -kv[1])},
                "example_brands": [],
            }
            for (c, t), v in sorted(links.items(), key=lambda kv: -sum(kv[1].values()))
        },
    }

    # grab example brands per link
    for p in prods:
        active = p["active"] or ""
        brand = p["brand"] or ""
        for line in p["usage"]:
            n = norm(line)
            crops_hit = {cid for tok, cid in crop_items if tok in n}
            if not crops_hit:
                continue
            tgt_hit = None
            for tok, (typ, canon) in tgt_items:
                if tok in n:
                    tgt_hit = canon
                    break
            if not tgt_hit:
                continue
            for cid in crops_hit:
                key = f"{cid} <-> {tgt_hit}"
                rec = out["links"].get(key)
                if rec and len(rec["example_brands"]) < 3:
                    rec["example_brands"].append(f"{brand} ({p['homologation']}) [{active}]")
                    break

    dst = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\PC\AppData\Local\Temp\opencode\inpv_links_report.json"
    with open(dst, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)

    print("crops seen:")
    for k, v in crop_count.most_common():
        print(f"  {k:16s} {v}")
    print("\ntargets seen:")
    for k, v in target_count.most_common():
        print(f"  {k:18s} {v}")
    print("\nlinks (crop <-> target): n=... top actives")
    for key, rec in list(out["links"].items())[:120]:
        acts = ", ".join(f"{a} x{n}" for a, n in list(rec["actives"].items())[:4])
        print(f"  {key:34s} n={rec['n']:4d}  [{acts}]")
    print(f"\nlines hitting no crop token: {len(unmatched)} (top):")
    for k, v in unmatched.most_common(15):
        print(f"  {v:4d}  {k}")
    print(f"\nreport written to {dst}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
