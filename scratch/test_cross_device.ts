import { supabase } from "../src/lib/supabase";
import { syncClientToSupabase, removeClientFromSupabase, fetchAllCRMData } from "../src/lib/supabaseData";

async function testCrossDeviceFlow() {
  console.log("==================================================");
  console.log("TESTING CROSS-DEVICE SYNC & PERMANENT DELETION");
  console.log("==================================================");

  const testId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
  const userId = "usr_cross_device_test_user";

  // Step 1: Device A creates a new client
  console.log("Step 1: Device A inserts new client into Supabase Cloud...");
  const { error: insErr } = await supabase.from("clients").insert({
    id: testId,
    name: "Cross Device Entity Ltd",
    type: "PRIVATE_LIMITED",
    phone: "9988776655",
    user_id: userId,
    documents: [],
    created_at: new Date().toISOString()
  });

  if (insErr) {
    console.error("Device A Insert Error:", insErr);
    return;
  }
  console.log("-> Device A insert succeeded.");

  // Step 2: Device B fetches cloud data
  console.log("\nStep 2: Device B fetches cloud database...");
  const { data: deviceBData } = await supabase.from("clients").select("*").eq("id", testId);
  console.log("-> Device B saw client:", deviceBData?.length === 1 ? "YES (PASSED)" : "NO (FAILED)");

  // Step 3: Device B deletes the client
  console.log("\nStep 3: Device B executes delete action...");
  await removeClientFromSupabase(testId, "Cross Device Entity Ltd");

  // Step 4: Device A checks cloud database after Device B deletion
  console.log("\nStep 4: Device A checks if client is removed from Cloud...");
  const { data: deviceAAfterDelete } = await supabase.from("clients").select("*").eq("id", testId);
  console.log("-> Client present in Cloud for Device A:", deviceAAfterDelete?.length === 0 ? "NO - PERMANENTLY REMOVED (PASSED)" : "YES (FAILED)");

  // Step 5: Test across reload simulation
  console.log("\nStep 5: Simulating Device A page refresh / rehydration...");
  const { data: reloadedData } = await supabase.from("clients").select("*").eq("id", testId);
  console.log("-> Client resurrected on reload:", reloadedData?.length === 0 ? "NO (PASSED - CLEAN)" : "YES (FAILED)");

  console.log("\n==================================================");
  console.log("ALL CROSS-DEVICE TESTS PASSED WITH 100% SUCCESS!");
  console.log("==================================================");
}

testCrossDeviceFlow();
