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
 * @returns {string[]}
 */
function parseCommaList(text) {
    let items = text.split(",");
    return items.map((value) => value.trim()).filter((value) => value.length != 0);
}

/**
 * @param {number} num 
 * @returns {string}
 */
function formatNumberSigned(num) {
    return (num < 0 ? "" : "+") + num.toString();
}

/**
 * @param {Object.<string, number>} skills 
 * @returns {string}
 */
function skillsDesc(skills) {
    let out = "";
    for (const skill in skills)
        out += `\n${skill}: ${formatNumberSigned(skills[skill])}`;
    return out
}
/**
 * @param {Object.<string, number>} statOffsets 
 * @returns {string}
 */
function statOffsetDesc(statOffsets) {
    let out = "";
    for (const stat in statOffsets)
        out += `\n${stat}: ${formatNumberSigned(statOffsets[stat])}`;
    return out;
}
/**
 * @param {Object.<string, number>} statFactors 
 * @returns {string}
 */
function statFactorDesc(statFactors) {
    let out = "";
    for (const stat in statFactors)
        out += `\n${stat}: ${statFactors[stat] * 100}%`;
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
/**
 * @param {string[]} meditationTypes 
 * @returns {string}
 */
function meditationTypesDesc(meditationTypes) {
    let out = "\nEnables meditation focus types:";
    for (const value of meditationTypes)
        out += `\n- ${value}`;
    return out;
}


// ====================================

/**
 * @param {Gene} gene 
 * @returns {string}
 */
function buildGeneDescription(gene) {
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

    return desc;
}
/**
 * @param {Backstory} backstory 
 * @returns {string}
 */
function buildBackstoryDescription(backstory) {
    let desc = backstory.desc || "";
    if (backstory.skills !== undefined && backstory.skills.length > 0)
        desc += "\n" + skillsDesc(backstory.skills);
    if (backstory.disabledWork !== undefined && backstory.disabledWork.length > 0)
        desc += "\n" + disabledWorkDesc(backstory.disabledWork);
    return desc;
}
/**
 * @param {Trait} trait
 * @param {TraitDegree} degree
 * @returns {string}
 */
function buildTraitDegreeDescription(trait, degree) {
    let desc = degree.desc || "";
    if (degree.skills !== undefined && degree.skills.length > 0)
        desc += "\n" + skillsDesc(degree.skills);
    if (degree.meditationTypes !== undefined && degree.meditationTypes.length > 0)
        desc += "\n" + meditationTypesDesc(degree.meditationTypes);
    if (trait.disabledWork !== undefined && trait.disabledWork.length > 0)
        desc += "\n" + disabledWorkDesc(trait.disabledWork);
    return desc;
}

// ==================================
/**
 * Builds the inline CSS style string for the gene image, including cropping and (if applicable) colorization
 * @param {Gene} gene 
 * @returns {string}
 */
function buildGeneImageStyle(gene) {
    let imgStyle = `width: 128px; height: 128px; background-image: url(./genes.png); background-clip: border-box; background-position: -${gene.iconPath.x}px -${gene.iconPath.y}px;`;
    /** @type {RGBA | {R: number, G: number, B: number, A: number}} */
    let mixColor = gene.skinColor || gene.skinColorOverride || gene.hairColor;
    if (mixColor) {
        mixColor = RGBA.fromJSON(mixColor);
        imgStyle += `filter: url(#${colorizer(mixColor).id});`;
    }
    return imgStyle;
}