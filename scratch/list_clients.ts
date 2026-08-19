import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://dwtsntjkysxlqluouhbr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dHNudGpreXN4bHFsdW91aGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NjU4NTgsImV4cCI6MjEwMDQ0MTg1OH0.SPFdmR18c7CUNTXoUn-1pftYd9GY5hH65nEuZDJlCpg"
);

async function run() {
  console.log("=== LISTING ALL CLIENTS IN DB ===");
  const { data, error } = await sb
    .from("clients")
    .select("id,name,user_id,created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error:", JSON.stringify(error));
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("NO CLIENTS IN DB — trying to insert a test record...");
    const testId = "11111111-1111-4111-a111-111111111111";
    const ins = await sb.from("clients").insert({
      id: testId,
      user_id: "usr_test_diag",
      name: "TEST_DIAG_CLIENT",
      type: "PROPRIETORSHIP",
      status: "ACTIVE",
      phone: "1234567890"
    }).select("id,name");
    console.log("Insert attempt:", JSON.stringify(ins.data), "error:", JSON.stringify(ins.error));

    if (!ins.error) {
      const del = await sb.from("clients").delete().eq("id", testId).select("id");
      console.log("Delete attempt:", JSON.stringify(del.data), "error:", JSON.stringify(del.error));
    }
    process.exit(0);
  }

  console.log(`\nFound ${data.length} clients:`);
  data.forEach((c: any, i: number) => {
    console.log(`  ${i+1}. id=${c.id} | name=${c.name} | user_id=${c.user_id}`);
  });

  // Try deleting the most recent one by its exact UUID
  const target = data[0];
  console.log(`\nDeleting: ${target.name} (id=${target.id})`);
  const del = await sb.from("clients").delete().eq("id", target.id).select("id,name");
  console.log("Delete result:", JSON.stringify(del.data));
  console.log("Delete error:", JSON.stringify(del.error));
  console.log("Delete status:", del.status);

  if (!del.error && del.data?.length === 0) {
    console.log("\n⚠️  RLS is BLOCKING deletes silently — 0 rows affected, no error.");
    console.log("    Need to update Supabase RLS policy to allow deletes.");
  } else if (!del.error && (del.data?.length || 0) > 0) {
    console.log("\n✅ Delete worked — restoring record...");
    await sb.from("clients").insert(target);
  }
}

run().catch(e => { console.error("FATAL:", e); process.exit(1); });
