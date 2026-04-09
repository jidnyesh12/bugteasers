/**
 * @fileoverview Winnowing algorithm for code fingerprinting.
 * @module @bugteasers/ast-core/fingerprinter
 */

'use strict';

const crypto = require('crypto');
const { K_GRAM_SIZE, WINDOW_SIZE } = require('./constants');

const PRIME = 31;
const MOD = 2 ** 61 - 1;
const stringHashCache = new Map();

// FNV-1a inspired string hash (fast, good distribution)
function hashString(str) {
    if (stringHashCache.has(str)) return stringHashCache.get(str);
    
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    
    stringHashCache.set(str, hash);
    return hash;
}

// Fast polynomial rolling hash for k-grams
function rollingHash(kGram) {
    let hash = 0n;
    for (let i = 0; i < kGram.length; i++) {
        hash = (hash * BigInt(PRIME) + BigInt(hashString(kGram[i]))) % BigInt(MOD);
    }
    return hash;
}

// SHA-256 based hash (more collision-resistant, slightly slower)
function cryptoHash(kGram) {
    const hash = crypto.createHash('sha256').update(kGram.join('|')).digest();
    return hash.readBigUInt64BE(0);
}

function generateKGrams(tokens, k = K_GRAM_SIZE) {
    if (tokens.length < k) return [];
    const kGrams = new Array(tokens.length - k + 1);
    for (let i = 0; i <= tokens.length - k; i++) {
        kGrams[i] = tokens.slice(i, i + k);
    }
    return kGrams;
}

function hashKGrams(kGrams) {
    const hashes = new Array(kGrams.length);
    for (let i = 0; i < kGrams.length; i++) {
        hashes[i] = rollingHash(kGrams[i]);
    }
    return hashes;
}

// Winnowing: select minimum hash from each sliding window
function winnow(hashes, w = WINDOW_SIZE) {
    if (hashes.length === 0) return new Set();
    if (hashes.length <= w) {
        const minHash = hashes.reduce((min, h) => h < min ? h : min, hashes[0]);
        return new Set([minHash]);
    }
    
    const fingerprints = new Set();
    let minIdx = 0;
    
    for (let i = 0; i <= hashes.length - w; i++) {
        const windowEnd = i + w - 1;
        
        if (minIdx < i) {
            minIdx = i;
            for (let j = i + 1; j <= windowEnd; j++) {
                if (hashes[j] < hashes[minIdx]) minIdx = j;
            }
        } else if (hashes[windowEnd] <= hashes[minIdx]) {
            minIdx = windowEnd;
        }
        
        fingerprints.add(hashes[minIdx]);
    }
    
    return fingerprints;
}

// Main entry: generate fingerprint from token array
function generateFingerprint(tokens, options = {}) {
    if (!Array.isArray(tokens) || tokens.length === 0) return [];
    
    const k = options.k ?? K_GRAM_SIZE;
    const w = options.w ?? WINDOW_SIZE;
    
    if (tokens.length < k) return [];
    
    const kGrams = generateKGrams(tokens, k);
    const hashes = options.useCryptoHash ? kGrams.map(cryptoHash) : hashKGrams(kGrams);
    
    return [...winnow(hashes, w)];
}

// Jaccard similarity (returns 0-1)
function calculateSimilarity(fp1, fp2) {
    if (fp1.length === 0 && fp2.length === 0) return 1;
    if (fp1.length === 0 || fp2.length === 0) return 0;
    
    const set1 = new Set(fp1.map(String));
    const set2 = new Set(fp2.map(String));
    
    let intersection = 0;
    for (const h of set1) {
        if (set2.has(h)) intersection++;
    }
    
    return intersection / (set1.size + set2.size - intersection);
}

// Compare two token arrays directly
function compareTokens(tokens1, tokens2, options = {}) {
    const fp1 = generateFingerprint(tokens1, options);
    const fp2 = generateFingerprint(tokens2, options);
    return { similarity: calculateSimilarity(fp1, fp2), fingerprint1: fp1, fingerprint2: fp2 };
}

function clearCache() {
    stringHashCache.clear();
}

module.exports = {
    generateFingerprint,
    calculateSimilarity,
    compareTokens,
    generateKGrams,
    winnow,
    clearCache,
};
