# Reads backgrounds from a directory and puts them into ../data/childhoods.json and ../data/adulthoods.json
from pathlib import Path
from typing import List, Dict, Union
from xml.etree import ElementTree as ET
import json

directory = input("Directory: ").strip('" \n\t')

exclude = []

files = list(filter(lambda x: x.name not in exclude,
             Path(directory).rglob("*.[xX][mM][lL]")))


class traitDegree:
    @staticmethod
    def cleanDescription(text: str) -> str:
        return text.replace("\\n", "\n").replace("\n\n", "\n").replace("[PAWN_nameDef]", "This pawn").replace("[PAWN_pronoun]", "This pawn").replace("[PAWN_possessive]", "their").replace("[PAWN_objective]", "them").replace("{PAWN_nameDef}", "This pawn").replace("{PAWN_pronoun}", "This pawn").replace("{PAWN_possessive}", "their").replace("{PAWN_objective}", "them")

    def __init__(self, deg: ET.Element):
        # handles parsing of a <li> element in <degreeDatas>
        self.label = deg.findtext("label")
        self.desc: str = traitDegree.cleanDescription(
            deg.findtext("description"))
        self.degree: int = deg.findtext("degree")
        self.degree = 0 if self.degree is None else int(self.degree)

        self.skillGains: Dict[str, int] = {}
        for li in deg.iterfind("./skillGains/li"):
            key = li.findtext("key")
            value = li.findtext("value")
            assert key is not None and value is not None
            self.skillGains[key] = int(value)
        self.statOffsets: Dict[str, float] = {}
        for item in deg.iterfind("./statOffsets/*"):
            self.statOffsets[item.tag] = float(item.text)
        self.statFactors: Dict[str, float] = {}
        for item in deg.iterfind("./statFactors/*"):
            self.statFactors[item.tag] = float(item.text)
        self.meditationTypes: List[str] = []
        for li in deg.iterfind("./allowedMeditationFocusTypes/li"):
            self.meditationTypes.append(li.text)
        self.hungerRateFactor = deg.findtext("./hungerRateFactor")
        if self.hungerRateFactor is not None:
            self.hungerRateFactor = float(self.hungerRateFactor)

        """
        theOnlyAllowedMentalBreaks (e.g. Traits_Singular.xml -> Gourmand, Pyromaniac)
        randomMentalState (e.g. Traits_Singular.xml -> Gourmand, Pyromaniac)
        randomMentalStateMtbDaysMoodCurve (e.g. Traits_Singular.xml -> Gourmand, Pyromaniac)
        mentalBreakInspirationGainSet (e.g. Traits_Singular.xml -> TorturedArtist)
        mentalBreakInspirationGainReasonText (e.g. Traits_Singular.xml -> TorturedArtist)
        mentalBreakInspirationGainChance (e.g. Traits_Singular.xml -> TorturedArtist)
        disallowedInspirations (e.g. Traits_Singular.xml -> Brawler)
        disallowedMeditationFocusTypes (e.g. Traits_Singular.xml -> Ascetic)
        marketValueFactorOffset (e.g. Traits_Singular.xml -> Wimp)
        disallowedThoughtsFromIngestion (e.g. Traits_Singular.xml -> Cannibal)
        extraThoughtsFromIngestion (e.g. Traits_Singular.xml -> Cannibal)
        socialFightChanceFactor (e.g. Traits_Singular.xml -> Bloodlust)
        randomDiseaseMtbDays (e.g. Traits_Spectrum.xml -> Immunity/sickly)
        """

    def export(self) -> Dict[str, Union[str, int, List[str], Dict[str, int]]]:
        d = {
            "label": self.label,
            "desc": self.desc,
            "degree": self.degree,
            "skills": self.skillGains,
            "statOffsets": self.statOffsets,
            "statFactors": self.statFactors,
            "meditationTypes": self.meditationTypes,
            "hungerRateFactor": self.hungerRateFactor
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


class trait:

    def __init__(self, tdef: ET.Element):
        # Handles parsing of a <TraitDef> element
        self.defName: str = tdef.findtext("defName")
        self.commonality: str = tdef.findtext("commonality")
        self.commonality = 1.0 if self.commonality is None else float(
            self.commonality)

        self.conflictingTraits: List[str] = []
        for li in tdef.iterfind("./conflictingTraits/li"):
            self.conflictingTraits.append(li.text)
        self.exclusionTags: List[str] = []
        for li in tdef.iterfind("./exclusionTags/li"):
            self.conflictingTraits.append(li.text)
        self.forcedFlames: List[str] = []
        for li in tdef.iterfind("./forcedPassions/li"):
            self.forcedFlames.append(li.text)
        self.conflictingFlames: List[str] = []
        for li in tdef.iterfind("./conflictingPassions/li"):
            self.forcedFlames.append(li.text)

        self.disabledWork: List[str] = []
        for li in tdef.iterfind("./disabledWorkTags/li"):
            assert li.text is not None
            self.disabledWork.append(li.text)
        disabledWorkText = tdef.findtext("./disabledWorkTags")
        if disabledWorkText is not None and disabledWorkText.strip() != "None":
            self.disabledWork.extend(filter(lambda x: x != "", map(
                lambda x: x.strip(), disabledWorkText.split(","))))
        self.requiredWork: List[str] = []
        for li in tdef.iterfind("./requiredWorkTags/li"):
            assert li.text is not None
            self.requiredWork.append(li.text)
        requiredWorkText = tdef.findtext("requiredWorkTags")
        if requiredWorkText is not None and requiredWorkText.strip() != "None":
            self.requiredWork.extend(filter(lambda x: x != "", map(
                lambda x: x.strip(), requiredWorkText.split(","))))

        self.degrees: Dict[int, traitDegree] = {}
        for li in tdef.iterfind("./degreeDatas/li"):
            degree: traitDegree = traitDegree(li)
            self.degrees[degree.degree] = degree

        """
        commonalityFemale (e.g. Traits_Singular.xml -> DislikesMen, DislikesWomen. Seems to be an override, meaning commonality is the value for males)
        """

    def export(self) -> Dict[str, Union[str, int, List[str], Dict[str, int]]]:
        degrees: Dict[int, dict] = {}
        for degree in self.degrees:
            degrees[degree] = self.degrees[degree].export()
        return {
            "name": self.defName,
            "commonality": self.commonality,
            "conflictingTraits": self.conflictingTraits,
            "exclusionTags": self.exclusionTags,
            "forcedFlames": self.forcedFlames,
            "conflictingFlames": self.conflictingFlames,
            "disabledWork": self.disabledWork,
            "requiredWork": self.requiredWork,
            "degrees": degrees
        }


traits: List[dict] = []

for filePath in files:
    tree = ET.ElementTree(file=filePath)
    for tdef in tree.iterfind("./TraitDef"):
        b = trait(tdef)
        traits.append(b.export())

traitsFileTS = open(Path("./data/traits.ts").resolve(), "w+")
traitsFileJS = open(Path("./page/traits.js").resolve(), "w+")
jsonString = json.dumps(traits, separators=(",", ":"))
traitsFileTS.write(f"export var traits = {jsonString};")
traitsFileJS.write("/** @type { Trait[] } */\n" +
                   f"var traits = {jsonString};")
