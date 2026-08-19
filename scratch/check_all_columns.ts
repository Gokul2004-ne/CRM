import { supabase } from "../src/lib/supabase";

async function checkColumns() {
  const tables = [
    "clients", "services", "sub_services", "required_docs",
    "assigned_services", "banking_entries", "leads", "drafts",
    "collaborations", "invoices", "one_time_services", "renewals", "user_settings"
  ];

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(1);
    if (error) {
      console.log(`Table: ${t} -> ERROR:`, error.message);
    } else {
      console.log(`Table: ${t} -> Columns:`, data && data.length > 0 ? Object.keys(data[0]) : "(empty table, fetching one insert...)");
    }
  }
}

checkColumns();
