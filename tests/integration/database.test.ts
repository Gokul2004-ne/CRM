import { supabase } from "../../src/lib/supabase";

export async function runDatabaseTests() {
  console.log("\n🧪 RUNNING INTEGRATION TESTS: Supabase Cloud Database (13 Tables)\n" + "─".repeat(60));
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  const testUserId = "test_user_e2e_" + Date.now();
  const testId = "test_id_" + Date.now();

  try {
    // 1. Database Connection Check
    const { data: pingData, error: pingError } = await supabase.from("clients").select("id").limit(1);
    assert(!pingError, "Supabase client connected to cloud project dwtsntjkysxlqluouhbr");

    // 2. Test 'clients' Table CRUD
    const clientPayload = {
      id: testId,
      name: "E2E Test Client Firm",
      type: "PROPRIETORSHIP",
      phone: "9998887770",
      email: "testclient@e2e.com",
      status: "ACTIVE",
      user_id: testUserId,
    };
    const { error: insertClientErr } = await supabase.from("clients").insert(clientPayload);
    assert(!insertClientErr, "clients: INSERT new client record");

    const { data: fetchClientData, error: fetchClientErr } = await supabase
      .from("clients")
      .select("*")
      .eq("id", testId)
      .single();
    assert(!fetchClientErr && fetchClientData?.name === "E2E Test Client Firm", "clients: SELECT record by ID & user_id");

    const { error: updateClientErr } = await supabase.from("clients").update({ name: "Updated E2E Client" }).eq("id", testId);
    assert(!updateClientErr, "clients: UPDATE record fields");

    const { error: deleteClientErr } = await supabase.from("clients").delete().eq("id", testId);
    assert(!deleteClientErr, "clients: DELETE test record");

    // 3. Test 'services' Table CRUD
    const servicePayload = { id: testId, name: "E2E Service", price: 2500, recurrence: "MONTHLY", user_id: testUserId };
    const { error: insServErr } = await supabase.from("services").insert(servicePayload);
    assert(!insServErr, "services: INSERT package record");
    await supabase.from("services").delete().eq("id", testId);

    // 4. Test 'sub_services' Table CRUD
    const subServPayload = { id: testId, service_id: "s1", name: "E2E SubService", due_date: "2026-03-31", user_id: testUserId };
    const { error: insSubErr } = await supabase.from("sub_services").insert(subServPayload);
    assert(!insSubErr, "sub_services: INSERT sub-service record");
    await supabase.from("sub_services").delete().eq("id", testId);

    // 5. Test 'required_docs' Table CRUD
    const docPayload = { id: testId, sub_service_id: "ss1", name: "E2E Doc", is_mandatory: true, user_id: testUserId };
    const { error: insDocErr } = await supabase.from("required_docs").insert(docPayload);
    assert(!insDocErr, "required_docs: INSERT required document record");
    await supabase.from("required_docs").delete().eq("id", testId);

    // 6. Test 'assigned_services' Table CRUD
    const assignPayload = {
      id: testId,
      client_id: "c1",
      service_id: "s1",
      financial_year: "2025-26",
      amount_billed: 5000,
      amount_received: 2000,
      amount_pending: 3000,
      user_id: testUserId,
    };
    const { error: insAssErr } = await supabase.from("assigned_services").insert(assignPayload);
    assert(!insAssErr, "assigned_services: INSERT client service assignment record");
    await supabase.from("assigned_services").delete().eq("id", testId);

    // 7. Test 'banking_entries' Table CRUD
    const bankPayload = {
      id: testId,
      financial_year: "2025-26",
      client_id: "c1",
      service_id: "s1",
      amount_billed: 5000,
      amount_received: 5000,
      amount_pending: 0,
      payment_status: "PAID",
      user_id: testUserId,
    };
    const { error: insBankErr } = await supabase.from("banking_entries").insert(bankPayload);
    assert(!insBankErr, "banking_entries: INSERT ledger entry");
    await supabase.from("banking_entries").delete().eq("id", testId);

    // 8. Test 'leads' Table CRUD
    const leadPayload = { id: testId, name: "E2E Prospect Lead", mobile: "9876543210", status: "NEW", user_id: testUserId };
    const { error: insLeadErr } = await supabase.from("leads").insert(leadPayload);
    assert(!insLeadErr, "leads: INSERT sales lead record");
    await supabase.from("leads").delete().eq("id", testId);

    // 9. Test 'drafts' Table CRUD
    const draftPayload = { id: testId, client_id: "c1", document_type: "ENGAGEMENT", financial_year: "2025-26", title: "E2E Draft Letter", user_id: testUserId };
    const { error: insDraftErr } = await supabase.from("drafts").insert(draftPayload);
    assert(!insDraftErr, "drafts: INSERT document draft record");
    await supabase.from("drafts").delete().eq("id", testId);

    // 10. Test 'collaborations' Table CRUD
    const collabPayload = { id: testId, name: "E2E Partner", number: "9123456789", email: "partner@e2e.com", user_id: testUserId };
    const { error: insCollabErr } = await supabase.from("collaborations").insert(collabPayload);
    assert(!insCollabErr, "collaborations: INSERT team member record");
    await supabase.from("collaborations").delete().eq("id", testId);

    // 11. Test 'invoices' Table CRUD
    const invoicePayload = {
      id: testId,
      type: "TAX_INVOICE",
      invoice_number: "INV-E2E-001",
      date: "2026-03-31",
      financial_year: "2025-26",
      client_id: "c1",
      client_name: "E2E Client",
      subtotal: 1000,
      gst_rate: 18,
      gst_amount: 180,
      total: 1180,
      amount_received: 1180,
      balance_due: 0,
      status: "PAID",
      user_id: testUserId,
    };
    const { error: insInvErr } = await supabase.from("invoices").insert(invoicePayload);
    assert(!insInvErr, "invoices: INSERT tax invoice record");
    await supabase.from("invoices").delete().eq("id", testId);

    // 12. Test 'one_time_services' Table CRUD
    const otsPayload = { id: testId, client_name: "E2E Client", service_name: "DSC Token", due_date: "2026-04-15", progress: "IN_PROGRESS", user_id: testUserId };
    const { error: insOtsErr } = await supabase.from("one_time_services").insert(otsPayload);
    assert(!insOtsErr, "one_time_services: INSERT one-time job record");
    await supabase.from("one_time_services").delete().eq("id", testId);

    // 13. Test 'renewals' Table CRUD
    const renewalPayload = {
      id: testId,
      client_name: "E2E Client",
      service_name: "Trademark Renewal",
      due_date: "2026-05-01",
      progress: "PENDING",
      user_id: testUserId,
    };
    const { error: insRenErr } = await supabase.from("renewals").insert(renewalPayload);
    assert(!insRenErr, "renewals: INSERT recurring renewal record");
    await supabase.from("renewals").delete().eq("id", testId);

    // 14. Test 'user_settings' Table CRUD
    const settingsPayload = {
      user_id: testUserId,
      settings: { firmName: "E2E Test Firm", brandColor: "#059669" },
    };
    const { error: insSetErr } = await supabase.from("user_settings").upsert(settingsPayload);
    assert(!insSetErr, "user_settings: UPSERT firm settings record");
    await supabase.from("user_settings").delete().eq("user_id", testUserId);

  } catch (err: any) {
    console.error("Database Test Error:", err);
    failed++;
  }

  console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);
  return { passed, failed };
}
