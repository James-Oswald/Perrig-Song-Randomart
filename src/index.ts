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

// Grammar code ===============================================================

type RuleMember = {
    name: string | "a" | "x" | "y";
    // If this is empty, the member is a terminal.
    // otherwise if this is non empty, it is a composite rule treated as 
    // a function, the function takes
    // the arguments specified in args_types
    // and it expects a GLSL function defined to handle it. 
    args_types: string[];
    weight: number;
    glsl_func_name : string; //Function name in GLSL
}

type Grammar = {
    rules : Map<string, RuleMember[]>
    expression : string; // The root expression type in the rules.
};

// Adds a rule to a grammar, and makes sure it follows
// the rules, weights add to 1, its not already defined
function addRule(grammar : Grammar, name : string, members : RuleMember[]) : void {
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
function perrig_grammar_gen() : Grammar {

    const grammar: Grammar = {
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
function tsoding_grammar_gen() : Grammar {
    const grammar: Grammar = {
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
        { name: "sin", args_types: ["C"], weight: 0.2, glsl_func_name: "csin"}
    ]);

    addRule(grammar, "E", [
        { name: "E", args_types: ["C", "C", "C"], weight: 1, glsl_func_name: "E" }
    ]);

    return grammar;
}

function oswald_grammar_gen() : Grammar {
    const grammar: Grammar = {
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
        { name: "sin", args_types: ["C"], weight: 0.125, glsl_func_name: "csin"},
        { name: "cos", args_types: ["C"], weight: 0.125, glsl_func_name: "ccos"},
        { name: "tan", args_types: ["C"], weight: 0.125, glsl_func_name: "ctan"},
        { name: "refl", args_types: ["C"], weight: 0.125, glsl_func_name: "refl"},
    ]);

    addRule(grammar, "E", [
        { name: "E", args_types: ["C", "C", "C"], weight: 1, glsl_func_name: "E" }
    ]);

    return grammar;
}

const GRAMMARS : Map<string, Grammar> = new Map([
    ["perrig", perrig_grammar_gen()],
    ["tsoding", tsoding_grammar_gen()],
    ["oswald", oswald_grammar_gen()],
]);

// Random number gen utility functions =========================================

function hashStringToU32(str: string): number {
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
function mulberry32(seed : string) : () => number {
    let a = hashStringToU32(seed);
    return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function pickWeightedRule(rules: RuleMember[], rng: () => number): RuleMember {
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

function random_float(min: number, max: number, rng: () => number): number {
    return rng() * (max - min) + min;
}

// GLSL code ===================================================================

let vertex_shader_code : string = `
#version 100

attribute vec3 position;

void main()
{
    gl_Position = vec4(position.x, position.y, 0, 1.0);
}
`;

let frag_shader_template : string = `
#version 100

precision highp float;
uniform vec2 resolution;

#define M_PI 3.1415926535897932384626433832795
#define SCALE 2.0

float get_x() {
    return (gl_FragCoord.x/resolution.x)*2.0*SCALE - SCALE;
}

float get_y() {
    return (gl_FragCoord.y/resolution.y)*2.0*SCALE - SCALE;
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
`

// Compiles either a shader of type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
function createShader(
    gl : WebGLRenderingContext,
    sourceCode : string, 
    type : GLenum
) : WebGLShader {
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
const canvas_cache = new Map<string, OffscreenCanvas>();
const context_cache = new Map<string, WebGL2RenderingContext>();

// Given a fragment shader, generate an image bitmap from it, on a fullscreen 
// quad of a given size.
function draw_image(frag_shader_code : string, x : number, y : number) 
: ImageBitmap  {
    if (x <= 0 || y <= 0) {
        throw new Error("Width and height must be positive integers.");
    }

    // Check if we have a cached offscreen canvas for this size
    const cache_key: string = `${x}x${y}`;
    let canvas : OffscreenCanvas;
    let gl : WebGL2RenderingContext;

    if (canvas_cache.has(cache_key)) {
        canvas = canvas_cache.get(cache_key)!;
        gl = context_cache.get(cache_key)!;
    } else {
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
    if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)){
        const info = gl.getProgramInfoLog(shader_program);
        throw `Could not compile WebGL program. \n\n${info}`;
    }
    const resolution_uniform = gl.getUniformLocation(shader_program, "resolution");
    if (!resolution_uniform) {
        throw new Error("Could not find resolution uniform in shader program.");
    }
    let fullscreen_quad = [
        1.0,  1.0, -1.0,  1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0, -1.0, 1.0,  1.0
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, fullscreen_quad_vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fullscreen_quad), gl.STATIC_DRAW);
    let position_attribute = gl.getAttribLocation(shader_program, "position")

    // Draw the shader
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(shader_program);
    gl.bindBuffer(gl.ARRAY_BUFFER, fullscreen_quad_vbo);
    gl.enableVertexAttribArray(position_attribute);
    gl.vertexAttribPointer(position_attribute, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(resolution_uniform, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return canvas.transferToImageBitmap();
}


// Given the grammar and a depth parameter, generate a GLSL shader. 
function randomart_aux(g: Grammar, i : string, d: number, rng : () => number): string {
    let r = g.rules.get(i)
    let A = g.rules.get("A");
    if (!A) {throw new Error("Rule A not found in grammar.");}
    if (!r) {throw new Error(`Rule ${i} not found in grammar.`);}
    let a = pickWeightedRule(d <= 0 ? A : r , rng);
    if (!a) {throw new Error(`No rule found for ${i} in grammar.`);}
    if (a.args_types.length == 0) {
        return a.name == "a" ? random_float(0, 1, rng) + "" : a.glsl_func_name + "()";
    } else {
        while (d >= 0 && rng() < 0.5) {d--;}
        let args = a.args_types.map((t) => randomart_aux(g, t, d - 1, rng));
        return a.glsl_func_name + "(" + args.join(", ") + ")";
    }
}

/**
 * Generates a randomart image bitmap of given a width, height, depth, and seed.
 * @param x the width of the randomart image in pixels
 * @param y the height of the randomart image in pixels
 * @param depth The "complexity" of the randomart, default to 15. WARNING: this
 * is an exponential parameter, higher values will cause potentially very long
 * generation times, and have a know issue corrupting WebGL on Firefox, requiring
 * a browser restart.
 * @param seed The seed string used to generate the random art,
 * default to "default".
 * @param grammar The grammar to use for generating the randomart, either
 * "perrig" or "tsoding". Default to "perrig".
 * @returns A randomart image bitmap, can be drawn to a canvas.
 */
export function randomart(
    x : number,
    y : number,
    seed: string = "default",
    depth : number = 15,
    grammar_name : "perrig" | "tsoding" | "oswald" = "perrig",
    debug : boolean = false
) : ImageBitmap {
    const g = GRAMMARS.get(grammar_name);
    if (!g) {
        throw new Error(`Grammar ${grammar_name} not found.`);
    }
    const rng = mulberry32(seed);
    let expression = randomart_aux(g, g.expression, depth, rng);
    if (debug) {
        console.info("Randomart expression used for generation:", expression);
    }
    let glsl_code = frag_shader_template.replace("EXPRESSION", expression);
    let image = draw_image(glsl_code, x, y);
    return image;
}