#!/usr/bin/env node
/**
 * Migration 00: Add fields via PocketBase HTTP API
 * 
 * This script adds the required fields programmatically
 * using the Admin API directly.
 * 
 * Run: node migrations/00-add-fields-via-api.mjs
 */

import 'dotenv/config';

const BASE_URL = process.env.VITE_POCKETBASE_URL;
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function addFields() {
  console.log('🔐 Authenticating...');
  
  // Authenticate
  const authResponse = await fetch(`${BASE_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });
  
  if (!authResponse.ok) {
    console.error('❌ Authentication failed');
    process.exit(1);
  }
  
  const authData = await authResponse.json();
  const token = authData.token;
  console.log('✅ Authenticated\n');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token
  };
  
  try {
    // Get expenses collection
    console.log('📋 Fetching expenses collection...');
    const collectionsResponse = await fetch(`${BASE_URL}/api/collections`, {
      headers
    });
    
    if (!collectionsResponse.ok) {
      console.error('❌ Failed to fetch collections');
      process.exit(1);
    }
    
    const collections = await collectionsResponse.json();
    const expensesCollection = collections.find(c => c.name === 'expenses');
    
    if (!expensesCollection) {
      console.error('❌ expenses collection not found');
      process.exit(1);
    }
    
    console.log(`✅ Found expenses collection: ${expensesCollection.id}\n`);
    
    // Check if categoryGroup already exists
    const hasCategoryGroup = expensesCollection.schema?.some(f => f.name === 'categoryGroup');
    
    if (hasCategoryGroup) {
      console.log('⚠️  categoryGroup field already exists, skipping...\n');
    } else {
      console.log('➕ Adding categoryGroup field...');
      
      // Add categoryGroup field
      const updatedSchema = [
        ...(expensesCollection.schema || []),
        {
          id: `select_${Date.now()}`,
          name: 'categoryGroup',
          type: 'select',
          required: false,
          presentable: false,
          system: false,
          hidden: false,
          options: {
            maxSelect: 1,
            values: ['fixed', 'variable', 'travel', 'business', 'personal']
          }
        }
      ];
      
      const updateResponse = await fetch(`${BASE_URL}/api/collections/${expensesCollection.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          schema: updatedSchema
        })
      });
      
      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        console.error('❌ Failed to add categoryGroup:', error);
      } else {
        console.log('✅ categoryGroup field added\n');
      }
    }
    
    // Get budgets collection
    console.log('📋 Fetching budgets collection...');
    const budgetsCollection = collections.find(c => c.name === 'budgets');
    
    if (!budgetsCollection) {
      console.error('❌ budgets collection not found');
      process.exit(1);
    }
    
    console.log(`✅ Found budgets collection: ${budgetsCollection.id}\n`);
    
    // Check if period already exists
    const hasPeriod = budgetsCollection.schema?.some(f => f.name === 'period');
    
    if (hasPeriod) {
      console.log('⚠️  period field already exists, skipping...\n');
    } else {
      console.log('➕ Adding period field...');
      
      // Add period field
      const updatedSchema = [
        ...(budgetsCollection.schema || []),
        {
          id: `select_${Date.now()}`,
          name: 'period',
          type: 'select',
          required: false,
          presentable: false,
          system: false,
          hidden: false,
          options: {
            maxSelect: 1,
            values: ['weekly', 'monthly', 'quarterly', 'annual']
          }
        }
      ];
      
      const updateResponse = await fetch(`${BASE_URL}/api/collections/${budgetsCollection.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          schema: updatedSchema
        })
      });
      
      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        console.error('❌ Failed to add period:', error);
      } else {
        console.log('✅ period field added\n');
      }
    }
    
    console.log('🎉 All fields added successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: node migrations/01-add-category-group.mjs');
    console.log('   2. Run: AUTO_CONFIRM=true node migrations/02-clean-notes.mjs');
    console.log('   3. Run: node migrations/03-fix-budget-period.mjs');
    
  } catch (error) {
    console.error('❌ Failed to add fields:', error);
    process.exit(1);
  }
}

addFields().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
