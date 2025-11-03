// Quick test script to verify Supabase connection
// Run: node test-supabase-connection.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('SUPABASE_URL:', SUPABASE_URL ? 'Set ✓' : 'Missing ✗');
console.log('SUPABASE_KEY:', SUPABASE_KEY ? 'Set ✓' : 'Missing ✗');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Test connection by checking if reviews table exists
async function testConnection() {
  try {
    // Try to query reviews table
    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing reviews table:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('\nPossible issues:');
      console.error('1. Reviews table does not exist - run api/reviews-schema.sql in Supabase');
      console.error('2. Wrong credentials - check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      console.error('3. RLS (Row Level Security) blocking access - check Supabase policies');
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('✅ Reviews table exists and is accessible');
      
      // Try inserting a test review
      const { data: insertData, error: insertError } = await supabase
        .from('reviews')
        .insert({
          name: 'Test User',
          rating: 5,
          review: 'This is a test review',
          status: 'pending'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Error inserting test review:', insertError);
      } else {
        console.log('✅ Test review inserted successfully!');
        console.log('Review ID:', insertData.id);
        
        // Clean up test review
        await supabase
          .from('reviews')
          .delete()
          .eq('id', insertData.id);
        console.log('✅ Test review deleted');
      }
    }
  } catch (err) {
    console.error('❌ Connection failed:', err);
  }
}

testConnection();

