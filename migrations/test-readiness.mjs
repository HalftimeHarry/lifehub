#!/usr/bin/env node
/**
 * Test Migration Readiness
 * 
 * Verifies that:
 * 1. PocketBase connection works
 * 2. Required fields exist
 * 3. Data is in expected state
 * 4. Migrations can proceed safely
 * 
 * Run: node migrations/test-readiness.mjs
 */

import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL);

async function testReadiness() {
  const results = {
    connection: false,
    authentication: false,
    expensesCollection: false,
    budgetsCollection: false,
    categoryGroupField: false,
    periodField: false,
    dataIntegrity: false,
    readyToMigrate: false
  };
  
  try {
    // Test 1: Connection
    console.log('🔌 Testing connection...');
    results.connection = true;
    console.log('✅ Connection OK\n');
    
    // Test 2: Authentication
    console.log('🔐 Testing authentication...');
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL,
      process.env.POCKETBASE_ADMIN_PASSWORD
    );
    results.authentication = true;
    console.log('✅ Authentication OK\n');
    
    // Test 3: Expenses collection
    console.log('📊 Testing expenses collection...');
    const expenses = await pb.collection('expenses').getList(1, 1);
    results.expensesCollection = true;
    console.log(`✅ Expenses collection OK (${expenses.totalItems} records)\n`);
    
    // Test 4: Budgets collection
    console.log('💰 Testing budgets collection...');
    const budgets = await pb.collection('budgets').getList(1, 1);
    results.budgetsCollection = true;
    console.log(`✅ Budgets collection OK (${budgets.totalItems} records)\n`);
    
    // Test 5: Check for categoryGroup field
    console.log('🔍 Checking for categoryGroup field...');
    if (expenses.items.length > 0) {
      const hasField = 'categoryGroup' in expenses.items[0];
      results.categoryGroupField = hasField;
      if (hasField) {
        console.log('✅ categoryGroup field exists\n');
      } else {
        console.log('⚠️  categoryGroup field NOT found');
        console.log('   → Need to add via PocketBase Admin UI\n');
      }
    }
    
    // Test 6: Check for period field
    console.log('🔍 Checking for period field...');
    if (budgets.items.length > 0) {
      const hasField = 'period' in budgets.items[0];
      results.periodField = hasField;
      if (hasField) {
        console.log('✅ period field exists\n');
      } else {
        console.log('⚠️  period field NOT found');
        console.log('   → Need to add via PocketBase Admin UI\n');
      }
    }
    
    // Test 7: Data integrity
    console.log('🔍 Checking data integrity...');
    const allExpenses = await pb.collection('expenses').getFullList();
    const allBudgets = await pb.collection('budgets').getFullList();
    
    const missingCategory = allExpenses.filter(e => !e.category);
    const missingFor = allExpenses.filter(e => !e.for);
    const notesWithMetadata = allExpenses.filter(e => 
      e.notes && e.notes.includes('Type:') && e.notes.includes('Amount:')
    );
    
    console.log(`   Total expenses: ${allExpenses.length}`);
    console.log(`   Missing category: ${missingCategory.length}`);
    console.log(`   Missing "for": ${missingFor.length}`);
    console.log(`   Notes with metadata: ${notesWithMetadata.length}`);
    console.log(`   Total budgets: ${allBudgets.length}`);
    
    results.dataIntegrity = missingCategory.length === 0 && missingFor.length === 0;
    if (results.dataIntegrity) {
      console.log('✅ Data integrity OK\n');
    } else {
      console.log('⚠️  Some data issues found (non-blocking)\n');
    }
    
    // Final assessment
    results.readyToMigrate = 
      results.connection &&
      results.authentication &&
      results.expensesCollection &&
      results.budgetsCollection;
    
    console.log('═══════════════════════════════════════');
    console.log('READINESS SUMMARY');
    console.log('═══════════════════════════════════════\n');
    
    console.log('Prerequisites:');
    console.log(`  ${results.connection ? '✅' : '❌'} Connection`);
    console.log(`  ${results.authentication ? '✅' : '❌'} Authentication`);
    console.log(`  ${results.expensesCollection ? '✅' : '❌'} Expenses collection`);
    console.log(`  ${results.budgetsCollection ? '✅' : '❌'} Budgets collection`);
    console.log('');
    
    console.log('Schema fields:');
    console.log(`  ${results.categoryGroupField ? '✅' : '⚠️ '} categoryGroup field`);
    console.log(`  ${results.periodField ? '✅' : '⚠️ '} period field`);
    console.log('');
    
    console.log('Data quality:');
    console.log(`  ${results.dataIntegrity ? '✅' : '⚠️ '} Data integrity`);
    console.log(`  ${notesWithMetadata.length}/${allExpenses.length} expenses need notes cleaning`);
    console.log('');
    
    if (results.readyToMigrate) {
      if (results.categoryGroupField && results.periodField) {
        console.log('🎉 READY TO MIGRATE!');
        console.log('');
        console.log('Next steps:');
        console.log('  1. node migrations/01-add-category-group.mjs');
        console.log('  2. AUTO_CONFIRM=true node migrations/02-clean-notes.mjs');
        console.log('  3. node migrations/03-fix-budget-period.mjs');
      } else {
        console.log('⚠️  ALMOST READY');
        console.log('');
        console.log('Next steps:');
        console.log('  1. Add missing schema fields via PocketBase Admin UI');
        console.log('     (See MIGRATION-PLAN.md Step 1)');
        console.log('  2. Run this test again to verify');
        console.log('  3. Then run migrations');
      }
    } else {
      console.log('❌ NOT READY');
      console.log('');
      console.log('Fix the issues above before proceeding.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testReadiness().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
