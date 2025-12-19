#!/usr/bin/env node
/**
 * Migration 01: Add categoryGroup field to expenses
 * 
 * This migration:
 * 1. Adds categoryGroup select field (optional)
 * 2. Backfills based on existing category values
 * 3. Makes field required after backfill
 * 
 * Run: node migrations/01-add-category-group.mjs
 */

import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL);

// Category to group mapping
const CATEGORY_GROUP_MAP = {
  // Fixed expenses/income
  'subscription': 'fixed',
  'salary': 'fixed',
  'rental_income': 'fixed',
  'utilities': 'fixed',
  'bank': 'fixed',
  
  // Variable expenses
  'food': 'variable',
  'entertainment': 'variable',
  'retail': 'variable',
  'other': 'variable',
  
  // Travel
  'travel': 'travel',
  'lodging': 'travel',
  
  // Business/Personal (may need manual review)
  'ona': 'business',
  'alexis': 'personal'
};

async function migrate() {
  console.log('🔐 Authenticating...');
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );
  console.log('✅ Authenticated\n');

  // Step 1: Check if field already exists
  console.log('📋 Checking current schema...');
  const expenses = await pb.collection('expenses').getList(1, 1);
  const sampleRecord = expenses.items[0];
  
  if (sampleRecord.categoryGroup !== undefined) {
    console.log('⚠️  categoryGroup field already exists');
    console.log('   Skipping field creation, proceeding to backfill...\n');
  } else {
    console.log('ℹ️  categoryGroup field does not exist');
    console.log('   You need to add it via PocketBase Admin UI:\n');
    console.log('   1. Go to Collections → expenses');
    console.log('   2. Add new field:');
    console.log('      - Name: categoryGroup');
    console.log('      - Type: Select (single)');
    console.log('      - Values: fixed, variable, travel, business, personal');
    console.log('      - Required: No (we\'ll make it required after backfill)');
    console.log('\n   Press Ctrl+C to exit, add the field, then run again.\n');
    
    // Wait for user to add field
    process.exit(1);
  }

  // Step 2: Backfill categoryGroup
  console.log('🔄 Backfilling categoryGroup...');
  const allExpenses = await pb.collection('expenses').getFullList({
    sort: 'created'
  });
  
  console.log(`   Found ${allExpenses.length} expenses to process`);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const expense of allExpenses) {
    // Skip if already has categoryGroup
    if (expense.categoryGroup) {
      skipped++;
      continue;
    }
    
    // Determine categoryGroup from category
    const categoryGroup = CATEGORY_GROUP_MAP[expense.category] || 'variable';
    
    try {
      await pb.collection('expenses').update(expense.id, {
        categoryGroup
      });
      updated++;
      
      if (updated % 10 === 0) {
        console.log(`   Processed ${updated}/${allExpenses.length}...`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to update ${expense.id}:`, error.message);
      errors++;
    }
  }
  
  console.log(`\n✅ Backfill complete:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  
  // Step 3: Verify
  console.log('\n🔍 Verifying...');
  const verification = await pb.collection('expenses').getFullList();
  const missing = verification.filter(e => !e.categoryGroup);
  
  if (missing.length > 0) {
    console.log(`⚠️  ${missing.length} expenses still missing categoryGroup:`);
    missing.forEach(e => {
      console.log(`   - ${e.id}: ${e.title} (category: ${e.category})`);
    });
    console.log('\n   Please review and update manually.');
  } else {
    console.log('✅ All expenses have categoryGroup');
    console.log('\n📝 Next steps:');
    console.log('   1. Review the backfilled values');
    console.log('   2. Make categoryGroup required in PocketBase Admin UI');
    console.log('   3. Run migration 02 to clean notes');
  }
}

migrate().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
