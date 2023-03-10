// This file contains no code, and is only a bunch of @typedef

/*
+-------------------------------------------------------------------------+
|                                                                         |
|                                 Main types                              |
|                                                                         |
+-------------------------------------------------------------------------+
*/

/*
+-------------------------------------------------------------------------+
|                                                                         |
|                              Data-file types                            |
|                                                                         |
+-------------------------------------------------------------------------+
*/
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
 * @property {string} [label]
 * @property {string} [labelShortAdj]
 * @property {string} [desc]
 * @property {{x: number, y: number}} [iconPath]
 * @property {{R: number, G: number, B: number, A: number}} [iconColor]
 * @property {string} [displayCategory]
 * @property {number} [displayOrder]
 * @property {number} [metabolism]
 * @property {number} [complexity]
 * @property {string[]} [exclusionTags]
 * @property {Object.<string, number>} [skills]
 * @property {string[]} [abilities]
 * @property {Object.<string, number>} [traits]
 * @property {Object.<string, number>} [statOffsets]
 * @property {Object.<string, number>} [statFactors]
 * @property {Object.<string, number>} [damageFactors]
 * @property {string[]} [disabledWork]
 * @property {string} [endogeneCategory]
 * @property {number} [selectionWeight]
 * @property {{R: number, G: number, B: number, A: number}} [skinColor]
 * @property {{R: number, G: number, B: number, A: number}} [skinColorOverride]
 * @property {{R: number, G: number, B: number, A: number}} [hairColor]
 * @property {string} [bodyType]
 * @property {number} [melanin]
 */

/**
 * @typedef {Object} TraitDegree
 * @property {string} label
 * @property {string} desc
 * @property {number} degree
 * @property {Object.<string, number>} [skills]
 * @property {Object.<string, number>} [statOffsets]
 * @property {Object.<string, number>} [statFactors]
 * @property {string[]} [meditationTypes]
 * @property {number} [hungerRateFactor]
 */

/**
 * @typedef {Object} Trait
 * @property {string} name
 * @property {number} commonality
 * @property {string[]} conflictingTraits
 * @property {string[]} exclusionTags
 * @property {string[]} forcedFlames
 * @property {string[]} conflictingFlames
 * @property {string[]} disabledWork
 * @property {string[]} requiredWork
 * @property {Object.<string, TraitDegree>} degrees
 */

/**
 * @typedef {Object} HeadType
 * @property {string} name
 * @property {{x: number, y: number}} [iconPath]
 * @property {string} [gender]
 * @property {string} [randomChosen]
 * @property {number[]} [hairMeshSize]
 * @property {number[]} [beardMeshSize]
 * @property {number[]} [beardOffset]
 * @property {number} [hairMeshSize]
 * @property {number[]} [eyeOffsetEastWest]
 */

/**
 * @typedef {Object} HairBeardType
 * @property {string} name
 * @property {string} label
 * @property {{x: number, y: number}} [iconPath]
 * @property {string} [gender]
 * @property {string} [category]
 * @property {string[]} [styleTags]
 * @property {number} [offsetNarrowEast]
 * @property {number} [offsetNarrowSouth]
 */

/*
+-------------------------------------------------------------------------+
|                                                                         |
|            Response JSON types, based on planning/sample.txt            |
|                                                                         |
+-------------------------------------------------------------------------+
*/
/**
 * Should be used for any non-ok response (should only be 400-499)
 * @typedef {Object} ResponseJSON_Error
 * @property {string} error
 */

// GET Responses
/**
 * Response when requesting the rules for a game
 * Should only be used for an ok (200-299) response
 * @typedef {Object} ResponseJSON_GET_Rules
 * @property {string} gameID
 * @property {Ruleset} rules
 */

/**
 * Response when requesting a saved pawn from a game/token
 * Should only be used for an ok (200-299) response
 * @typedef {Object} ResponseJSON_GET_Pawn
 * @property {string} gameID
 * @property {string} token
 * @property {Pawn} pawn
 */

// POST Responses
/**
 * Reponse when creating a new game
 * Should only be used for an ok (200-299) response, though this should generally always be the case.
 * @typedef {Object} ResponseJSON_POST_Game
 * @property {string} gameID
 */

/**
 * Response when creating a new pawn
 * Should only be used for an ok (200-299) response
 * @typedef {Object} ResponseJSON_POST_Pawn
 * @property {string} gameID
 * @property {string} token
 */

// PUT Responses (note there is currently no rule editing)
// Does not return a body

// DELETE Responses
// Does not return a body