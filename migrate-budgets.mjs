#!/usr/bin/env node

/**
 * Budget Migration Script
 * Imports budgets from budgets_import.json into PocketBase
 * 
 * Usage: node migrate-budgets.mjs
 */

import { readFileSync } from 'fs';

const POCKETBASE_URL = 'https://pocketbase-production-f733.up.railway.app';
const ADMIN_EMAIL = 'ddinsmore8@gmail.com';
const ADMIN_PASSWORD = 'MADcap(123)';

// Read budgets from JSON file
let budgets;
try {
    const data = readFileSync('./budgets_import.json', 'utf8');
    budgets = JSON.parse(data);
    console.log(`📄 Loaded ${budgets.length} budgets from budgets_import.json\n`);
} catch (error) {
    console.error('❌ Error reading budgets_import.json:', error.message);
    process.exit(1);
}

/**
 * Authenticate with PocketBase
 * Tries multiple authentication methods
 */
async function authenticate() {
    console.log('🔐 Authenticating with PocketBase...');
    
    // Method 1: Try admin authentication
    try {
        const response = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identity: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Authenticated as admin\n');
            return data.token;
        }
    } catch (error) {
        console.log('⚠️  Admin auth failed, trying user auth...');
    }

    // Method 2: Try user authentication
    try {
        const response = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identity: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Authenticated as user\n');
            return data.token;
        }

        const error = await response.text();
        throw new Error(`User auth failed: ${error}`);
    } catch (error) {
        throw new Error(`Authentication failed: ${error.message}`);
    }
}

/**
 * Create a single budget record
 */
async function createBudget(budget, token) {
    const response = await fetch(`${POCKETBASE_URL}/api/collections/budgets/records`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
        },
        body: JSON.stringify(budget),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
    }

    return await response.json();
}

/**
 * Check if a budget with the same name already exists
 */
async function budgetExists(name, token) {
    const response = await fetch(
        `${POCKETBASE_URL}/api/collections/budgets/records?filter=(name='${encodeURIComponent(name)}')`,
        {
            headers: { 'Authorization': token },
        }
    );

    if (response.ok) {
        const data = await response.json();
        return data.items && data.items.length > 0;
    }
    return false;
}

/**
 * Main migration function
 */
async function migrate() {
    console.log('🚀 Starting budget migration...\n');
    console.log('━'.repeat(60));
    
    try {
        // Authenticate
        const token = await authenticate();
        
        // Create budgets
        console.log('📊 Creating budgets...\n');
        
        let created = 0;
        let skipped = 0;
        let failed = 0;

        for (const budget of budgets) {
            try {
                // Check if budget already exists
                const exists = await budgetExists(budget.name, token);
                
                if (exists) {
                    console.log(`⏭️  Skipped: ${budget.name} (already exists)`);
                    skipped++;
                    continue;
                }

                // Create the budget
                const result = await createBudget(budget, token);
                console.log(`✅ Created: ${budget.name} ($${budget.amount}/${budget.period})`);
                created++;
                
            } catch (error) {
                console.error(`❌ Failed: ${budget.name}`);
                console.error(`   Error: ${error.message}`);
                failed++;
            }
        }
        
        // Summary
        console.log('\n' + '━'.repeat(60));
        console.log('\n📈 Migration Summary:');
        console.log(`   ✅ Created: ${created}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log(`   📊 Total: ${budgets.length}`);
        
        if (created > 0) {
            console.log('\n🎉 Migration completed successfully!');
            console.log('\n💡 Next steps:');
            console.log('   1. Verify budgets in PocketBase Admin UI');
            console.log('   2. Update the frontend to display budgets');
            console.log('   3. Link expenses to budgets');
        } else if (skipped === budgets.length) {
            console.log('\n✨ All budgets already exist - nothing to do!');
        } else {
            console.log('\n⚠️  Migration completed with errors');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Check that PocketBase is running');
        console.error('   2. Verify your credentials in the script');
        console.error('   3. Ensure the budgets collection exists');
        console.error('   4. Check network connectivity');
        process.exit(1);
    }
}

// Run migration
migrate();
