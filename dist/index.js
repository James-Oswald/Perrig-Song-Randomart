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
export const grammarNames = ["perrig", "tsoding", "oswald"];
// Adds a rule to a grammar, and makes sure it follows
// the rules, weights add to 1, its not already defined
function addRule(grammar, name, members) {
    if (grammar.rules.has(name)) {
        throw new Error(`Rule ${name} already exists in the grammar.`);
    }
    let totalWeight = 0;
    for (const member of members) {
        totalWeight += member.weight;
    }
    if (totalWeight != 1) {
        throw new Error(`Total weight for rule ${name} must equal 1, but got ${totalWeight}.`);
    }
    grammar.rules.set(name, members);
}
// Generates the example grammar Perrig uses in Perrig Song 1999. 
function perrig_grammar_gen() {
    const grammar = {
        rules: new Map(),
        expression: "E"
    };
    addRule(grammar, "A", [
        { name: "a", args_types: [], weight: 0.34, glsl_func_name: "get_a" },
        { name: "x", args_types: [], weight: 0.33, glsl_func_name: "get_x" },
        { name: "y", args_types: [], weight: 0.33, glsl_func_name: "get_y" }
    ]);
    addRule(grammar, "C", [
        { name: "A", args_types: ["A"], weight: 0.25, glsl_func_name: "A" },
        { name: "add", args_types: ["C", "C"], weight: 0.375, glsl_func_name: "add" },
        { name: "mul", args_types: ["C", "C"], weight: 0.375, glsl_func_name: "mul" },
    ]);
    addRule(grammar, "E", [
        { name: "E", args_types: ["C", "C", "C"], weight: 1, glsl_func_name: "E" }
    ]);
    return grammar;
}
// Time free subset of the TSoding grammar
// https://github.com/tsoding/randomart/blob/main/grammar.bnf
function tsoding_grammar_gen() {
    const grammar = {
        rules: new Map(),
        expression: "E"
    };
    addRule(grammar, "A", [
        { name: "a", args_types: [], weight: 0.20, glsl_func_name: "get_a" },
        { name: "x", args_types: [], weight: 0.16, glsl_func_name: "get_x" },
        { name: "y", args_types: [], weight: 0.16, glsl_func_name: "get_y" },
        { name: "abs_x", args_types: [], weight: 0.16, glsl_func_name: "get_abs_x" },
        { name: "abs_y", args_types: [], weight: 0.16, glsl_func_name: "get_abs_y" },
        { name: "distance", args_types: [], weight: 0.16, glsl_func_name: "get_distance" }
    ]);
    addRule(grammar, "C", [
        { name: "A", args_types: ["A"], weight: 0.2, glsl_func_name: "A" },
        { name: "add", args_types: ["C", "C"], weight: 0.2, glsl_func_name: "add" },
        { name: "mul", args_types: ["C", "C"], weight: 0.2, glsl_func_name: "mul" },
        { name: "sqrt", args_types: ["C"], weight: 0.2, glsl_func_name: "sqrt_abs" },
        { name: "sin", args_types: ["C"], weight: 0.2, glsl_func_name: "csin" }
    ]);
    addRule(grammar, "E", [
        { name: "E", args_types: ["C", "C", "C"], weight: 1, glsl_func_name: "E" }
    ]);
    return grammar;
}
function oswald_grammar_gen() {
    const grammar = {
        rules: new Map(),
        expression: "E"
    };
    addRule(grammar, "A", [
        { name: "a", args_types: [], weight: 0.20, glsl_func_name: "get_a" },
        { name: "x", args_types: [], weight: 0.16, glsl_func_name: "get_x" },
        { name: "y", args_types: [], weight: 0.16, glsl_func_name: "get_y" },
        { name: "abs_x", args_types: [], weight: 0.16, glsl_func_name: "get_abs_x" },
        { name: "abs_y", args_types: [], weight: 0.16, glsl_func_name: "get_abs_y" },
        { name: "distance", args_types: [], weight: 0.16, glsl_func_name: "get_distance" }
    ]);
    addRule(grammar, "C", [
        { name: "A", args_types: ["A"], weight: 0.125, glsl_func_name: "A" },
        { name: "add", args_types: ["C", "C"], weight: 0.125, glsl_func_name: "add" },
        { name: "mul", args_types: ["C", "C"], weight: 0.125, glsl_func_name: "mul" },
        { name: "sqrt", args_types: ["C"], weight: 0.125, glsl_func_name: "sqrt_abs" },
        { name: "sin", args_types: ["C"], weight: 0.125, glsl_func_name: "csin" },
        { name: "cos", args_types: ["C"], weight: 0.125, glsl_func_name: "ccos" },
        { name: "tan", args_types: ["C"], weight: 0.125, glsl_func_name: "ctan" },
        { name: "refl", args_types: ["C"], weight: 0.125, glsl_func_name: "refl" },
    ]);
    addRule(grammar, "E", [
        { name: "E", args_types: ["C", "C", "C"], weight: 1, glsl_func_name: "E" }
    ]);
    return grammar;
}
const GRAMMARS = new Map([
    ["perrig", perrig_grammar_gen()],
    ["tsoding", tsoding_grammar_gen()],
    ["oswald", oswald_grammar_gen()],
]);
// Random number gen utility functions =========================================
function hashStringToU32(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        // (hash << 5) - hash  is equivalent to  hash * 31
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        // Force into 32-bit signed integer
        hash |= 0;
    }
    // Convert signed 32-bit to unsigned 32-bit
    return hash >>> 0;
}
// It is important that each string generates the same unique sequence numbers
// so we get the same random art each time.
// Mulberry32 seedable random number generator
// https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
function mulberry32(seed) {
    let a = hashStringToU32(seed);
    return function () {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
function pickWeightedRule(rules, rng) {
    let totalWeight = 0;
    for (const rule of rules) {
        totalWeight += rule.weight;
    }
    const random = rng() * totalWeight;
    let cumulativeWeight = 0;
    for (const rule of rules) {
        cumulativeWeight += rule.weight;
        if (random < cumulativeWeight) {
            return rule;
        }
    }
    throw new Error("Unreachable");
}
function random_float(min, max, rng) {
    return rng() * (max - min) + min;
}
// GLSL code ===================================================================
const vertex_shader_code = `
#version 100

attribute vec3 position;

void main()
{
    gl_Position = vec4(position.x, position.y, 0, 1.0);
}
`;
const frag_shader_template = `
#version 100

precision highp float;
uniform vec2 resolution;
uniform float scale;

#define M_PI 3.1415926535897932384626433832795

float get_x() {
    return (gl_FragCoord.x/resolution.x)*2.0*scale - scale;
}

float get_y() {
    return (gl_FragCoord.y/resolution.y)*2.0*scale - scale;
}

float get_abs_x() {
    return abs(get_x());
}

float get_abs_y() {
    return abs(get_y());
}

float get_distance() {
    return length(vec2(get_x(), get_y()));
}

float csin(float a) {
    return sin(a * M_PI);
}

float ccos(float a) {
    return cos(a * M_PI);
}

float ctan(float a) {
    return tan(a * M_PI);
}

float refl(float a) {
    return a;
}

float add(float a, float b) {
    return min(a + b, 1.0);
}

float mul(float a, float b) {
    return a * b;
}

float sqrt_abs(float a) {
    return sqrt(abs(a));
}

float A(float a) {
    return a;
}

vec4 E(float c1, float c2, float c3) {
    return vec4(c1, c2, c3, 1.0);
}

void main() {
    gl_FragColor = EXPRESSION;
}
`;
// Compiles either a shader of type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
function createShader(gl, sourceCode, type) {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error("Failed to create shader.");
    }
    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        throw `Could not compile WebGL program. \n\n${info} + ${sourceCode}`;
    }
    return shader;
}
// Randomart Generation ========================================================
// Cache support for offscreen canvases and contexts.
// The overwhelming majority of the time, the size of the randomart
// will be the same, so we can cache the offscreen canvas and context for a
// dimension pair. This prevents annoying WebGL context loss warnings on Firefox
const canvas_cache = new Map();
const context_cache = new Map();
// Given a fragment shader, generate an image bitmap from it, on a fullscreen 
// quad of a given size.
function draw_image(frag_shader_code, x, y, scale) {
    if (x <= 0 || y <= 0) {
        throw new Error("Width and height must be positive integers.");
    }
    // Check if we have a cached offscreen canvas for this size
    const cache_key = `${x}x${y}`;
    let canvas;
    let gl;
    if (canvas_cache.has(cache_key)) {
        canvas = canvas_cache.get(cache_key);
        gl = context_cache.get(cache_key);
    }
    else {
        // Create a new offscreen canvas and cache it
        canvas = new OffscreenCanvas(x, y);
        canvas_cache.set(cache_key, canvas);
        const ctx = canvas.getContext("webgl2");
        if (!ctx) {
            throw new Error("WebGL2 context not available.");
        }
        gl = ctx;
        context_cache.set(cache_key, gl);
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    const shader_program = gl.createProgram();
    if (!shader_program) {
        throw new Error("Failed to create shader program.");
    }
    const fullscreen_quad_vbo = gl.createBuffer();
    const vertex_shader = createShader(gl, vertex_shader_code, gl.VERTEX_SHADER);
    const fragment_shader = createShader(gl, frag_shader_code, gl.FRAGMENT_SHADER);
    gl.attachShader(shader_program, vertex_shader);
    gl.attachShader(shader_program, fragment_shader);
    gl.linkProgram(shader_program);
    if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(shader_program);
        throw `Could not compile WebGL program. \n\n${info}`;
    }
    const resolution_uniform = gl.getUniformLocation(shader_program, "resolution");
    const scale_uniform = gl.getUniformLocation(shader_program, "scale");
    if (!resolution_uniform) {
        throw new Error("Could not find resolution uniform in shader program.");
    }
    const fullscreen_quad = [
        1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0, -1.0, 1.0, 1.0
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, fullscreen_quad_vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fullscreen_quad), gl.STATIC_DRAW);
    const position_attribute = gl.getAttribLocation(shader_program, "position");
    // Draw the shader
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(shader_program);
    gl.bindBuffer(gl.ARRAY_BUFFER, fullscreen_quad_vbo);
    gl.enableVertexAttribArray(position_attribute);
    gl.vertexAttribPointer(position_attribute, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(resolution_uniform, canvas.width, canvas.height);
    gl.uniform1f(scale_uniform, scale);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return canvas.transferToImageBitmap();
}
// Given the grammar and a depth parameter, generate a GLSL shader. 
function randomart_aux(g, i, d, rng) {
    const r = g.rules.get(i);
    const A = g.rules.get("A");
    if (!A) {
        throw new Error("Rule A not found in grammar.");
    }
    if (!r) {
        throw new Error(`Rule ${i} not found in grammar.`);
    }
    const a = pickWeightedRule(d <= 0 ? A : r, rng);
    if (!a) {
        throw new Error(`No rule found for ${i} in grammar.`);
    }
    if (a.args_types.length == 0) {
        return a.name == "a" ? random_float(0, 1, rng) + "" : a.glsl_func_name + "()";
    }
    else {
        while (d >= 0 && rng() < 0.5) {
            d--;
        }
        const args = a.args_types.map((t) => randomart_aux(g, t, d - 1, rng));
        return a.glsl_func_name + "(" + args.join(", ") + ")";
    }
}
function getGrammar(grammar_name) {
    const g = GRAMMARS.get(grammar_name);
    if (!g) {
        throw new Error(`Grammar ${grammar_name} not found.`);
    }
    return g;
}
function normalizeOptions(widthOrOptions, height, seed = "default", grammar = "tsoding", depth = 15, scale = 2.0, debug = false) {
    if (typeof widthOrOptions === "object") {
        return {
            width: widthOrOptions.width,
            height: widthOrOptions.height,
            seed: widthOrOptions.seed ?? "default",
            grammar: widthOrOptions.grammar ?? "tsoding",
            depth: widthOrOptions.depth ?? 15,
            scale: widthOrOptions.scale ?? 2.0,
            debug: widthOrOptions.debug ?? false
        };
    }
    if (height === undefined) {
        throw new Error("Height is required when calling randomart with positional arguments.");
    }
    return {
        width: widthOrOptions,
        height,
        seed,
        grammar,
        depth,
        scale,
        debug
    };
}
function nextTask() {
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}
function normalizeConcurrency(concurrency, itemCount) {
    if (itemCount === 0) {
        return 0;
    }
    if (concurrency === undefined) {
        return itemCount;
    }
    if (!Number.isFinite(concurrency) || concurrency < 1) {
        throw new Error("Concurrency must be a positive number.");
    }
    return Math.min(Math.floor(concurrency), itemCount);
}
/**
 * Generates the GLSL expression used to render randomart. This is useful for
 * debugging, caching, or rendering the expression with your own WebGL pipeline.
 */
export function createRandomartExpression(options = {}) {
    const seed = options.seed ?? "default";
    const grammar = options.grammar ?? "tsoding";
    const depth = options.depth ?? 15;
    const rng = mulberry32(seed);
    const selectedGrammar = getGrammar(grammar);
    const expression = randomart_aux(selectedGrammar, selectedGrammar.expression, depth, rng);
    if (options.debug) {
        console.info("Randomart expression used for generation:", expression);
    }
    return expression;
}
/**
 * Generates a complete fragment shader for a seeded randomart image.
 */
export function createRandomartFragmentShader(options = {}) {
    return frag_shader_template.replace("EXPRESSION", createRandomartExpression(options));
}
export function randomart(widthOrOptions, height, seed = "default", grammar_name = "tsoding", depth = 15, scale = 2.0, debug = false) {
    const options = normalizeOptions(widthOrOptions, height, seed, grammar_name, depth, scale, debug);
    const glsl_code = createRandomartFragmentShader({
        seed: options.seed,
        grammar: options.grammar,
        depth: options.depth,
        debug: options.debug
    });
    return draw_image(glsl_code, options.width, options.height, options.scale);
}
/**
 * Generates randomart image bitmaps for a list of seed strings.
 *
 * The returned list preserves the input seed order. Work is scheduled across
 * separate browser tasks so UI handlers can await a batch without one large
 * synchronous loop monopolizing the event loop.
 */
export async function randomarts(options) {
    const results = new Array(options.seeds.length);
    let nextIndex = 0;
    const workerCount = normalizeConcurrency(options.concurrency, options.seeds.length);
    async function worker() {
        while (nextIndex < options.seeds.length) {
            const index = nextIndex;
            nextIndex++;
            await nextTask();
            results[index] = randomart({
                width: options.width,
                height: options.height,
                seed: options.seeds[index],
                grammar: options.grammar,
                depth: options.depth,
                scale: options.scale,
                debug: options.debug
            });
        }
    }
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return results;
}
//# sourceMappingURL=index.js.map