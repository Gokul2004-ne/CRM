import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dwtsntjkysxlqluouhbr.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dHNudGpreXN4bHFsdW91aGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NjU4NTgsImV4cCI6MjEwMDQ0MTg1OH0.SPFdmR18c7CUNTXoUn-1pftYd9GY5hH65nEuZDJlCpg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
