import { removeClientFromSupabase } from "../src/lib/supabaseData";
import { supabase } from "../src/lib/supabase";

async function deleteRemaining() {
  console.log("Deleting gokul and krishna...");
  await removeClientFromSupabase("6d9b36a5-c017-4699-8074-403000000000", "gokul");
  await removeClientFromSupabase("694785ae-c017-4707-8885-603000000000", "krishna");

  const { data } = await supabase.from("clients").select("*").eq("user_id", "usr_gowthammummidi2118_gmail_com");
  console.log("Remaining clients in Supabase for usr_gowthammummidi2118_gmail_com:", data?.length);
  console.log(data);
}

deleteRemaining();
