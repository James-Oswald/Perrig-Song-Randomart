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
export declare const grammarNames: readonly ["perrig", "tsoding", "oswald"];
export type GrammarName = typeof grammarNames[number];
export interface RandomartOptions {
    width: number;
    height: number;
    seed?: string;
    grammar?: GrammarName;
    depth?: number;
    scale?: number;
    debug?: boolean;
}
export interface RandomartShaderOptions {
    seed?: string;
    grammar?: GrammarName;
    depth?: number;
    debug?: boolean;
}
export interface RandomartsOptions {
    width: number;
    height: number;
    seeds: readonly string[];
    grammar?: GrammarName;
    depth?: number;
    scale?: number;
    debug?: boolean;
    concurrency?: number;
}
/**
 * Generates the GLSL expression used to render randomart. This is useful for
 * debugging, caching, or rendering the expression with your own WebGL pipeline.
 */
export declare function createRandomartExpression(options?: RandomartShaderOptions): string;
/**
 * Generates a complete fragment shader for a seeded randomart image.
 */
export declare function createRandomartFragmentShader(options?: RandomartShaderOptions): string;
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
export declare function randomart(options: RandomartOptions): ImageBitmap;
export declare function randomart(x: number, y: number, seed?: string, grammar_name?: GrammarName, depth?: number, scale?: number, debug?: boolean): ImageBitmap;
/**
 * Generates randomart image bitmaps for a list of seed strings.
 *
 * The returned list preserves the input seed order. Work is scheduled across
 * separate browser tasks so UI handlers can await a batch without one large
 * synchronous loop monopolizing the event loop.
 */
export declare function randomarts(options: RandomartsOptions): Promise<ImageBitmap[]>;
//# sourceMappingURL=index.d.ts.map