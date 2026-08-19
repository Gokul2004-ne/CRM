import { supabase } from "../src/lib/supabase";

async function queryInfoSchema() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `
  });
  if (error) {
    console.log("RPC execute_sql error:", error.message);
    // fallback: test columns with sample inserts
  } else {
    console.log("Columns:", data);
  }
}

queryInfoSchema();
