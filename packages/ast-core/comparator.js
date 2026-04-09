/**
 * @fileoverview Fingerprint comparison utilities for plagiarism detection.
 * Provides fast Jaccard similarity calculations for the worker.
 * 
 * @module @bugteasers/ast-core/comparator
 */

'use strict';

/**
 * Calculate Jaccard Similarity Index between two fingerprint sets.
 * Returns percentage from 0.0 to 100.0.
 * Optimized with Sets for O(min(n,m)) intersection lookup.
 * 
 * @param {(bigint|number|string)[]} hashesA - First fingerprint array
 * @param {(bigint|number|string)[]} hashesB - Second fingerprint array
 * @returns {number} Similarity percentage (0.0 - 100.0)
 */
function calculateSimilarity(hashesA, hashesB) {
    // Handle edge cases
    if (!hashesA?.length && !hashesB?.length) return 100.0;
    if (!hashesA?.length || !hashesB?.length) return 0.0;
    
    // Convert to string Sets for comparison (handles bigint/number/string uniformly)
    const setA = new Set(hashesA.map(String));
    const setB = new Set(hashesB.map(String));
    
    // Iterate smaller set for better performance
    const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
    
    let intersection = 0;
    for (const hash of smaller) {
        if (larger.has(hash)) intersection++;
    }
    
    const union = setA.size + setB.size - intersection;
    
    // Return as percentage (0-100)
    return (intersection / union) * 100;
}

/**
 * Compare two code submissions by their fingerprints.
 * Returns detailed comparison result for the worker.
 * 
 * @param {(bigint|number|string)[]} fingerprintA - First submission fingerprint
 * @param {(bigint|number|string)[]} fingerprintB - Second submission fingerprint
 * @returns {{ similarity: number, intersectionSize: number, unionSize: number, isPotentialPlagiarism: boolean }}
 */
function compareFingerprints(fingerprintA, fingerprintB) {
    const similarity = calculateSimilarity(fingerprintA, fingerprintB);
    
    const setA = new Set(fingerprintA.map(String));
    const setB = new Set(fingerprintB.map(String));
    
    let intersectionSize = 0;
    for (const h of setA) {
        if (setB.has(h)) intersectionSize++;
    }
    
    const unionSize = setA.size + setB.size - intersectionSize;
    
    return {
        similarity,
        intersectionSize,
        unionSize,
        isPotentialPlagiarism: similarity >= 70, // Default threshold
    };
}

/**
 * Batch compare one fingerprint against multiple others.
 * Useful for checking a submission against a database of previous submissions.
 * 
 * @param {(bigint|number|string)[]} target - Target fingerprint
 * @param {Array<{id: string, fingerprint: (bigint|number|string)[]}>} candidates - Candidate fingerprints with IDs
 * @returns {Array<{id: string, similarity: number, isPotentialPlagiarism: boolean}>}
 */
function batchCompare(target, candidates) {
    if (!target?.length) return [];
    
    const targetSet = new Set(target.map(String));
    
    return candidates.map(({ id, fingerprint }) => {
        if (!fingerprint?.length) {
            return { id, similarity: 0, isPotentialPlagiarism: false };
        }
        
        const candidateSet = new Set(fingerprint.map(String));
        
        let intersection = 0;
        for (const h of targetSet) {
            if (candidateSet.has(h)) intersection++;
        }
        
        const union = targetSet.size + candidateSet.size - intersection;
        const similarity = (intersection / union) * 100;
        
        return {
            id,
            similarity,
            isPotentialPlagiarism: similarity >= 70,
        };
    });
}

module.exports = {
    calculateSimilarity,
    compareFingerprints,
    batchCompare,
};
