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

graphicsSearch: Set[str] = set()


def parseFloatList(text: Union[str, None]) -> Union[List[float], None]:
    if text is None:
        return None
    assert text[0] == "(" and text[-1] == ")"
    items = text[1:-1].split(",")
    return [float(x) for x in items]


class headType:
    def __init__(self, bdef: ET.Element):
        self.defName = bdef.findtext("defName")
        self.graphicPath = bdef.findtext("graphicPath")
        if self.graphicPath is not None:
            graphicsSearch.add(self.graphicPath + "_south")
        self.gender = bdef.findtext("gender")
        self.randomChosen = bdef.findtext("randomChosen")
        self.hairMeshSize = parseFloatList(bdef.findtext("hairMeshSize"))
        self.beardMeshSize = parseFloatList(bdef.findtext("beardMeshSize"))
        self.beardOffset = parseFloatList(bdef.findtext("beardOffset"))
        self.beardOffsetXEast = bdef.findtext("beardOffsetXEast")
        if self.beardOffsetXEast is not None:
            self.beardOffsetXEast = float(self.beardOffsetXEast)
        self.eyeOffsetEastWest = parseFloatList(bdef.findtext("eyeOffsetEastWest"))
        self.narrow = bdef.findtext("narrow")

    def export(self) -> dict:
        d = {
            "name": self.defName,
            "graphicPath": self.graphicPath,
            "gender": self.gender,
            "randomChosen": self.randomChosen,
            "hairMeshSize": self.hairMeshSize,
            "beardMeshSize": self.beardMeshSize,
            "beardOffset": self.beardOffset,
            "beardOffsetXEast": self.beardOffsetXEast,
            "eyeOffsetEastWest": self.eyeOffsetEastWest,
            "narrow": self.narrow
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


class hairType:
    def __init__(self, bdef: ET.Element):
        self.defName = bdef.findtext("defName")
        self.label = bdef.findtext("label")
        self.graphicPath = bdef.findtext("texPath")
        if self.graphicPath is not None:
            graphicsSearch.add(self.graphicPath)
        self.gender = bdef.findtext("gender")
        self.category = bdef.findtext("category")
        self.styleTags: List[str] = []
        for li in bdef.iterfind("./styleTags/li"):
            self.styleTags.append(li.text)
        self.offsetNarrowEast = parseFloatList(
            bdef.findtext("offsetNarrowEast"))
        self.offsetNarrowSouth = parseFloatList(
            bdef.findtext("offsetNarrowSouth"))

    def export(self) -> dict:
        d = {
            "name": self.defName,
            "label": self.label,
            "graphicPath": self.graphicPath,
            "gender": self.gender,
            "category": self.category,
            "styleTags": self.styleTags,
            "offsetNarrowEast": self.offsetNarrowEast,
            "offsetNarrowSouth": self.offsetNarrowSouth
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


abstract_headTypes: Dict[str, ET.Element] = {}
abstract_hairTypes: Dict[str, ET.Element] = {}
abstract_beards: Dict[str, ET.Element] = {}

for filePath in files:
    tree = ET.ElementTree(file=filePath)
    for bdef in tree.iterfind("./HeadTypeDef"):
        if "Abstract" in bdef.attrib:
            abstract_headTypes[bdef.attrib["Name"]] = bdef
    for bdef in tree.iterfind("./HairDef"):
        if "Abstract" in bdef.attrib:
            abstract_hairTypes[bdef.attrib["Name"]] = bdef
    for bdef in tree.iterfind("./BeardDef"):
        if "Abstract" in bdef.attrib:
            abstract_beards[bdef.attrib["Name"]] = bdef

headTypes: List[Dict[str, Any]] = []
hairTypes: List[Dict[str, Any]] = []
beardTypes: List[Dict[str, Any]] = []

for filePath in files:
    tree = ET.ElementTree(file=filePath)
    for bdef in tree.iterfind("./HeadTypeDef"):
        if "Abstract" in bdef.attrib:
            continue
        elif "ParentName" in bdef.attrib:
            bdef.extend(abstract_headTypes[bdef.attrib["ParentName"]])
        h = headType(bdef)
        headTypes.append(h.export())
    for bdef in tree.iterfind("./HairDef"):
        if "Abstract" in bdef.attrib:
            continue
        elif "ParentName" in bdef.attrib:
            bdef.extend(abstract_hairTypes[bdef.attrib["ParentName"]])
        h = hairType(bdef)
        hairTypes.append(h.export())
    for bdef in tree.iterfind("./BeardDef"):
        if "Abstract" in bdef.attrib:
            continue
        elif "ParentName" in bdef.attrib:
            bdef.extend(abstract_beards[bdef.attrib["ParentName"]])
        b = hairType(bdef)
        beardTypes.append(b.export())

"""
gfxDef = loadGraphics(graphicsDir, (128, 128),
                      list(graphicsSearch), "genes.png")
for h in headTypes:
    if "graphicPath" in h:
        h["graphicPath"] = gfxDef[h["graphicPath"]]
for h in hairTypes:
    if "graphicPath" in h:
        h["graphicPath"] = gfxDef[h["graphicPath"]]
for b in beardTypes:
    if "graphicPath" in b:
        b["graphicPath"] = gfxDef[b["graphicPath"]]
"""

genesFileTS = open(Path("./data/bodyparts.ts").resolve(), "w+")
genesFileJS = open(Path("./docs/bodyparts.js").resolve(), "w+")
jsonStringHeads = json.dumps(headTypes, separators=(",", ":"))
jsonStringHairs = json.dumps(hairTypes, separators=(",", ":"))
jsonStringBeards = json.dumps(beardTypes, separators=(",", ":"))
genesFileTS.write(
    f"export const headTypes = {jsonStringHeads};\nexport const hairTypes = {jsonStringHairs};\nexport const beardTypes = {jsonStringBeards}")
genesFileJS.write("/** @type { HeadType[] } */\n" + f"var headTypes = {jsonStringHeads};\n" + "/** @type { HairBeardType[] } */\n" +
                  f"var hairTypes = {jsonStringHairs};\n" + "/** @type { HairBeardType[] } */\n" + f"var beardTypes = {jsonStringBeards};\n")
