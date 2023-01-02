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

/**
 * @template T
 * @param {T[]} a 
 * @param {T[]} b 
 * @returns {bool}
 */
function anyMatch(a, b) {
    for (const item of a) {
        if (b.includes(item))
            return true;
    }
    return false;
}

/**
 * Adds a number, but as a string
 * @param {string} text 
 * @param {number} num
 * @returns {string}
 */
function addStrInt(text, num) {
    return (Number.parseInt(text) + num).toString()
}

/**
 * parses a string of the format `"a,b, c,  d,e"` -> `["a", "b", "c", "d", "e"]` (whitespace is trimmed)
 * @param {string} text 
 * @param {string[]}
 */
function parseCommaList(text) {
    let items = text.split(",");
    return items.map((value) => value.trim()).filter((value) => value.length != 0);
}

/**
 * @param {Object.<string, number>} skills 
 * @returns {string}
 */
function skillsDesc(skills) {
    let out = "";
    for (const skill in skills) {
        out += `\n${skill}: ${skills[skill] < 0 ? "" : "+"}${skills[skill]}`;
    }
    return out
}
/**
 * @param {Object.<string, number>} statOffsets 
 * @returns {string}
 */
function statOffsetDesc(statOffsets) {
    let out = "";
    for (const stat in statOffsets) {
        out += `\n${stat}: ${statOffsets[stat] < 0 ? "" : "+"}${statOffsets[stat]}`;
    }
    return out;
}
/**
 * @param {Object.<string, number>} statFactors 
 * @returns {string}
 */
function statFactorDesc(statFactors) {
    let out = "";
    for (const stat in statFactors) {
        out += `\n${stat}: ${statFactors[stat] * 100}%`;
    }
    return out;
}
/**
 * @param {string[]} disabledWork 
 * @returns {string}
 */
function disabledWorkDesc(disabledWork) {
    let out = "";
    for (const value of disabledWork) {
        out += `\n${value} disabled`;
    }
    return out;
}
/**
 * @param {Object.<string, number>} requiredTraits 
 * @returns {string}
 */
function requiredTraitDesc(requiredTraits) {
    let out = "";
    for (const key in requiredTraits) {
        let label = traits.find((value) => value.name == key).degrees[requiredTraits[key].toString()].label;
        out += `\nForced trait: ${label}`
    }
    return out;
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
    /** @type {string[]} */
    endogenes = [];
    /** @type {string[]} */
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

    stats() {
        let out = { complexity: 0, metabolism: 0 };
        for (const geneName of this.endogenes) {
            let gene = genes.find((value) => value.name == geneName);
            out.complexity += gene.complexity || 0;
            out.metabolism += gene.metabolism || 0;
        }
        for (const geneName of this.xenogenes) {
            let gene = genes.find((value) => value.name == geneName);
            out.complexity += gene.complexity || 0;
            out.metabolism += gene.metabolism || 0;
        }
        return out;
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
        if (backstory.skills.length > 0) desc += "\n";
        for (const skill in backstory.skills) {
            desc += `\n${skill}: ${backstory.skills[skill] < 0 ? "" : "+"}${backstory.skills[skill]}`
        };
        if (backstory.disabledWork.length > 0) desc += "\n";
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

/**
 * Adds `<option>` elements to the dialog for each trait
 * @param {Trait[]} traitList 
 */
function buildTraitsDialog(traitList) {
    /**
     * @param {Trait} a 
     * @param {HTMLInputElement} b 
     * @returns {boolean}
     */
    function hasConflict(a, b) {
        let b_exclusionTags = parseCommaList(b.getAttribute("exclusionTags"));
        let b_conflictingTraits = parseCommaList(b.getAttribute("conflictingTraits"));
        let b_name = b.value.substring(0, b.value.lastIndexOf(":"));
        return anyMatch(a.exclusionTags, b_exclusionTags) ||
            anyMatch(a.conflictingTraits, b_conflictingTraits) ||
            b_conflictingTraits.includes(a.name) ||
            a.conflictingTraits.includes(b_name) ||
            a.name == b_name;
    }
    let scrollBox = document.getElementById("traitsScrollBox");
    /** @type {Function[]} */
    let postBuildCallbacks = [];
    for (const trait of traitList) {
        for (const degKey in trait.degrees) {
            const degree = trait.degrees[degKey];
            let desc = degree.desc;
            if (degree.skills !== undefined && degree.skills.length > 0) {
                desc += "\n";
                for (const skill in degree.skills) {
                    desc += `\n${skill}: ${degree.skills[skill] < 0 ? "" : "+"}${degree.skills[skill]}`
                };
            }
            if (degree.meditationTypes !== undefined && degree.meditationTypes.length > 0) {
                desc += "\n\nEnables meditation focus types:";
                for (const value of degree.meditationTypes) {
                    desc += `\n- ${value}`;
                }
            }
            if (trait.disabledWork !== undefined && trait.disabledWork.length > 0) {
                desc += "\n";
                for (const value of trait.disabledWork) {
                    desc += `\n${value} disabled`;
                }
            }
            let div = document.createElement("div");
            let label = document.createElement("label");
            let check = document.createElement("input");
            div.title = desc;

            check.type = "checkbox";
            check.value = `${trait.name}:${degKey}`;
            check.id = `traitLabel${check.value}`
            label.textContent = degree.label;
            label.htmlFor = check.id;

            check.setAttribute("exclusionTags", trait.exclusionTags.join(","));
            check.setAttribute("conflictingTraits", trait.conflictingTraits.join(","));
            check.setAttribute("conflicts", "0");

            // Change event
            function setConflicts() {
                scrollBox.querySelectorAll("input").forEach((other) => {
                    if (other.id === check.id)
                        return;
                    if (hasConflict(trait, other)) {
                        other.disabled = true;
                        let prevConflicts = other.getAttribute("conflicts");
                        other.setAttribute("conflicts", addStrInt(prevConflicts, 1));
                    }
                });
            }
            function unsetConflicts() {
                scrollBox.querySelectorAll("input").forEach((other) => {
                    if (other.id === check.id)
                        return;
                    if (hasConflict(trait, other)) {
                        let newConflictCount = addStrInt(other.getAttribute("conflicts"), -1);
                        other.setAttribute("conflicts", newConflictCount);
                        if (newConflictCount === "0")
                            other.disabled = false;
                    }
                });
            }
            check.onchange = (ev) => {
                if (check.checked) {
                    setConflicts();
                    pawn.traits[trait.name] = Number.parseInt(degKey);
                } else {
                    unsetConflicts();
                    delete pawn.traits[trait.name];
                }
            }

            // Check if the pawn has the trait
            if (trait.name in pawn.traits && pawn.traits[trait.name].toString() == degKey) {
                check.checked = true;
                postBuildCallbacks.push(setConflicts);
            }

            scrollBox.append(div);
            div.append(label);
            div.append(check);
        }
    }
    for (const callback of postBuildCallbacks) {
        callback();
    }
}

/** 
 * Updates genetic complexity and metabolism 
 */
function updateGeneStats() {
    let stats = pawn.genotype.stats();
    complexityElement.textContent = stats.complexity.toString();
    metabolismElement.textContent = (stats.metabolism < 0 ? "" : "+") + stats.metabolism.toString();
    // Metabolism can go lower, but food percent will never drop below 50% in game
    let foodPercent = Math.max(100 + (stats.metabolism < 0 ? -25 * stats.metabolism : -10 * stats.metabolism), 50);
    foodPercentElement.textContent = foodPercent.toString() + "%";
}

/**
 * @param {Gene[]} geneList 
 */
function buildGenesList(geneList) {
    /** @type {Map<string, Gene[]>} */
    let categories = new Map();
    for (const gene of geneList) {
        let catName = gene.displayCategory || "Misc";
        let catList = categories.get(catName);
        if (catList === undefined)
            categories.set(catName, [gene]);
        else
            catList.push(gene);
    }

    // GFX
    window.addEventListener("scroll", (ev) => {
        let selectedRect = selectedGenesDiv.getBoundingClientRect();
        if (selectedRect.top < 0) {
            selectedGenesDiv.style = "margin: 0; padding-left: 2em; padding-right: 2em; padding-bottom: 0;";
            genesStatsDiv.style = `padding-top: 0; margin: 0; padding-left: 2em; padding-right: 2em;`;
        } else {
            selectedGenesDiv.style = undefined;
            genesStatsDiv.style = undefined;
        }
    });

    /**
     * @param {Gene} a 
     * @param {HTMLInputElement} b 
     * @returns {boolean}
     */
    function hasConflict(a, b) {
        let b_exclusionTags = parseCommaList(b.getAttribute("exclusionTags") || "");
        return anyMatch(a.exclusionTags || [], b_exclusionTags);
    }

    /** @type {Function[]} */
    let postBuildCallbacks = [];
    categories.forEach((value, key, map) => {
        value.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        let categoryLabelDiv = document.createElement("div");
        categoryLabelDiv.id = `geneCategoryLabelDiv${key}`;
        let categoryLabel = document.createElement("label");
        categoryLabel.id = `geneCategoryLabel${key}`;
        categoryLabel.textContent = key;
        categoryLabelDiv.append(categoryLabel);
        geneListDiv.append(categoryLabelDiv);

        let categoryGenesDiv = document.createElement("div");
        categoryGenesDiv.id = `geneCategoryListDiv${key}`;
        for (const gene of value) {
            let desc = gene.desc || "";
            if (gene.skills)
                desc += "\n" + skillsDesc(gene.skills);

            if (gene.statOffsets || gene.statFactors || gene.damageFactors)
                desc += "\n";
            if (gene.statOffsets)
                desc += statOffsetDesc(gene.statOffsets);
            if (gene.statFactors)
                desc += statFactorDesc(gene.statFactors);
            if (gene.damageFactors)
                desc += statFactorDesc(gene.damageFactors);

            if (gene.traits)
                desc += "\n" + requiredTraitDesc(gene.traits);
            if (gene.disabledWork)
                desc += "\n" + disabledWorkDesc(gene.disabledWork);

            let geneElement = document.createElement("label");
            geneElement.htmlFor = `geneCheckbox${gene.name}`;
            geneElement.className = "geneListItem";
            geneElement.append(gene.label || gene.name);
            geneElement.title = desc;
            let geneCheckbox = document.createElement("input");
            geneCheckbox.id = geneElement.htmlFor;
            geneCheckbox.hidden = true;
            geneCheckbox.value = gene.name;
            geneCheckbox.type = "checkbox";
            geneCheckbox.setAttribute("conflicts", "0");
            geneCheckbox.setAttribute("exclusionTags", (gene.exclusionTags || []).join(","));

            categoryGenesDiv.append(geneElement, geneCheckbox);

            function setConflicts() {
                geneListDiv.querySelectorAll("input").forEach((other) => {
                    if (other.id === geneCheckbox.id)
                        return;
                    if (hasConflict(gene, other)) {
                        let prevConflicts = other.getAttribute("conflicts");
                        other.setAttribute("conflicts", addStrInt(prevConflicts, 1));
                        if (!other.disabled) {
                            other.disabled = true;
                            /** @type {HTMLLabelElement} */
                            let otherLabel = geneListDiv.querySelector(`label[for="${other.id}"]`)
                            otherLabel.style = "border-color:red;";
                        }
                    }
                });
            }
            function unsetConflicts() {
                geneListDiv.querySelectorAll("input").forEach((other) => {
                    if (other.id === geneCheckbox.id)
                        return;
                    if (hasConflict(gene, other)) {
                        let newConflictCount = addStrInt(other.getAttribute("conflicts"), -1);
                        other.setAttribute("conflicts", newConflictCount);
                        if (newConflictCount === "0") {
                            other.disabled = false;
                            /** @type {HTMLLabelElement} */
                            let otherLabel = geneListDiv.querySelector(`label[for="${other.id}"]`)
                            otherLabel.style = undefined;
                        }
                    }
                });
            }
            function addSelected() {
                let selectedGeneElement = document.createElement("label");
                selectedGeneElement.htmlFor = geneElement.htmlFor;
                selectedGeneElement.className = "geneSelectedItem";
                selectedGeneElement.append(gene.label || gene.name);
                selectedGeneElement.title = desc;
                selectedGeneElement.style = "background-color: #242526;"
                selectedGenesDiv.append(selectedGeneElement);
            }
            geneCheckbox.onchange = (ev) => {
                if (geneCheckbox.checked) {
                    pawn.genotype.xenogenes.push(gene.name);
                    geneElement.style = "background-color: #242526;";

                    addSelected();
                    setConflicts();
                    updateGeneStats();
                } else {
                    let index = pawn.genotype.xenogenes.indexOf(gene.name);
                    pawn.genotype.xenogenes.splice(index, 1);
                    geneElement.style = undefined;
                    // Remove selected label
                    selectedGenesDiv.querySelector(`label.geneSelectedItem[for='${geneCheckbox.id}']`).remove();

                    unsetConflicts();
                    updateGeneStats();
                }
            }
            if (pawn.genotype.hasGene(gene.name)) {
                geneElement.style = "background-color: #242526;";
                addSelected();
                geneCheckbox.checked = true;
                postBuildCallbacks.push(setConflicts);
            }
        }
        geneListDiv.append(categoryGenesDiv);
    });
    for (const callback of postBuildCallbacks)
        callback();
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
var submitButton;

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
/** @type {HTMLDialogElement} */
var traitsDialog;
/** @type {HTMLInputElement} */
var openTraitsButton;

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

/** @type {HTMLDivElement} */
var geneHeaderDiv;
/** @type {HTMLDivElement} */
var selectedGenesDiv;
/** @type {HTMLDivElement} */
var genesStatsDiv;
/** @type {HTMLElement} */
var complexityElement;
/** @type {HTMLElement} */
var metabolismElement;
/** @type {HTMLElement} */
var foodPercentElement;
/** @type {HTMLDivElement} */
var geneListDiv;

function loadHTMLElements() {
    // Pawn->Top bar
    firstNameInput = document.getElementById("firstNameInput");
    nickNameInput = document.getElementById("nickNameInput");
    lastNameInput = document.getElementById("lastNameInput");
    favoriteColorPicker = document.getElementById("favoriteColor");
    submitButton = document.getElementById("submitButton");
    // Pawn->Main->Left
    maleRadioButton = document.getElementById("maleRadioButton");
    femaleRadioButton = document.getElementById("femaleRadioButton");
    skinColorPicker = document.getElementById("skinColor");
    hairColorPicker = document.getElementById("hairColor");
    // Pawn->Main->Middle
    bioAgeInput = document.getElementById("bioAgeInput");
    chronAgeInput = document.getElementById("chronAgeInput");
    adulthoodSelect = document.getElementById("adulthoodSelect");
    childhoodSelect = document.getElementById("childhoodSelect");
    traitsDialog = document.getElementById("traitsDialog");
    openTraitsButton = document.getElementById("openTraitsButton");
    // Pawn->Main->Left
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

    // Genotype
    geneHeaderDiv = document.getElementById("geneHeaderDiv");
    selectedGenesDiv = document.getElementById("selectedGenesDiv");
    genesStatsDiv = document.getElementById("genesStatsDiv");
    complexityElement = document.getElementById("complexityNum");
    metabolismElement = document.getElementById("metabolismNum");
    foodPercentElement = document.getElementById("foodPercentage");
    geneListDiv = document.getElementById("geneListDiv");

    // Other
    pageCoverDiv = document.getElementById("pageCover")
}

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


    loadHTMLElements();


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
    buildTraitsDialog(traits);
    // set value

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

    buildGenesList(genes);
    // set value

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
    openTraitsButton.addEventListener("click", (ev) => {
        console.log(traitsDialog);
        traitsDialog.show();
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
        // verify?
        pawn.save();
        if (token === null) {
            let r = await fetch("http://localhost:8787", {
                method: "POST",
                headers: { "gameID": gameID },
                body: window.localStorage.getItem(`${gameID}:PAWN`)
            });
            if (r.ok) {
                /** @type {ResponseJSON_POST_Game} */
                let rbody = await r.json();
                if (rbody.gameID !== gameID)
                    throw new Error("Recieved response with invalid gameID: " + rbody.gameID);
                token = rbody.token;
                localStorage.setItem(`${gameID}:TOKEN`, token)
                alert("Saved!");
            } else {
                /** @type {ResponseJSON_Error} */
                let rbody = await r.json();
                alert("Could not save to server: " + rbody.error);
            }
        } else {
            let r = await fetch("http://localhost:8787", {
                method: "PUT",
                headers: { "gameID": gameID, "token": token },
                body: window.localStorage.getItem(`${gameID}:PAWN`)
            });
            if (r.ok) {
                alert("Saved!");
            } else {
                /** @type {ResponseJSON_Error} */
                let rbody = await r.json();
                alert("Could not save to server: " + rbody.error);
            }
        }
    });

    pageCoverDiv.hidden = true;
});

