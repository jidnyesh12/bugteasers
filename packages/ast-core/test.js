/**
 * @fileoverview Test suite for @bugteasers/ast-core package.
 * Run with: node test.js
 */

'use strict';

const { 
    generateAST, 
    extractTokens, 
    extractTokensWithMetadata,
    parseAndExtractTokens,
    generateFingerprint,
    calculateSimilarity,
    compareTokens,
    analyzeCode,
    compareCode,
    compareFingerprints,
    batchCompare,
    K_GRAM_SIZE, 
    WINDOW_SIZE 
} = require('./index.js');
const { generateKGrams, computeTokenStats, tokensToHashableString } = require('./tokenizer.js');

// Test cases demonstrating anonymization
const studentCode1 = `
function calculateSum(a, b) {
    let result = a + b;
    return result;
}
`;

// Same structure, different names - should produce IDENTICAL token sequences
const studentCode2 = `
function add(x, y) {
    let sum = x + y;
    return sum;
}
`;

// Different structure - should produce DIFFERENT token sequences
const studentCode3 = `
const calculateSum = (a, b) => a + b;
`;

// Helper for test output
function logSection(title) {
    console.log('\n' + '='.repeat(50));
    console.log(`  ${title}`);
    console.log('='.repeat(50));
}

async function testBasicParsing() {
    logSection('Test 1: Basic AST Parsing');
    
    try {
        const tree = await generateAST(studentCode1);
        console.log('✅ Root Node Type:', tree.rootNode.type);
        console.log('✅ Is the tree built successfully?', tree.rootNode !== null);
        console.log('✅ Child count:', tree.rootNode.childCount);
        return true;
    } catch (error) {
        console.error('❌ Error parsing:', error.message);
        return false;
    }
}

async function testTokenExtraction() {
    logSection('Test 2: Token Extraction');
    
    try {
        const tree = await generateAST(studentCode1);
        const tokens = extractTokens(tree.rootNode);
        
        console.log('✅ Extracted', tokens.length, 'tokens');
        console.log('✅ Token sequence:', tokens.join(' → '));
        console.log('\n📊 First 10 tokens:', tokens.slice(0, 10));
        return tokens;
    } catch (error) {
        console.error('❌ Error extracting tokens:', error.message);
        return null;
    }
}

async function testAnonymization() {
    logSection('Test 3: Anonymization (Critical Test)');
    
    try {
        // Extract tokens from both code variants
        const tokens1 = await parseAndExtractTokens(studentCode1);
        const tokens2 = await parseAndExtractTokens(studentCode2); // Same structure, different names
        const tokens3 = await parseAndExtractTokens(studentCode3); // Different structure
        
        console.log('\n📝 Code 1 (original):');
        console.log('   Tokens:', tokens1.length);
        console.log('   Sequence:', tokens1.slice(0, 15).join(' → '));
        
        console.log('\n📝 Code 2 (renamed variables - should match Code 1):');
        console.log('   Tokens:', tokens2.length);
        console.log('   Sequence:', tokens2.slice(0, 15).join(' → '));
        
        console.log('\n📝 Code 3 (arrow function - different structure):');
        console.log('   Tokens:', tokens3.length);
        console.log('   Sequence:', tokens3.slice(0, 15).join(' → '));
        
        // Critical assertion: Code 1 and 2 should have identical tokens
        const codes1and2Match = JSON.stringify(tokens1) === JSON.stringify(tokens2);
        const codes1and3Differ = JSON.stringify(tokens1) !== JSON.stringify(tokens3);
        
        console.log('\n🔍 Anonymization Results:');
        console.log(`   Code 1 vs Code 2 (renamed vars): ${codes1and2Match ? '✅ MATCH' : '❌ DIFFER'}`);
        console.log(`   Code 1 vs Code 3 (diff structure): ${codes1and3Differ ? '✅ DIFFER' : '❌ MATCH (unexpected)'}`);
        
        if (codes1and2Match && codes1and3Differ) {
            console.log('\n🎉 SUCCESS: Anonymization working correctly!');
        } else {
            console.log('\n⚠️  WARNING: Anonymization may have issues');
        }
        
        return codes1and2Match && codes1and3Differ;
    } catch (error) {
        console.error('❌ Error in anonymization test:', error.message);
        return false;
    }
}

async function testMetadataExtraction() {
    logSection('Test 4: Metadata Extraction');
    
    try {
        const tree = await generateAST(studentCode1);
        const result = extractTokensWithMetadata(tree.rootNode);
        
        console.log('✅ Tokens with metadata:', result.tokens.length);
        console.log('📊 Sample metadata (first 5):');
        result.metadata.slice(0, 5).forEach((m, i) => {
            console.log(`   [${i}] ${m.type} (depth: ${m.depth}, pos: ${m.position})`);
        });
        
        return true;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function testKGramGeneration() {
    logSection('Test 5: K-Gram Generation');
    
    try {
        const tokens = await parseAndExtractTokens(studentCode1);
        const kGrams = generateKGrams(tokens, 5); // Use k=5 for demo
        
        console.log(`✅ Generated ${kGrams.length} k-grams (k=5)`);
        console.log('📊 First 3 k-grams:');
        kGrams.slice(0, 3).forEach((gram, i) => {
            console.log(`   [${i}] ${gram.join(' → ')}`);
        });
        
        // Test hashable string
        const hashable = tokensToHashableString(kGrams[0]);
        console.log(`\n🔑 Hashable string: "${hashable}"`);
        
        return true;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

function testConstants() {
    logSection('Test 6: Constants');
    
    console.log('📊 Algorithm Constants:');
    console.log(`   K_GRAM_SIZE: ${K_GRAM_SIZE}`);
    console.log(`   WINDOW_SIZE: ${WINDOW_SIZE}`);
    
    const constants = require('./constants.js');
    console.log('\n📊 Additional Constants:');
    console.log(`   SIMILARITY_THRESHOLD: ${constants.SIMILARITY_THRESHOLD}`);
    console.log(`   MAX_TRAVERSAL_DEPTH: ${constants.MAX_TRAVERSAL_DEPTH}`);
    console.log(`   SKIPPED_NODE_TYPES: ${[...constants.SKIPPED_NODE_TYPES].join(', ')}`);
    
    return true;
}

async function testTokenStats() {
    logSection('Test 7: Token Statistics');
    
    try {
        const tokens = await parseAndExtractTokens(studentCode1);
        const stats = computeTokenStats(tokens);
        
        console.log('📊 Token Statistics:');
        console.log(`   Total tokens: ${stats.totalTokens}`);
        console.log(`   Unique types: ${stats.uniqueTypes}`);
        console.log('\n   Type frequency (top 5):');
        const sorted = Object.entries(stats.typeFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        sorted.forEach(([type, count]) => {
            console.log(`   - ${type}: ${count}`);
        });
        
        return true;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function testFingerprinting() {
    logSection('Test 8: Fingerprinting');
    
    try {
        const tokens1 = await parseAndExtractTokens(studentCode1);
        const tokens2 = await parseAndExtractTokens(studentCode2);
        const tokens3 = await parseAndExtractTokens(studentCode3);
        
        // Use smaller k for demo since our samples are short
        const options = { k: 5, w: 4 };
        
        const fp1 = generateFingerprint(tokens1, options);
        const fp2 = generateFingerprint(tokens2, options);
        const fp3 = generateFingerprint(tokens3, options);
        
        console.log(`✅ Fingerprint 1: ${fp1.length} hashes`);
        console.log(`✅ Fingerprint 2: ${fp2.length} hashes`);
        console.log(`✅ Fingerprint 3: ${fp3.length} hashes`);
        
        // Compare similarities
        const sim12 = calculateSimilarity(fp1, fp2);
        const sim13 = calculateSimilarity(fp1, fp3);
        const sim23 = calculateSimilarity(fp2, fp3);
        
        console.log('\n📊 Similarity Matrix:');
        console.log(`   Code 1 vs Code 2 (renamed): ${sim12.toFixed(1)}%`);
        console.log(`   Code 1 vs Code 3 (diff structure): ${sim13.toFixed(1)}%`);
        console.log(`   Code 2 vs Code 3: ${sim23.toFixed(1)}%`);
        
        // Verify: renamed code should have high similarity
        const fingerprintWorks = sim12 >= 80 && sim13 < sim12;
        console.log(`\n🔍 Fingerprinting: ${fingerprintWorks ? '✅ Working correctly' : '⚠️ Needs review'}`);
        
        return fingerprintWorks;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function testDirectComparison() {
    logSection('Test 9: Direct Token Comparison');
    
    try {
        const tokens1 = await parseAndExtractTokens(studentCode1);
        const tokens2 = await parseAndExtractTokens(studentCode2);
        
        const result = compareTokens(tokens1, tokens2, { k: 5, w: 4 });
        
        console.log('📊 Comparison Result:');
        console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`);
        console.log(`   Fingerprint sizes: ${result.fingerprint1.length}, ${result.fingerprint2.length}`);
        
        return true;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function testPublicAPI() {
    logSection('Test 10: Public API - analyzeCode');
    
    try {
        // Test analyzeCode (main pipeline function)
        const fp1 = await analyzeCode(studentCode1, 'javascript', { k: 5, w: 4 });
        const fp2 = await analyzeCode(studentCode2, 'javascript', { k: 5, w: 4 });
        
        console.log('✅ analyzeCode returns fingerprint integers:');
        console.log(`   Type: ${typeof fp1[0]} (first hash: ${fp1[0]})`);
        console.log(`   Length: ${fp1.length} hashes`);
        
        // Test calculateSimilarity from comparator (returns 0-100)
        const similarity = calculateSimilarity(fp1, fp2);
        console.log(`\n✅ calculateSimilarity (from comparator):`);
        console.log(`   Returns: ${similarity.toFixed(1)}% (0-100 scale)`);
        
        return similarity === 100;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function testComparator() {
    logSection('Test 11: Comparator Module');
    
    try {
        const fp1 = await analyzeCode(studentCode1, 'javascript', { k: 5, w: 4 });
        const fp2 = await analyzeCode(studentCode2, 'javascript', { k: 5, w: 4 });
        const fp3 = await analyzeCode(studentCode3, 'javascript', { k: 5, w: 4 });
        
        // Test compareFingerprints
        const result = compareFingerprints(fp1, fp2);
        console.log('📊 compareFingerprints result:');
        console.log(`   Similarity: ${result.similarity.toFixed(1)}%`);
        console.log(`   Intersection: ${result.intersectionSize}, Union: ${result.unionSize}`);
        console.log(`   Is Potential Plagiarism: ${result.isPotentialPlagiarism}`);
        
        // Test batchCompare
        const batchResult = batchCompare(fp1, [
            { id: 'code2', fingerprint: fp2 },
            { id: 'code3', fingerprint: fp3 },
        ]);
        console.log('\n📊 batchCompare result:');
        batchResult.forEach(r => {
            console.log(`   ${r.id}: ${r.similarity.toFixed(1)}% (plagiarism: ${r.isPotentialPlagiarism})`);
        });
        
        return result.similarity === 100;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function testCompareCode() {
    logSection('Test 12: compareCode Convenience Function');
    
    try {
        const result = await compareCode(studentCode1, studentCode2, 'javascript');
        
        console.log('📊 Direct code comparison:');
        console.log(`   Similarity: ${result.similarity.toFixed(1)}%`);
        console.log(`   Fingerprint A: ${result.fingerprintA.length} hashes`);
        console.log(`   Fingerprint B: ${result.fingerprintB.length} hashes`);
        
        return result.similarity === 100;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('\n🚀 @bugteasers/ast-core Test Suite\n');
    
    const results = [];
    
    results.push(await testBasicParsing());
    results.push((await testTokenExtraction()) !== null);
    results.push(await testAnonymization());
    results.push(await testMetadataExtraction());
    results.push(await testKGramGeneration());
    results.push(testConstants());
    results.push(await testTokenStats());
    results.push(await testFingerprinting());
    results.push(await testDirectComparison());
    results.push(await testPublicAPI());
    results.push(await testComparator());
    results.push(await testCompareCode());
    
    // Summary
    logSection('Test Summary');
    const passed = results.filter(Boolean).length;
    console.log(`\n📈 Results: ${passed}/${results.length} tests passed`);
    
    if (passed === results.length) {
        console.log('\n🎉 All tests passed! Package is ready.\n');
    } else {
        console.log('\n⚠️  Some tests failed. Review output above.\n');
    }
}

runAllTests().catch(console.error);