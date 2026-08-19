import { removeClientFromSupabase } from "../src/lib/supabaseData";
import { supabase } from "../src/lib/supabase";

async function testDelete() {
  console.log("Deleting dhoni and Phani directly via removeClientFromSupabase...");
  await removeClientFromSupabase("6be4f524-c017-4699-8177-749000000000", "dhoni");
  await removeClientFromSupabase("670f22e8-c017-4699-8422-847000000000", "Phani");

  const { data } = await supabase.from("clients").select("*").eq("user_id", "usr_gowthammummidi2118_gmail_com");
  console.log("Remaining clients for usr_gowthammummidi2118_gmail_com:", data?.length);
  console.log(data);
}

testDelete();
