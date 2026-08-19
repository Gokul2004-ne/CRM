import { getUserId, syncClientToSupabase, removeClientFromSupabase, fetchAllCRMData } from "../src/lib/supabaseData";
import { Client } from "../src/lib/types";

async function test() {
  console.log("1. Testing getUserId()...");
  const uid = await getUserId();
  console.log("   getUserId returned:", uid);

  console.log("\n2. Testing syncClientToSupabase...");
  const testClient: Client = {
    id: `c_test_${Date.now()}`,
    name: "Automated Test Client",
    ownerName: "Automated Test Client",
    type: "PROPRIETORSHIP",
    phone: "9876543210",
    mobile: "9876543210",
    email: "autotest@gmail.com",
    pan: "ABCDE1234F",
    gstin: "27ABCDE1234F1Z5",
    city: "Mumbai",
    address: "Maharashtra",
    status: "ACTIVE",
    documentCount: 0,
    documents: [],
    createdAt: new Date().toISOString()
  };

  await syncClientToSupabase(testClient);
  console.log("   syncClientToSupabase completed for ID:", testClient.id);

  console.log("\n3. Testing fetchAllCRMData...");
  const data = await fetchAllCRMData();
  console.log("   fetchAllCRMData returned clients count:", data?.clients?.length);
  const found = data?.clients?.find(c => c.name === "Automated Test Client");
  console.log("   Found newly added client in cloud fetch:", !!found, found?.id);

  console.log("\n4. Testing removeClientFromSupabase...");
  if (found) {
    await removeClientFromSupabase(found.id);
    console.log("   removeClientFromSupabase completed for ID:", found.id);

    console.log("\n5. Verifying deletion with fetchAllCRMData...");
    const afterData = await fetchAllCRMData();
    const stillFound = afterData?.clients?.find(c => c.id === found.id || c.name === "Automated Test Client");
    console.log("   Still found in cloud fetch after delete:", !!stillFound);
    if (!stillFound) {
      console.log("\n🎉 ALL TESTS PASSED: Insert, Fetch, and Delete work seamlessly!");
    } else {
      console.error("\n❌ FAILED: Client was not deleted from cloud!");
    }
  }
}

test().catch(console.error);
