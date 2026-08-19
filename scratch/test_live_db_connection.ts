import { supabase } from "../src/lib/supabase";

async function run() {
  console.log("\n=== LIVE SUPABASE CONNECTION & WRITE TEST ===\n");

  const ts = Date.now();
  const testId = `00000000-0000-4000-a000-${String(ts).padStart(12, "0")}`;
  const testName = `LiveTest_${ts}`;

  // 1. INSERT
  console.log("1. Testing INSERT...");
  const insertRes = await supabase.from("clients").insert({
    id: testId,
    user_id: "usr_live_test",
    name: testName,
    type: "PROPRIETORSHIP",
    phone: "9999999999",
    status: "ACTIVE"
  }).select();

  console.log("   INSERT data:", JSON.stringify(insertRes.data));
  console.log("   INSERT error:", JSON.stringify(insertRes.error));
  console.log("   INSERT status:", insertRes.status);

  if (insertRes.error) {
    console.error("\n❌ INSERT FAILED — this means all writes are broken.");
    console.error("Error code:", insertRes.error.code);
    console.error("Error message:", insertRes.error.message);
    console.error("Error hint:", insertRes.error.hint);
    process.exit(1);
  }

  // 2. SELECT
  console.log("\n2. Testing SELECT...");
  const selectRes = await supabase.from("clients").select("id,name,user_id").eq("id", testId);
  console.log("   SELECT data:", JSON.stringify(selectRes.data));
  console.log("   SELECT error:", JSON.stringify(selectRes.error));

  // 3. DELETE
  console.log("\n3. Testing DELETE...");
  const deleteRes = await supabase.from("clients").delete().eq("id", testId).select();
  console.log("   DELETE data:", JSON.stringify(deleteRes.data));
  console.log("   DELETE error:", JSON.stringify(deleteRes.error));
  console.log("   DELETE status:", deleteRes.status);

  if (deleteRes.error) {
    console.error("\n❌ DELETE FAILED");
    process.exit(1);
  }

  // 4. Verify gone
  const verifyRes = await supabase.from("clients").select("id").eq("id", testId);
  const gone = (verifyRes.data || []).length === 0;

  if (gone) {
    console.log("\n✅ ALL DB OPERATIONS WORKING: INSERT → SELECT → DELETE — all verified.");
  } else {
    console.error("\n❌ DELETE DID NOT REMOVE THE ROW FROM DB");
  }
}

run().catch(e => {
  console.error("FATAL:", e);
  process.exit(1);
});
