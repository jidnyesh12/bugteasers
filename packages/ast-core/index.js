// packages/ast-core/index.js
const Parser = require('web-tree-sitter');
const path = require('path');

let parser = null;

// Initialize the WASM engine (only happens once)
async function initParser() {
    if (parser) return parser; // Return if already loaded
    
    await Parser.init();
    parser = new Parser();
    
    // Load the language grammar from the file we just downloaded
    const wasmPath = path.join(__dirname, 'tree-sitter-javascript.wasm');
    const JavaScript = await Parser.Language.load(wasmPath);
    
    parser.setLanguage(JavaScript);
    return parser;
}

/**
 * Takes a raw string of code and returns the parsed AST.
 */
async function generateAST(codeString) {
    console.log("🌲 [AST-CORE] Parsing code into Tree using WASM...");
    const p = await initParser();
    const tree = p.parse(codeString);
    return tree;
}

module.exports = { generateAST };