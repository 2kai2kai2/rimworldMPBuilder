# Reads genes from a directory and puts them into ../data/genes.json
from pathlib import Path
from typing import List, Dict, Union
from xml.etree import ElementTree as ET
import json

directory = input("Directory: ").strip('" \n\t')

exclude = []

files = list(filter(lambda x: x.name not in exclude,
             Path(directory).rglob("*.[xX][mM][lL]")))


class gene:
    def __init__(self, bdef: ET.Element):
        self.defName = bdef.findtext("defName")
        self.label = bdef.findtext("label")
        self.labelShortAdj = bdef.findtext("labelShortAdj")
        # This is only for some special effects
        self.geneClass = bdef.findtext("geneClass")
        self.desc = bdef.findtext("description").replace("\\n", "\n")
        self.iconPath = bdef.findtext("iconPath")
        self.iconColor = bdef.findtext("iconColor")
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
        # hairTagFilter (all hair)
        # beardTagFilter (all beards)
        # randomBrightnessFactor (cosmetic)
        # skinColorOverride (all skin color)
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
            "skills": {}, # I think only aptitudes (below)
            "abilities": self.abilities,
            "traits": self.forcedTraits,
            "statOffsets": self.statOffsets,
            "statFactors": self.statFactors,
            "damageFactors": self.damageFactors,
            "disabledWork": self.disabledWork
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


genes: List[dict] = []
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
skills = ["Shooting", "Melee", "Construction", "Mining", "Cooking", "Plants", "Animals", "Crafting", "Artistic", "Medicine", "Intelligence"]
aptitudeLevels = {"AptitudeTerrible": ("Awful", -8, 1, 2), "AptitudePoor": ("Poor", -4, 1, 1), "AptitudeStrong": ("Strong", 4, 2, -1), "AptitudeRemarkable": ("Great", 8, 2, -3)}
order = 0
for skill in skills:
    for level in aptitudeLevels:
        genes.append({
            "name": f"{level}_{skill}",
            "label": f"{aptitudeLevels[level][0]} {skill}",
            #labelShortAdj
            "desc": f"The carrier's aptitude in {skill} is {'reduced' if aptitudeLevels[level][1] < 0 else 'increased'} by {abs(aptitudeLevels[level][1])}. Aptitude acts like an offset on skill level.{' Additionally, all passion is removed from ' + skill + '.' if aptitudeLevels[level][1] < 0 else ''}",
            "iconPath": f"UI/Icons/Genes/Gene_{level}_{skill}", # unchecked
            "displayCategory": "Aptitudes",
            "displayOrder": order,
            "metabolism": aptitudeLevels[level][2],
            "complexity": aptitudeLevels[level][3],
            "exclusionTags": [f"Aptitude{skill}"], # This is made-up for app purposes and does not use real game tags
            "skills": dict([(skill, aptitudeLevels[level][1])])
            # none of the rest (it only does skills)
        })
        order += 1

# Drugs
drugs = {"Alcohol": ("Alcohol", True), "Smokeleaf": ("Smokeleaf", True), "Psychite": ("Psychite", False), "GoJuice": ("Go-juice", False), "WakeUp": ("Wake-up", False)}
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
            #labelShortAdj
            "desc": drugLevels[level][1](drugs[drug][0]),
            "iconPath": f"UI/Icons/Genes/Gene_{level}_{drug}", # unchecked
            "displayCategory": "Drugs",
            "displayOrder": order,
            "metabolism": drugLevels[level][3][0 if drugs[drug][1] else 1],
            "complexity": drugLevels[level][2],
            "exclusionTags": [f"Drug{drug}"] # This is made-up for app purposes and does not use real game tags
            # some other stuff that's the actual effects
        })
        order += 1

genesFileTS = open(Path("./data/genes.ts").resolve(), "w+")
genesFileJS = open(Path("./page/genes.js").resolve(), "w+")
jsonString = json.dumps(genes, separators=(",", ":"))
genesFileTS.write(f"export var genes = {jsonString};")
genesFileJS.write("/** @type { Gene[] } */\n" + f"var genes = {jsonString};")
