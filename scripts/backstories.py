# Reads backgrounds from a directory and puts them into ../data/childhoods.json and ../data/adulthoods.json
from pathlib import Path
from typing import List, Dict, Union
from xml.etree import ElementTree as ET
import json

directory = input("Directory: ").strip('" \n\t')

exclude = ["Special.xml", "TynanCustom.xml"]

files = list(filter(lambda x: x.name not in exclude,
             Path(directory).rglob("*.[xX][mM][lL]")))


class backstory:
    @staticmethod
    def cleanDescription(text: str) -> str:
        return text.replace("\\n", "\n").replace("\n\n", "\n").replace("[PAWN_nameDef]", "This pawn").replace("[PAWN_pronoun]", "This pawn").replace("[PAWN_possessive]", "their").replace("[PAWN_objective]", "them"),

    def __init__(self, bdef: ET.Element):
        # Handles parsing of a <BackstoryDef> element
        self.defName: str = bdef.findtext("defName")
        self.title: str = bdef.findtext("title")
        self.titleShort: str = bdef.findtext("titleShort")
        self.desc: str = backstory.cleanDescription(bdef.findtext("baseDesc"))
        self.slot: str = bdef.findtext("slot")

        self.skills: Dict[str, int] = {}
        for li in bdef.iterfind("./skillGains/li"):
            key = li.findtext("key")
            value = li.findtext("value")
            assert key is not None and value is not None
            self.skills[key] = int(value)

        self.disabledWork: List[str] = []
        for li in bdef.iterfind("./workDisables/li"):
            assert li.text is not None
            self.disabledWork.append(li.text)
        disabledWorkText = bdef.findtext("workDisables")
        if disabledWorkText is not None and disabledWorkText.strip() != "None":
            self.disabledWork.extend(filter(lambda x: x != "", map(
                lambda x: x.strip(), disabledWorkText.split(","))))

        self.requiredWork: List[str] = []
        # Two ways it could be formatted: xml list or simple "a, b, c"/"None"
        for li in bdef.iterfind("./requiredWorkTags/li"):
            assert li.text is not None
            self.requiredWork.append(li.text)
        requiredWorkText = bdef.findtext("requiredWorkTags")
        if requiredWorkText is not None and requiredWorkText.strip() != "None":
            self.requiredWork.extend(filter(lambda x: x != "", map(
                lambda x: x.strip(), requiredWorkText.split(","))))

        self.forcedTraits: Dict[str, int] = {}
        for item in bdef.iterfind("./forcedTraits/*"):
            if item.text is None:
                self.forcedTraits[item.tag] = 0
            else:
                self.forcedTraits[item.tag] = int(item.text)

    def export(self) -> Dict[str, Union[str, int, List[str], Dict[str, int]]]:
        return {
            "name": self.defName,
            "title": self.title,
            "titleShort": self.titleShort,
            "desc": self.desc,
            "skills": self.skills,
            "disabledWork": self.disabledWork,
            "requiredWork": self.requiredWork,
            "traits": self.forcedTraits
        }


adulthoods: List[dict] = []
childhoods: List[dict] = []

for filePath in files:
    tree = ET.ElementTree(file=filePath)
    for bdef in tree.iterfind("./BackstoryDef"):
        b = backstory(bdef)
        if b.slot == "Adulthood":
            adulthoods.append(b.export())
        elif b.slot == "Childhood":
            childhoods.append(b.export())
adulthoodsFileTS = open(Path("./data/adulthoods.ts").resolve(), "w+")
childhoodsFileTS = open(Path("./data/childhoods.ts").resolve(), "w+")
adulthoodsFileJS = open(Path("./page/adulthoods.js").resolve(), "w+")
childhoodsFileJS = open(Path("./page/childhoods.js").resolve(), "w+")
adulthoodsFileTS.write(f"export var adulthoods = {json.dumps(adulthoods)};")
childhoodsFileTS.write(f"export var childhoods = {json.dumps(childhoods)};")
adulthoodsFileJS.write(
    "/** @type { Backstory[] } */\n" + f"var adulthoods = {json.dumps(adulthoods)};")
childhoodsFileJS.write(
    "/** @type { Backstory[] } */\n" + f"var childhoods = {json.dumps(childhoods)};")
