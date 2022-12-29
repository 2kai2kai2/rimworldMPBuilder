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
        self.desc = bdef.findtext("description")
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

json.dump(genes, open(Path("./data/genes.json").resolve(), "w+"))
