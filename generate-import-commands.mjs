#!/usr/bin/env node

/**
 * Generate Import Commands
 * Creates curl commands to import budgets
 * 
 * Usage: node generate-import-commands.mjs
 */

import { readFileSync } from 'fs';

const POCKETBASE_URL = 'https://pocketbase-production-f733.up.railway.app';

// Read budgets from JSON file
let budgets;
try {
    const data = readFileSync('./budgets_import.json', 'utf8');
    budgets = JSON.parse(data);
} catch (error) {
    console.error('❌ Error reading budgets_import.json:', error.message);
    process.exit(1);
}

console.log('🚀 Budget Import Commands Generator\n');
console.log('━'.repeat(80));
console.log('\n📋 Instructions:');
console.log('1. Login to your app at: https://5173--019ad10a-e46d-7d48-93f2-39a68eac6e8a.us-east-1-01.gitpod.dev');
console.log('2. Open browser DevTools (F12)');
console.log('3. Go to Application/Storage → Local Storage');
console.log('4. Find "pocketbase_auth" and copy the "token" value');
console.log('5. Replace YOUR_TOKEN_HERE in the commands below');
console.log('6. Run each command in your terminal\n');
console.log('━'.repeat(80));
console.log('\n📝 Import Commands:\n');

budgets.forEach((budget, index) => {
    console.log(`# Budget ${index + 1}: ${budget.name}`);
    console.log(`curl -X POST "${POCKETBASE_URL}/api/collections/budgets/records" \\`);
    console.log(`  -H "Authorization: YOUR_TOKEN_HERE" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '${JSON.stringify(budget)}'`);
    console.log('');
});

console.log('━'.repeat(80));
console.log('\n💡 Alternative: Import via PocketBase Admin UI');
console.log(`   Go to: ${POCKETBASE_URL}/_/`);
console.log('   Navigate to: Collections → budgets → New Record');
console.log('   Copy values from BUDGET_IMPORT_GUIDE.md\n');
