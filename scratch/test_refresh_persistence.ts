import { useAppStore } from "../src/lib/store";
import { supabase } from "../src/lib/supabase";

async function testRefreshPersistence() {
  console.log("==================================================");
  console.log("TESTING REFRESH PERSISTENCE (DELETED ITEMS STAY DELETED)");
  console.log("==================================================");

  const testId = "11111111-2222-3333-4444-555555555555";
  const store = useAppStore.getState();

  // 1. Add Client
  console.log("Step 1: Adding a test client...");
  store.addClient({
    id: testId,
    name: "Refresh Test Entity",
    type: "PROPRIETORSHIP",
    phone: "9988776655",
    email: "refresh@test.com",
    address: "Pune;Maharashtra;411001",
    documents: []
  });

  // Give Supabase a moment to complete sync
  await new Promise(r => setTimeout(r, 1000));

  let { data: inCloud } = await supabase.from("clients").select("*").eq("id", testId);
  console.log("-> Client present in Cloud:", inCloud?.length === 1 ? "YES (PASSED)" : "NO (FAILED)");

  // 2. Delete Client
  console.log("\nStep 2: Deleting client via store.deleteClient...");
  store.deleteClient(testId);

  // Give Supabase a moment to complete deletion
  await new Promise(r => setTimeout(r, 1000));

  let { data: afterDeleteCloud } = await supabase.from("clients").select("*").eq("id", testId);
  console.log("-> Client removed from Cloud:", afterDeleteCloud?.length === 0 ? "YES (PASSED)" : "NO (FAILED)");
  console.log("-> Client removed from Local Store:", !useAppStore.getState().clients.some(c => c.id === testId) ? "YES (PASSED)" : "NO (FAILED)");

  // 3. Simulate Page Refresh by executing loadSupabaseData()
  console.log("\nStep 3: Simulating Page Refresh (loadSupabaseData)...");
  await useAppStore.getState().loadSupabaseData();

  const refreshedStore = useAppStore.getState();
  const existsAfterRefresh = refreshedStore.clients.some(c => c.id === testId || c.name === "Refresh Test Entity");
  let { data: cloudAfterRefresh } = await supabase.from("clients").select("*").eq("id", testId);

  console.log("-> Client exists in Local Store after refresh:", existsAfterRefresh ? "YES (FAILED - RESURRECTED)" : "NO (PASSED - CLEAN)");
  console.log("-> Client exists in Cloud after refresh:", cloudAfterRefresh?.length === 0 ? "NO (PASSED - CLEAN)" : "YES (FAILED - RESURRECTED)");

  if (!existsAfterRefresh && cloudAfterRefresh?.length === 0) {
    console.log("\n==================================================");
    console.log("SUCCESS: DELETED DATA NEVER REAPPEARS ON REFRESH!");
    console.log("==================================================");
  } else {
    console.error("\nFAILURE: DATA REAPPEARED AFTER REFRESH.");
  }
}

testRefreshPersistence();
