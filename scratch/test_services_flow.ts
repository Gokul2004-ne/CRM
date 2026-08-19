import { fetchAllCRMData, syncServiceToSupabase, removeServiceFromSupabase, getUserId } from "../src/lib/supabaseData";
import { generateUUID } from "../src/lib/utils";

async function testServicesFlow() {
  console.log("============================================================");
  console.log("🧪 TESTING SERVICES & PACKAGES FLOW (NO AUTO-SEED & PROPER UI SYNC)");
  console.log("============================================================");

  const userId = await getUserId();
  console.log("Current User ID:", userId);

  // 1. Fetch current packages
  const initialData = await fetchAllCRMData();
  console.log(`Initial packages count: ${initialData?.services?.length}`);

  // 2. Add custom package
  const testPkgId = generateUUID();
  const testPkg = {
    id: testPkgId,
    name: "Custom Corporate Tax Advisory",
    price: 45000,
    recurrence: "ANNUAL" as const,
    applicableMonths: ["October", "November"],
  };

  console.log(`\nAdding test package '${testPkg.name}' (${testPkgId})...`);
  await syncServiceToSupabase(testPkg);

  // 3. Fetch again and verify presence
  const afterAdd = await fetchAllCRMData();
  const found = afterAdd?.services?.find((s: any) => s.id === testPkgId);
  console.log(`Found newly added package in Supabase:`, !!found, found?.name, found?.price);

  if (!found) {
    throw new Error("❌ Package was not retrieved from Supabase after insert!");
  }

  // 4. Delete the test package
  console.log(`\nDeleting test package (${testPkgId})...`);
  await removeServiceFromSupabase(testPkgId);

  // 5. Verify deletion
  const afterDelete = await fetchAllCRMData();
  const stillFound = afterDelete?.services?.find((s: any) => s.id === testPkgId);
  console.log(`Package still found after deletion:`, !!stillFound);

  if (stillFound) {
    throw new Error("❌ Package was not deleted from Supabase!");
  }

  console.log("\n============================================================");
  console.log("🎉 ALL PACKAGE TESTS PASSED SUCCESSFULLY!");
  console.log("============================================================\n");
}

testServicesFlow().catch((err) => {
  console.error(err);
  process.exit(1);
});
