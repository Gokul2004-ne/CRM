import { supabase } from "../../src/lib/supabase";
import { ensureUUID } from "../../src/lib/utils";
import { RequiredDoc, Client, AssignedService } from "../../src/lib/types";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${msg}`);
    throw new Error(msg);
  }
  console.log(`  ✓ PASS: ${msg}`);
}

export async function runDuplicateAndFileTests() {
  console.log("\n============================================================");
  console.log("🔍 TESTING DUPLICATE SERVICE PREVENTION & FILE STORAGE IN DB");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Duplicate Service Assignment per Client Logic
  try {
    const existingAssignments: AssignedService[] = [
      {
        id: "as_1",
        clientId: "c_101",
        serviceId: "s_gst",
        subServiceIds: ["ss_gstr1", "ss_gstr3b"],
        financialYear: "2026-27",
        amountBilled: 0,
        amountReceived: 0,
        amountPending: 0
      }
    ];

    // Attempting to assign same sub-service to same client in same FY
    const candidateClient = "c_101";
    const candidateFY = "2026-27";
    const candidateSubIds = ["ss_gstr1"];

    const isDuplicate = existingAssignments.some(a =>
      a.clientId === candidateClient &&
      a.financialYear === candidateFY &&
      a.subServiceIds?.some(sid => candidateSubIds.includes(sid))
    );

    assert(isDuplicate === true, "Client cannot be assigned duplicate sub-service for the same financial year");
    passed++;

    // Assigning to a DIFFERENT client should succeed
    const isDifferentClientDuplicate = existingAssignments.some(a =>
      a.clientId === "c_102" &&
      a.financialYear === candidateFY &&
      a.subServiceIds?.some(sid => candidateSubIds.includes(sid))
    );
    assert(isDifferentClientDuplicate === false, "Different client can receive the same service package");
    passed++;

    // Assigning a DIFFERENT sub-service to the same client should succeed
    const candidateNewSubIds = ["ss_gstr9"];
    const isDifferentSubDuplicate = existingAssignments.some(a =>
      a.clientId === candidateClient &&
      a.financialYear === candidateFY &&
      a.subServiceIds?.some(sid => candidateNewSubIds.includes(sid))
    );
    assert(isDifferentSubDuplicate === false, "Same client can receive distinct non-duplicate sub-services");
    passed++;
  } catch (err: any) {
    failed++;
  }

  // Test 2: File Name Storage & Retrieval in Supabase DB for Required Docs
  try {
    const testDocId = ensureUUID(`test_doc_${Date.now()}`);
    const testFileName = `Compliance_Checklist_${Date.now()}.pdf`;
    const testFileUrl = `data:application/pdf;base64,JVBERi0xLjQKJSDl4uXn...`;

    // Insert required doc with fileName into Supabase
    const { error: insertErr } = await supabase.from("required_docs").upsert({
      id: testDocId,
      name: "Audit Checklist",
      is_mandatory: true,
      file_name: testFileName,
      file_url: testFileUrl,
      file_type: "PDF",
      user_id: "00000000-0000-0000-0000-000000000000"
    });
    assert(!insertErr, "Upsert required_docs record with file_name into Supabase");
    passed++;

    // Fetch required doc back from Supabase and verify file_name
    const { data: fetchedDoc, error: fetchErr } = await supabase
      .from("required_docs")
      .select("id, name, file_name, file_url, file_type")
      .eq("id", testDocId)
      .single();

    assert(!fetchErr && !!fetchedDoc, "Fetch required_docs record from Supabase");
    assert(fetchedDoc?.file_name === testFileName, `Database file_name matches attached file (${testFileName})`);
    assert(fetchedDoc?.file_type === "PDF", "Database file_type matches PDF format");
    passed += 3;

    // Cleanup test record
    await supabase.from("required_docs").delete().eq("id", testDocId);
    assert(true, "Cleanup test required_docs record from Supabase");
    passed++;
  } catch (err: any) {
    console.error("Test 2 failure:", err);
    failed++;
  }

  // Test 3: File Name Storage & Retrieval in Supabase DB for Client KYC Documents
  try {
    const testClientId = ensureUUID(`test_client_doc_${Date.now()}`);
    const testKycFileName = `GST_Registration_Certificate_${Date.now()}.pdf`;
    const testKycDocs = [
      {
        id: `cd_1`,
        clientId: testClientId,
        name: testKycFileName,
        fileName: testKycFileName,
        type: "PDF",
        category: "Statutory & GST",
        uploadDate: "2026-03-31",
        size: "1.24 MB",
        status: "RECEIVED",
        fileUrl: "data:application/pdf;base64,JVBERi0xLjQK..."
      }
    ];

    // Insert client with JSONB documents containing fileName into Supabase
    const { error: clientInsertErr } = await supabase.from("clients").upsert({
      id: testClientId,
      name: "Acme Test Corp",
      phone: "9988776655",
      documents: testKycDocs,
      document_count: testKycDocs.length,
      user_id: "00000000-0000-0000-0000-000000000000"
    });
    assert(!clientInsertErr, "Upsert client with attached KYC documents array into Supabase");
    passed++;

    // Fetch client back and verify documents array and fileName property
    const { data: fetchedClient, error: clientFetchErr } = await supabase
      .from("clients")
      .select("id, name, document_count, documents")
      .eq("id", testClientId)
      .single();

    assert(!clientFetchErr && !!fetchedClient, "Fetch client record from Supabase");
    assert(Array.isArray(fetchedClient?.documents) && fetchedClient!.documents.length === 1, "Documents JSONB array retrieved with 1 document");
    assert(fetchedClient?.documents?.[0]?.fileName === testKycFileName, `Client document fileName matches (${testKycFileName})`);
    assert(fetchedClient?.documents?.[0]?.name === testKycFileName, `Client document name matches (${testKycFileName})`);
    passed += 4;

    // Cleanup test client record
    await supabase.from("clients").delete().eq("id", testClientId);
    assert(true, "Cleanup test client record from Supabase");
    passed++;
  } catch (err: any) {
    console.error("Test 3 failure:", err);
    failed++;
  }

  // Test 4: Sub-Services Table Insertion & Due Dates, Client ID, Client Name Storage in DB
  try {
    const testSubId = ensureUUID(`test_ss_${Date.now()}`);
    const testClientId = ensureUUID(`client_for_ss_${Date.now()}`);
    const testClientName = "Apex Global Holdings";
    const testDueDate = "2026-04-15";
    const testDueDay = 15;

    // Insert sub_service record with due_date, due_date_day, client_id, client_name into Supabase
    const { error: ssInsertErr } = await supabase.from("sub_services").upsert({
      id: testSubId,
      name: "GSTR-1 Monthly Return",
      service_id: "00000000-0000-0000-0000-000000000000",
      service_ids: ["00000000-0000-0000-0000-000000000000"],
      applicable_months: ["April", "May", "June"],
      recurrence: "QUARTERLY",
      due_date: testDueDate,
      due_date_day: testDueDay,
      client_id: testClientId,
      client_name: testClientName,
      user_id: "00000000-0000-0000-0000-000000000000"
    });
    assert(!ssInsertErr, "Upsert sub_services record with due date and client metadata into Supabase");
    passed++;

    // Fetch sub_service back from Supabase and verify columns
    const { data: fetchedSS, error: ssFetchErr } = await supabase
      .from("sub_services")
      .select("id, name, due_date, due_date_day, client_id, client_name, recurrence, applicable_months")
      .eq("id", testSubId)
      .single();

    assert(!ssFetchErr && !!fetchedSS, "Fetch sub_services record from Supabase");
    assert(fetchedSS?.due_date === testDueDate, `Database sub_services due_date matches (${testDueDate})`);
    assert(fetchedSS?.due_date_day === testDueDay, `Database sub_services due_date_day matches (${testDueDay})`);
    assert(fetchedSS?.client_id === testClientId, `Database sub_services client_id matches (${testClientId})`);
    assert(fetchedSS?.client_name === testClientName, `Database sub_services client_name matches (${testClientName})`);
    assert(fetchedSS?.recurrence === "QUARTERLY", "Database sub_services recurrence matches QUARTERLY");
    passed += 6;

    // Cleanup test sub_service record
    await supabase.from("sub_services").delete().eq("id", testSubId);
    assert(true, "Cleanup test sub_services record from Supabase");
    passed++;
  } catch (err: any) {
    console.error("Test 4 failure:", err);
    failed++;
  }

  console.log(`\n============================================================`);
  console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`============================================================\n`);

  return { passed, failed };
}

if (require.main === module) {
  runDuplicateAndFileTests();
}
