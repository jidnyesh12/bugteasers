/**
 * @fileoverview @bugteasers/ast-core - Core package for AST-based plagiarism detection.
 * 
 * This package provides:
 * - AST parsing via Tree-sitter WASM (JavaScript, Python, Java, C++)
 * - Token extraction and anonymization
 * - Algorithmic constants for Winnowing fingerprinting
 * 
 * @module @bugteasers/ast-core
 * @author BugTeasers Team
 * @version 1.0.0
 */

'use strict';

const Parser = require('web-tree-sitter');
const path = require('path');
const { K_GRAM_SIZE, WINDOW_SIZE } = require('./constants');
const { extractTokens, extractTokensWithMetadata } = require('./tokenizer');
const { generateFingerprint, compareTokens } = require('./fingerprinter');
const { calculateSimilarity, compareFingerprints, batchCompare } = require('./comparator');

/** @type {Parser|null} */
let parser = null;

/** @type {Parser.Language|null} */
let currentLanguage = null;

/**
 * Supported language identifiers.
 * @enum {string}
 */
const SUPPORTED_LANGUAGES = {
    JAVASCRIPT: 'javascript',
    PYTHON: 'python',
    JAVA: 'java',
    CPP: 'cpp',
};

/**
 * Map of language names to their WASM file paths.
 * @type {Object.<string, string>}
 */
const LANGUAGE_WASM_MAP = {
    javascript: 'tree-sitter-javascript.wasm',
    python: 'tree-sitter-python.wasm',
    java: 'tree-sitter-java.wasm',
    cpp: 'tree-sitter-cpp.wasm',
};

/**
 * Initialize the WASM parser engine (only happens once per language).
 * 
 * @param {string} [language='javascript'] - Language to parse (javascript, python, java, cpp)
 * @returns {Promise<Parser>} Initialized parser instance
 * @throws {Error} If language is not supported or WASM fails to load
 */
async function initParser(language = 'javascript') {
    const lang = language.toLowerCase();
    
    if (!LANGUAGE_WASM_MAP[lang]) {
        throw new Error(
            `Unsupported language: ${language}. ` +
            `Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`
        );
    }
    
    // Reuse parser if language hasn't changed
    if (parser && currentLanguage === lang) {
        return parser;
    }
    
    await Parser.init();
    parser = new Parser();
    
    const wasmPath = path.join(__dirname, LANGUAGE_WASM_MAP[lang]);
    const Language = await Parser.Language.load(wasmPath);
    
    parser.setLanguage(Language);
    currentLanguage = lang;
    
    return parser;
}

/**
 * Parses raw code string into a Tree-sitter AST.
 * Returns the full tree object with rootNode property.
 * 
 * @param {string} codeString - Raw source code to parse
 * @param {string} [language='javascript'] - Language of the source code
 * @returns {Promise<{rootNode: Object, toString: function(): string}>} Parsed AST tree
 * @throws {Error} If parsing fails
 */
async function generateAST(codeString, language = 'javascript') {
    if (typeof codeString !== 'string') {
        throw new TypeError('generateAST requires a string of code');
    }
    
    console.log(`🌲 [AST-CORE] Parsing ${language} code into AST using WASM...`);
    const p = await initParser(language);
    const tree = p.parse(codeString);
    return tree;
}

/**
 * Convenience function: Parse code and extract structural tokens in one call.
 * 
 * @param {string} codeString - Raw source code to analyze
 * @param {Object} [options={}]
 * @param {string} [options.language='javascript'] - Source code language
 * @param {import('./tokenizer').ExtractionOptions} [options.tokenOptions] - Token extraction options
 * @returns {Promise<string[]>} Anonymized structural token sequence
 */
async function parseAndExtractTokens(codeString, options = {}) {
    const { language = 'javascript', tokenOptions = {} } = options;
    
    const tree = await generateAST(codeString, language);
    return extractTokens(tree.rootNode, tokenOptions);
}

/**
 * Master pipeline function: Parse → Tokenize → Fingerprint.
 * Primary entry point for the Next.js web app.
 * 
 * @param {string} codeString - Raw source code to analyze
 * @param {string} [language='javascript'] - Language of the source code
 * @param {Object} [options={}] - Fingerprint options (k, w, useCryptoHash)
 * @returns {Promise<bigint[]>} Array of fingerprint integers
 */
async function analyzeCode(codeString, language = 'javascript', options = {}) {
    const tree = await generateAST(codeString, language);
    const tokens = extractTokens(tree.rootNode);
    const fingerprint = generateFingerprint(tokens, options);
    return fingerprint;
}

/**
 * Compare two code strings directly and return similarity percentage.
 * Convenience function for quick comparison without storing fingerprints.
 * 
 * @param {string} codeA - First source code
 * @param {string} codeB - Second source code
 * @param {string} [language='javascript'] - Language of both code strings
 * @returns {Promise<{ similarity: number, fingerprintA: bigint[], fingerprintB: bigint[] }>}
 */
async function compareCode(codeA, codeB, language = 'javascript') {
    const [fpA, fpB] = await Promise.all([
        analyzeCode(codeA, language),
        analyzeCode(codeB, language),
    ]);
    
    return {
        similarity: calculateSimilarity(fpA, fpB),
        fingerprintA: fpA,
        fingerprintB: fpB,
    };
}

module.exports = {
    // ===== PUBLIC API (for external consumers) =====
    
    // Primary entry points
    analyzeCode,                    // Next.js web app: Parse → Tokenize → Fingerprint
    calculateSimilarity,            // Worker: Compare two fingerprint arrays (returns 0-100)
    
    // Convenience functions
    compareCode,                    // Quick comparison of two code strings
    
    // ===== ADVANCED API (for fine-grained control) =====
    
    // Parsing
    generateAST,
    initParser,
    parseAndExtractTokens,
    
    // Token extraction
    extractTokens,
    extractTokensWithMetadata,
    
    // Fingerprinting
    generateFingerprint,
    compareTokens,
    compareFingerprints,
    batchCompare,
    
    // Constants
    K_GRAM_SIZE,
    WINDOW_SIZE,
    
    // Language support
    SUPPORTED_LANGUAGES,
};