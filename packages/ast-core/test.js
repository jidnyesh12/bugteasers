// packages/ast-core/test.js
const { generateAST } = require('./index.js');

const studentCode = `
function calculateSum(a, b) {
    let result = a + b;
    return result;
}
`;

async function runTest() {
    try {
        const tree = await generateAST(studentCode);
        console.log("✅ Root Node Type:", tree.rootNode.type);
        console.log("✅ Is the tree built successfully?", tree.rootNode !== null);
    } catch (error) {
        console.error("❌ Error parsing:", error);
    }
}

runTest();