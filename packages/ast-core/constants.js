/**
 * @fileoverview Constants for the plagiarism detection system.
 * @module @bugteasers/ast-core/constants
 */

'use strict';

const K_GRAM_SIZE = 15;
const WINDOW_SIZE = 40;
const SIMILARITY_THRESHOLD = 0.7;
const MAX_TRAVERSAL_DEPTH = 1000;

const SKIPPED_NODE_TYPES = new Set([
    'comment', 'template_chars', 'escape_sequence', ';', ',',
]);

const LITERAL_TYPE_MAPPING = {
    'string': 'STRING_LITERAL',
    'number': 'NUMBER_LITERAL',
    'string_fragment': 'STRING_LITERAL',
    'integer': 'NUMBER_LITERAL',
    'float': 'NUMBER_LITERAL',
    'true': 'BOOLEAN_LITERAL',
    'false': 'BOOLEAN_LITERAL',
    'null': 'NULL_LITERAL',
    'undefined': 'UNDEFINED_LITERAL',
};

function validateKGramSize(size) {
    if (!Number.isInteger(size) || size < 1) {
        throw new RangeError(`K_GRAM_SIZE must be a positive integer, got: ${size}`);
    }
}

function validateWindowSize(size) {
    if (!Number.isInteger(size) || size < 1) {
        throw new RangeError(`WINDOW_SIZE must be a positive integer, got: ${size}`);
    }
}

module.exports = {
    K_GRAM_SIZE,
    WINDOW_SIZE,
    SIMILARITY_THRESHOLD,
    MAX_TRAVERSAL_DEPTH,
    SKIPPED_NODE_TYPES,
    LITERAL_TYPE_MAPPING,
    validateKGramSize,
    validateWindowSize,
};
