#!/usr/bin/env node
/**
 * Migration 02: Clean metadata from notes field
 * 
 * This migration:
 * 1. Removes auto-generated metadata from notes
 * 2. Preserves user-entered content after "Additional Notes:"
 * 3. Sets to empty string if no user notes
 * 
 * Run: node migrations/02-clean-notes.mjs
 */

import PocketBase from 'pocketbase';
import 'dotenv/config';

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL);

/**
 * Extract user notes from metadata-filled notes field
 */
function cleanNotes(notes) {
  if (!notes) return '';
  
  // Pattern 1: Look for "Additional Notes:" section
  const additionalNotesMatch = notes.match(/Additional Notes:\s*(.+?)$/s);
  if (additionalNotesMatch) {
    const userNotes = additionalNotesMatch[1].trim();
    // Check if it's just repeated metadata
    if (userNotes.startsWith('Type:') || userNotes.startsWith('Amount:')) {
      return '';
    }
    return userNotes;
  }
  
  // Pattern 2: Check if entire notes is just metadata
  const hasMetadata = notes.includes('Type:') && 
                      notes.includes('Amount:') && 
                      notes.includes('Category:');
  
  if (hasMetadata) {
    // Try to extract anything after the last metadata block
    const lines = notes.split('\n');
    const metadataFields = ['Type:', 'Amount:', 'Category:', 'Service:', 'Date:', 'For:', 'Email:', 'Phone:'];
    
    let lastMetadataIndex = -1;
    lines.forEach((line, index) => {
      if (metadataFields.some(field => line.trim().startsWith(field))) {
        lastMetadataIndex = index;
      }
    });
    
    if (lastMetadataIndex >= 0 && lastMetadataIndex < lines.length - 1) {
      const remainingLines = lines.slice(lastMetadataIndex + 1);
      const userContent = remainingLines.join('\n').trim();
      
      // Verify it's not just more metadata
      if (userContent && !metadataFields.some(field => userContent.startsWith(field))) {
        return userContent;
      }
    }
    
    return ''; // All metadata, no user content
  }
  
  // No metadata detected, keep as-is
  return notes.trim();
}

async function migrate() {
  console.log('🔐 Authenticating...');
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );
  console.log('✅ Authenticated\n');

  console.log('🔄 Cleaning notes field...');
  const allExpenses = await pb.collection('expenses').getFullList({
    sort: 'created'
  });
  
  console.log(`   Found ${allExpenses.length} expenses to process\n`);
  
  let cleaned = 0;
  let unchanged = 0;
  let errors = 0;
  
  // Preview mode first
  console.log('📋 Preview (first 5 records):');
  for (let i = 0; i < Math.min(5, allExpenses.length); i++) {
    const expense = allExpenses[i];
    const originalNotes = expense.notes || '';
    const cleanedNotes = cleanNotes(originalNotes);
    
    console.log(`\n${i + 1}. ${expense.title}`);
    console.log('   Original length:', originalNotes.length);
    console.log('   Cleaned length:', cleanedNotes.length);
    if (cleanedNotes) {
      console.log('   Cleaned content:', cleanedNotes.substring(0, 100) + (cleanedNotes.length > 100 ? '...' : ''));
    } else {
      console.log('   Cleaned content: (empty)');
    }
  }
  
  console.log('\n❓ Proceed with cleaning all records? (y/n)');
  
  // In automated mode, skip confirmation
  if (process.env.AUTO_CONFIRM !== 'true') {
    console.log('   Set AUTO_CONFIRM=true to skip this prompt');
    process.exit(0);
  }
  
  console.log('   AUTO_CONFIRM=true, proceeding...\n');
  
  for (const expense of allExpenses) {
    const originalNotes = expense.notes || '';
    const cleanedNotes = cleanNotes(originalNotes);
    
    // Skip if no change
    if (originalNotes === cleanedNotes) {
      unchanged++;
      continue;
    }
    
    try {
      await pb.collection('expenses').update(expense.id, {
        notes: cleanedNotes
      });
      cleaned++;
      
      if (cleaned % 10 === 0) {
        console.log(`   Processed ${cleaned + unchanged}/${allExpenses.length}...`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to update ${expense.id}:`, error.message);
      errors++;
    }
  }
  
  console.log(`\n✅ Cleaning complete:`);
  console.log(`   Cleaned: ${cleaned}`);
  console.log(`   Unchanged: ${unchanged}`);
  console.log(`   Errors: ${errors}`);
  
  // Verification
  console.log('\n🔍 Verifying...');
  const verification = await pb.collection('expenses').getFullList();
  const stillHasMetadata = verification.filter(e => {
    const notes = e.notes || '';
    return notes.includes('Type:') && notes.includes('Amount:');
  });
  
  if (stillHasMetadata.length > 0) {
    console.log(`⚠️  ${stillHasMetadata.length} expenses still have metadata in notes:`);
    stillHasMetadata.slice(0, 5).forEach(e => {
      console.log(`   - ${e.id}: ${e.title}`);
    });
    if (stillHasMetadata.length > 5) {
      console.log(`   ... and ${stillHasMetadata.length - 5} more`);
    }
  } else {
    console.log('✅ All notes cleaned successfully');
  }
}

migrate().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
