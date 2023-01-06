const params = new URLSearchParams(window.location.search)
const SVG_NS = "http://www.w3.org/2000/svg";
const serverURL = "https://rimworldmpbuilder.2kai2kai2.workers.dev";

/** @type {Object.<string,SVGFilterElement>} */
const colorizerFilters = {}; // string is in the format colorizer000000 (hex)
/**
 * @param {RGBA} rgba 
 * @returns {SVGFilterElement}
 */
function colorizer(rgba) {
    let key = `colorizer${rgba.asHex()}`.replace("#", "");
    if (key in colorizerFilters)
        return colorizerFilters[key];
    let filter = document.createElementNS(SVG_NS, "filter");
    filter.id = key;
    colorizerFilters[key] = filter;
    let colorMatrix = document.createElementNS(SVG_NS, "feColorMatrix");
    colorMatrix.setAttribute("type", "matrix");
    colorMatrix.setAttribute("values", `${rgba.R / 255} 0 0 0 0
                                        0 ${rgba.G / 255} 0 0 0
                                        0 0 ${rgba.B / 255} 0 0
                                        0 0 0 1 0`);
    filter.append(colorMatrix);
    filterDefs.append(filter);
    return filter;
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
        Object.assign(this, obj);
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
 * Runs in linear time based on the number of items
 * @template T
 * @param {T[]} list
 * @param {number[]} weights
 * @returns {T}
 */
function pickRandomWeighted(list, weights) {
    if (list.length != weights.length)
        throw new Error("list and weights must be the same length.");
    if (list.length == 0)
        return undefined
    let target = Math.random() * weights.reduce((prev, cur) => prev + cur);
    for (let i = 0; i < list.length; i++) {
        target -= weights[i];
        if (target <= 0)
            return list[i];
    }
    throw new Error("Something went wrong. This shouldn't be able to happen.");
}

/**
 * @template T
 * @param {T[]} a 
 * @param {T[]} b 
 * @returns {bool}
 */
function anyMatch(a, b) {
    return a.some((value) => b.includes(value));
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

    /**
     * @param {{xenotype: string, endogenes: string[], xenogenes: string[]}} obj 
     */
    constructor(obj = {}) {
        Object.assign(this, obj);
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
        Object.assign(this, obj);
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
    bodyType = "Standard";
    headType = "Gaunt";
    hair = "Bald";
    hairColor = new RGBA();
    beard = "NoBeard";
    faceTattoo = "NoTattoo_Face";
    bodyTattoo = "NoTattoo_Body";
    skinColor = new RGBA();
    melanin = 0;
    favoriteColor = new RGBA();

    genotype = new Genotype();
    skills = new Skills()
    /** @type {Object.<string, number>} */
    traits = {};

    constructor(doInit = true) {
        if (!doInit)
            return;
        let skinColorGene = pickRandom(genes.filter((gene) => "skinColor" in gene && "melanin" in gene));
        this.skinColor = RGBA.fromJSON(skinColorGene.skinColor);
        this.melanin = skinColorGene.melanin;

        let allHairColorGenes = genes.filter((gene) => "hairColor" in gene);
        let hairColorGene = pickRandomWeighted(allHairColorGenes, allHairColorGenes.map((gene) => gene.selectionWeight || 1));
        this.hairColor = RGBA.fromJSON(hairColorGene.hairColor);

        this.favoriteColor.R = Math.floor(Math.random() * 255);
        this.favoriteColor.G = Math.floor(Math.random() * 255);
        this.favoriteColor.B = Math.floor(Math.random() * 255);
    }

    /**
     * Saves the pawn JSON to `window.localStorage` as `{gameID}:PAWN`
     */
    save() {
        window.localStorage.setItem(`${gameID}:PAWN`, JSON.stringify(pawn));
    }

    static fromJSON(obj = {}) {
        let p = new Pawn(false);
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
        p.hairColor = RGBA.fromJSON(obj.hairColor);
        p.beard = obj.beard;
        p.faceTattoo = obj.faceTattoo;
        p.bodyTattoo = obj.bodyTattoo;
        p.skinColor = RGBA.fromJSON(obj.skinColor);
        p.melanin = obj.melanin;
        p.favoriteColor = RGBA.fromJSON(obj.favoriteColor);
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
    backstoryList.forEach((backstory) => {
        let element = document.createElement("option");
        element.value = backstory.name;
        element.title = buildBackstoryDescription(backstory);
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

            let div = document.createElement("div");
            let label = document.createElement("label");
            let check = document.createElement("input");
            div.title = buildTraitDegreeDescription(trait, degree);

            check.type = "checkbox";
            check.value = `${trait.name}:${degKey}`;
            check.id = `traitLabel${check.value}`
            label.textContent = degree.label;
            label.htmlFor = check.id;

            check.setAttribute("exclusionTags", trait.exclusionTags.join(","));
            check.setAttribute("conflictingTraits", trait.conflictingTraits.join(","));
            check.setAttribute("conflicts", "0");

            /** Local function; sets all other applicable trait degrees as conflicted */
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
            /** Local function; unsets all other applicable trait degrees conflicts */
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
            // Change event
            check.onchange = (ev) => {
                if (check.checked) {
                    setConflicts();
                    pawn.traits[trait.name] = Number.parseInt(degKey);
                } else {
                    unsetConflicts();
                    delete pawn.traits[trait.name];
                }
            }

            // Check if the pawn has the trait at load time
            if (trait.name in pawn.traits && pawn.traits[trait.name].toString() == degKey) {
                check.checked = true;
                postBuildCallbacks.push(setConflicts);
            }

            scrollBox.append(div);
            div.append(label);
            div.append(check);
        }
    }
    for (const callback of postBuildCallbacks)
        callback();
}

/** 
 * Updates genetic complexity and metabolism 
 */
function updateGeneStats() {
    let stats = pawn.genotype.stats();
    complexityElement.textContent = stats.complexity.toString();
    metabolismElement.textContent = formatNumberSigned(stats.metabolism);
    // Metabolism can go lower, but food percent will never drop below 50% in game
    let foodPercent = Math.max(100 + (stats.metabolism < 0 ? -25 * stats.metabolism : -10 * stats.metabolism), 50);
    foodPercentElement.textContent = foodPercent.toString() + "%";
}


/**
 * @param {Gene} gene 
 * @param {string} id The id that the input HTML element should have
 * @returns {HTMLInputElement}
 */
function buildGeneCheckbox(gene, id) {
    let out = document.createElement("input");
    out.id = id;
    out.hidden = true;
    out.value = gene.name;
    out.type = "checkbox";
    out.setAttribute("conflicts", "0");
    out.setAttribute("exclusionTags", (gene.exclusionTags || []).join(","));
    return out;
}

/**
 * @param {Gene[]} geneList 
 */
function buildGenesList(geneList) {
    // Sort genes into categories
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

    // Selected genes/gene stats sticky graphics
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
    categories.forEach((catEntries, catName) => {
        catEntries.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        // vvv Build category header (label) vvv
        let categoryLabelDiv = document.createElement("div");
        categoryLabelDiv.id = `geneCategoryLabelDiv${catName}`;
        categoryLabelDiv.className = "geneCategoryLabelDiv";
        let categoryLabel = document.createElement("label");
        categoryLabel.id = `geneCategoryLabel${catName}`;
        categoryLabel.className = "geneCategoryLabel";
        categoryLabel.textContent = catName;
        categoryLabelDiv.append(categoryLabel);
        geneListDiv.append(categoryLabelDiv);
        // vvv Build category body (entries) vvv
        let categoryGenesDiv = document.createElement("div");
        categoryGenesDiv.id = `geneCategoryListDiv${catName}`;
        categoryGenesDiv.className = "geneCategoryListDiv";
        for (const gene of catEntries) {
            let desc = buildGeneDescription(gene);
            // vvv Build gene item in category body vvv
            // v Build gene label v
            let geneElement = document.createElement("label");
            geneElement.htmlFor = `geneCheckbox${gene.name}`;
            geneElement.className = "geneListItem";
            let geneImage = document.createElement("img");
            geneImage.style = buildGeneImageStyle(gene);
            geneElement.append(geneImage);
            geneElement.append(gene.label || gene.name);
            geneElement.title = desc;
            // v Build gene checkbox v
            let geneCheckbox = buildGeneCheckbox(gene, geneElement.htmlFor);

            categoryGenesDiv.append(geneElement, geneCheckbox);

            /** Local to a specific gene; disables all conflicting genes from being selected */
            function setConflicts() {
                for (const other of geneListDiv.querySelectorAll("input")) {
                    if (other.id === geneCheckbox.id)
                        continue;
                    if (!hasConflict(gene, other))
                        continue;

                    let prevConflicts = other.getAttribute("conflicts");
                    other.setAttribute("conflicts", addStrInt(prevConflicts, 1));
                    if (!other.disabled) {
                        other.disabled = true;
                        /** @type {HTMLLabelElement} */
                        let otherLabel = geneListDiv.querySelector(`label[for="${other.id}"]`)
                        otherLabel.style = "border-color:red;";
                    }
                }
            }
            /** Local to a specific gene; removes this conflict all conflicting genes */
            function unsetConflicts() {
                for (const other of geneListDiv.querySelectorAll("input")) {
                    if (other.id === geneCheckbox.id)
                        continue;
                    if (!hasConflict(gene, other))
                        continue;

                    let newConflictCount = addStrInt(other.getAttribute("conflicts"), -1);
                    other.setAttribute("conflicts", newConflictCount);
                    if (newConflictCount === "0") {
                        other.disabled = false;
                        /** @type {HTMLLabelElement} */
                        let otherLabel = geneListDiv.querySelector(`label[for="${other.id}"]`)
                        otherLabel.style = undefined;
                    }
                }
            }
            /** Local to a specific gene; Adds a label for the gene to the selectedGenesDiv */
            function addSelected() {
                let selectedGeneElement = document.createElement("label");
                selectedGeneElement.htmlFor = geneElement.htmlFor;
                selectedGeneElement.className = "geneSelectedItem";

                let selectedGeneImage = document.createElement("img");
                selectedGeneImage.style = geneImage.getAttribute("style");
                selectedGeneElement.append(selectedGeneImage);

                selectedGeneElement.append(gene.label || gene.name);
                selectedGeneElement.title = desc;
                selectedGeneElement.style = "background-color: #242526;"
                selectedGenesDiv.append(selectedGeneElement);
            }
            geneCheckbox.onchange = (ev) => {
                if (geneCheckbox.checked) {
                    if ("endogeneCategory" in gene)
                        pawn.genotype.endogenes.push(gene.name);
                    else
                        pawn.genotype.xenogenes.push(gene.name);
                    geneElement.style = "background-color: #242526;";
                    if ("skinColor" in gene) {
                        // Don't change skin color if there's already an override
                        let hasOverride = pawn.genotype.xenogenes.some((value) => "skinColorOverride" in genes.find((g) => g.name == value));
                        if (!hasOverride) {
                            pawn.skinColor = RGBA.fromJSON(gene.skinColor);
                            skinColorPicker.value = pawn.skinColor.asHex();
                        }
                    }
                    if ("skinColorOverride" in gene) {
                        pawn.skinColor = RGBA.fromJSON(gene.skinColorOverride);
                        skinColorPicker.value = pawn.skinColor.asHex();
                        skinColorPicker.disabled = true; // If we have an override gene, no manual override
                    }
                    if ("melanin" in gene) {
                        pawn.melanin = gene.melanin;
                    }
                    if ("hairColor" in gene) {
                        pawn.hairColor = RGBA.fromJSON(gene.hairColor);
                        hairColorPicker.value = pawn.hairColor.asHex();
                    }
                    if ("bodyType" in gene) {
                        pawn.bodyType = gene.bodyType;
                    }

                    addSelected();
                    setConflicts();
                    updateGeneStats();
                } else { // Disabling gene
                    if ("endogeneCategory" in gene) {
                        let index = pawn.genotype.endogenes.indexOf(gene.name);
                        pawn.genotype.endogenes.splice(index, 1);
                    } else {
                        let index = pawn.genotype.xenogenes.indexOf(gene.name);
                        pawn.genotype.xenogenes.splice(index, 1);
                    }
                    geneElement.style = undefined;
                    if ("skinColorOverride" in gene) {
                        hairColorPicker.disabled = false;
                        // If we have a base skin color, set it back to that when disabling override
                        let base = genes.find((value) => "skinColor" in value && pawn.genotype.endogenes.includes(value.name));
                        if (base !== undefined) {
                            pawn.skinColor = RGBA.fromJSON(base.skinColor);
                            skinColorPicker.value = pawn.skinColor.asHex();
                        }
                    }

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
/** @type {SVGDefsElement} */
var filterDefs;
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
var exportPresetButton;

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
var socialInput;
/** @type {HTMLInputElement} */
var intellectualInput;

/** @type {HTMLImageElement} */
var shootingPassion;
/** @type {HTMLImageElement} */
var meleePassion;
/** @type {HTMLImageElement} */
var constructionPassion;
/** @type {HTMLImageElement} */
var miningPassion;
/** @type {HTMLImageElement} */
var cookingPassion;
/** @type {HTMLImageElement} */
var plantsPassion;
/** @type {HTMLImageElement} */
var animalsPassion;
/** @type {HTMLImageElement} */
var craftingPassion;
/** @type {HTMLImageElement} */
var artisticPassion;
/** @type {HTMLImageElement} */
var medicinePassion;
/** @type {HTMLImageElement} */
var socialPassion;
/** @type {HTMLImageElement} */
var intellectualPassion;

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
    exportPresetButton = document.getElementById("exportPresetButton");
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
    socialInput = document.getElementById("socialInput");
    intellectualInput = document.getElementById("intellectualInput");

    shootingPassion = document.getElementById("shootingPassion");
    meleePassion = document.getElementById("meleePassion");
    constructionPassion = document.getElementById("constructionPassion");
    miningPassion = document.getElementById("miningPassion");
    cookingPassion = document.getElementById("cookingPassion");
    plantsPassion = document.getElementById("plantsPassion");
    animalsPassion = document.getElementById("animalsPassion");
    craftingPassion = document.getElementById("craftingPassion");
    artisticPassion = document.getElementById("artisticPassion");
    medicinePassion = document.getElementById("medicinePassion");
    socialPassion = document.getElementById("socialPassion");
    intellectualPassion = document.getElementById("intellectualPassion");

    // Genotype
    geneHeaderDiv = document.getElementById("geneHeaderDiv");
    selectedGenesDiv = document.getElementById("selectedGenesDiv");
    genesStatsDiv = document.getElementById("genesStatsDiv");
    complexityElement = document.getElementById("complexityNum");
    metabolismElement = document.getElementById("metabolismNum");
    foodPercentElement = document.getElementById("foodPercentage");
    geneListDiv = document.getElementById("geneListDiv");

    // Other
    pageCoverDiv = document.getElementById("pageCover");
    filterDefs = document.getElementById("filterDefs");
}

function applyPawnData() {
    firstNameInput.value = pawn.firstName;
    nickNameInput.value = pawn.nickName;
    lastNameInput.value = pawn.lastName;
    if (pawn.gender === "Male")
        maleRadioButton.checked = true;
    else
        femaleRadioButton.checked = true;
    favoriteColorPicker.value = pawn.favoriteColor.asHex();
    skinColorPicker.value = pawn.skinColor.asHex();
    hairColorPicker.value = pawn.hairColor.asHex();
    bioAgeInput.value = Math.floor(pawn.tickAgeBio / 3600000);
    chronAgeInput.value = Math.floor(pawn.tickAgeChron / 3600000);
    buildBackstorySelect(adulthoodSelect, adulthoods);
    buildBackstorySelect(childhoodSelect, childhoods);
    adulthoodSelect.value = pawn.adulthood;
    childhoodSelect.value = pawn.childhood;
    buildTraitsDialog(traits);

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
    socialInput.value = pawn.skills.Social;
    intellectualInput.value = pawn.skills.Intellectual;

    shootingPassion.setAttribute("level", pawn.skills.ShootingFlames);
    meleePassion.setAttribute("level", pawn.skills.MeleeFlames);
    constructionPassion.setAttribute("level", pawn.skills.ConstructionFlames);
    miningPassion.setAttribute("level", pawn.skills.MiningFlames);
    cookingPassion.setAttribute("level", pawn.skills.CookingFlames);
    plantsPassion.setAttribute("level", pawn.skills.PlantsFlames);
    animalsPassion.setAttribute("level", pawn.skills.AnimalsFlames);
    craftingPassion.setAttribute("level", pawn.skills.CraftingFlames);
    artisticPassion.setAttribute("level", pawn.skills.ArtisticFlames);
    medicinePassion.setAttribute("level", pawn.skills.MedicineFlames);
    socialPassion.setAttribute("level", pawn.skills.SocialFlames);
    intellectualPassion.setAttribute("level", pawn.skills.IntellectualFlames);
}

// And the data thingies
/** @type {Ruleset} */
var ruleset;
/** @type {Pawn} */
var pawn;
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

    let r = await fetch(`${serverURL}/game/rules`, { method: "GET", headers: { "gameID": gameID } });
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
    applyPawnData();

    buildGenesList(genes);

    // vvv Build Event Handlers vvv
    firstNameInput.addEventListener("input", (ev) => pawn.firstName = ev.target.value);
    nickNameInput.addEventListener("input", (ev) => pawn.nickName = ev.target.value);
    lastNameInput.addEventListener("input", (ev) => pawn.lastName = ev.target.value);

    favoriteColorPicker.addEventListener("input", (ev) => pawn.favoriteColor = RGBA.fromHex(ev.target.value));
    maleRadioButton.addEventListener("change", (ev) => pawn.gender = "Male");
    femaleRadioButton.addEventListener("change", (ev) => pawn.gender = "Female");
    skinColorPicker.addEventListener("input", (ev) => pawn.skinColor = RGBA.fromHex(ev.target.value));
    hairColorPicker.addEventListener("input", (ev) => pawn.hairColor = RGBA.fromHex(ev.target.value));

    bioAgeInput.addEventListener("change", (ev) => {
        pawn.tickAgeBio = Number.parseInt(bioAgeInput.value) * 3600000;
        if (pawn.tickAgeChron < pawn.tickAgeBio) {
            pawn.tickAgeChron = pawn.tickAgeBio;
            chronAgeInput.value = bioAgeInput.value;
        }
    });
    chronAgeInput.addEventListener("change", (ev) => {
        pawn.tickAgeChron = Number.parseInt(chronAgeInput.value) * 3600000;
        if (pawn.tickAgeChron < pawn.tickAgeBio) {
            pawn.tickAgeBio = pawn.tickAgeChron;
            bioAgeInput.value = chronAgeInput.value;
        }
    });
    adulthoodSelect.addEventListener("change", (ev) => pawn.adulthood = adulthoodSelect.value);
    childhoodSelect.addEventListener("change", (ev) => pawn.childhood = childhoodSelect.value);
    openTraitsButton.addEventListener("click", (ev) => traitsDialog.show());

    /**
     * @param {HTMLInputElement} input 
     * @param {string} skill 
     */
    function addSkillChangeListener(input, skill) {
        input.addEventListener("change", (ev) => pawn.skills[skill] = Number.parseInt(input.value));
    }
    addSkillChangeListener(shootingInput, "Shooting");
    addSkillChangeListener(meleeInput, "Melee");
    addSkillChangeListener(constructionInput, "Construction");
    addSkillChangeListener(miningInput, "Mining");
    addSkillChangeListener(cookingInput, "Cooking");
    addSkillChangeListener(plantsInput, "Plants");
    addSkillChangeListener(animalsInput, "Animals");
    addSkillChangeListener(craftingInput, "Crafting");
    addSkillChangeListener(artisticInput, "Artistic");
    addSkillChangeListener(medicineInput, "Medicine");
    addSkillChangeListener(socialInput, "Social");
    addSkillChangeListener(intellectualInput, "Intellectual");
    /**
     * @param {HTMLImageElement} input
     * @param {string} skill
     */
    function addPassionChangeListener(input, skill) {
        input.addEventListener("click", (ev) => {
            pawn.skills[skill + "Flames"] = (pawn.skills[skill + "Flames"] + 1) % 3;
            input.setAttribute("level", pawn.skills[skill + "Flames"]);
        });
    }
    addPassionChangeListener(shootingPassion, "Shooting");
    addPassionChangeListener(meleePassion, "Melee");
    addPassionChangeListener(constructionPassion, "Construction");
    addPassionChangeListener(miningPassion, "Mining");
    addPassionChangeListener(cookingPassion, "Cooking");
    addPassionChangeListener(plantsPassion, "Plants");
    addPassionChangeListener(animalsPassion, "Animals");
    addPassionChangeListener(craftingPassion, "Crafting");
    addPassionChangeListener(artisticPassion, "Artistic");
    addPassionChangeListener(medicinePassion, "Medicine");
    addPassionChangeListener(socialPassion, "Social");
    addPassionChangeListener(intellectualPassion, "Intellectual");

    // vvv Build Submit Button Handler vvv
    /**
     * @returns {Promise<string>} Output message, if successful
     * @throws if not successful
     */
    async function postPawn() {
        return fetch(`${serverURL}/pawn`, {
            method: "POST",
            headers: { "gameID": gameID },
            body: window.localStorage.getItem(`${gameID}:PAWN`)
        }).then(async (r) => {
            if (!r.ok)
                return r.json().then((/** @type {ResponseJSON_Error} */ rbody) => {
                    throw new Error("Could not save to server: " + rbody.error);
                });
            return r.json().then((/** @type {ResponseJSON_POST_Game} */ rbody) => {
                if (rbody.gameID !== gameID)
                    throw new Error("Recieved response with invalid gameID: " + rbody.gameID);
                token = rbody.token;
                localStorage.setItem(`${gameID}:TOKEN`, token)
                return "saved!";
            });
        });
    }
    /**
     * @returns {Promise<string>} Output message, if successful
     * @throws if not successful
     */
    async function putPawn() {
        fetch(`${serverURL}/pawn`, {
            method: "PUT",
            headers: { "gameID": gameID, "token": token },
            body: window.localStorage.getItem(`${gameID}:PAWN`)
        }).then(async (r) => {
            if (!r.ok)
                return r.json().then((/** @type {ResponseJSON_Error} */ rbody) => {
                    throw new Error("Could not save to server: " + rbody.error);
                });
            return "Saved!";
        });
    }
    submitButton.addEventListener("click", async (ev) => {
        // verify?
        pawn.save();
        if (token === null) {
            postPawn()
                .then((message) => alert(message))
                .catch((err) => alert(err.message || "Error!"));
        } else {
            putPawn()
                .then((message) => alert(message))
                .catch((err) => alert(err.message || "Error!"));
        }
    });

    exportPresetButton.onclick = async (ev) => {
        // This is really easy to get around but will stop most unskilled or (if you're looking at this) hopefully undedicated spammers (so please don't, thanks :D )
        let clickTime = Date.now();
        let lastExport = exportPresetButton.getAttribute("lastExport");
        if (lastExport !== undefined && clickTime - Number.parseInt(lastExport) < 30 * 1000) {
            alert("You must wait at least 30s between exports!");
            return;
        }
        exportPresetButton.setAttribute("lastExport", clickTime);

        fetch(`${serverURL}/game/export`, { method: "GET", headers: { "gameID": gameID } })
            .then(async (res) => {
                if (!res.ok) {
                    alert("Error: " + ((await res.json()).error) || "Received bad response; no further information received from server.");
                    return;
                }
                res.blob().then((blob) => {
                    let downloader = document.createElement("a");
                    downloader.href = URL.createObjectURL(blob)
                    downloader.download = "preset.pcp";
                    downloader.dispatchEvent(new MouseEvent("click"));

                    setTimeout(() => {
                        URL.revokeObjectURL(downloader.href);
                        downloader.remove();
                    });
                });
            }).catch((err) => alert("Error: " + (err.message || "something went wrong. That's not very helpful, I suppose.")));
    };

    pageCoverDiv.hidden = true;
});

