const params = new URLSearchParams(window.location.search)


class Ruleset {
    minMetabolism = Number.NEGATIVE_INFINITY;
    maxComplexity = Number.POSITIVE_INFINITY;
    bannedGenes = [];
    bannedTraits = [];
    maxFlames = Number.POSITIVE_INFINITY;
    maxSkillAlloc = Number.POSITIVE_INFINITY;

    /**
     * @param {Pawn} pawn 
     * @returns {string} error or `""` if ok
     */
    verify(pawn) {
        // TODO: check metabolism and complexity
        // Check for banned genes
        for (const gene of this.bannedGenes) {
            if (pawn.genotype.hasGene(gene))
                return "Has banned gene: " + gene;
        }
        // TODO: check traits (deal with spectrums)
        // Check for skills/flames
        if (pawn.skills.totalPoints() > this.maxSkillAlloc)
            return "Too many allocated skill points (max " + this.maxSkillAlloc.toString() + ")";
        if (pawn.skills.totalFlames() > this.maxFlames)
            return "Too many skill flames (max " + this.maxFlames.toString() + ")";
        return "";
    }

    constructor(obj = {}) {
        Object.assign(this, obj)
    }
}

/**
 * @template T
 * @param {T[]} list 
 * @returns {T}
 */
function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

class RGBA {
    R;
    G;
    B;
    A;
    constructor(R = 0, G = 0, B = 0, A = 1) {
        this.R = R; this.B = B; this.G = G; this.A = A;
    }

    asHex() {
        return "#" + this.R.toString(16).padStart(2, "0") + this.G.toString(16).padStart(2, "0") + this.B.toString(16).padStart(2, "0");
    }
    /**
     * @param {string} hex 
     * @returns {RGBA}
     */
    static fromHex(hex) {
        hex = hex.replace("#", "").trim();
        if (hex.length == 6)
            return new RGBA(Number.parseInt(hex.substring(0, 2), 16),
                Number.parseInt(hex.substring(2, 4), 16),
                Number.parseInt(hex.substring(4, 6), 16));
        else if (hex.length == 8)
            return new RGBA(Number.parseInt(hex.substring(0, 2), 16),
                Number.parseInt(hex.substring(2, 4), 16),
                Number.parseInt(hex.substring(4, 6), 16),
                Number.parseInt(hex.substring(6, 8), 16))
        else
            throw new Error("Invalid color hex string");
    }
    /**
     * @param {{R: number, G: number, B: number, A?: number}} obj 
     * @returns {RGBA}
     */
    static fromJSON(obj) {
        return new RGBA(obj.R, obj.G, obj.B, "A" in obj ? obj.A : 1);
    }
}

class Genotype {
    xenotype = "Baseliner";
    endogenes = [];
    xenogenes = [];

    /**
     * @param {string} gene 
     * @returns {boolean} whether it has the gene
     */
    hasGene(gene) {
        return this.endogenes.includes(gene) || this.xenogenes.includes(gene);
    }

    constructor(obj = {}) {
        Object.assign(this, obj)
    }
}

class Skills {
    Shooting = 0;
    Melee = 0;
    Construction = 0;
    Mining = 0;
    Cooking = 0;
    Plants = 0;
    Animals = 0;
    Crafting = 0;
    Artistic = 0;
    Medicine = 0;
    Social = 0;
    Intellectual = 0;

    ShootingFlames = 0;
    MeleeFlames = 0;
    ConstructionFlames = 0;
    MiningFlames = 0;
    CookingFlames = 0;
    PlantsFlames = 0;
    AnimalsFlames = 0;
    CraftingFlames = 0;
    ArtisticFlames = 0;
    MedicineFlames = 0;
    SocialFlames = 0;
    IntellectualFlames = 0;

    totalPoints() {
        return this.Shooting + this.Melee + this.Construction + this.Mining + this.Cooking + this.Plants +
            this.Animals + this.Crafting + this.Artistic + this.Medicine + this.Social + this.Intellectual;
    }
    totalFlames() {
        return this.ShootingFlames + this.MeleeFlames + this.Construction + this.MiningFlames + this.CookingFlames + this.PlantsFlames +
            this.AnimalsFlames + this.CraftingFlames + this.ArtisticFlames + this.MedicineFlames + this.SocialFlames + this.IntellectualFlames;
    }

    constructor(obj = {}) {
        Object.assign(this, obj)
    }
}

class Pawn {
    id = "should be a UUID";
    firstName = "first";
    nickName = "nick";
    lastName = "last";
    tickAgeBio = Math.floor(3600000 * (18 + Math.random() * 22)); // picks random from 18-40 years old
    tickAgeChron = this.tickAgeBio;

    childhood = pickRandom(adulthoods).name;
    adulthood = pickRandom(childhoods).name;

    gender = pickRandom(["Male", "Female"]);
    bodyType = "Thin";
    headType = "Gaunt";
    hair = "Elisabeth";
    hairColor = new RGBA();
    beard = "NoBeard";
    faceTattoo = "NoTattoo_Face";
    bodyTattoo = "NoTattoo_Body";
    skinColor = new RGBA();
    melanin = 0.5;
    favoriteColor = new RGBA();

    genotype = new Genotype();
    skills = new Skills()
    /** @type {Object.<string, number>} */
    traits = new Object();
    // apparel default
    // ideology placeholder

    /**
     * Saves the pawn JSON to `window.localStorage` as `{gameID}:PAWN`
     */
    save() {
        window.localStorage.setItem(`${gameID}:PAWN`, JSON.stringify(pawn));
    }

    static fromJSON(obj = {}) {
        let p = new Pawn();
        p.id = obj.id;
        p.firstName = obj.firstName;
        p.nickName = obj.nickName;
        p.lastName = obj.lastName;
        p.tickAgeBio = obj.tickAgeBio;
        p.tickAgeChron = obj.tickAgeChron;
        p.childhood = obj.childhood;
        p.adulthood = obj.adulthood;
        p.gender = obj.gender;
        p.bodyType = obj.bodyType;
        p.headType = obj.headType;
        p.hair = obj.hair;
        p.hairColor = new RGBA(obj.hairColor);
        p.beard = obj.beard;
        p.faceTattoo = obj.faceTattoo;
        p.bodyTattoo = obj.bodyTattoo;
        p.skinColor = new RGBA(obj.skinColor);
        p.melanin = obj.melanin;
        p.favoriteColor = new RGBA(obj.favoriteColor);
        p.genotype = new Genotype(obj.genotype);
        p.skills = new Skills(obj.skills);
        p.traits = obj.traits;
        return p;
    }
}
/**
 * Adds `<option>` elements to the select for each backstory
 * @param {HTMLSelectElement} select 
 * @param {Backstory[]} backstoryList 
 */
function buildBackstorySelect(select, backstoryList) {
    backstoryList.sort((a, b) => a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1);
    backstoryList.forEach((backstory, bs_index, bs_array) => {
        let desc = backstory.desc;
        if (backstory.skills.size > 0) desc += `\n`;
        for (const skill in backstory.skills) {
            desc += `\n${skill}: ${backstory.skills[skill] < 0 ? "" : "+"}${backstory.skills[skill]}`
        };
        if (backstory.disabledWork.size > 0) desc += `\n`;
        backstory.disabledWork.forEach((value, index, array) => {
            desc += `\n${value} disabled`
        })
        let element = document.createElement("option");
        element.value = backstory.name;
        element.title = desc;
        element.text = backstory.title;
        select.appendChild(element);
    });
}

// Grab the elements
/** @type {HTMLDivElement} */
var pageCoverDiv;
/** @type {HTMLInputElement} */
var firstNameInput;
/** @type {HTMLInputElement} */
var nickNameInput;
/** @type {HTMLInputElement} */
var lastNameInput;
/** @type {HTMLInputElement} */
var favoriteColorPicker;
/** @type {HTMLInputElement} */
var maleRadioButton;
/** @type {HTMLInputElement} */
var femaleRadioButton;
/** @type {HTMLInputElement} */
var skinColorPicker;
/** @type {HTMLInputElement} */
var hairColorPicker;
/** @type {HTMLInputElement} */
var bioAgeInput;
/** @type {HTMLInputElement} */
var chronAgeInput;
/** @type {HTMLSelectElement} */
var childhoodSelect;
/** @type {HTMLSelectElement} */
var adulthoodSelect;
/** @type {HTMLInputElement} */
var submitButton;

/** @type {HTMLInputElement} */
var shootingInput;
/** @type {HTMLInputElement} */
var meleeInput;
/** @type {HTMLInputElement} */
var constructionInput;
/** @type {HTMLInputElement} */
var miningInput;
/** @type {HTMLInputElement} */
var cookingInput;
/** @type {HTMLInputElement} */
var plantsInput;
/** @type {HTMLInputElement} */
var animalsInput;
/** @type {HTMLInputElement} */
var craftingInput;
/** @type {HTMLInputElement} */
var artisticInput;
/** @type {HTMLInputElement} */
var medicineInput;
/** @type {HTMLInputElement} */
var intellectualInput;


// And the data thingies
/** @type {Ruleset} */
var ruleset;
/** @type {string} */
var token;
/** @type {Pawn} */
var pawn;
/** @type {Backstory} */
var childhoodCache;
/** @type {Backstory} */
var adulthoodCache;
/** @type {string} */
var gameID;
/** @type {string} */
var token;

// Apply pawn data to page
addEventListener("DOMContentLoaded", async (event) => {
    pageCoverDiv = document.getElementById("pageCover")

    if (!params.has("g")) {
        alert("oh noews! yuwu nweed a pawameter!");
        return;
    }
    gameID = params.get("g").trim();

    let r = await fetch("http://localhost:8787", { method: "GET", headers: { "gameID": gameID } });
    if (!r.ok) { // the params are probably invalid
        alert("Invalid game parameter. Maybe it has ended?");
        return;
    }
    ruleset = new Ruleset((await r.json()).rules);

    // if stored, load
    token = window.localStorage.getItem(`${gameID}:TOKEN`);
    pawn = window.localStorage.getItem(`${gameID}:PAWN`);
    if (pawn !== null)
        pawn = Pawn.fromJSON(JSON.parse(pawn));
    // hopefully we have both or none of these keys. if not that's bad. Maybe they should be bundled. idk.
    // for now assume we don't have to ask the server for the last uploaded pawn. TODO: error check this

    // If necessary, roll a new pawn
    if (pawn === null)
        pawn = new Pawn();

    firstNameInput = document.getElementById("firstNameInput");
    nickNameInput = document.getElementById("nickNameInput");
    lastNameInput = document.getElementById("lastNameInput");
    favoriteColorPicker = document.getElementById("favoriteColor");
    maleRadioButton = document.getElementById("maleRadioButton");
    femaleRadioButton = document.getElementById("femaleRadioButton");
    skinColorPicker = document.getElementById("skinColor");
    hairColorPicker = document.getElementById("hairColor");
    bioAgeInput = document.getElementById("bioAgeInput");
    chronAgeInput = document.getElementById("chronAgeInput");
    adulthoodSelect = document.getElementById("adulthoodSelect");
    childhoodSelect = document.getElementById("childhoodSelect");
    submitButton = document.getElementById("submitButton");

    shootingInput = document.getElementById("shootingInput");
    meleeInput = document.getElementById("meleeInput");
    constructionInput = document.getElementById("constructionInput");
    miningInput = document.getElementById("miningInput");
    cookingInput = document.getElementById("cookingInput");
    plantsInput = document.getElementById("plantsInput");
    animalsInput = document.getElementById("animalsInput");
    craftingInput = document.getElementById("craftingInput");
    artisticInput = document.getElementById("artisticInput");
    medicineInput = document.getElementById("medicineInput");
    intellectualInput = document.getElementById("intellectualInput");



    firstNameInput.value = pawn.firstName;
    nickNameInput.value = pawn.nickName;
    lastNameInput.value = pawn.lastName;
    if (pawn.gender === "Male")
        maleRadioButton.checked = true;
    else
        femaleRadioButton.checked = true;
    favoriteColorPicker.value = pawn.favoriteColor.asHex;
    skinColorPicker.value = pawn.skinColor.asHex;
    hairColorPicker.value = pawn.hairColor.asHex;
    bioAgeInput.value = Math.floor(pawn.tickAgeBio / 3600000);
    chronAgeInput.value = Math.floor(pawn.tickAgeChron / 3600000);
    buildBackstorySelect(adulthoodSelect, adulthoods);
    buildBackstorySelect(childhoodSelect, childhoods);
    adulthoodSelect.value = pawn.adulthood;
    childhoodSelect.value = pawn.childhood;

    shootingInput.value = pawn.skills.Shooting;
    meleeInput.value = pawn.skills.Melee;
    constructionInput.value = pawn.skills.Construction;
    miningInput.value = pawn.skills.Mining;
    cookingInput.value = pawn.skills.Cooking;
    plantsInput.value = pawn.skills.Plants;
    animalsInput.value = pawn.skills.Animals;
    craftingInput.value = pawn.skills.Crafting;
    artisticInput.value = pawn.skills.Artistic;
    medicineInput.value = pawn.skills.Medicine;
    intellectualInput.value = pawn.skills.Intellectual;

    firstNameInput.addEventListener("input", (ev) => {
        pawn.firstName = ev.target.value;
    });
    nickNameInput.addEventListener("input", (ev) => {
        pawn.nickName = ev.target.value;
    });
    lastNameInput.addEventListener("input", (ev) => {
        pawn.lastName = ev.target.value;
    });
    favoriteColorPicker.addEventListener("input", (ev) => {
        pawn.favoriteColor = RGBA.fromHex(ev.target.value);
    });
    maleRadioButton.addEventListener("change", (ev) => {
        pawn.gender = "Male";
    });
    femaleRadioButton.addEventListener("change", (ev) => {
        pawn.gender = "Female";
    });
    skinColorPicker.addEventListener("input", (ev) => {
        pawn.skinColor = RGBA.fromHex(ev.target.value);
    });
    hairColorPicker.addEventListener("input", (ev) => {
        pawn.hairColor = RGBA.fromHex(ev.target.value);
    });
    bioAgeInput.addEventListener("change", (ev) => {
        pawn.tickAgeBio = bioAgeInput.value * 3600000;
        if (pawn.tickAgeChron < pawn.tickAgeBio) {
            pawn.tickAgeChron = pawn.tickAgeBio;
            chronAgeInput.value = bioAgeInput.value;
        }
    });
    chronAgeInput.addEventListener("change", (ev) => {
        pawn.tickAgeChron = chronAgeInput.value * 3600000;
        if (pawn.tickAgeChron < pawn.tickAgeBio) {
            pawn.tickAgeBio = pawn.tickAgeChron;
            bioAgeInput.value = chronAgeInput.value;
        }
    });
    adulthoodSelect.addEventListener("change", (ev) => {
        pawn.adulthood = adulthoodSelect.value;
    });
    childhoodSelect.addEventListener("change", (ev) => {
        pawn.childhood = childhoodSelect.value;
    });

    shootingInput.addEventListener("change", (ev) => {
        pawn.skills.Shooting = ev.target.value;
    });
    meleeInput.addEventListener("change", (ev) => {
        pawn.skills.Melee = ev.target.value;
    });
    constructionInput.addEventListener("change", (ev) => {
        pawn.skills.Construction = ev.target.value;
    });
    miningInput.addEventListener("change", (ev) => {
        pawn.skills.Mining = ev.target.value;
    });
    cookingInput.addEventListener("change", (ev) => {
        pawn.skills.Cooking = ev.target.value;
    });
    plantsInput.addEventListener("change", (ev) => {
        pawn.skills.Plants = ev.target.value;
    });
    animalsInput.addEventListener("change", (ev) => {
        pawn.skills.Animals = ev.target.value;
    });
    craftingInput.addEventListener("change", (ev) => {
        pawn.skills.Crafting = ev.target.value;
    });
    artisticInput.addEventListener("change", (ev) => {
        pawn.skills.Artistic = ev.target.value;
    });
    medicineInput.addEventListener("change", (ev) => {
        pawn.skills.Medicine = ev.target.value;
    });
    intellectualInput.addEventListener("change", (ev) => {
        pawn.skills.Intellectual = ev.target.value;
    });

    submitButton.addEventListener("click", async (ev) => {
        // verify
        // send it in
        pawn.save();
    });

    pageCoverDiv.hidden = true;
});

