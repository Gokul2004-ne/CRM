import { supabase } from "../../src/lib/supabase";
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
  syncRenewalToSupabase, removeRenewalFromSupabase,
  fetchAllCRMData, getUserId
} from "../../src/lib/supabaseData";
import { ensureUUID } from "../../src/lib/utils";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ FULL-FLOW PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FULL-FLOW FAIL: ${testName}`);
    failCount++;
  }
}

export async function runFullCrudLifecycleTests(): Promise<{ passed: number; failed: number }> {
  console.log("\n============================================================");
  console.log("🔄 FULL END-TO-END CRUD & DB VERIFICATION TEST SUITE");
  console.log("============================================================\n");

  const ts = Date.now();
  const userId = await getUserId();
  console.log(`Current Test Authenticated User ID: ${userId}\n`);

  // =========================================================================
  // 1. CLIENTS LIFECYCLE (Add -> Retrieve -> Update -> Delete -> Verify DB)
  // =========================================================================
  console.log("▶ [1/12] Client Lifecycle: Add -> Retrieve -> Update -> Delete");
  const cliId = `cli_${ts}`;
  const cliDbId = ensureUUID(cliId);

  // A. Add / Insert
  await syncClientToSupabase({
    id: cliId,
    name: `Enterprise Client ${ts}`,
    type: "PRIVATE_LIMITED",
    phone: "9876543210",
    mobile: "9876543210",
    email: `client_${ts}@enterprise.com`,
    pan: "ABCDE1234F",
    gstin: "27ABCDE1234F1Z5",
    city: "Mumbai",
    address: "100 Corporate Blvd, Mumbai",
    status: "ACTIVE",
    documentCount: 1,
    documents: [
      {
        id: `doc_${ts}`,
        clientId: cliId,
        name: "MOA.pdf",
        fileName: "MOA.pdf",
        type: "PDF",
        category: "Corporate",
        uploadDate: "2026-08-19",
        size: "2.5 MB",
        status: "RECEIVED",
        fileUrl: ""
      }
    ],
    portalCredentials: [
      { id: `cred_gst_${ts}`, portalName: "GST Portal", portalId: "GST_123", password: "SecretPassword123" }
    ]
  });

  // B. Retrieve
  const { data: fetchCli1 } = await supabase.from("clients").select("*").eq("id", cliDbId);
  assert((fetchCli1 || []).length === 1, "Client successfully inserted & retrieved from Supabase");
  assert(fetchCli1?.[0]?.name === `Enterprise Client ${ts}`, "Client name matches inserted record");

  // C. Update
  await syncClientToSupabase({
    id: cliId,
    name: `Enterprise Client ${ts} (Updated)`,
    type: "PRIVATE_LIMITED",
    phone: "9876543210",
    mobile: "9876543210",
    email: `client_${ts}@enterprise.com`,
    pan: "ABCDE1234F",
    gstin: "27ABCDE1234F1Z5",
    city: "Pune",
    status: "ACTIVE",
    documentCount: 1,
    documents: []
  });

  const { data: fetchCli2 } = await supabase.from("clients").select("*").eq("id", cliDbId);
  assert(fetchCli2?.[0]?.city === "Pune", "Client successfully updated in Supabase (City: Pune)");

  // D. Delete
  await removeClientFromSupabase(cliId);
  const { data: fetchCli3 } = await supabase.from("clients").select("*").eq("id", cliDbId);
  assert((fetchCli3 || []).length === 0, "Client permanently deleted from Supabase (0 rows remaining)");

  // =========================================================================
  // 2. PACKAGES (SERVICES) LIFECYCLE
  // =========================================================================
  console.log("\n▶ [2/12] Packages (Services) Lifecycle");
  const srvId = `srv_${ts}`;
  const srvDbId = ensureUUID(srvId);

  await syncServiceToSupabase({
    id: srvId,
    name: `Corporate Tax Package ${ts}`,
    price: 15000,
    recurrence: "ANNUALLY",
    applicableMonths: ["April", "October"]
  });

  const { data: fetchSrv1 } = await supabase.from("services").select("*").eq("id", srvDbId);
  assert((fetchSrv1 || []).length === 1, "Service package successfully inserted into Supabase");

  await syncServiceToSupabase({
    id: srvId,
    name: `Corporate Tax Package ${ts} - Premium`,
    price: 25000,
    recurrence: "ANNUALLY",
    applicableMonths: ["April", "October"]
  });

  const { data: fetchSrv2 } = await supabase.from("services").select("*").eq("id", srvDbId);
  assert(Number(fetchSrv2?.[0]?.price) === 25000, "Service package price updated to ₹25,000");

  await removeServiceFromSupabase(srvId);
  const { data: fetchSrv3 } = await supabase.from("services").select("*").eq("id", srvDbId);
  assert((fetchSrv3 || []).length === 0, "Service package permanently deleted from Supabase");

  // =========================================================================
  // 3. SUB-SERVICES & CHECKLISTS LIFECYCLE
  // =========================================================================
  console.log("\n▶ [3/12] Sub-Services & Checklists Lifecycle");
  const subId = `sub_${ts}`;
  const subDbId = ensureUUID(subId);

  await syncSubServiceToSupabase({
    id: subId,
    name: `GSTR-3B Monthly Filing ${ts}`,
    applicableMonths: ["April", "May", "June"],
    recurrence: "MONTHLY",
    dueDateDay: 20
  });

  const { data: fetchSub1 } = await supabase.from("sub_services").select("*").eq("id", subDbId);
  assert((fetchSub1 || []).length === 1, "Sub-service checklist inserted into Supabase");

  await removeSubServiceFromSupabase(subId);
  const { data: fetchSub2 } = await supabase.from("sub_services").select("*").eq("id", subDbId);
  assert((fetchSub2 || []).length === 0, "Sub-service permanently deleted from Supabase");

  // =========================================================================
  // 4. REQUIRED DOCUMENTS LIFECYCLE
  // =========================================================================
  console.log("\n▶ [4/12] Required Documents Lifecycle");
  const reqId = `rd_${ts}`;
  const reqDbId = ensureUUID(reqId);

  await syncRequiredDocToSupabase({
    id: reqId,
    name: `Sales Register ${ts}`,
    isMandatory: true
  });

  const { data: fetchReq1 } = await supabase.from("required_docs").select("*").eq("id", reqDbId);
  assert((fetchReq1 || []).length === 1, "Required document inserted into Supabase");

  await removeRequiredDocFromSupabase(reqId);
  const { data: fetchReq2 } = await supabase.from("required_docs").select("*").eq("id", reqDbId);
  assert((fetchReq2 || []).length === 0, "Required document permanently deleted from Supabase");

  // =========================================================================
  // 5. COLLABORATIONS LIFECYCLE
  // =========================================================================
  console.log("\n▶ [5/12] Collaborations Lifecycle");
  const colId = `col_${ts}`;
  const colDbId = ensureUUID(colId);

  await syncCollaborationToSupabase({
    id: colId,
    name: `Legal Associates ${ts}`,
    number: "9876500000",
    email: `legal_${ts}@associates.com`,
    type: "Legal Firm",
    notes: "Corporate compliance partners"
  });

  const { data: fetchCol1 } = await supabase.from("collaborations").select("*").eq("id", colDbId);
  assert((fetchCol1 || []).length === 1, "Collaboration partner inserted into Supabase");

  await removeCollaborationFromSupabase(colId);
  const { data: fetchCol2 } = await supabase.from("collaborations").select("*").eq("id", colDbId);
  assert((fetchCol2 || []).length === 0, "Collaboration partner permanently deleted from Supabase");

  // =========================================================================
  // 6. LEADS & SALES PIPELINE LIFECYCLE
  // =========================================================================
  console.log("\n▶ [6/12] Leads Lifecycle");
  const leadId = `lead_${ts}`;
  const leadDbId = ensureUUID(leadId);

  await syncLeadToSupabase({
    id: leadId,
    name: `Prospective Lead ${ts}`,
    phone: "9123456789",
    mobile: "9123456789",
    source: "WHATSAPP",
    status: "LEAD",
    createdAt: "2026-08-19"
  });

  const { data: fetchLead1 } = await supabase.from("leads").select("*").eq("id", leadDbId);
  assert((fetchLead1 || []).length === 1, "Lead inserted into Supabase");

  await removeLeadFromSupabase(leadId);
  const { data: fetchLead2 } = await supabase.from("leads").select("*").eq("id", leadDbId);
  assert((fetchLead2 || []).length === 0, "Lead permanently deleted from Supabase");

  // =========================================================================
  // 7. INVOICES & RECONCILIATION LIFECYCLE
  // =========================================================================
  console.log("\n▶ [7/12] Invoices Lifecycle");
  const invId = `inv_${ts}`;
  const invDbId = ensureUUID(invId);

  await syncInvoiceToSupabase({
    id: invId,
    type: "INVOICE",
    invoiceNumber: `INV-${ts}`,
    date: "2026-08-19",
    financialYear: "2025-26",
    clientName: "Alpha Corp",
    total: 35400,
    amountReceived: 35400,
    balanceDue: 0,
    status: "PAID"
  });

  const { data: fetchInv1 } = await supabase.from("invoices").select("*").eq("id", invDbId);
  assert((fetchInv1 || []).length === 1, "Invoice inserted into Supabase");

  await removeInvoiceFromSupabase(invId);
  const { data: fetchInv2 } = await supabase.from("invoices").select("*").eq("id", invDbId);
  assert((fetchInv2 || []).length === 0, "Invoice permanently deleted from Supabase");

  // =========================================================================
  // 8. ONE-TIME SERVICES LIFECYCLE
  // =========================================================================
  console.log("\n▶ [8/12] One-Time Services Lifecycle");
  const otsId = `ots_${ts}`;
  const otsDbId = ensureUUID(otsId);

  await syncOneTimeServiceToSupabase({
    id: otsId,
    clientName: "Beta LLC",
    serviceName: `Statutory Audit ${ts}`,
    dueDate: "2026-09-30",
    progress: "In-progress"
  });

  const { data: fetchOts1 } = await supabase.from("one_time_services").select("*").eq("id", otsDbId);
  assert((fetchOts1 || []).length === 1, "One-time service inserted into Supabase");

  await removeOneTimeServiceFromSupabase(otsId);
  const { data: fetchOts2 } = await supabase.from("one_time_services").select("*").eq("id", otsDbId);
  assert((fetchOts2 || []).length === 0, "One-time service permanently deleted from Supabase");

  // =========================================================================
  // 9. RENEWALS LIFECYCLE
  // =========================================================================
  console.log("\n▶ [9/12] Renewals Lifecycle");
  const rnId = `rn_${ts}`;
  const rnDbId = ensureUUID(rnId);

  await syncRenewalToSupabase({
    id: rnId,
    clientName: "Gamma Corp",
    serviceName: `FSSAI License Renewal ${ts}`,
    dueDate: "2026-11-30",
    progress: "To-do"
  });

  const { data: fetchRn1 } = await supabase.from("renewals").select("*").eq("id", rnDbId);
  assert((fetchRn1 || []).length === 1, "Renewal record inserted into Supabase");

  await removeRenewalFromSupabase(rnId);
  const { data: fetchRn2 } = await supabase.from("renewals").select("*").eq("id", rnDbId);
  assert((fetchRn2 || []).length === 0, "Renewal record permanently deleted from Supabase");

  // =========================================================================
  // 10. ASSIGNED SERVICES & BANKING ENTRIES LIFECYCLE
  // =========================================================================
  console.log("\n▶ [10/12] Assigned Services & Banking Entries Lifecycle");
  const asId = `as_${ts}`;
  const asDbId = ensureUUID(asId);
  const bkId = `bk_${ts}`;
  const bkDbId = ensureUUID(bkId);

  await syncAssignedServiceToSupabase({
    id: asId,
    clientId: cliDbId,
    serviceId: srvDbId,
    financialYear: "2025-26",
    amountBilled: 12000,
    amountReceived: 6000,
    amountPending: 6000,
    status: "PARTIAL"
  });

  await syncBankingEntryToSupabase({
    id: bkId,
    clientId: cliDbId,
    serviceId: srvDbId,
    financialYear: "2025-26",
    amountBilled: 12000,
    amountReceived: 6000,
    amountPending: 6000
  });

  const [fetchAs1, fetchBk1] = await Promise.all([
    supabase.from("assigned_services").select("*").eq("id", asDbId),
    supabase.from("banking_entries").select("*").eq("id", bkDbId)
  ]);

  assert((fetchAs1.data || []).length === 1, "Assigned service inserted into Supabase");
  assert((fetchBk1.data || []).length === 1, "Banking entry inserted into Supabase");

  await Promise.all([
    removeAssignedServiceFromSupabase(asId),
    removeBankingEntryFromSupabase(bkId)
  ]);

  const [fetchAs2, fetchBk2] = await Promise.all([
    supabase.from("assigned_services").select("*").eq("id", asDbId),
    supabase.from("banking_entries").select("*").eq("id", bkDbId)
  ]);

  assert((fetchAs2.data || []).length === 0, "Assigned service permanently deleted from Supabase");
  assert((fetchBk2.data || []).length === 0, "Banking entry permanently deleted from Supabase");

  // =========================================================================
  // 11. DRAFTS LIFECYCLE
  // =========================================================================
  console.log("\n▶ [11/12] Document Drafts Lifecycle");
  const dftId = `dft_${ts}`;
  const dftDbId = ensureUUID(dftId);

  await syncDraftToSupabase({
    id: dftId,
    title: `Notice of Assessment Response ${ts}`,
    content: "Draft letter content..."
  });

  const { data: fetchDft1 } = await supabase.from("drafts").select("*").eq("id", dftDbId);
  assert((fetchDft1 || []).length === 1, "Draft template inserted into Supabase");

  await removeDraftFromSupabase(dftId);
  const { data: fetchDft2 } = await supabase.from("drafts").select("*").eq("id", dftDbId);
  assert((fetchDft2 || []).length === 0, "Draft template permanently deleted from Supabase");

  // =========================================================================
  // 12. FULL REFRESH & REHYDRATION RE-VERIFICATION
  // =========================================================================
  console.log("\n▶ [12/12] Full Re-hydration & Refresh Persistence");
  const refreshData = await fetchAllCRMData();
  const ghostRecords = (
    (refreshData?.clients || []).some((c: any) => c.id === cliDbId) ||
    (refreshData?.services || []).some((s: any) => s.id === srvDbId) ||
    (refreshData?.subServices || []).some((ss: any) => ss.id === subDbId) ||
    (refreshData?.requiredDocs || []).some((rd: any) => rd.id === reqDbId) ||
    (refreshData?.collaborations || []).some((col: any) => col.id === colDbId) ||
    (refreshData?.leads || []).some((l: any) => l.id === leadDbId) ||
    (refreshData?.invoices || []).some((inv: any) => inv.id === invDbId) ||
    (refreshData?.oneTimeServices || []).some((ots: any) => ots.id === otsDbId) ||
    (refreshData?.renewals || []).some((rn: any) => rn.id === rnDbId) ||
    (refreshData?.drafts || []).some((d: any) => d.id === dftDbId)
  );

  assert(!ghostRecords, "Zero ghost or un-deleted records exist on full fetch / refresh");

  console.log("\n============================================================");
  console.log(`📊 FULL CRUD LIFECYCLE RESULTS: ${passCount} Passed, ${failCount} Failed`);
  console.log("============================================================\n");

  return { passed: passCount, failed: failCount };
}

if (process.argv[1]?.includes("full-crud-lifecycle.test")) {
  runFullCrudLifecycleTests().then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}
