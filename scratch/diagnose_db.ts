/**
 * Diagnosis script - finds ALL clients in DB and tests delete by their exact ID
 */
import { createClient } from "@supabase/supabase-js";
import { v5 as uuidv5, v4 as uuidv4 } from "uuid";

const supabase = createClient(
  "https://dwtsntjkysxlqluouhbr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dHNudGpreXN4bHFsdW91aGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NjU4NTgsImV4cCI6MjEwMDQ0MTg1OH0.SPFdmR18c7CUNTXoUn-1pftYd9GY5hH65nEuZDJlCpg"
);

const UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

function ensureUUID(id: string): string {
  if (!id) return uuidv4();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id.toLowerCase();
  return uuidv5(id, UUID_NAMESPACE);
}

async function run() {
  console.log("\n=== SUPABASE DIAGNOSIS ===\n");

  // 1. List all clients to see what IDs are in DB
  const { data: allClients, error: listErr } = await supabase
    .from("clients")
    .select("id, name, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (listErr) {
    console.error("❌ Cannot fetch clients:", listErr);
    return;
  }

  console.log(`Found ${allClients?.length || 0} clients in DB:\n`);
  (allClients || []).forEach((c, i) => {
    console.log(`  ${i+1}. ID=${c.id} | user_id=${c.user_id} | name=${c.name}`);
  });

  if (!allClients || allClients.length === 0) {
    console.log("\n⚠️  NO CLIENTS IN DB AT ALL");
    console.log("    This means syncClientToSupabase is either failing silently or not being called.");

    // Insert a test record to see if write works at all
    console.log("\n--- Testing manual insert ---");
    const testId = uuidv4();
    const { data: ins, error: insErr } = await supabase.from("clients").insert({
      id: testId,
      user_id: "usr_diag_test",
      name: "DIAG_TEST_CLIENT",
      type: "PROPRIETORSHIP",
      status: "ACTIVE",
      phone: "0000000000"
    }).select("id,name");
    console.log("Insert result:", ins, insErr);

    if (!insErr) {
      // Clean up
      await supabase.from("clients").delete().eq("id", testId);
      console.log("Insert WORKS — problem is in the frontend calling sync functions.");
    }
    return;
  }

  // 2. Try deleting the MOST RECENT client by exact DB ID
  const target = allClients[0];
  console.log(`\nAttempting to DELETE most recent client: ${target.name} (id=${target.id})`);

  const { data: delData, error: delErr } = await supabase
    .from("clients")
    .delete()
    .eq("id", target.id)
    .select("id,name");

  console.log("DELETE result:", delData, delErr);

  if (!delErr && (delData?.length || 0) > 0) {
    console.log("\n✅ DELETE BY EXACT ID WORKS");
    console.log("    Re-inserting it to restore...");
    await supabase.from("clients").insert(target);
  } else if (!delErr && (delData?.length || 0) === 0) {
    console.log("\n⚠️  DELETE returned no error but also deleted NOTHING (RLS blocking it silently)");
  } else {
    console.log("\n❌ DELETE ERRORED:", delErr);
  }

  // 3. Test .or() style used in removeClientFromSupabase
  const dbId = ensureUUID(target.id);
  console.log(`\nTesting .or() delete style (id=${target.id}, dbId=${dbId}):`);
  const { data: orDel, error: orErr } = await supabase
    .from("clients")
    .delete()
    .or(`id.eq.${dbId},id.eq.${target.id}`)
    .select("id");
  console.log(".or() DELETE result:", orDel, orErr);
}

run().catch(console.error);
