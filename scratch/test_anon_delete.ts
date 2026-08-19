import { supabase } from "../src/lib/supabase";
import { syncClientToSupabase, removeClientFromSupabase, fetchAllCRMData, getUserId } from "../src/lib/supabaseData";
import { ensureUUID } from "../src/lib/utils";

async function test() {
  console.log("1. Current getUserId():", await getUserId());
  
  const testId = `test_delete_${Date.now()}`;
  const dbId = ensureUUID(testId);
  const userId = "usr_gokulnekkanti04_gmail_com"; // user from table
  
  console.log("2. Inserting client with user_id:", userId, "id:", dbId);
  const { data: insData, error: insErr } = await supabase.from("clients").insert({
    id: dbId,
    user_id: userId,
    name: "Test Delete Bug Client",
    phone: "9998887776",
    mobile: "9998887776",
    type: "PROPRIETORSHIP",
    documents: [],
    document_count: 0
  }).select();
  
  console.log("Insert result:", insData, "error:", insErr);
  
  console.log("3. Now testing delete using removeClientFromSupabase or direct supabase.from('clients').delete()...");
  const delRes = await supabase.from("clients").delete().or(`id.eq.${dbId},id.eq.${testId}`).eq("user_id", userId).select();
  console.log("Delete query result:", delRes.data, "delete error:", delRes.error);
  
  console.log("4. Checking if row still exists...");
  const { data: checkData } = await supabase.from("clients").select("*").eq("id", dbId);
  console.log("Row in DB after delete:", checkData);
}

test();
