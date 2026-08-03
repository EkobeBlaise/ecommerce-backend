import { createClient } from '@supabase/supabase-js';

// Get the variables from the environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY; // Use the public key here

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase URL or Anon Key missing in environment variables.");
}

// Export the client
const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;