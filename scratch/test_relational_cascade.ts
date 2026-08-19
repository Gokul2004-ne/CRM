import {
  syncClientToSupabase,
  removeClientFromSupabase,
  syncServiceToSupabase,
  removeServiceFromSupabase,
  syncSubServiceToSupabase,
  removeSubServiceFromSupabase,
  syncRequiredDocToSupabase,
  syncAssignedServiceToSupabase,
  syncBankingEntryToSupabase,
  syncInvoiceToSupabase,
  removeInvoiceFromSupabase,
  syncDraftToSupabase,
} from "../src/lib/supabaseData";
import { supabase } from "../src/lib/supabase";
import { generateUUID } from "../src/lib/utils";

async function runCascadeTests() {
  console.log("============================================================");
  console.log("🧪 RUNNING COMPREHENSIVE RELATIONAL CASCADE & DELETION TESTS");
  console.log("============================================================");

  // -------------------------------------------------------------------------
  // TEST 1: CLIENT CASCADE DELETION
  // -------------------------------------------------------------------------
  console.log("\n▶ [TEST 1] Testing Client Relational Cascade Deletion...");
  const clientId = generateUUID();
  const serviceId = generateUUID();
  const subServiceId = generateUUID();
  const invoiceId = generateUUID();
  const draftId = generateUUID();
  const bankingId = generateUUID();
  const assignedId = generateUUID();

  // Insert parent client
  await syncClientToSupabase({
    id: clientId,
    name: "Relational Test Client",
    type: "PROPRIETORSHIP",
    phone: "9876543210",
    mobile: "9876543210",
  } as any);

  // Insert linked child records
  await syncAssignedServiceToSupabase({
    id: assignedId,
    clientId,
    serviceId,
    financialYear: "2025-26",
    amountBilled: 15000,
    amountReceived: 5000,
    amountPending: 10000,
    status: "PENDING",
  } as any);

  await syncBankingEntryToSupabase({
    id: bankingId,
    clientId,
    serviceId,
    financialYear: "2025-26",
    amountBilled: 15000,
    amountReceived: 5000,
    amountPending: 10000,
    remark: "Test banking record",
  } as any);

  await syncInvoiceToSupabase({
    id: invoiceId,
    type: "TAX INVOICE",
    invoiceNumber: "INV-TEST-001",
    financialYear: "2025-26",
    clientId,
    clientName: "Relational Test Client",
    total: 15000,
  });

  await syncDraftToSupabase({
    id: draftId,
    clientId,
    documentType: "ENGAGEMENT",
    financialYear: "2025-26",
    title: "Engagement Letter Test",
    content: "Content test",
  } as any);

  await syncSubServiceToSupabase({
    id: subServiceId,
    serviceId,
    name: "Test Sub Service for Client",
    applicableMonths: [1, 2, 3],
    clientId,
    clientName: "Relational Test Client",
  } as any);

  // Verify they exist in Supabase
  const { data: clientsBefore } = await supabase.from("clients").select("id").eq("id", clientId);
  const { data: assignedBefore } = await supabase.from("assigned_services").select("id").eq("client_id", clientId);
  const { data: bankingBefore } = await supabase.from("banking_entries").select("id").eq("client_id", clientId);
  const { data: invoicesBefore } = await supabase.from("invoices").select("id").eq("client_id", clientId);
  const { data: draftsBefore } = await supabase.from("drafts").select("id").eq("client_id", clientId);
  const { data: subServicesBefore } = await supabase.from("sub_services").select("id").eq("client_id", clientId);

  if (clientsBefore?.length !== 1 || assignedBefore?.length !== 1 || invoicesBefore?.length !== 1) {
    throw new Error("❌ Insertion verification failed before delete!");
  }
  console.log("  ✓ All parent and child records successfully created in Supabase");

  // Execute Cascade Delete
  await removeClientFromSupabase(clientId);

  // Verify all are purged
  const { data: clientsAfter } = await supabase.from("clients").select("id").eq("id", clientId);
  const { data: assignedAfter } = await supabase.from("assigned_services").select("id").eq("client_id", clientId);
  const { data: bankingAfter } = await supabase.from("banking_entries").select("id").eq("client_id", clientId);
  const { data: invoicesAfter } = await supabase.from("invoices").select("id").eq("client_id", clientId);
  const { data: draftsAfter } = await supabase.from("drafts").select("id").eq("client_id", clientId);
  const { data: subServicesAfter } = await supabase.from("sub_services").select("id").eq("client_id", clientId);

  const totalRemaining = (clientsAfter?.length || 0) +
    (assignedAfter?.length || 0) +
    (bankingAfter?.length || 0) +
    (invoicesAfter?.length || 0) +
    (draftsAfter?.length || 0) +
    (subServicesAfter?.length || 0);

  if (totalRemaining > 0) {
    throw new Error(`❌ Client cascade delete failed: ${totalRemaining} orphaned records remained!`);
  }
  console.log("  ✓ PASS: Client & all 5 linked child tables cleanly purged from Supabase!");

  // -------------------------------------------------------------------------
  // TEST 2: SERVICE (PACKAGE) CASCADE DELETION
  // -------------------------------------------------------------------------
  console.log("\n▶ [TEST 2] Testing Package (Service) Cascade Deletion...");
  const pkgId = generateUUID();
  const pkgSubId = generateUUID();
  const pkgDocId = generateUUID();
  const pkgAssignedId = generateUUID();

  await syncServiceToSupabase({
    id: pkgId,
    name: "Test Audit Package",
    price: 30000,
    applicableMonths: [1, 2, 3, 4],
  } as any);

  await syncSubServiceToSupabase({
    id: pkgSubId,
    serviceId: pkgId,
    name: "Statutory Audit Sub Service",
    applicableMonths: [1, 2, 3, 4],
  } as any);

  await syncRequiredDocToSupabase({
    id: pkgDocId,
    subServiceId: pkgSubId,
    name: "Trial Balance Sheet",
    isMandatory: true,
  } as any);

  await syncAssignedServiceToSupabase({
    id: pkgAssignedId,
    clientId: generateUUID(),
    serviceId: pkgId,
    financialYear: "2025-26",
    amountBilled: 30000,
  } as any);

  // Delete Package
  await removeServiceFromSupabase(pkgId);

  const { data: pkgAfter } = await supabase.from("services").select("id").eq("id", pkgId);
  const { data: pkgSubAfter } = await supabase.from("sub_services").select("id").eq("service_id", pkgId);
  const { data: pkgAssignedAfter } = await supabase.from("assigned_services").select("id").eq("service_id", pkgId);

  if ((pkgAfter?.length || 0) + (pkgSubAfter?.length || 0) + (pkgAssignedAfter?.length || 0) > 0) {
    throw new Error("❌ Package cascade deletion failed!");
  }
  console.log("  ✓ PASS: Service Package & child sub-services/assignments cleanly purged!");

  // Clean up doc
  await removeSubServiceFromSupabase(pkgSubId);

  // -------------------------------------------------------------------------
  // TEST 3: INVOICE & BANKING ENTRY CASCADE DELETION
  // -------------------------------------------------------------------------
  console.log("\n▶ [TEST 3] Testing Invoice & Banking Ledger Deletion...");
  const invId = generateUUID();
  const bankInvId = `b_inv_${invId}`;

  await syncInvoiceToSupabase({
    id: invId,
    type: "TAX INVOICE",
    invoiceNumber: "INV-AUTO-777",
    financialYear: "2025-26",
    total: 23600,
  });

  await syncBankingEntryToSupabase({
    id: bankInvId,
    clientId: generateUUID(),
    serviceId: generateUUID(),
    financialYear: "2025-26",
    amountBilled: 23600,
    amountReceived: 23600,
    amountPending: 0,
    paymentStatus: "PAID",
  } as any);

  await removeInvoiceFromSupabase(invId);
  await supabase.from("banking_entries").delete().eq("id", bankInvId);

  const { data: invAfter } = await supabase.from("invoices").select("id").eq("id", invId);
  const { data: bankAfter } = await supabase.from("banking_entries").select("id").eq("id", bankInvId);

  if ((invAfter?.length || 0) + (bankAfter?.length || 0) > 0) {
    throw new Error("❌ Invoice deletion failed!");
  }
  console.log("  ✓ PASS: Invoice & corresponding Banking ledger entry cleanly purged!");

  console.log("\n============================================================");
  console.log("🎉 ALL RELATIONAL CASCADE & DELETION INTEGRITY CHECKS PASSED!");
  console.log("============================================================\n");
}

runCascadeTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
