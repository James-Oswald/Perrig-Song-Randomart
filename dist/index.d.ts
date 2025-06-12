/**
 * @author James T. Oswald
 * @license MIT
 * @description Randomart generation library:
 * This library generates a image randomart based on a grammar and a seed string.
 * It uses WebGL to render the generated art to an image bitmap.
 * The grammar is defined in a way that allows for recursive definitions,
 * and the generated art can be customized by changing the seed string and
 * the complexity of the generated art.
 * The grammar is based on the Perrig Song 1999 paper and
 * the TSoding's implementation of Perrig-Song.
 */
/**
 * Generates a randomart image bitmap of given a width, height, depth, and seed.
 * @param x the width of the randomart image in pixels
 * @param y the height of the randomart image in pixels
 * @param seed The seed string used to generate the random art,
 * default to "default".
 * @param grammar_name The grammar to use for generating the randomart, either
 * "perrig", "tsoding", or "oswald". Default to "tsoding".
 * @param depth The "complexity" of the randomart, default to 15. WARNING: this
 * is an exponential parameter, higher values will cause potentially very long
 * generation times, and have a know issue corrupting WebGL on Firefox, requiring
 * a browser restart.
 * @param scale How "zoomed in" the randomart is, default to 2.0.
 * @returns A randomart image bitmap, can be drawn to a canvas.
 */
export declare function randomart(x: number, y: number, seed?: string, grammar_name?: "perrig" | "tsoding" | "oswald", depth?: number, scale?: number, debug?: boolean): ImageBitmap;
