const params = new URLSearchParams(window.location.search)

/**
 * @typedef {Object} Backstory
 * @property {string} name
 * @property {string} title
 * @property {string} titleShort
 * @property {string} desc
 * @property {Object.<string, number>} skills
 * @property {string[]} disabledWork
 * @property {string[]} requiredWork
 * @property {Object.<string, number>} traits
 */

/**
 * @typedef {Object} Gene
 * @property {string} name
 * @property {string} label
 * @property {string} [labelShortAdj]
 * @property {string} [iconpath]
 * @property {string} [iconColor]
 * @property {string} [displayCategory]
 * @property {number} [displayOrder]
 * @property {number} [metabolism]
 * @property {Object.<string, number>} [skills]
 * @property {string[]} [abilities]
 * @property {Object.<string, number>} [traits]
 * @property {Object.<string, number>} [statOffsets]
 * @property {Object.<string, number>} [statFactors]
 * @property {Object.<string, number>} [damageFactors]
 * @property {string[]} [disabledWork]
 */

const cookieExpiration = new Date(2100, 0).toUTCString();

/**
 * @param {string} key 
 * 
 * @returns {string | null} value
 */
function cookieCutter(key) {
    let index = document.cookie.search("(?:^|;)\\s*" + key + "=");
    if (index == -1)
        return null;
    index = document.cookie.indexOf("=", index) + 1;
    let indexEnd = document.cookie.indexOf(";", index);
    if (indexEnd == -1)
        indexEnd = document.cookie.length;
    return document.cookie.substring(index, indexEnd);
}

class Ruleset {
    minMetabolism = Number.NEGATIVE_INFINITY;
    maxComplexity = Number.POSITIVE_INFINITY;
    bannedGenes = [];
    bannedTraits = [];
    maxFlames = Number.POSITIVE_INFINITY;
    maxSkillAlloc = Number.POSITIVE_INFINITY;

    /**
     * @param {Pawn} pawn 
     * @returns {string} error or "" if ok
     */
    verify = (pawn) => {
        // TODO: check metabolism and complexity
        // Check for banned genes
        for (const gene of this.bannedGenes) {
            if (pawn.genotype.hasGene())
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
    traits = new Map(); //string, number
    // apparel default
    // ideology placeholder

    saveCookie() {
        document.cookie = `${gameID}:PAWN=${encodeURIComponent(JSON.stringify(this))};expires=${cookieExpiration};samesite=lax`;
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
    ruleset = (await r.json()).rules;

    // if cooki, load
    token = cookieCutter(gameID + ":TOKEN");
    pawn = (() => {
        let str = cookieCutter(gameID + ":PAWN");
        if (str === null)
            return null;
        console.log(decodeURIComponent(str));
        return JSON.parse(decodeURIComponent(str));
    })();
    console.log(pawn);
    // hopefully we have both or none of these cookies. if not that's bad. Maybe they should be bundled. idk.
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
        Pawn.prototype.saveCookie.call(pawn);
        // send it in
    });

    pageCoverDiv.hidden = true;
});

