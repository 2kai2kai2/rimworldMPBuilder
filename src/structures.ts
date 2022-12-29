function pickRandom<T>(list: T[]): T {
    return list[Math.floor(Math.random() * list.length)];
}

export class RGBA {
    R: number;
    G: number;
    B: number;
    A: number;
    constructor(R: number = 0, G: number = 0, B: number = 0, A: number = 0) {
        this.R = R; this.B = B; this.G = G; this.A = A;
    }
}

export class Genotype {
    xenotype: string = "Baseliner";
    endogenes: string[] = [];
    xenogenes: string[] = [];
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

    
}

export class Pawn {
    id: string = "should be a UUID";
    firstName: string = "first";
    nickName: string = "nick";
    lastName: string = "last";
    tickAgeBio: number = 3600000 * (20 + Math.random() * 20); // picks random from 20-40 years old
    tickAgeChron: number = this.tickAgeBio;

    childhood: string = "";
    adulthood: string = "";

    gender: "Male" | "Female" = pickRandom(["Male", "Female"]);
    bodyType: string = "Thin";
    headType: string = "???";
    hair: string = "???";
    hairColor: RGBA = new RGBA();
    beard: string = "NoBeard";
    faceTattoo: string = "NoTattoo_Face";
    bodyTattoo: string = "NoTattoo_Body";
    skinColor: RGBA = new RGBA();
    melanin: number = 0.5;
    favoriteColor: RGBA = new RGBA();

    genotype: Genotype = new Genotype();
    skills: Skills = new Skills()
    traits: Map<string, number> = new Map<string, number>();
    // apparel default
    // ideology placeholder
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
}