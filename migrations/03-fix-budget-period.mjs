#!/usr/bin/env node
/**
 * Migration 03: Fix budget period field
 * 
 * This migration:
 * 1. Adds period field if missing (via Admin UI)
 * 2. Sets all existing budgets to 'monthly'
 * 3. Makes field required after backfill
 * 
 * Run: node migrations/03-fix-budget-period.mjs
 */

import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL);

async function migrate() {
  console.log('🔐 Authenticating...');
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );
  console.log('✅ Authenticated\n');

  // Step 1: Check if field exists
  console.log('📋 Checking current schema...');
  const budgets = await pb.collection('budgets').getList(1, 1);
  
  if (budgets.items.length === 0) {
    console.log('⚠️  No budgets found, nothing to migrate');
    return;
  }
  
  const sampleRecord = budgets.items[0];
  
  if (sampleRecord.period === undefined) {
    console.log('ℹ️  period field does not exist');
    console.log('   You need to add it via PocketBase Admin UI:\n');
    console.log('   1. Go to Collections → budgets');
    console.log('   2. Add new field:');
    console.log('      - Name: period');
    console.log('      - Type: Select (single)');
    console.log('      - Values: weekly, monthly, quarterly, annual');
    console.log('      - Required: No (we\'ll make it required after backfill)');
    console.log('\n   Press Ctrl+C to exit, add the field, then run again.\n');
    process.exit(1);
  }

  // Step 2: Backfill period
  console.log('🔄 Setting period to "monthly" for all budgets...');
  const allBudgets = await pb.collection('budgets').getFullList({
    sort: 'created'
  });
  
  console.log(`   Found ${allBudgets.length} budgets to process`);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const budget of allBudgets) {
    // Skip if already has period
    if (budget.period) {
      skipped++;
      console.log(`   ✓ ${budget.name}: already has period "${budget.period}"`);
      continue;
    }
    
    try {
      await pb.collection('budgets').update(budget.id, {
        period: 'monthly'
      });
      updated++;
      console.log(`   ✓ ${budget.name}: set to "monthly"`);
    } catch (error) {
      console.error(`   ❌ Failed to update ${budget.id}:`, error.message);
      errors++;
    }
  }
  
  console.log(`\n✅ Backfill complete:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  
  // Step 3: Verify
  console.log('\n🔍 Verifying...');
  const verification = await pb.collection('budgets').getFullList();
  const missing = verification.filter(b => !b.period);
  
  if (missing.length > 0) {
    console.log(`⚠️  ${missing.length} budgets still missing period:`);
    missing.forEach(b => {
      console.log(`   - ${b.id}: ${b.name}`);
    });
  } else {
    console.log('✅ All budgets have period set');
    console.log('\n📝 Next step:');
    console.log('   Make period required in PocketBase Admin UI');
  }
}

migrate().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
