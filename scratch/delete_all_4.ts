import { removeClientFromSupabase } from "../src/lib/supabaseData";
import { supabase } from "../src/lib/supabase";

async function deleteAll4() {
  console.log("Starting deletion of all 4 clients...");
  const names = ["dhoni", "gokul", "krishna", "Phani"];
  for (const n of names) {
    const { data } = await supabase.from("clients").select("id, name").ilike("name", n);
    if (data && data.length > 0) {
      for (const row of data) {
        console.log(`Deleting ${row.name} (id: ${row.id})...`);
        await removeClientFromSupabase(row.id, row.name);
      }
    }
  }

  // Also delete by user_id
  await supabase.from("clients").delete().eq("user_id", "usr_gowthammummidi2118_gmail_com");

  const { data: remaining } = await supabase.from("clients").select("id, name, phone, user_id").eq("user_id", "usr_gowthammummidi2118_gmail_com");
  console.log("Remaining for usr_gowthammummidi2118_gmail_com:", remaining?.length);
  console.table(remaining);
}

deleteAll4();
