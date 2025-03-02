// supabaseConfig.ts
// import { createClient } from '@supabase/supabase-js';
// import Constants from 'expo-constants';

// let supabaseUrl = '';
// let supabaseKey = '';

// try {
//   supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
//   supabaseKey = Constants.expoConfig?.extra?.supabaseKey || '';
// } catch (error) {
//   console.warn('Error loading Supabase config:', error);
// }
// console.log("Supabase URL:", supabaseUrl);
// console.log("Supabase Key:", supabaseKey);
// // Create a single supabase client for interacting with your database
// export const supabase = createClient(supabaseUrl, supabaseKey);
//2
// import { createClient } from "@supabase/supabase-js";
// import Constants from "expo-constants";

// const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
// const supabaseKey = Constants.expoConfig?.extra?.supabaseKey;

// if (!supabaseUrl || !supabaseKey) {
//   console.error("Supabase URL or Key is missing! Check .env and app.config.js");
//   throw new Error("Supabase URL and Anon Key are required.");
// }

// export const supabase = createClient(supabaseUrl, supabaseKey);


// import { createClient } from "@supabase/supabase-js";

// TEMPORARY HARDCODED VALUES - REPLACE THESE WITH YOUR ACTUAL VALUES
// Remove before deploying to production

// const SUPABASE_URL = "https://iyvnaeejiexrmxoificd.supabase.co";
// const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5dm5hZWVqaWV4cm14b2lmaWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3NzU0MTUsImV4cCI6MjA1NjM1MTQxNX0.G_QEutvV0B2nFEiCGjfLP0qQ31Nq4o505gLAe1kNT-Y";

// Skip all the environment checking for now
//export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// supabaseConfig.ts
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseKey } from '../utils/apiKeyManager';

async function initializeSupabase() {
  try {
    // Get Supabase URL and Key using our apiKeyManager
    const supabaseUrl = await getSupabaseUrl();
    const supabaseKey = await getSupabaseKey();
    
    // If we got this far, we have valid values
    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    
    // During development, you might want a fallback, but remove for production
    console.warn('Using fallback Supabase configuration - FOR DEVELOPMENT ONLY');
    const fallbackUrl = "https://iyvnaeejiexrmxoificd.supabase.co";
    const fallbackKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5dm5hZWVqaWV4cm14b2lmaWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3NzU0MTUsImV4cCI6MjA1NjM1MTQxNX0.G_QEutvV0B2nFEiCGjfLP0qQ31Nq4o505gLAe1kNT-Y";
    
    return createClient(fallbackUrl, fallbackKey);
  }
}

// For immediate use (will be null until initialized)
let _supabase: any = null;

// Initialize the client
initializeSupabase().then(client => {
  _supabase = client;
}).catch(err => {
  console.error("Critical error initializing Supabase:", err);
});

// Export the initialization promise for when you need to await
export const supabasePromise = initializeSupabase();

// Export the client directly (will be null until initialized)
export const supabase = _supabase;

// Helper function to get initialized client
export async function getSupabaseClient() {
  if (_supabase) return _supabase;
  return await supabasePromise;
}