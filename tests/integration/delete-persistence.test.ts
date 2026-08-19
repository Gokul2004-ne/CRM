import { supabase } from "../../src/lib/supabase";
import {
  syncClientToSupabase, removeClientFromSupabase,
  syncServiceToSupabase, removeServiceFromSupabase,
  syncSubServiceToSupabase, removeSubServiceFromSupabase,
  syncRequiredDocToSupabase, removeRequiredDocFromSupabase,
  syncLeadToSupabase, removeLeadFromSupabase,
  syncDraftToSupabase, removeDraftFromSupabase,
  syncCollaborationToSupabase, removeCollaborationFromSupabase,
  syncInvoiceToSupabase, removeInvoiceFromSupabase,
  syncOneTimeServiceToSupabase, removeOneTimeServiceFromSupabase,
  syncRenewalToSupabase, removeRenewalFromSupabase,
  fetchAllCRMData, getUserId
} from "../../src/lib/supabaseData";
import { ensureUUID } from "../../src/lib/utils";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ DEL-PERSIST PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ DEL-PERSIST FAIL: ${testName}`);
    failCount++;
  }
}

export async function runDeletePersistenceTests(): Promise<{ passed: number; failed: number }> {
  console.log("\n============================================================");
  console.log("🗑️  RUNNING FULL FRONTEND-BACKEND DELETE SYNCHRONIZATION TESTS");
  console.log("============================================================\n");

  const userId = await getUserId();
  const testTimestamp = Date.now();

  // --- 1. Client Deletion Persistence ---
  console.log("▶ Scenario 1: Client & Document Deletion Persistence");
  const testClientId = `test_cli_${testTimestamp}`;
  const testClientDbId = ensureUUID(testClientId);
  await syncClientToSupabase({
    id: testClientId,
    name: `Delete Test Client ${testTimestamp}`,
    type: "PROPRIETORSHIP",
    phone: "9123456780",
    email: `del_client_${testTimestamp}@test.com`,
    pan: "ABCDE1234F",
    gstin: "27ABCDE1234F1Z5",
    documents: [
      {
        id: `doc_${testTimestamp}`,
        clientId: testClientId,
        name: "Test_PAN.pdf",
        fileName: "Test_PAN.pdf",
        type: "PDF",
        category: "KYC",
        uploadDate: "2026-08-19",
        size: "1 MB",
        status: "RECEIVED",
        fileUrl: ""
      }
    ],
    documentCount: 1,
    portalCredentials: [
      { id: `cred_${testTimestamp}`, portalName: "GST Portal", portalId: "GST123", password: "pass" }
    ],
    status: "ACTIVE"
  });

  const { data: insertedClients } = await supabase.from("clients").select("*").eq("id", testClientDbId);
  assert((insertedClients || []).length === 1, "Client successfully saved in Supabase");

  await removeClientFromSupabase(testClientId);
  const { data: postDeleteClients } = await supabase.from("clients").select("*").eq("id", testClientDbId);
  assert((postDeleteClients || []).length === 0, "Client permanently removed from Supabase");

  // --- 2. Service / Package Deletion Persistence ---
  console.log("\n▶ Scenario 2: Service / Package Deletion Persistence");
  const testServiceId = `test_srv_${testTimestamp}`;
  const testServiceDbId = ensureUUID(testServiceId);
  await syncServiceToSupabase({
    id: testServiceId,
    name: `Delete Test Service ${testTimestamp}`,
    price: 5000,
    recurrence: "ANNUALLY",
    applicableMonths: ["April"]
  });

  const { data: insertedServices } = await supabase.from("services").select("*").eq("id", testServiceDbId);
  assert((insertedServices || []).length === 1, "Service package successfully saved in Supabase");

  await removeServiceFromSupabase(testServiceId);
  const { data: postDeleteServices } = await supabase.from("services").select("*").eq("id", testServiceDbId);
  assert((postDeleteServices || []).length === 0, "Service package permanently removed from Supabase");

  // --- 3. Sub-Service Deletion Persistence ---
  console.log("\n▶ Scenario 3: Sub-Service Checklist Deletion Persistence");
  const testSubServiceId = `test_sub_${testTimestamp}`;
  const testSubServiceDbId = ensureUUID(testSubServiceId);
  await syncSubServiceToSupabase({
    id: testSubServiceId,
    serviceId: testServiceDbId,
    name: `Delete Test SubService ${testTimestamp}`,
    applicableMonths: ["April", "May"],
    recurrence: "CUSTOM",
    dueDateDay: 20
  });

  const { data: insertedSubServices } = await supabase.from("sub_services").select("*").eq("id", testSubServiceDbId);
  assert((insertedSubServices || []).length === 1, "Sub-service successfully saved in Supabase");

  await removeSubServiceFromSupabase(testSubServiceId);
  const { data: postDeleteSubServices } = await supabase.from("sub_services").select("*").eq("id", testSubServiceDbId);
  assert((postDeleteSubServices || []).length === 0, "Sub-service permanently removed from Supabase");

  // --- 4. Required Doc Deletion Persistence ---
  console.log("\n▶ Scenario 4: Required Document Deletion Persistence");
  const testReqDocId = `test_rd_${testTimestamp}`;
  const testReqDocDbId = ensureUUID(testReqDocId);
  await syncRequiredDocToSupabase({
    id: testReqDocId,
    subServiceId: testSubServiceDbId,
    name: `Bank Statement ${testTimestamp}`,
    isMandatory: true
  });

  const { data: insertedDocs } = await supabase.from("required_docs").select("*").eq("id", testReqDocDbId);
  assert((insertedDocs || []).length === 1, "Required doc successfully saved in Supabase");

  await removeRequiredDocFromSupabase(testReqDocId);
  const { data: postDeleteDocs } = await supabase.from("required_docs").select("*").eq("id", testReqDocDbId);
  assert((postDeleteDocs || []).length === 0, "Required doc permanently removed from Supabase");

  // --- 5. Lead Deletion Persistence ---
  console.log("\n▶ Scenario 5: Lead Deletion Persistence");
  const testLeadId = `test_lead_${testTimestamp}`;
  const testLeadDbId = ensureUUID(testLeadId);
  await syncLeadToSupabase({
    id: testLeadId,
    name: `Lead ${testTimestamp}`,
    phone: "9876543210",
    mobile: "9876543210",
    source: "WHATSAPP",
    status: "LEAD"
  });

  const { data: insertedLeads } = await supabase.from("leads").select("*").eq("id", testLeadDbId);
  assert((insertedLeads || []).length === 1, "Lead successfully saved in Supabase");

  await removeLeadFromSupabase(testLeadId);
  const { data: postDeleteLeads } = await supabase.from("leads").select("*").eq("id", testLeadDbId);
  assert((postDeleteLeads || []).length === 0, "Lead permanently removed from Supabase");

  // --- 6. Collaboration Partner Deletion Persistence ---
  console.log("\n▶ Scenario 6: Collaboration Partner Deletion Persistence");
  const testCollabId = `test_collab_${testTimestamp}`;
  const testCollabDbId = ensureUUID(testCollabId);
  await syncCollaborationToSupabase({
    id: testCollabId,
    name: `Partner ${testTimestamp}`,
    number: "9876543210",
    email: `collab_${testTimestamp}@partner.com`,
    type: "CA Firm",
    notes: "Tax referral partner"
  });

  const { data: insertedCollabs } = await supabase.from("collaborations").select("*").eq("id", testCollabDbId);
  assert((insertedCollabs || []).length === 1, "Collaboration partner saved in Supabase");

  await removeCollaborationFromSupabase(testCollabId);
  const { data: postDeleteCollabs } = await supabase.from("collaborations").select("*").eq("id", testCollabDbId);
  assert((postDeleteCollabs || []).length === 0, "Collaboration partner permanently removed from Supabase");

  // --- 7. Invoices, Renewals & One-Time Services Deletion ---
  console.log("\n▶ Scenario 7: Invoices, Renewals & One-Time Services Deletion");
  const testInvId = `test_inv_${testTimestamp}`;
  const testInvDbId = ensureUUID(testInvId);
  await syncInvoiceToSupabase({
    id: testInvId,
    type: "INVOICE",
    invoiceNumber: `INV-${testTimestamp}`,
    date: "2026-08-19",
    financialYear: "2025-26",
    clientName: "Test Client",
    total: 10000,
    amountReceived: 10000,
    balanceDue: 0,
    status: "PAID"
  });

  const testOtsId = `test_ots_${testTimestamp}`;
  const testOtsDbId = ensureUUID(testOtsId);
  await syncOneTimeServiceToSupabase({
    id: testOtsId,
    clientName: "Test Client",
    serviceName: `One Time Audit ${testTimestamp}`,
    dueDate: "2026-09-30",
    progress: "In-progress"
  });

  const testRnId = `test_rn_${testTimestamp}`;
  const testRnDbId = ensureUUID(testRnId);
  await syncRenewalToSupabase({
    id: testRnId,
    clientName: "Test Client",
    serviceName: `GST Renewal ${testTimestamp}`,
    dueDate: "2026-10-31",
    progress: "To-do"
  });

  await Promise.all([
    removeInvoiceFromSupabase(testInvId),
    removeOneTimeServiceFromSupabase(testOtsId),
    removeRenewalFromSupabase(testRnId)
  ]);

  const [invCheck, otsCheck, rnCheck] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", testInvDbId),
    supabase.from("one_time_services").select("*").eq("id", testOtsDbId),
    supabase.from("renewals").select("*").eq("id", testRnDbId)
  ]);

  assert((invCheck.data || []).length === 0, "Invoice permanently removed from Supabase");
  assert((otsCheck.data || []).length === 0, "One-time service permanently removed from Supabase");
  assert((rnCheck.data || []).length === 0, "Renewal record permanently removed from Supabase");

  // --- 8. Simulated Refresh & Re-hydration Verification ---
  console.log("\n▶ Scenario 8: Refresh & Re-hydration Verification");
  const refreshData = await fetchAllCRMData();
  const foundAny = (
    (refreshData?.clients || []).some((c: any) => c.id === testClientDbId) ||
    (refreshData?.services || []).some((s: any) => s.id === testServiceDbId) ||
    (refreshData?.subServices || []).some((ss: any) => ss.id === testSubServiceDbId) ||
    (refreshData?.leads || []).some((l: any) => l.id === testLeadDbId) ||
    (refreshData?.collaborations || []).some((col: any) => col.id === testCollabDbId)
  );
  assert(!foundAny, "Deleted records never reappear upon page refresh or fetchAllCRMData");

  console.log("\n============================================================");
  console.log(`📊 DELETE SYNCHRONIZATION RESULTS: ${passCount} Passed, ${failCount} Failed`);
  console.log("============================================================\n");

  return { passed: passCount, failed: failCount };
}

if (process.argv[1]?.includes("delete-persistence.test")) {
  runDeletePersistenceTests().then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}
