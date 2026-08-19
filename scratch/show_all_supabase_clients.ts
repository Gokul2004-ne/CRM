import { supabase } from "../src/lib/supabase";

async function showAllClients() {
  const { data } = await supabase.from("clients").select("id, name, phone, user_id");
  console.log("ALL CLIENTS IN SUPABASE:");
  console.table(data);
}

showAllClients();
