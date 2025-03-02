// utils/supabaseConfig.ts
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseKey } from './apiKeyManager';

// Create a single supabase client for interacting with your database
let _supabase: any = null;

async function initializeSupabase() {
  try {
    // Get Supabase URL and Key using our apiKeyManager
    const supabaseUrl = await getSupabaseUrl();
    const supabaseKey = await getSupabaseKey();
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Anon Key are required.');
    }
    
    // Create the client
    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw error;
  }
}

// Initialize the client immediately
initializeSupabase().then(client => {
  _supabase = client;
  console.log('Supabase client initialized successfully');
}).catch(err => {
  console.error("Critical error initializing Supabase:", err);
});

// Export the initialization promise for when you need to await
export const supabasePromise = initializeSupabase();

// Helper function to get initialized client
export async function getSupabaseClient() {
  if (_supabase) return _supabase;
  return await supabasePromise;
}

// DO NOT export _supabase directly as it will be null at export time