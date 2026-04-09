/**
 * @fileoverview AST Tokenizer - flattens Tree-sitter AST into anonymized structural tokens.
 * @module @bugteasers/ast-core/tokenizer
 */

'use strict';

const { SKIPPED_NODE_TYPES, LITERAL_TYPE_MAPPING, MAX_TRAVERSAL_DEPTH } = require('./constants');

const DEFAULT_OPTIONS = {
    includePositionInfo: false,
    skipComments: true,
    normalizeLiterals: true,
    maxDepth: MAX_TRAVERSAL_DEPTH,
};

// Normalize node type to anonymized structural representation
function normalizeNodeType(nodeType, options) {
    if (options.skipComments && SKIPPED_NODE_TYPES.has(nodeType)) return null;
    if (options.normalizeLiterals && nodeType in LITERAL_TYPE_MAPPING) {
        return LITERAL_TYPE_MAPPING[nodeType];
    }
    return nodeType;
}

// Recursively walk AST and extract tokens (depth-first, pre-order)
function walkNode(node, tokens, metadata, options, tokenMetadata = null) {
    if (!node) return;
    if (metadata.currentDepth > options.maxDepth) {
        throw new Error(`AST traversal exceeded max depth of ${options.maxDepth}`);
    }

    const normalizedType = normalizeNodeType(node.type, options);
    
    if (normalizedType !== null) {
        tokens.push(normalizedType);
        if (options.includePositionInfo && tokenMetadata) {
            tokenMetadata.push({ type: normalizedType, depth: metadata.currentDepth, position: tokens.length - 1 });
        }
    }

    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) walkNode(child, tokens, { currentDepth: metadata.currentDepth + 1 }, options, tokenMetadata);
    }
}

// Main entry: extract flat array of anonymized structural tokens
function extractTokens(astRootNode, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    if (!astRootNode || typeof astRootNode.type !== 'string') {
        throw new TypeError('extractTokens requires a valid AST root node');
    }

    const tokens = [];
    const tokenMetadata = opts.includePositionInfo ? [] : null;

    try {
        walkNode(astRootNode, tokens, { currentDepth: 0 }, opts, tokenMetadata);
    } catch (error) {
        throw new Error(`[ast-core] Token extraction failed: ${error.message}`);
    }

    return opts.includePositionInfo ? { tokens, metadata: tokenMetadata } : tokens;
}

function extractTokensWithMetadata(astRootNode, options = {}) {
    return extractTokens(astRootNode, { ...options, includePositionInfo: true });
}

function tokensToHashableString(tokens, start = 0, end, delimiter = '|') {
    if (!Array.isArray(tokens) || tokens.length === 0) return '';
    return tokens.slice(start, end).join(delimiter);
}

function generateKGrams(tokens, k = require('./constants').K_GRAM_SIZE) {
    if (!Array.isArray(tokens)) throw new TypeError('generateKGrams requires an array of tokens');
    if (tokens.length < k) return [];
    
    const kGrams = [];
    for (let i = 0; i <= tokens.length - k; i++) {
        kGrams.push(tokens.slice(i, i + k));
    }
    return kGrams;
}

function computeTokenStats(tokens) {
    if (!Array.isArray(tokens)) throw new TypeError('computeTokenStats requires an array of tokens');
    
    const typeFrequency = {};
    for (const token of tokens) {
        typeFrequency[token] = (typeFrequency[token] || 0) + 1;
    }

    return {
        totalTokens: tokens.length,
        uniqueTypes: Object.keys(typeFrequency).length,
        typeFrequency,
    };
}

module.exports = {
    extractTokens,
    extractTokensWithMetadata,
    tokensToHashableString,
    generateKGrams,
    computeTokenStats,
    DEFAULT_OPTIONS,
    normalizeNodeType,
    walkNode,
};
