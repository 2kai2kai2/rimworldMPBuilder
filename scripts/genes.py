# Reads genes from a directory and puts them into ../data/genes.json
from pathlib import Path
from typing import Any, List, Dict, Set, Union, Literal
from xml.etree import ElementTree as ET
import json
from graphics import loadGraphics
from sys import argv

directory = ""
graphicsDir = ""
if len(argv) == 3:
    directory = argv[1]
    graphicsDir = argv[2]
else:
    directory = input("Directory: ").strip('" \n\t')
    graphicsDir = input("Graphics Directory: ").strip('" \n\t')

exclude = []

files = list(filter(lambda x: x.name not in exclude,
             Path(directory).rglob("*.[xX][mM][lL]")))


def parseColor(text: str) -> Dict[Literal["R", "G", "B", "A"], Union[float, int]]:
    assert text[0] == "(" and text[-1] == ")"
    r, g, b = text[1:-1].split(",")
    if "." in r:
        r = int(float(r) * 255)
    else:
        r = int(r)
    if "." in g:
        g = int(float(g) * 255)
    else:
        g = int(g)
    if "." in b:
        b = int(float(b) * 255)
    else:
        b = int(b)
    return {
        "R": r,
        "G": g,
        "B": b,
        "A": 1.0
    }


graphicsSearch: Set[str] = set()


class gene:
    def __init__(self, bdef: ET.Element):
        self.defName = bdef.findtext("defName")
        self.label = bdef.findtext("label")
        self.labelShortAdj = bdef.findtext("labelShortAdj")
        # This is only for some special effects
        self.geneClass = bdef.findtext("geneClass")
        self.desc = bdef.findtext("description").replace("\\n", "\n")
        self.iconPath = bdef.findtext("iconPath")
        if self.iconPath is not None:
            graphicsSearch.add(self.iconPath)
        self.iconColor = bdef.findtext("iconColor")
        if self.iconColor is not None:
            self.iconColor = parseColor(self.iconColor)
        self.displayCategory = bdef.findtext("displayCategory")
        self.displayOrder = bdef.findtext("displayOrderInCategory")
        self.displayOrder = 0 if self.displayOrder is None else int(
            self.displayOrder)

        self.metabolism = bdef.findtext("biostatMet")
        self.metabolism = 0 if self.metabolism is None else int(
            self.metabolism)
        self.complexity = bdef.findtext("biostatCpx")
        self.complexity = 1 if self.complexity is None else int(
            self.complexity)
        self.exclusionTags: List[str] = [
            x.text for x in bdef.iterfind("./exclusionTags/li")]

        self.abilities: List[str] = [
            x.text for x in bdef.iterfind("./abilities/li")]
        self.forcedTraits: Dict[str, int] = {}
        for li in bdef.iterfind("./forcedTraits/li"):
            key = li.findtext("def")
            value = li.findtext("degree")
            value = 0 if value is None else int(value)
            self.forcedTraits[key] = value
        # self.capMods: Dict[str, float] = {} # e.g. GeneDefs_Cosmetic.xml -> Tail_Smooth
        self.statOffsets: Dict[str, float] = {}
        for item in bdef.iterfind("./statOffsets/*"):
            self.statOffsets[item.tag] = float(item.text)
        self.statFactors: Dict[str, float] = {}
        for item in bdef.iterfind("./statFactors/*"):
            self.statFactors[item.tag] = float(item.text)
        self.damageFactors: Dict[str, float] = {}
        for item in bdef.iterfind("./damageFactors/*"):
            self.damageFactors[item.tag] = float(item.text)
        self.disabledWork = [
            x.text for x in bdef.iterfind("./disabledWorkTags/li")]
        self.endogeneCategory = bdef.findtext("endogeneCategory")
        self.skinColor = bdef.findtext("skinColorBase")
        if self.skinColor is not None:
            self.skinColor = parseColor(self.skinColor)
        self.skinColorOverride = bdef.findtext("skinColorOverride")
        if self.skinColorOverride is not None:
            self.skinColorOverride = parseColor(self.skinColorOverride)
        self.hairColor = bdef.findtext("hairColorOverride")
        if self.hairColor is not None:
            self.hairColor = parseColor(self.hairColor)
        self.bodyType = bdef.findtext("bodyType")
        self.melanin = bdef.findtext("minMelanin")
        if self.melanin is not None:
            self.melanin = float(self.melanin)
        # hairTagFilter (all hair)
        # beardTagFilter (all beards)
        # randomBrightnessFactor (cosmetic)
        # forcedHeadTypes (e.g. GeneDefs_Cosmetic.xml -> Furskin)
        # missingGeneRomanceChanceFactor (e.g. GeneDefs_Cosmetic.xml -> Furskin)
        # graphicData (e.g. GeneDefs_Cosmetic.xml -> Furskin)
        # ignoreDarkness (GeneDefs_Misc.xml -> DarkVision)
        # causesNeed (e.g. GeneDefs_Misc.xml -> KillThirst)
        # disablesNeeds (e.g. GeneDefs_Spectrum.xml -> Neversleep)
        # dontMindRawFood (e.g. GeneDefs_Misc.xml -> RobustDigestion)
        # conditionalStatAffecters (e.g. GeneDefs_Misc.xml -> NakedSpeed; GeneDefs_Spectrum.xml -> UVSensitivity_*)
        # immuneToToxGasExposure (e.g. GeneDefs_Spectrum.xml -> ToxResist_Total)
        # painFactor (e.g. GeneDefs_Spectrum.xml -> Pain_Reduced)
        # socialFightChanceFactor (e.g. GeneDefs_Spectrum.xml -> Aggression_*)
        # aggroMentalBreakSelectionChanceFactor (e.g. GeneDefs_Spectrum.xml -> Aggression_*)
        # prisonBreakMTBFactor (e.g. GeneDefs_Spectrum.xml -> Aggression_*)
        # dislikesSunlight (e.g. GeneDefs_Spectrum.xml -> UVSensitivity_*)
        # lovinMTBFactor (e.g. GeneDefs_Spectrum.xml -> Libido_*)
        # minAgeActive

    def export(self) -> dict:
        d = {
            "name": self.defName,
            "label": self.label,
            "labelShortAdj": self.labelShortAdj,
            "desc": self.desc,
            "iconPath": self.iconPath,
            "iconColor": self.iconColor,
            "displayCategory": self.displayCategory,
            "displayOrder": self.displayOrder,
            "metabolism": self.metabolism,
            "complexity": self.complexity,
            "exclusionTags": self.exclusionTags,
            "skills": {},  # I think only aptitudes (below)
            "abilities": self.abilities,
            "traits": self.forcedTraits,
            "statOffsets": self.statOffsets,
            "statFactors": self.statFactors,
            "damageFactors": self.damageFactors,
            "disabledWork": self.disabledWork,
            "endogeneCategory": self.endogeneCategory,
            "skinColor": self.skinColor,
            "skinColorOverride": self.skinColorOverride,
            "hairColor": self.hairColor,
            "bodyType": self.bodyType,
            "melanin": self.melanin
        }
        to_remove: str = []
        for x in d:
            if d[x] is None:
                to_remove.append(x)
            elif isinstance(d[x], (dict, list)) and len(d[x]) == 0:
                to_remove.append(x)
        for x in to_remove:
            d.pop(x)
        return d


genes: List[Dict[str, Any]] = []
abstract: Dict[str, ET.Element] = {}

for filePath in files:
    tree = ET.ElementTree(file=filePath)
    for bdef in tree.iterfind("./GeneDef[@Abstract='True']"):
        abstract[bdef.attrib["Name"]] = bdef
    for bdef in tree.iterfind("./GeneDef"):
        if "Abstract" in bdef.attrib:
            continue
        if "ParentName" in bdef.attrib:
            bdef.extend(abstract[bdef.attrib["ParentName"]])
        g = gene(bdef)
        genes.append(g.export())

# Additional genes
# Aptitudes (skills)
skills = ["Shooting", "Melee", "Construction", "Mining", "Cooking",
          "Plants", "Animals", "Crafting", "Artistic", "Medicine", "Intellectual"]
aptitudeLevels = {"Terrible": ("Awful", -8, 1, 2), "Poor": ("Poor", -4, 1, 1),
                  "Strong": ("Strong", 4, 2, -1), "Remarkable": ("Great", 8, 2, -3)}
order = 0
for skill in skills:
    for level in aptitudeLevels:
        genes.append({
            "name": f"Aptitude{level}_{skill}",
            "label": f"{aptitudeLevels[level][0]} {skill}",
            # labelShortAdj
            "desc": f"The carrier's aptitude in {skill} is {'reduced' if aptitudeLevels[level][1] < 0 else 'increased'} by {abs(aptitudeLevels[level][1])}. Aptitude acts like an offset on skill level.{' Additionally, all passion is removed from ' + skill + '.' if aptitudeLevels[level][1] < 0 else ''}",
            "iconPath": f"UI/Icons/Genes/Skills/{skill}/{level}",
            "displayCategory": "Aptitudes",
            "displayOrder": order,
            "metabolism": aptitudeLevels[level][2],
            "complexity": aptitudeLevels[level][3],
            # This is made-up for app purposes and does not use real game tags
            "exclusionTags": [f"Aptitude{skill}"],
            "skills": dict([(skill, aptitudeLevels[level][1])])
            # none of the rest (it only does skills)
        })
        order += 1
        graphicsSearch.add(genes[-1]["iconPath"])

# Drugs
drugs = {"Alcohol": ("Alcohol", True), "Smokeleaf": ("Smokeleaf", True), "Psychite": (
    "Psychite", False), "GoJuice": ("Go-juice", False), "WakeUp": ("Wake-up", False)}
drugLevels = {"ChemicalDependency": ("dependency", lambda x: f"Carriers of this gene need to ingest {x.lower()} on a regular basis to survive. After 5 days without {x.lower()}, carriers will suffer from drug deficiency. After 30 days, they will fall into a coma. After 60 days, they will die.", 1, (3, 4)),
              "AddictionResistant": ("resistant", lambda x: f"Carriers are only half as likely to become addicted to {x}.", 1, (-1, -2)),
              "AddictionImmune": ("impervious", lambda x: f"Carriers of this gene never get addicted to {x}.", 2, (-3, -5))
              }
order = 0
for drug in drugs:
    for level in drugLevels:
        genes.append({
            "name": f"{level}_{drug}",
            "label": f"{drugs[drug][0]} {drugLevels[level][0]}",
            # labelShortAdj
            "desc": drugLevels[level][1](drugs[drug][0]),
            "iconPath": f"UI/Icons/Genes/Chemicals/{drug}/{level}",
            "displayCategory": "Drugs",
            "displayOrder": order,
            "metabolism": drugLevels[level][3][0 if drugs[drug][1] else 1],
            "complexity": drugLevels[level][2],
            # This is made-up for app purposes and does not use real game tags
            "exclusionTags": [f"Drug{drug}"]
            # some other stuff that's the actual effects
        })
        order += 1
        graphicsSearch.add(genes[-1]["iconPath"])

gfxDef = loadGraphics(graphicsDir, (128, 128),
                      list(graphicsSearch), "genes.png")
for g in genes:
    if "iconPath" in g:
        g["iconPath"] = gfxDef[g["iconPath"]]

genesFileTS = open(Path("./data/genes.ts").resolve(), "w+")
genesFileJS = open(Path("./page/genes.js").resolve(), "w+")
jsonString = json.dumps(genes, separators=(",", ":"))
genesFileTS.write(f"export var genes = {jsonString};")
genesFileJS.write("/** @type { Gene[] } */\n" + f"var genes = {jsonString};")
