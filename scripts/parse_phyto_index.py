"""
Parse INDEX_PRODUITS_PHYTO_2017.pdf (INPV Algérie, 2017) directly from the
pdfplumber char stream into structured product records.

Layout discovered by probing (see worklog Phase D2):
  - Pages 21-232 hold product tables (~6-10 products/page). The table text is
    drawn rotated; every x-column reads correctly BOTTOM-TO-TOP.
  - Each product is anchored by its homologation number: 7 consecutive digits
    (groups of 2,2,3), e.g. "1252002" -> "12 52 002". The digits sit in a band
    near the top of the page whose position varies per page (tops ~166-277),
    so a wide band is scanned and each candidate run is verified by looking for
    identity glyphs (uppercase letters at tops > 560) near the same x.
  - The product identity (brand, active substance, concentration, formulation)
    lives in the same x-column as the homologation digits (+/-6pt) at the
    bottom of the page (tops ~560-745); reading bottom->top recovers it.
  - Usage-only columns (target/culture/dose/DAR) sit nearby; company
    (Représentant/Firme) text sits above the homologation band.
  - Section names (INSECTICIDES, FONGICIDES, ...) appear as vertical page-edge
    labels; detected per page and carried forward.
  - Wrapped active substances (e.g. "THIAME-...THOXAM") are reassembled by
    concatenating the non-brand, non-concentration, non-formulation tokens and
    fuzzy-matching against the curated active list.

Output: public/data/phyto-2017-index.json
"""
import json
import re
import sys
import unicodedata
from collections import Counter

import pdfplumber

SRC = "INDEX_PRODUITS_PHYTO_2017.pdf"
OUT = "public/data/phyto-2017-index.json"

FORMULATIONS = {
    "EC", "SL", "WP", "SC", "WG", "GR", "RB", "ULV", "ME", "CS", "DP", "FS",
    "OD", "SG", "TB", "EW", "GL", "BR", "AS", "KN", "ZC", "SE", "SP", "SS",
    "TC", "TK", "PA", "PC", "PO", "PR", "PS", "PT", "VL", "ZB", "ZG", "KP",
    "LA", "LY", "NO", "OP", "PU", "RS", "RW", "SB", "SF", "SK", "ST", "SU",
    "SZ", "TA", "WS", "XX", "DS", "GS",
}
SECTION_WORDS = {
    "INSECTICIDES", "ACARICIDES", "FONGICIDES", "HERBICIDES", "NEMATICIDES",
    "MOLLUSCICIDES", "RODENTICIDES", "REGULATEURS", "STOCKAGE", "DIVERS",
    "CORRECTEURS", "CARENCES", "ENGRAIS", "FERTILISANTS", "BIOPESTICIDES",
    "BIOLOGIQUES", "MATIERES", "ACTIVES", "BIOSTIMULANTS", "ADJUVANTS",
}
TITLE_MARKERS = (
    "INDEX", "PHYTOSANITAIRE", "USAGE AGRICOLE", "N D'HOMOLOGATION",
    "NOM COMMERCIAL", "MATIERE ACTIVE", "MATIÈRE ACTIVE", "CONCENTRATION",
    "FORMULATION", "D.A.R", "DOSE D'UTILISATION", "CULTURE", "OBSERVATION",
    "REPRESENTANT", "FIRME", "COMMERCIAL", "HOMOLOGATION", "CONCENTRA",
    "FORMULA", "MODE D'EMPLOI", "CONDITIONNEMENT",
)

HOM_BAND = (150.0, 280.0)          # tops scanned for homologation digits
COMPANY_BAND = 178.0               # columns fully above this top = company
WORD_GAP = 8.0                     # top gap that separates two words in a column
IDENT_WIN = 6.0                    # +/- x window around hom for identity text
USAGE_WIN = 30.0                   # max distance for nearby usage/company columns
IDENT_MIN_TOP = 560.0
STRIP_WIN = 9.0    # substance-name sweep window around hom digits (pt)
STRIP_GUARD = 8.7  # drop matches whose nearest containing column is further
                    # than this distance from the anchor
              # identity zone starts here
VERIFY_UPPER = 560.0               # identity evidence: uppercase glyphs above here

CONC_GPERL = re.compile(r"(\d+(?:[.,]\d+)?)\s*(?:G\s*/\s*L|g\s*/\s*l)", re.I)
CONC_PERCENT = re.compile(r"(\d+(?:[.,]\d+)?)\s*%")
CONC_JOINED = re.compile(r"^(\d+(?:[.,]\d+)?)%?\s*([A-Z]{1,4})$")
UPPER_WORD = re.compile(r"^[A-ZÀ-Þ][A-ZÀ-Þ0-9\-\/\.\%\'\(\) ]*$")

# Curated active substances (from src/lib/algeria-phyto-data.ts) used to
# reassemble wrapped active names in the parsed rows.
KNOWN_ACTIVES = [
    "abamectine", "acétamipride", "acétochlore", "alpha-cyperméthrine",
    "atrazine", "azadirachtine", "azoxystrobine",
    "bacillus thuringiensis var. kurstaki", "beauveria bassiana",
    "bentazone", "bifenthrine", "bromadiolone", "captan", "carbendazime",
    "chlorantraniliprole", "chlorothalonil", "chlorpyriphos-éthyl",
    "cléthodime", "clodinafop-propargyl", "cuivre (sulfate/oxychlorure)",
    "cymoxanil", "cyperméthrine", "cyproconazole", "deltaméthrine",
    "diclofop-méthyl", "difénoconazole", "diflubenzuron", "diméthoate",
    "émamectine benzoate", "fenbutatin oxyde", "fenoxaprop-P-éthyl",
    "fenpyroximate", "fipronil", "fluroxypyr", "flutriafol",
    "fosétyl-aluminium", "glufosinate-ammonium", "glyphosate",
    "haloxyfop-P", "hexythiazox", "imazamox", "imazéthapyr",
    "imidaclopride", "indoxacarbe", "iprodione", "krésoxim-méthyl",
    "lambda-cyhalothrine", "linuron", "mancozèbe", "MCPA", "métalaxyl",
    "metarhizium anisopliae", "méthiocarbe", "méthomyl", "métribuzine",
    "metsulfuron-méthyl", "myclobutanil", "nicosulfuron", "oxyfluorfène",
    "paraquat", "penconazole", "pendiméthaline", "propiconazole",
    "pyraclostrobine", "pyridabène", "quizalofop-P-éthyl", "séthoxydim",
    "S-métolachlore", "soufre", "spinosad", "sulfosulfuron",
    "tébuconazole", "thiaméthoxame", "thiophanate-méthyl",
    "trifloxystrobine", "trifluraline",
    # additional actives seen in the index
    "pirimiphos-méthyl", "pirimiphos-éthyl", "méthidathion",
    "buprofézine", "propinèbe", "hexaconazole", "triadiménol",
    "métaldéhyde", "hymexazole", "propargite", "procymidone",
    "manèbe", "difénacoum", "lufénuron", "tribénuron-méthyl",
    "métam-sodium", "bromoxynil", "ioxynil", "dicamba", "2,4-DB",
    "chlorotoluron", "isoproturon", "s-métolachlore", "fenoxaprop",
    "clodinafop", "quizalofop", "haloxyfop", "clethodim", "séthoxydim",
    "fluzilazole", "tétraconazole", "époxiconazole", "prothioconazole",
    "difenoconazole", "myclobutanil", "fenbuconazole", "dodine",
    "folpel", "captane", "mancozèbe", "métirame", "zirame", "soufre",
    "hydroxyde de cuivre", "oxychlorure de cuivre", "sulfate de cuivre",
    "bouillie bordelaise", "cuivre", "fosétyl", "métalaxyl", "cymoxanil",
    "bénomyl", "carbendazime", "thiophanate", "bitertanol",
    "tridémorphe", "fenpropimorphe", "spiroxamine", "tebuconazole",
    "malathion", "fenthion", "trichlorfon", "carbosulfan", "carbofuran",
    "aldicarbe", "oxamyl", "cadusafos", "terbufos", "fosthiazate",
    "endosulfan", "lindane", "dieldrine", "aldrine", "parathion-méthyl",
    "diazinon", "phoxime", "chlorfenviphos", "monocrotophos",
    "ométhoate", "vamidothion", "acéphate", "malathion", "téméphos",
    "dichlorvos", "naled", "pyrimicarbe", "pirimicarbe", "acrinathrine",
    "cyfluthrine", "bêta-cyfluthrine", "perméthrine", "tau-fluvalinate",
    "esfenvalérate", "fenvalérate", "zêta-cyperméthrine", "deltaméthrine",
    "téfluthrine", "bifenthrine", "cyhalothrine", "gamma-cyhalothrine",
    "flubendiamide", "chlorantraniliprole", "cyantraniliprole",
    "indoxacarbe", "spinosad", "spinetoram", "émamectine",
    "milbémectine", "avermectine", "diazinon", "fenazaquin",
    "fenpyroximate", "pyridabène", "hexythiazox", "clofentézine",
    "flufénoxuron", "diflubenzuron", "téflubenzuron", "lufénuron",
    "triflumuron", "novaluron", "méthoprène", "pyriproxyfène",
    "hydropène", "phosmet", "azinfos-méthyl", "phosalone", "mécarbame",
    "formétanate", "méthiocarbe", "bénomyl", "carbaryl", "propoxur",
    "bendiocarbe", "roténone", "nicotine", "spirotétramate",
    "spirodiclofène", "spirotétramate", "flonicamide", "pymétrozine",
    "flubendiamide", "metaflumizone", "chromafénozide", "tébufénozide",
    "méthoxyfénozide", "cyromazine", "dicyclanil", "buprofézine",
    "flurprimidole", "chlorméquat", "mépiquat", "daminozide",
    "acide gibbérellique", "benzyladénine", "éthéphon", "forchlorfénuron",
    "abamectine", "bromadiolone", "chlorophacinone", "coumatétralyl",
    "brodifacoum", "diféthialone", "zinc phosphure", "aluminium phosphure",
    "magnésium phosphure", "fumigants", "dazomet", "métam-sodium",
    "1,3-dichloropropène", "chloropicrine", "bromure de méthyle",
    # additional actives observed in glued / wrapped rows
    "thiaclopride", "huile minérale", "huile blanche", "huile de pétrole",
    "huile paraffinique", "huile", "bacillus thuringiensis",
    "thiaméthoxam", "chlorpyriphos", "deltamétrine", "deltamétryne",
    "étofenprox", "tolfenpyrad", "chlorfénapyr", "bêta-cyperméthrine",
    "alpha-cyperméthrine", "métidathion", "méthidathion",
    "cyhalothrine", "benzoximate", "propargite", "hexythiazox",
    "milbémectine", "spinetoram", "pymétrozine", "flonicamide",
    "tolfenpyrad", "noviflumuron", "hexaflumuron", "lufénuron",
    "téflubenzuron", "triflumuron", "buprofézine", "pyriproxyfène",
    "méthoprène", "cyromazine", "dicyclanil", "azadirachtine",
    "emamectine benzoate", "émanectine benzoate", "émamectine",
    "abamectine", "avermectine",     "hydrolysat de protéines",
    "protéines hydrolysées", "phéromone", "phéromones",
    # English / alternate spellings seen in the index (matching only —
    # the output still uses the French canonical name above).
    "chlorpyrifos", "chlorpyrifos-ethyl", "chlorpyrifos-methyl",
    "buprofezin", "buprofezine", "deltamethrin", "lambda-cyhalothrin",
    "cyhalothrin", "cypermethrin", "beta-cypermethrin", "alpha-cypermethrin",
    "difenoconazole", "propiconazole", "tebuconazole", "hexaconazole",
    "epoxiconazole", "prothioconazole", "triadimenol", "flutriafol",
    "kresoxim-methyl", "azoxystrobin", "trifloxystrobin",
    "pyraclostrobin", "picoxystrobin", "metalaxyl", "metalaxyl-m",
    "mefenoxam", "mancozeb", "maneb", "thiram", "chlorothalonil",
    "carbendazim", "benomyl", "thiophanate-methyl", "dodine", "folpet",
    "iprodione", "procymidone", "cyprodinil", "pyrimethanil",
    "mepanipyrim", "fenhexamid", "boscalid", "bupirimate", "fludioxonil",
    "ipconazole", "triticonazole", "metconazole", "tetraconazole",
    "triadimefon", "bitertanol", "penconazole", "myclobutanil",
    "fenbuconazole", "imidacloprid", "thiamethoxam", "acetamiprid",
    "clothianidin", "dinotefuran", "fipronil", "ethiprole", "indoxacarb",
    "emamectin", "emamectin benzoate", "abamectin", "spinetoram",
    "milbemectin", "fenpyroximate", "pyridaben", "fenazaquin",
    "clofentezine", "hexythiazox", "etoxazole", "propargite",
    "bifenazate", "spirodiclofen", "spirotetramat", "dicofol",
    "fenbutatin oxide", "azadirachtin", "rotenone", "malathion",
    "diazinon", "dimethoate", "phosmet", "methidathion", "metidathion",
    "pirimiphos-methyl", "pirimiphos-ethyl", "methyl parathion",
    "parathion-methyl", "trichlorfon", "chlorpyrifos", "glyphosate",
    "glufosinate-ammonium", "paraquat", "diquat", "atrazine",
    "metribuzin", "linuron", "pendimethalin", "trifluralin",
    "acetochlor", "s-metolachlor", "metolachlor", "nicosulfuron",
    "metsulfuron-methyl", "sulfosulfuron", "tribenuron-methyl",
    "imazamox", "imazethapyr", "clethodim", "setboxydim",
    "quizalofop-p-ethyl", "fenoxaprop-p-ethyl", "clodinafop-propargyl",
    "diclofop-methyl", "haloxyfop-p", "fluroxypyr", "bromoxynil",
    "ioxynil", "dicamba", "2,4-db", "mecoprop", "mcpb",
    "bentazone", "bentazon", "oxyfluorfen", "flumioxazin",
    "mesotrione", "tembotrione", "sulcotrione", "metam-sodium",
    "metham sodium", "dazomet", "fosetyl-aluminium", "fosetyl",
    "hymexazol", "propanocarb", "propamocarb", "zoxamide",
    "mandipropamid", "dimethomorph", "ipvalicarb", "benthiavalicarb",
    "famoxadone", "fluazinam", "fentin acetate", "fentin hydroxide",
    "copper oxychloride", "copper sulfate", "copper hydroxide",
    "bordeaux mixture", "sulfur", "sulphur", "lime sulfur",
    "spiroxamine", "fenpropimorph", "tridemorph", "bitertanol",
    "cyproconazole", "triadimenol", "tetraconazole", "difenoconazole",
    "flusilazole", "fluquinconazole", "flutriafol", "bromuconazole",
    "prochloraz", "imazalil", "propargite", "hexythiazox",
    "buprofezin", "flonicamid", "pymetrozine", "pyriproxyfen",
    "methoprene", "hydroprene", "cyromazine", "dicyclanil",
    "tebufenozide", "methoxyfenozide", "chromafenozide",
    "flubendiamide", "chlorantraniliprole", "cyantraniliprole",
    "tolfenpyrad", "metaflumizone", "brodifacoum", "difethialone",
    "bromadiolone", "coumatetralyl", "chlorophacinone", "warfarin",
    "zinc phosphide", "aluminium phosphide", "magnesium phosphide",
    "hydrogen cyanide", "methyl bromide", "1,3-dichloropropene",
    "chloropicrin", "bacillus thuringiensis var. kurstaki",
    "beauveria bassiana", "metarhizium anisopliae", "spinosad",
    "azadirachtin", "neem oil", "potassium soap", "insecticidal soap",
    "benzoximate", "hexaflumuron", "noviflumuron", "triflumuron",
    "teflubenzuron", "lufenuron", "diflubenzuron", "flufenoxuron",
    "novaluron", "chlorfluazuron", "chlorfenapyr", "fipronil",
    "ethiprole", "acetamiprid", "thiacloprid", "imidacloprid",
    "clothianidin", "thiamethoxam", "dinotefuran", "nitengyram",
    "flonicamid", "pymetrozine", "metaflumizone", "pyriproxyfen",
    "methoprene", "hydroprene", "cyromazine", "dicyclanil",
    "buprofezin", "azadirachtin", "spinosad", "spinetoram",
    "milbemectin", "emamectin benzoate", "avermectin",
    "tolfenpyrad", "hexythiazox", "propargite", "fenbutatin oxide",
    "benzoximate", "clofentezine", "etoxazole", "bifenazate",
    "spirodiclofen", "spirotetramat", "pyridaben", "fenazaquin",
    "fenpyroximate", "dicofol", "bromopropylate",
    "ethaboxam",
"fenoxycarb",
    "phosphure d'aluminium",
    "pinoxaden",
    "cloquintocet-méxyl",
    "fluazifop-P-butyl",
    "florasulam",
    "pyroxsulam",
    "métosulam",
    "acibenzolar-S-méthyl",
    "prohexadione-calcium",
    "hydrazide maléique",
    "acide indole-butyrique",
    "dichloropropane",
    "dichloropropène",
    "fenamidone",
    "diuron",
    "2,4-D",
    "2,4-D amine",
    "2,4-D ester",
    "fosétyl-Al",
    "clodinafop-propargyl",
    "glufosinate-ammonium",
    "tribénuron-méthyl",
]

_KNOWN_NORM: list[tuple[str, str]] = []


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9]", "", s.lower())


def _lcs_ratio(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            dp[i][j] = dp[i - 1][j - 1] + 1 if a[i - 1] == b[j - 1] \
                else max(dp[i - 1][j], dp[i][j - 1])
    lcs = dp[-1][-1]
    return 2.0 * lcs / (len(a) + len(b))


def match_actives(candidate: str) -> list[str]:
    """Return every known active substance present in a candidate token soup.

    Handles wrapped names ("THIAME- ... THOXAM") and multi-active mixes
    ("DIFENOCONAZOL APRON®STAR METALAXYLM+" -> [difénoconazole, métalaxyl]).
    When several known names overlap in the soup (e.g. "cuivre" inside
    "hydroxyde de cuivre") the longest, most specific one wins.
    """
    if not _KNOWN_NORM:
        _KNOWN_NORM.extend((norm(a), a) for a in KNOWN_ACTIVES)
    cand = norm(candidate)
    rev = norm(" ".join(reversed(candidate.split())))
    hits: list[tuple[int, int, str]] = []  # (start, length, name)
    for text in (cand, rev):
        if not text:
            continue
        for n, raw in _KNOWN_NORM:
            if len(n) < 4:
                continue
            start = 0
            while True:
                i = text.find(n, start)
                if i < 0:
                    break
                hits.append((i, len(n), raw))
                start = i + 1
    if not hits:
        return _fuzzy_actives(candidate)
    # leftmost-longest: keep non-overlapping spans in reading order, one hit
    # per name (the same name can be found in both the forward and the
    # reversed scan)
    hits.sort(key=lambda h: (h[0], -h[1]))
    chosen: list[str] = []
    seen: set[str] = set()
    last_end = -1
    for pos, ln, name in hits:
        if name in seen or pos < last_end:
            continue
        chosen.append(name)
        seen.add(name)
        last_end = pos + ln
    return chosen


def _fuzzy_actives(candidate: str) -> list[str]:
    """Best-effort LCS matching for OCR-mangled actives (e.g. "METIDATHION"
    vs "méthidathion", "DELTAMETRINE" vs "deltaméthrine", "ACETAMEPRIDE" vs
    "acétamipride"). Only used when no exact substring hit was found, and only
    for reasonably long candidate soups to avoid false positives.
    """
    if not _KNOWN_NORM:
        _KNOWN_NORM.extend((norm(a), a) for a in KNOWN_ACTIVES)
    sn = norm(candidate)
    if len(sn) < 5:
        return []
    scored: list[tuple[float, int, str]] = []
    for n, raw in _KNOWN_NORM:
        if len(n) < 5:
            continue
        r = _lcs_ratio(sn, n)
        if r >= 0.88:
            scored.append((r, len(n), raw))
    if not scored:
        return []
    scored.sort(key=lambda t: (-t[0], -t[1]))
    chosen: list[str] = []
    used: set[str] = set()
    for _, ln, name in scored:
        if name in used:
            continue
        chosen.append(name)
        used.add(name)
        if len(chosen) >= 2:
            break
    return chosen


def match_active(candidate: str) -> str:
    """Return known actives found in a soup, joined with " + "."""
    names = match_actives(candidate)
    return " + ".join(names) if names else ""


def col_text(chars: list[dict]) -> str:
    """Read one x-column bottom->top (un-mirrors the rotated glyphs)."""
    ordered = sorted(chars, key=lambda c: -c["top"])
    out: list[str] = []
    prev_top: float | None = None
    for c in ordered:
        t = c["text"]
        if t.startswith("(cid:") or t.startswith(")"):
            continue
        if prev_top is not None and prev_top - c["top"] > WORD_GAP:
            out.append(" ")
        out.append(t)
        prev_top = c["top"]
    return "".join(out).strip()


def x_clusters(chars: list[dict], gap: float) -> list[list[dict]]:
    ordered = sorted(chars, key=lambda c: c["x0"])
    groups: list[list[dict]] = []
    for c in ordered:
        if groups and c["x0"] - groups[-1][-1]["x0"] <= gap:
            groups[-1].append(c)
        else:
            groups.append([c])
    return groups


def find_hom_anchors(page) -> list[tuple[float, str]]:
    """Locate + verify homologation numbers on a page."""
    digits = [c for c in page.chars if c["text"].isdigit()
              and HOM_BAND[0] <= c["top"] <= HOM_BAND[1]]
    runs: list[tuple[float, str]] = []
    for g in x_clusters(digits, 4.0):
        text = "".join(c["text"] for c in sorted(g, key=lambda c: -c["top"]))
        m = re.search(r"(\d{7})", text)
        if not m:
            continue
        x = sum(c["x0"] for c in g) / len(g)
        # verify: uppercase identity glyphs near this x, below the hom band
        evidence = [c for c in page.chars
                    if abs(c["x0"] - x) <= 12.0 and c["top"] > VERIFY_UPPER
                    and c["text"].isupper()]
        if len(evidence) < 3:
            continue
        d = m.group(1)
        runs.append((x, f"{d[0:2]} {d[2:4]} {d[4:7]}"))
    return runs


BRAND_SYMBOL = str.maketrans("", "", "®™©°")
BRAND_TRAIL = re.compile(r"^(.*?)(\d+[.,]?\d*\s*%?)([A-Z]{1,4})$")

# Formulation codes sorted longest-first, joined for a prefix-stripping regex.
_FORMS_ALT = "|".join(sorted(FORMULATIONS, key=len, reverse=True))
_STRIP_LEADING_FORM = re.compile(rf"^(?:{_FORMS_ALT})(?=[A-Z])")


def _noise(tok: str) -> str:
    """Strip concentration / number noise from one token, keeping letters."""
    t = CONC_GPERL.sub(" ", tok)
    t = CONC_PERCENT.sub(" ", t)
    t = re.sub(r"\d+[.,]?\d*", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def _match_soup(raw_tokens: list[str]) -> tuple[str, str]:
    """Build an active-matching soup from the identity tokens.

    Numbers / concentrations are stripped from every token; standalone
    formulation codes are dropped; leading formulation codes are stripped from
    every token EXCEPT the first (the brand-position token), because brands
    like "GRANSTAR" or "ECORMON" start with a formulation code.
    """
    frags: list[str] = []
    for i, tok in enumerate(raw_tokens):
        parts = _noise(tok).split()
        for p in parts:
            if p.upper() in FORMULATIONS:
                continue
            if i > 0:
                p = _STRIP_LEADING_FORM.sub("", p)
            if p:
                frags.append(p)
    return " ".join(frags), " ".join(frags)


def _derive_brand(soup: str, matched: list[str]) -> str:
    """Brand = leading text of the soup before the leftmost matched active."""
    if not matched or not soup:
        return ""
    sn = norm(soup)
    pos = len(sn)
    for name in matched:
        i = sn.find(norm(name))
        if i >= 0 and i < pos:
            pos = i
    if pos <= 0:
        return ""
    out: list[str] = []
    n = 0
    for ch in soup:
        if n >= pos:
            break
        if norm(ch):
            n += 1
        out.append(ch)
    return "".join(out).strip(" -+.")


def parse_identity(text: str) -> dict:
    """Brand / active / concentration / formulation from an identity column."""
    tokens = [t.translate(BRAND_SYMBOL).strip() for t in text.split() if t.translate(BRAND_SYMBOL).strip()]

    def is_cf(tok: str) -> bool:
        return bool(CONC_GPERL.search(tok) or CONC_PERCENT.search(tok)
                    or CONC_JOINED.match(tok) or tok in FORMULATIONS
                    or re.fullmatch(r"\d{1,2}", tok)
                    or re.fullmatch(r"\d+[.,]?\d*", tok))

    # brand = first token that is not a concentration/formulation fragment
    brand = ""
    rest = []
    for tok in tokens:
        if not brand and not is_cf(tok):
            brand = tok
        elif brand:
            rest.append(tok)
    brand = re.sub(r"\d+[.,]?\d*$", "", brand).rstrip("+.")

    # brand with a glued concentration/formulation (e.g. "ATIFOS48EC",
    # "BIOK1,8EC" -> brand + "48 %" + EC). The glued digits sit on the brand
    # line, which is the LOWEST text in the column, so they come AFTER the
    # active tokens in bottom->top reading order.
    m = BRAND_TRAIL.match(brand)
    if m and not is_cf(m.group(1)):
        brand = m.group(1)
        rest = rest + [m.group(2), m.group(3)]

    first_cf = None
    for i, tok in enumerate(rest, start=1):
        if is_cf(tok):
            first_cf = i
            break
    active = " ".join(rest[:first_cf - 1]) if first_cf else " ".join(rest)
    conc = ""
    form = ""
    conc_explicit: str | None = None
    for tok in rest[first_cf - 1:] if first_cf else []:
        m = CONC_GPERL.search(tok)
        if m and conc_explicit is None:
            conc_explicit = f"{m.group(1)} g/L"
            continue
        m = CONC_PERCENT.search(tok)
        if m and conc_explicit is None:
            conc_explicit = f"{m.group(1)} %"
            continue
        if re.fullmatch(r"\d+[.,]?\d*", tok) and conc_explicit is None:
            # bare number from a split brand glue (e.g. "ATIFOS48EC" -> "48")
            conc_explicit = f"{tok} %"
            continue
        if tok in FORMULATIONS and not form:
            form = tok
    # fall back to attached "200SL"/"50EC"/"25WG" tokens when no explicit
    # unit is present; prefer explicit units over attached ones
    for tok in rest[first_cf - 1:] if first_cf else []:
        m = CONC_JOINED.match(tok)
        if m:
            if not conc:
                n = float(m.group(1).replace(",", "."))
                unit = "%" if "%" in tok else ("g/L" if n > 99 else "%")
                conc = f"{m.group(1)} {unit}"
            if m.group(2) in FORMULATIONS and not form:
                form = m.group(2)
    conc = conc_explicit or conc

    # NEW: reassemble wrapped / glued actives from ALL tokens (brand column
    # included, since it can carry the start of the active name), then derive
    # the brand from the leading text before the leftmost matched active.
    soup, _soup_raw = _match_soup(tokens)
    matched = match_actives(soup)
    active_clean = " + ".join(matched) if matched else ""
    brand_derived = _derive_brand(soup, matched)
    if brand_derived:
        brand = brand_derived
    if not matched and len(brand) >= 5:
        # some rows carry the substance name as the brand (e.g. "ABAMECTINE")
        matched = match_actives(brand)
        active_clean = " + ".join(matched) if matched else active_clean
    return {
        "brand": brand,
        "active": active_clean or active,
        "active_raw": active,
        "concentration": conc,
        "formulation": form,
    }


def clean_text(s: str) -> str:
    s = s.replace("\x00", "")
    return "".join(ch for ch in s if unicodedata.category(ch) not in ("Cc", "Cf"))


ACTIVE_OVERRIDES: dict[str, str] = {
    # Manual substance fixes for rows where the substance is not recoverable
    # from the page text (missing, OCR-split beyond the strip window, or an
    # adjective false-positive). Verified against the 2017 index columns.
    "08 46 017": "acétamipride",                          # CONFIDENTE
    "07 45 013": "bacillus thuringiensis",                # BATAK
    "16 56 072": "métalaxyl-m",                          # APRONS (strip caught neighbor cols)
    "08 46 011": "lambda-cyhalothrine",                   # CYCLONE
    "08 46 014": "cyperméthrine",                         # CYRENC
    "12 52 012": "difénoconazole",                        # DIVIDEND
    "09 47 001": "zêta-cyperméthrine",                    # FURY
    "16 56 030": "phosphure d'aluminium",                 # FUMIGAS
    "16 56 022": "lambda-cyhalothrine",                   # LERATEX
    "07 45 048": "acétamipride",                          # MOPISTOP
    "08 46 049": "chlorpyriphos-éthyl + cyperméthrine",   # MONDIAL
    "08 46 054": "fenpyroximate",                         # ORTUS
    "11 51 031": "chlorantraniliprole + thiaméthoxam",    # VOLIAM FLEXI
    "11 51 032": "abamectine + chlorantraniliprole",      # VOLIAM TARGO
    "07 45 081": "ethaboxam",                               # ETABOXAM
    "07 45 084": "fosétyl-Al",                              # FOSETOP
    "07 45 083": "fosétyl-Al",                            # FOLIETTE
    "13 53 019": "fosétyl-Al",                            # VALETTE
    "14 54 036": "2,4-D",                                 # SANHORMONE
    "07 45 142": "clodinafop-propargyl + cloquintocet-méxyl",  # ZELLAMIN
    "07 45 168": "1,3-dichloropropène + dichloropropane",      # D-D
    "08 46 066": "1,3-dichloropropène",                   # TELONEEC
    "51 01 106": "acibenzolar-S-méthyl",                  # BIONO
    "15 10 110": "prohexadione-calcium",                  # REGALIS
    "08 46 176": "hydrazide maléique",                    # HIMALAYA
    "09 47 031": "hydrazide maléique",                    # ITCAN
    "07 45 055": "acide indole-butyrique",                # PLANDOR
    "07 45 276": "acide gibbérellique",                   # SPA-GIB
    "15 55 280": "soufre",                                # SOFRAL
    "07 45 128": "tribénuron-méthyl",                     # AGRISTAR
    "11 51 020": "glufosinate-ammonium",                  # GLUSAR
    "07 45 304": "huile minérale",                        # SEFRAZIT
    "12 52 078": "",                                      # KERAK (Zn fertiliser; suppress false positive)
}

def main() -> int:
    products: list[dict] = []
    stats = Counter()
    current_section = ""

    with pdfplumber.open(SRC) as pdf:
        for i, page in enumerate(pdf.pages):
            if i < 20:
                continue
            chars = [c for c in page.chars if c["text"].strip()]
            if not chars:
                continue
            pno = i + 1

            # section edge label
            page_blob = "".join(c["text"] for c in chars).upper()
            edge = ""
            for w in sorted(SECTION_WORDS, key=len, reverse=True):
                if w in page_blob:
                    edge = w
                    break
            if edge:
                current_section = edge

            anchors = find_hom_anchors(page)
            if not anchors:
                stats["pages_without_anchor"] += 1
                continue
            stats["pages_with_anchor"] += 1

            cols = x_clusters(chars, 2.0)
            for x_hom, hom in anchors:
                ident_cols = [c for c in cols
                              if abs(c[0]["x0"] - x_hom) <= IDENT_WIN]
                ident_parts = []
                ident_means: list[float] = []
                for cg in ident_cols:
                    keep = [c for c in cg if c["top"] >= IDENT_MIN_TOP]
                    if keep:
                        ident_parts.append(col_text(keep))
                        ident_means.append(sum(c["top"] for c in keep)
                                           / len(keep))
                # brand columns sit lowest (largest mean top): order so the
                # brand is read first
                order = sorted(range(len(ident_parts)),
                               key=lambda j: -ident_means[j])
                ident_parts = [ident_parts[j] for j in order]
                ident_text = re.sub(r"\s+", " ", " ".join(ident_parts))
                parsed = parse_identity(ident_text)

                company_parts: list[str] = []
                usage_parts: list[str] = []
                for cg in cols:
                    cx = cg[0]["x0"]
                    if abs(cx - x_hom) <= IDENT_WIN or abs(cx - x_hom) > USAGE_WIN:
                        continue
                    if cx < 140.0:
                        continue  # page-title / table-header column zone
                    tops = [c["top"] for c in cg]
                    if max(tops) < COMPANY_BAND:
                        t = col_text(cg)
                        if t:
                            company_parts.append(t)
                        continue
                    t = col_text(cg)
                    if not t:
                        continue
                    up = t.upper()
                    if any(w in up for w in SECTION_WORDS) or \
                            any(m in up for m in TITLE_MARKERS):
                        continue
                    usage_parts.append(t[:200])

                rec = {
                    "page": pno,
                    "homologation": hom,
                    "brand": clean_text(parsed["brand"]),
                    "active": clean_text(parsed["active"]),
                    "active_raw": clean_text(parsed["active_raw"]),
                    "concentration": clean_text(parsed["concentration"]),
                    "formulation": parsed["formulation"],
                    "section": current_section,
                    "company": clean_text(" ".join(company_parts))[:160],
                    "usage": [clean_text(u) for u in usage_parts[:14]],
                }
                ov = ACTIVE_OVERRIDES.get(hom)
                if ov is not None:
                    if ov:
                        rec["active"] = ov
                elif not rec["active"]:
                    # substance-name columns beyond the identity band: several
                    # 2017 rows print the substance in a column a few pt from
                    # the hom digits but ABOVE IDENT_MIN_TOP, so it never
                    # reaches parse_identity. Sweep the nearest columns and
                    # match known actives there instead.
                    near = sorted(
                        (cg for cg in cols if abs(cg[0]["x0"] - x_hom) <= STRIP_WIN),
                        key=lambda cg: abs(cg[0]["x0"] - x_hom),
                    )
                    soup_parts = [clean_text(col_text(cg)) for cg in near]
                    soup_parts = [t for t in soup_parts if t]
                    if soup_parts:
                        matched = match_actives(" ".join(soup_parts))
                        guarded = []
                        for name in matched:
                            nm = norm(name)
                            for cg in near:
                                if abs(cg[0]["x0"] - x_hom) <= STRIP_GUARD and \
                                        nm in norm(clean_text(col_text(cg))):
                                    guarded.append(name)
                                    break
                        if guarded:
                            rec["active"] = " + ".join(guarded)
                if rec["brand"] and rec["active"]:
                    stats["full"] += 1
                elif rec["brand"]:
                    stats["brand_only"] += 1
                else:
                    stats["low"] += 1
                # quality: active fully composed of known substances
                active_parts = [a for a in re.split(r"\s*\+\s*", rec["active"]) if a]
                if active_parts and all(norm(a) in {n for n, _ in _KNOWN_NORM} for a in active_parts):
                    stats["known_only"] += 1
                products.append(rec)

    print("pages scanned:", 212)
    print("stats:", dict(stats))
    for k in ("full", "brand_only", "low", "known_only", "pages_with_anchor",
              "pages_without_anchor"):
        print(f"  {k}: {stats[k]}")

    for p in products[:14]:
        print(
            " | ".join(
                [
                    p["homologation"],
                    p["brand"][:20],
                    p["active"][:20],
                    p["concentration"][:10],
                    p["formulation"],
                    p["section"][:12],
                    f"{len(p['usage'])}u",
                ]
            )
        )

    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(
            {
                "source": "INDEX_PRODUITS_PHYTO_2017 (Algérie, INPV)",
                "generated": "pdfplumber char reconstruction (v3)",
                "count": len(products),
                "products": products,
            },
            fh,
            ensure_ascii=False,
            indent=1,
        )
    print(f"wrote {OUT}: {len(products)} products")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
