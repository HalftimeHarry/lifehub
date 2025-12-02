#!/usr/bin/env node

/**
 * Budget Migration Script
 * Authenticates as admin and creates sample budgets in PocketBase
 */

const POCKETBASE_URL = 'https://pocketbase-production-f733.up.railway.app';
const ADMIN_EMAIL = 'ddinsmore8@gmail.com';
const ADMIN_PASSWORD = 'MADcap(123)';

// Sample budgets to create
const budgets = [
    {
        name: "Monthly Housing",
        amount: 2500,
        period: "monthly",
        start_date: "2025-01-01",
        category: "lodging",
        type: "expense",
        account: "bank",
        alert_threshold: 90,
        active: true,
        rollover: false,
        notes: "Includes mortgage, HOA fees, and property-related expenses"
    },
    {
        name: "Monthly Utilities",
        amount: 500,
        period: "monthly",
        start_date: "2025-01-01",
        category: "utilities",
        type: "expense",
        account: "bank",
        alert_threshold: 80,
        active: true,
        rollover: false,
        notes: "Electric, water, internet, phone, and other utilities"
    },
    {
        name: "Monthly Food & Groceries",
        amount: 800,
        period: "monthly",
        start_date: "2025-01-01",
        category: "food",
        type: "expense",
        account: "bank",
        alert_threshold: 85,
        active: true,
        rollover: true,
        notes: "Groceries, dining out, and food delivery"
    },
    {
        name: "Monthly Transportation",
        amount: 600,
        period: "monthly",
        start_date: "2025-01-01",
        category: "transportation",
        type: "expense",
        account: "bank",
        alert_threshold: 80,
        active: true,
        rollover: false,
        notes: "Car payment, gas, insurance, maintenance, and parking"
    },
    {
        name: "Monthly Income Goal",
        amount: 5000,
        period: "monthly",
        start_date: "2025-01-01",
        category: "all",
        type: "income",
        account: "all",
        alert_threshold: 75,
        active: true,
        rollover: false,
        notes: "Total monthly income target from all sources"
    }
];

async function authenticate() {
    console.log('🔐 Authenticating as admin...');
    
    // Try admin auth endpoint
    let response = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            identity: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
        }),
    });

    // If admin endpoint fails, try regular user auth
    if (!response.ok) {
        console.log('⚠️  Admin endpoint not found, trying user auth...');
        response = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-with-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identity: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
            }),
        });
    }

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Authentication failed: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Authenticated successfully');
    return data.token;
}

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
        throw new Error(`Failed to create budget "${budget.name}": ${error}`);
    }

    const data = await response.json();
    return data;
}

async function migrate() {
    try {
        console.log('🚀 Starting budget migration...\n');
        
        // Authenticate
        const token = await authenticate();
        
        // Create budgets
        console.log('\n📊 Creating budgets...');
        let created = 0;
        
        for (const budget of budgets) {
            try {
                const result = await createBudget(budget, token);
                console.log(`✅ Created: ${budget.name} ($${budget.amount})`);
                created++;
            } catch (error) {
                console.error(`❌ Failed: ${budget.name} - ${error.message}`);
            }
        }
        
        console.log(`\n🎉 Migration complete! Created ${created}/${budgets.length} budgets.`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migration
migrate();
