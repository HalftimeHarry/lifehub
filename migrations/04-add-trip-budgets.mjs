#!/usr/bin/env node
/**
 * Migration 04: Add budget field to trips and suggest budgets
 * 
 * This migration:
 * 1. Checks if budget field exists on trips
 * 2. Calculates current spending per trip
 * 3. Suggests budget = current spending + 20% buffer
 * 4. Optionally sets budgets
 * 
 * Run: node migrations/04-add-trip-budgets.mjs
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

  // Step 1: Check if budget field exists
  console.log('📋 Checking for budget field...');
  const trips = await pb.collection('trips').getList(1, 1);
  
  if (trips.items.length === 0) {
    console.log('⚠️  No trips found');
    return;
  }
  
  const hasBudgetField = 'budget' in trips.items[0];
  
  if (!hasBudgetField) {
    console.log('ℹ️  budget field does not exist');
    console.log('   You need to add it via PocketBase Admin UI:\n');
    console.log('   1. Go to Collections → trips');
    console.log('   2. Add new field:');
    console.log('      - Name: budget');
    console.log('      - Type: Number');
    console.log('      - Min: 0');
    console.log('      - Required: No');
    console.log('\n   Press Ctrl+C to exit, add the field, then run again.\n');
    process.exit(1);
  }
  
  console.log('✅ budget field exists\n');

  // Step 2: Get all trips and their expenses
  console.log('🔄 Analyzing trips and expenses...\n');
  const allTrips = await pb.collection('trips').getFullList();
  const allExpenses = await pb.collection('expenses').getFullList({
    filter: 'trip != ""'
  });

  // Group expenses by trip
  const expensesByTrip = {};
  allExpenses.forEach(expense => {
    const tripId = expense.trip;
    if (!expensesByTrip[tripId]) {
      expensesByTrip[tripId] = [];
    }
    expensesByTrip[tripId].push(expense);
  });

  // Analyze each trip
  const suggestions = [];
  
  allTrips.forEach(trip => {
    const tripExpenses = expensesByTrip[trip.id] || [];
    const currentSpending = tripExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expenseCount = tripExpenses.length;
    
    // Suggest budget = current spending + 20% buffer (rounded to nearest $50)
    const suggestedBudget = currentSpending > 0 
      ? Math.ceil((currentSpending * 1.2) / 50) * 50
      : 0;
    
    suggestions.push({
      trip,
      currentSpending,
      expenseCount,
      suggestedBudget,
      hasBudget: trip.budget && trip.budget > 0
    });
  });

  // Display suggestions
  console.log('📊 TRIP BUDGET ANALYSIS:\n');
  
  suggestions.forEach((s, index) => {
    console.log(`${index + 1}. ${s.trip.title}`);
    console.log(`   ${s.trip.origin} → ${s.trip.destination}`);
    console.log(`   Status: ${s.trip.status}`);
    console.log(`   Current spending: $${s.currentSpending} (${s.expenseCount} expenses)`);
    
    if (s.hasBudget) {
      console.log(`   Current budget: $${s.trip.budget}`);
      const remaining = s.trip.budget - s.currentSpending;
      const status = remaining >= 0 ? 'under budget' : 'over budget';
      console.log(`   Status: $${Math.abs(remaining)} ${status}`);
    } else {
      console.log(`   Current budget: (not set)`);
      if (s.suggestedBudget > 0) {
        console.log(`   Suggested budget: $${s.suggestedBudget}`);
      }
    }
    console.log('');
  });

  // Step 3: Offer to set budgets
  console.log('❓ Set suggested budgets for trips without budgets? (y/n)');
  
  if (process.env.AUTO_CONFIRM !== 'true') {
    console.log('   Set AUTO_CONFIRM=true to skip this prompt');
    process.exit(0);
  }
  
  console.log('   AUTO_CONFIRM=true, proceeding...\n');

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const s of suggestions) {
    // Skip if already has budget or no suggested budget
    if (s.hasBudget || s.suggestedBudget === 0) {
      skipped++;
      continue;
    }

    try {
      await pb.collection('trips').update(s.trip.id, {
        budget: s.suggestedBudget
      });
      updated++;
      console.log(`   ✓ ${s.trip.title}: set budget to $${s.suggestedBudget}`);
    } catch (error) {
      console.error(`   ❌ Failed to update ${s.trip.id}:`, error.message);
      errors++;
    }
  }

  console.log(`\n✅ Budget update complete:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);

  // Step 4: Verify
  console.log('\n🔍 Verifying...');
  const verification = await pb.collection('trips').getFullList();
  const withBudget = verification.filter(t => t.budget && t.budget > 0);
  const withoutBudget = verification.filter(t => !t.budget || t.budget === 0);

  console.log(`✅ Trips with budget: ${withBudget.length}/${verification.length}`);
  
  if (withoutBudget.length > 0) {
    console.log(`\n⚠️  Trips without budget: ${withoutBudget.length}`);
    withoutBudget.forEach(t => {
      const expenses = expensesByTrip[t.id] || [];
      console.log(`   - ${t.title} (${expenses.length} expenses)`);
    });
  }

  console.log('\n📝 Next steps:');
  console.log('   1. Review budgets in PocketBase Admin UI');
  console.log('   2. Adjust budgets as needed');
  console.log('   3. Test trip summary API: /api/trips?include=summary');
}

migrate().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
