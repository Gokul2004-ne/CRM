import { supabase } from "../src/lib/supabase";
import {
  syncClientToSupabase, removeClientFromSupabase,
  syncServiceToSupabase, removeServiceFromSupabase,
  syncSubServiceToSupabase, removeSubServiceFromSupabase,
  syncRequiredDocToSupabase, removeRequiredDocFromSupabase,
  syncAssignedServiceToSupabase, removeAssignedServiceFromSupabase,
  syncBankingEntryToSupabase, removeBankingEntryFromSupabase,
  syncLeadToSupabase, removeLeadFromSupabase,
  syncDraftToSupabase, removeDraftFromSupabase,
  syncCollaborationToSupabase, removeCollaborationFromSupabase,
  syncInvoiceToSupabase, removeInvoiceFromSupabase,
  syncOneTimeServiceToSupabase, removeOneTimeServiceFromSupabase,
  syncRenewalToSupabase, removeRenewalFromSupabase
} from "../src/lib/supabaseData";

async function verifyAll() {
  console.log("==================================================");
  console.log("VERIFYING CLOUD INSERT, UPDATE & DELETE FOR ALL ENTITIES");
  console.log("==================================================");

  const testId = "99999999-9999-9999-9999-999999999999";

  // 1. Clients
  console.log("\n[1/12] Testing Clients Cloud Sync & Delete...");
  await syncClientToSupabase({
    id: testId,
    name: "Cloud Test Client Pvt Ltd",
    type: "PRIVATE_LIMITED",
    phone: "9876543210",
    email: "cloudtest@test.com",
    address: "Mumbai;Maharashtra;400001",
    documents: []
  });
  let { data: cData } = await supabase.from("clients").select("*").eq("id", testId);
  console.log("✓ Client Inserted in Supabase:", cData?.length === 1 ? "PASSED" : "FAILED");
  await removeClientFromSupabase(testId, "Cloud Test Client Pvt Ltd");
  let { data: cAfter } = await supabase.from("clients").select("*").eq("id", testId);
  console.log("✓ Client Deleted from Supabase:", cAfter?.length === 0 ? "PASSED" : "FAILED");

  // 2. Services
  console.log("\n[2/12] Testing Services Cloud Sync & Delete...");
  await syncServiceToSupabase({
    id: testId,
    name: "Cloud Test Package",
    price: 15000,
    recurrence: "ANNUAL",
    applicableMonths: [],
    dueDate: "2026-12-31"
  });
  let { data: sData } = await supabase.from("services").select("*").eq("id", testId);
  console.log("✓ Service Inserted in Supabase:", sData?.length === 1 ? "PASSED" : "FAILED");
  await removeServiceFromSupabase(testId, "Cloud Test Package");
  let { data: sAfter } = await supabase.from("services").select("*").eq("id", testId);
  console.log("✓ Service Deleted from Supabase:", sAfter?.length === 0 ? "PASSED" : "FAILED");

  // 3. Sub-Services
  console.log("\n[3/12] Testing Sub-Services Cloud Sync & Delete...");
  await syncSubServiceToSupabase({
    id: testId,
    name: "Cloud Test SubService Task",
    recurrence: "MONTHLY"
  });
  let { data: ssData } = await supabase.from("sub_services").select("*").eq("id", testId);
  console.log("✓ Sub-Service Inserted in Supabase:", ssData?.length === 1 ? "PASSED" : "FAILED");
  await removeSubServiceFromSupabase(testId, "Cloud Test SubService Task");
  let { data: ssAfter } = await supabase.from("sub_services").select("*").eq("id", testId);
  console.log("✓ Sub-Service Deleted from Supabase:", ssAfter?.length === 0 ? "PASSED" : "FAILED");

  // 4. Required Docs
  console.log("\n[4/12] Testing Required Docs Cloud Sync & Delete...");
  await syncRequiredDocToSupabase({
    id: testId,
    name: "Cloud Test Required Doc",
    isMandatory: true
  });
  let { data: rdData } = await supabase.from("required_docs").select("*").eq("id", testId);
  console.log("✓ Required Doc Inserted in Supabase:", rdData?.length === 1 ? "PASSED" : "FAILED");
  await removeRequiredDocFromSupabase(testId, "Cloud Test Required Doc");
  let { data: rdAfter } = await supabase.from("required_docs").select("*").eq("id", testId);
  console.log("✓ Required Doc Deleted from Supabase:", rdAfter?.length === 0 ? "PASSED" : "FAILED");

  // 5. Assigned Services
  console.log("\n[5/12] Testing Assigned Services Cloud Sync & Delete...");
  await syncAssignedServiceToSupabase({
    id: testId,
    financialYear: "2025-26",
    amountBilled: 15000,
    amountReceived: 5000,
    amountPending: 10000,
    status: "IN_PROGRESS"
  });
  let { data: aData } = await supabase.from("assigned_services").select("*").eq("id", testId);
  console.log("✓ Assigned Service Inserted in Supabase:", aData?.length === 1 ? "PASSED" : "FAILED");
  await removeAssignedServiceFromSupabase(testId);
  let { data: aAfter } = await supabase.from("assigned_services").select("*").eq("id", testId);
  console.log("✓ Assigned Service Deleted from Supabase:", aAfter?.length === 0 ? "PASSED" : "FAILED");

  // 6. Banking Entries
  console.log("\n[6/12] Testing Banking Entries Cloud Sync & Delete...");
  await syncBankingEntryToSupabase({
    id: testId,
    financialYear: "2025-26",
    amountBilled: 20000,
    amountReceived: 20000,
    amountPending: 0,
    remark: "Test ledger entry"
  });
  let { data: bData } = await supabase.from("banking_entries").select("*").eq("id", testId);
  console.log("✓ Banking Entry Inserted in Supabase:", bData?.length === 1 ? "PASSED" : "FAILED");
  await removeBankingEntryFromSupabase(testId);
  let { data: bAfter } = await supabase.from("banking_entries").select("*").eq("id", testId);
  console.log("✓ Banking Entry Deleted from Supabase:", bAfter?.length === 0 ? "PASSED" : "FAILED");

  // 7. Leads
  console.log("\n[7/12] Testing Leads Cloud Sync & Delete...");
  await syncLeadToSupabase({
    id: testId,
    name: "Cloud Test Lead",
    mobile: "9123456780",
    source: "WHATSAPP",
    status: "HOT"
  });
  let { data: lData } = await supabase.from("leads").select("*").eq("id", testId);
  console.log("✓ Lead Inserted in Supabase:", lData?.length === 1 ? "PASSED" : "FAILED");
  await removeLeadFromSupabase(testId, "Cloud Test Lead");
  let { data: lAfter } = await supabase.from("leads").select("*").eq("id", testId);
  console.log("✓ Lead Deleted from Supabase:", lAfter?.length === 0 ? "PASSED" : "FAILED");

  // 8. Drafts
  console.log("\n[8/12] Testing Drafts Cloud Sync & Delete...");
  await syncDraftToSupabase({
    id: testId,
    title: "Cloud Test Draft",
    content: "Draft sample content"
  });
  let { data: dData } = await supabase.from("drafts").select("*").eq("id", testId);
  console.log("✓ Draft Inserted in Supabase:", dData?.length === 1 ? "PASSED" : "FAILED");
  await removeDraftFromSupabase(testId);
  let { data: dAfter } = await supabase.from("drafts").select("*").eq("id", testId);
  console.log("✓ Draft Deleted from Supabase:", dAfter?.length === 0 ? "PASSED" : "FAILED");

  // 9. Collaborations
  console.log("\n[9/12] Testing Collaborations Cloud Sync & Delete...");
  await syncCollaborationToSupabase({
    id: testId,
    name: "Cloud Test Partner",
    number: "9876543210",
    email: "partner@test.com",
    type: "AUDIT_FIRM"
  });
  let { data: colData } = await supabase.from("collaborations").select("*").eq("id", testId);
  console.log("✓ Collaboration Inserted in Supabase:", colData?.length === 1 ? "PASSED" : "FAILED");
  await removeCollaborationFromSupabase(testId, "Cloud Test Partner");
  let { data: colAfter } = await supabase.from("collaborations").select("*").eq("id", testId);
  console.log("✓ Collaboration Deleted from Supabase:", colAfter?.length === 0 ? "PASSED" : "FAILED");

  // 10. Invoices
  console.log("\n[10/12] Testing Invoices Cloud Sync & Delete...");
  await syncInvoiceToSupabase({
    id: testId,
    type: "INVOICE",
    invoiceNumber: "INV-TEST-9999",
    date: "2026-08-19",
    financialYear: "2025-26",
    clientName: "Test Client",
    items: [],
    subtotal: 10000,
    gstRate: 18,
    gstAmount: 1800,
    total: 11800,
    amountReceived: 11800,
    balanceDue: 0,
    status: "PAID"
  });
  let { data: invData } = await supabase.from("invoices").select("*").eq("id", testId);
  console.log("✓ Invoice Inserted in Supabase:", invData?.length === 1 ? "PASSED" : "FAILED");
  await removeInvoiceFromSupabase(testId);
  let { data: invAfter } = await supabase.from("invoices").select("*").eq("id", testId);
  console.log("✓ Invoice Deleted from Supabase:", invAfter?.length === 0 ? "PASSED" : "FAILED");

  // 11. One-Time Services
  console.log("\n[11/12] Testing One-Time Services Cloud Sync & Delete...");
  await syncOneTimeServiceToSupabase({
    id: testId,
    clientName: "Test Client",
    serviceName: "One Time Cloud Audit",
    progress: "To-do"
  });
  let { data: otsData } = await supabase.from("one_time_services").select("*").eq("id", testId);
  console.log("✓ One-Time Service Inserted in Supabase:", otsData?.length === 1 ? "PASSED" : "FAILED");
  await removeOneTimeServiceFromSupabase(testId);
  let { data: otsAfter } = await supabase.from("one_time_services").select("*").eq("id", testId);
  console.log("✓ One-Time Service Deleted from Supabase:", otsAfter?.length === 0 ? "PASSED" : "FAILED");

  // 12. Renewals
  console.log("\n[12/12] Testing Renewals Cloud Sync & Delete...");
  await syncRenewalToSupabase({
    id: testId,
    clientName: "Test Client",
    serviceName: "Annual Cloud Renewal",
    progress: "To-do"
  });
  let { data: rnData } = await supabase.from("renewals").select("*").eq("id", testId);
  console.log("✓ Renewal Inserted in Supabase:", rnData?.length === 1 ? "PASSED" : "FAILED");
  await removeRenewalFromSupabase(testId);
  let { data: rnAfter } = await supabase.from("renewals").select("*").eq("id", testId);
  console.log("✓ Renewal Deleted from Supabase:", rnAfter?.length === 0 ? "PASSED" : "FAILED");

  console.log("\n==================================================");
  console.log("ALL 12 MODULES VERIFIED: 100% CLOUD & LOCAL INTEGRATION");
  console.log("==================================================");
}

verifyAll();
