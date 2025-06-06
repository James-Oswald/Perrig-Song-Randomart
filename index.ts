
// Grammar code =======================================================================================================

type RuleMember = {
    name: string | "a" | "x" | "y";
    // If this is empty, the member is a terminal.
    // otherwise if this is non empty, it is a composite rule treated as a function, the function takes the arguments specified in args_types
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
function perrig_grammar() : Grammar {

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
function tsoding_grammar() : Grammar {
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
        { name: "A", args_types: ["A"], weight: 0.25, glsl_func_name: "A" },
        { name: "add", args_types: ["C", "C"], weight: 0.25, glsl_func_name: "add" },
        { name: "mul", args_types: ["C", "C"], weight: 0.25, glsl_func_name: "mul" },
        { name: "sqrt", args_types: ["C"], weight: 0.25, glsl_func_name: "sqrt_abs" },
    ]);

    addRule(grammar, "E", [
        { name: "E", args_types: ["C", "C", "C"], weight: 1, glsl_func_name: "E" }
    ]);

    return grammar;
}

// Random number gen utility functions ================================================================================

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

// It is important that each string generates the same unique sequence numbers fo we get the same random art each time.
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

function random_int(min: number, max: number, rng: () => number): number {
    return Math.floor(rng() * (max - min + 1)) + min;
}

function random_float(min: number, max: number, rng: () => number): number {
    return rng() * (max - min) + min;
}

// GLSL code ==========================================================================================================

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

float get_x() {
    return gl_FragCoord.x;
}

float get_y() {
    return gl_FragCoord.y;
}

float get_abs_x() {
    return abs(gl_FragCoord.x);
}

float get_abs_y() {
    return abs(gl_FragCoord.y);
}

float get_distance() {
    return length(vec2(gl_FragCoord.x, gl_FragCoord.y));
}

float add(float a, float b) {
    return a + b;
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
    return vec4(c1 / 255.0, c2 / 255.0, c3 / 255.0, 1.0);
}

void main() {
    gl_FragColor = EXPRESSION;
}
`

function createShader(gl : WebGL2RenderingContext , sourceCode : string, type : GLenum) : WebGLShader {
    // Compiles either a shader of type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
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

// Randomart Generation ==================================================================================================

// Given a fragment shader, generate an image bitmap from it, on a fullscreen quad of a given size.
function genImage(frag_shader_code : string, x : number, y : number) : ImageBitmap {
    let canvas : OffscreenCanvas = new OffscreenCanvas(424, 600);
    let gl = canvas.getContext("webgl2");
    if (!gl) {
        throw new Error("WebGL2 context not available.");
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
    let fullscreen_quad = [
        1.0,  1.0, -1.0,  1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0, -1.0, 1.0,  1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fullscreen_quad), gl.STATIC_DRAW);
    let position_attribute = gl.getAttribLocation(shader_program, "position")

    // Draw the shader
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(shader_program);
    gl.bindBuffer(gl.ARRAY_BUFFER, fullscreen_quad_vbo);
    gl.enableVertexAttribArray(position_attribute);
    gl.vertexAttribPointer(position_attribute, 2, gl.FLOAT, false, 0, 0); 
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return canvas.transferToImageBitmap();
}


// Given the grammar G and a depth parameter, generate a GLSL shader. 
function randomart_aux(g: Grammar, i : string, d: number, rng : () => number): string {
    let r = g.rules.get(i)
    let A = g.rules.get("A");
    if (!A) {throw new Error("Rule A not found in grammar.");}
    if (!r) {throw new Error(`Rule ${i} not found in grammar.`);}
    let a = pickWeightedRule(d <= 0 ? A : r , rng);
    if (!a) {throw new Error(`No rule found for ${i} in grammar.`);}
    if (a.args_types.length == 0) {
        return a.name == "a" ? random_float(-1, 1, rng) + "" : a.glsl_func_name + "()";
    } else {
        while (d >= 0 && rng() < 0.5) {d--;}
        let args = a.args_types.map((t) => randomart_aux(g, t, d - 1, rng));
        return a.glsl_func_name + "(" + args.join(", ") + ")";
    }
}

export function randomart(seed: string) : ImageBitmap {
    let g = tsoding_grammar(); // or perrig_grammar() for the Perrig grammar
    let rng = mulberry32(seed);
    let depth = random_int(5, 10, rng); // Random depth between 5 and 10
    let expression = randomart_aux(g, g.expression, depth, rng);
    let glsl_code = frag_shader_template.replace("EXPRESSION", expression);
    let image = genImage(glsl_code, 424, 600);
    return image;
}