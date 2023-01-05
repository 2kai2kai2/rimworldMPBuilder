import { adulthoods } from "../data/adulthoods";
import { childhoods } from "../data/childhoods";
import { genes } from "../data/genes";
import xml from "xml";

function pickRandom<T>(list: T[]): T {
    return list[Math.floor(Math.random() * list.length)];
}

/** Can determine with total certainty */
function isStringArray(item: Array<string> | any): boolean {
    return Array.isArray(item) && item.every((value) => typeof value === "string");
}

function inRange(num: number, min: number, max: number): boolean {
    return min <= num && num <= max;
}

export class RGBA {
    R: number;
    G: number;
    B: number;
    A: number;
    constructor(R: number = 0, G: number = 0, B: number = 0, A: number = 1) {
        this.R = R; this.B = B; this.G = G; this.A = A;
    }
    static validate(rgba: any): boolean {
        let base = new RGBA();
        return Object.keys(rgba).every((key) => key in base && typeof rgba[key] === "number") &&
            inRange(rgba.R, 0, 255) && inRange(rgba.G, 0, 255) && inRange(rgba.B, 0, 255) && inRange(rgba.A, 0, 1);
    }
}
function RGBAtoString(rgba: RGBA): string {
    return `RGBA(${(rgba.R / 255).toFixed(3)}, ${(rgba.G / 255).toFixed(3)}, ${(rgba.B / 255).toFixed(3)}, ${rgba.A.toFixed(3)})`;
}

export class Genotype {
    xenotype: string = "Baseliner";
    endogenes: string[] = [];
    xenogenes: string[] = [];

    static validate(gt: any): boolean {
        let base = new Genotype();
        return Object.keys(gt).every((key) => key in base) &&
            typeof gt.xenotype === "string" &&
            isStringArray(gt.endogenes) && gt.endogenes.every((geneName: string) => genes.some((gene) => gene.name === geneName)) &&
            isStringArray(gt.xenogenes) && gt.xenogenes.every((geneName: string) => genes.some((gene) => gene.name === geneName));
    }
}

export class Skills {
    Shooting: number = 0;
    Melee: number = 0;
    Construction: number = 0;
    Mining: number = 0;
    Cooking: number = 0;
    Plants: number = 0;
    Animals: number = 0;
    Crafting: number = 0;
    Artistic: number = 0;
    Medicine: number = 0;
    Social: number = 0;
    Intellectual: number = 0;

    ShootingFlames: 0 | 1 | 2 = 0;
    MeleeFlames: 0 | 1 | 2 = 0;
    ConstructionFlames: 0 | 1 | 2 = 0;
    MiningFlames: 0 | 1 | 2 = 0;
    CookingFlames: 0 | 1 | 2 = 0;
    PlantsFlames: 0 | 1 | 2 = 0;
    AnimalsFlames: 0 | 1 | 2 = 0;
    CraftingFlames: 0 | 1 | 2 = 0;
    ArtisticFlames: 0 | 1 | 2 = 0;
    MedicineFlames: 0 | 1 | 2 = 0;
    SocialFlames: 0 | 1 | 2 = 0;
    IntellectualFlames: 0 | 1 | 2 = 0;

    /** All skills must be 0-20 and all flames must be 0-2 */
    static validate(skills: Skills | any): boolean {
        let base = new Skills();
        return Object.keys(skills).every((key) => key in base &&
            typeof skills[key] === "number" &&
            ((key.includes("Flames") && inRange(skills[key], 0, 2)) ||
                (!key.includes("Flames") && inRange(skills[key], 0, 20)))
        );
    }
}

export class Pawn {
    id: string = "";
    firstName: string = "";
    nickName: string = "";
    lastName: string = "";
    tickAgeBio: number = 0;
    tickAgeChron: number = 0;

    childhood: string = "";
    adulthood: string = "";

    gender: "Male" | "Female" = "Male";
    bodyType: string = "";
    headType: string = "";
    hair: string = "";
    hairColor: RGBA = new RGBA();
    beard: string = "";
    faceTattoo: string = "";
    bodyTattoo: string = "";
    skinColor: RGBA = new RGBA();
    melanin: number = 0;
    favoriteColor: RGBA = new RGBA();

    genotype: Genotype = new Genotype();
    skills: Skills = new Skills();
    traits: { [key: string]: number } = {};
    // apparel default
    // ideology placeholder

    static validate(pawn: Pawn | any): boolean {
        let base = new Pawn();
        return Object.keys(pawn).every((key) => key in base) &&
            typeof pawn.id === "string" &&
            typeof pawn.firstName === "string" &&
            typeof pawn.nickName === "string" &&
            typeof pawn.lastName === "string" &&
            typeof pawn.tickAgeBio === "number" && pawn.tickAgeBio >= 18 * 3600000 &&
            typeof pawn.tickAgeChron === "number" && pawn.tickAgeChron >= pawn.tickAgeBio &&
            typeof pawn.childhood === "string" && childhoods.some((ch) => ch.name === pawn.childhood) &&
            typeof pawn.adulthood === "string" && adulthoods.some((ah) => ah.name === pawn.adulthood) &&
            (pawn.gender === "Male" || pawn.gender === "Female") &&
            typeof pawn.bodyType === "string" &&
            typeof pawn.headType === "string" &&
            typeof pawn.hair === "string" &&
            RGBA.validate(pawn.hairColor) &&
            typeof pawn.beard === "string" &&
            typeof pawn.faceTattoo === "string" &&
            typeof pawn.bodyTattoo === "string" &&
            RGBA.validate(pawn.skinColor) &&
            typeof pawn.melanin === "number" && inRange(pawn.melanin, 0, 1) &&
            RGBA.validate(pawn.favoriteColor) &&
            Genotype.validate(pawn.genotype) &&
            Skills.validate(pawn.skills) &&
            typeof pawn.traits === "object" && pawn.traits !== null &&
            Object.keys(pawn.traits).every((key) => typeof key === "string" &&
                typeof pawn.traits[key] === "number" &&
                Number.isInteger(pawn.traits[key]) &&
                traits.some((trait) => key === trait.name && pawn.traits[key].toString() in trait.degrees)
            );
    }
}

function flamesStr(num: 0 | 1 | 2): string {
    switch (num) {
        case 0: return "None";
        case 1: return "Minor";
        case 2: return "Major";
    }
}

export function pawnToXML(pawn: Pawn): string {
    let traitsTree: any[] = [];
    for (const trait in pawn.traits) {
        let _li: any[] = [{ def: trait }]
        if (pawn.traits[trait] !== 0)
            _li.push({ degree: pawn.traits[trait] });
        traitsTree.push({ li: _li });
    }
    let skillsTree: any[] = [
        { li: [{ name: "Shooting" }, { value: pawn.skills.Shooting }, { passion: flamesStr(pawn.skills.ShootingFlames) }] },
        { li: [{ name: "Melee" }, { value: pawn.skills.Melee }, { passion: flamesStr(pawn.skills.MeleeFlames) }] },
        { li: [{ name: "Construction" }, { value: pawn.skills.Construction }, { passion: flamesStr(pawn.skills.ConstructionFlames) }] },
        { li: [{ name: "Mining" }, { value: pawn.skills.Mining }, { passion: flamesStr(pawn.skills.MiningFlames) }] },
        { li: [{ name: "Cooking" }, { value: pawn.skills.Cooking }, { passion: flamesStr(pawn.skills.CookingFlames) }] },
        { li: [{ name: "Plants" }, { value: pawn.skills.Plants }, { passion: flamesStr(pawn.skills.PlantsFlames) }] },
        { li: [{ name: "Animals" }, { value: pawn.skills.Animals }, { passion: flamesStr(pawn.skills.AnimalsFlames) }] },
        { li: [{ name: "Crafting" }, { value: pawn.skills.Crafting }, { passion: flamesStr(pawn.skills.CraftingFlames) }] },
        { li: [{ name: "Artistic" }, { value: pawn.skills.Artistic }, { passion: flamesStr(pawn.skills.ArtisticFlames) }] },
        { li: [{ name: "Medicine" }, { value: pawn.skills.Medicine }, { passion: flamesStr(pawn.skills.MedicineFlames) }] },
        { li: [{ name: "Social" }, { value: pawn.skills.Social }, { passion: flamesStr(pawn.skills.SocialFlames) }] },
        { li: [{ name: "Intellectual" }, { value: pawn.skills.Intellectual }, { passion: flamesStr(pawn.skills.IntellectualFlames) }] },
    ];
    let clothesTree = [
        {
            li: [
                { layer: "Pants" },
                { apparel: "Apparel_Pants" },
                { stuff: "Synthread" },
                { color: "RGBA(0.682, 0.859, 0.894, 1.000)" }
            ]
        },
        {
            li: [
                { layer: "BottomClothingLayer" },
                { apparel: "Apparel_CollarShirt" },
                { stuff: "Synthread" },
                { color: "RGBA(0.682, 0.859, 0.894, 1.000)" }
            ]
        }];
    let endogenesTree: any[] = [];
    for (const gene of pawn.genotype.endogenes) {
        endogenesTree.push({ li: gene });
    }
    let xenogenesTree: any[] = [];
    for (const gene of pawn.genotype.xenogenes) {
        xenogenesTree.push({ li: gene });
    }
    let genesTree: any[] = [
        { xenotypeDef: pawn.genotype.xenotype },
        { endogenes: endogenesTree.length === 0 ? null : endogenesTree },
        { xenogenes: xenogenesTree.length === 0 ? null : xenogenesTree }
    ];
    return xml([
        //{ id: pawn.id },
        { type: "Colonist" },
        { faction: [{ _attr: { IsNull: "True" } }] },
        { pawnKindDef: "Colonist" },
        { originalFactionDef: "PlayerColony" },
        { childhood: pawn.childhood },
        { adulthood: pawn.adulthood },
        { traits: traitsTree },
        { traitNames: null },
        { traitDegrees: null },
        { skinColor: RGBAtoString(pawn.skinColor) },
        { melanin: pawn.melanin.toString() },
        { bodyType: pawn.bodyType },
        { headType: pawn.headType },
        { hairDef: pawn.hair },
        { hairColor: RGBAtoString(pawn.hairColor) },
        { beard: pawn.beard },
        { faceTattoo: pawn.faceTattoo },
        { bodyTattoo: pawn.bodyTattoo },
        { firstName: pawn.firstName },
        { nickName: pawn.nickName },
        { lastName: pawn.lastName },
        { favoriteColor: RGBAtoString(pawn.favoriteColor) },
        // { biologicalAge: Math.floor(pawn.tickAgeBio / 3600000) },
        // { chronologicalAge: Math.floor(pawn.tickAgeChron / 3600000) },
        { biologicalAgeInTicks: pawn.tickAgeBio },
        { chronologicalAgeInTicks: pawn.tickAgeChron },
        { skills: skillsTree },
        { apparel: clothesTree },
        // { ideo: [{ name: "Placeholder" }, { certainty: 1.0 }, { culture: "Placeholder" }, { memes: null }] },
        { genes: genesTree },
        // { abilities: "TODO" },
        { implants: null },
        { injuries: null },
        { compFields: null },
        { savedComps: null },
        { hediffs: null }
    ]);
}

export class Ruleset {
    minMetabolism: number = Number.NEGATIVE_INFINITY;
    maxComplexity: number = Number.POSITIVE_INFINITY;
    bannedGenes: string[] = [];
    bannedTraits: string[] = [];
    maxFlames: number = Number.POSITIVE_INFINITY;
    maxSkillAlloc: number = Number.POSITIVE_INFINITY;

    public verify(pawn: Pawn): string {
        // check metabolism and complexity
        return "";
    }

    static validate(rules: Ruleset | any): boolean {
        let base = new Ruleset();
        return Object.keys(rules).every((key) => key in base) &&
            typeof rules.minMetabolism === "number" &&
            typeof rules.maxComplexity === "number" &&
            isStringArray(rules.bannedGenes) &&
            isStringArray(rules.bannedTraits) &&
            typeof rules.maxFlames === "number" &&
            typeof rules.maxSkillAlloc === "number" &&
            rules.maxComplexity >= 0 &&
            rules.bannedGenes.every((geneName: string) => genes.some((gene) => gene.name === geneName)) &&
            // rules.bannedTraits.every((traitName: string) => traits.some((trait) => trait.name === traitName)) &&
            rules.maxFlames >= 0 &&
            rules.maxSkillAlloc >= 0;
    }
}