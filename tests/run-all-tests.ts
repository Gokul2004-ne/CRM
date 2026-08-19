import { runUtilsTests } from "./unit/utils.test";
import { runStoreTests } from "./unit/store.test";
import { runDatabaseTests } from "./integration/database.test";
import { runApiTests } from "./integration/api.test";
import { runAuthTests } from "./integration/auth.test";
import { runUATTests } from "./uat/user-acceptance.test";
import { runBlackBoxTests } from "./blackbox/black-box.test";
import { runRecursiveTests } from "./recursive/recursive.test";
import { runDuplicateAndFileTests } from "./integration/duplicate-service-and-files.test";
import { runClientIsolationTests } from "./integration/client-isolation.test";
import { runDeletePersistenceTests } from "./integration/delete-persistence.test";

async function runAllTests() {
  const startTime = Date.now();
  console.log("============================================================");
  console.log("🚀 STARTING COMPREHENSIVE E2E, UAT, BLACK BOX & RECURSIVE TEST SUITE");
  console.log("============================================================");

  let totalPassed = 0;
  let totalFailed = 0;

  // 1. Run Utility Function Tests
  const utilsRes = await runUtilsTests();
  totalPassed += utilsRes.passed;
  totalFailed += utilsRes.failed;

  // 2. Run Store & Deduplication Key Tests
  const storeRes = await runStoreTests();
  totalPassed += storeRes.passed;
  totalFailed += storeRes.failed;

  // 3. Run Supabase Cloud Database Integration Tests
  const dbRes = await runDatabaseTests();
  totalPassed += dbRes.passed;
  totalFailed += dbRes.failed;

  // 4. Run API Endpoint Integration Tests
  const apiRes = await runApiTests();
  totalPassed += apiRes.passed;
  totalFailed += apiRes.failed;

  // 5. Run Client Isolation & Deletion Scoping Tests
  const isoRes = await runClientIsolationTests();
  totalPassed += isoRes.passed;
  totalFailed += isoRes.failed;

  // 6. Run Delete Synchronization & Persistence Tests
  const delPersistRes = await runDeletePersistenceTests();
  totalPassed += delPersistRes.passed;
  totalFailed += delPersistRes.failed;

  // 7. Run Authentication & Cross-Device Sync Tests
  const authRes = await runAuthTests();
  totalPassed += authRes.passed;
  totalFailed += authRes.failed;

  // 8. Run User Acceptance Testing (UAT) Scenarios
  const uatRes = await runUATTests();
  totalPassed += uatRes.passed;
  totalFailed += uatRes.failed;

  // 9. Run Black Box Testing (Input/Output & Boundary Values)
  const bbRes = await runBlackBoxTests();
  totalPassed += bbRes.passed;
  totalFailed += bbRes.failed;

  // 10. Run Recursive Testing (Multi-Level Relational & Roll-Forward Iterations)
  const recRes = await runRecursiveTests();
  totalPassed += recRes.passed;
  totalFailed += recRes.failed;

  // 11. Run Duplicate Service Prevention & File Storage Tests
  const dupRes = await runDuplicateAndFileTests();
  totalPassed += dupRes.passed;
  totalFailed += dupRes.failed;

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n============================================================");
  console.log("📊 FINAL END-TO-END TEST SUITE SUMMARY");
  console.log("============================================================");
  console.log(`  Total Test Assertions: ${totalPassed + totalFailed}`);
  console.log(`  Passed Assertions:    ${totalPassed} ✓`);
  console.log(`  Failed Assertions:    ${totalFailed} ${totalFailed > 0 ? "✗" : ""}`);
  console.log(`  Execution Duration:   ${duration} seconds`);
  console.log("============================================================\n");

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests();
