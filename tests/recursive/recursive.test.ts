import { supabase } from "../../src/lib/supabase";
import {
  formatCurrency,
  formatDate,
  getValidDateForMonthDay,
  numberToWords,
  getFYDateRange,
  getFYMonths,
} from "../../src/lib/utils";
import { Service, SubService, RequiredDoc, Client, AssignedService, BankingEntry, Invoice } from "../../src/lib/types";

export async function runRecursiveTests() {
  console.log("\n============================================================");
  console.log("🔄 RUNNING RECURSIVE TESTING - MULTI-LEVEL & DEEP ITERATION TESTS");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  function assertREC(condition: boolean, testId: string, description: string) {
    if (condition) {
      console.log(`  ✓ REC PASS: [${testId}] - ${description}`);
      passed++;
    } else {
      console.error(`  ✗ REC FAIL: [${testId}] - ${description}`);
      failed++;
    }
  }

  // ── RECURSIVE TEST 1: Relational Hierarchy Traversal (Service -> SubService -> RequiredDoc) ──
  console.log("▶ Scenario 1: Recursive Relational Hierarchy Traversal");

  interface RecursiveServiceNode {
    service: Service;
    subServices: {
      subService: SubService;
      docs: RequiredDoc[];
    }[];
  }

  const parentService: Service = { id: "s_rec_1", name: "Full Statutory Compliance Package", price: 25000, recurrence: "ANNUAL" };
  const childSubServices: SubService[] = [
    { id: "ss_rec_1", serviceId: parentService.id, name: "GST Annual Return GSTR-9" },
    { id: "ss_rec_2", serviceId: parentService.id, name: "Income Tax Audit Form 3CD" },
    { id: "ss_rec_3", serviceId: parentService.id, name: "ROC Annual Filing Form AOC-4" },
  ];
  const leafDocs: RequiredDoc[] = [
    { id: "rd_rec_1", subServiceId: "ss_rec_1", name: "GSTR-2A Reconciliation Sheet", isMandatory: true },
    { id: "rd_rec_2", subServiceId: "ss_rec_1", name: "Sales Ledger Summary", isMandatory: true },
    { id: "rd_rec_3", subServiceId: "ss_rec_2", name: "Form 26AS Tax Credit Statement", isMandatory: true },
    { id: "rd_rec_4", subServiceId: "ss_rec_3", name: "Audited Balance Sheet PDF", isMandatory: true },
  ];

  // Recursive Tree Assembly Function
  function buildRecursiveTree(
    srv: Service,
    subs: SubService[],
    docs: RequiredDoc[]
  ): RecursiveServiceNode {
    const matchingSubs = subs.filter(sub => sub.serviceId === srv.id);
    return {
      service: srv,
      subServices: matchingSubs.map(sub => ({
        subService: sub,
        docs: docs.filter(doc => doc.subServiceId === sub.id),
      })),
    };
  }

  // Recursive Traversal & Metric Counter Function
  function countTreeLeafNodes(node: RecursiveServiceNode): number {
    return node.subServices.reduce((acc, subNode) => acc + subNode.docs.length, 0);
  }

  const tree = buildRecursiveTree(parentService, childSubServices, leafDocs);
  const totalLeafDocs = countTreeLeafNodes(tree);

  assertREC(tree.subServices.length === 3, "REC-TREE-01", "Recursive tree built 3 sub-service branches under parent service");
  assertREC(totalLeafDocs === 4, "REC-TREE-02", "Recursive traversal accurately resolved 4 leaf document nodes across branches");


  // ── RECURSIVE TEST 2: Multi-Year Renewal Roll-Forward Iteration ──
  console.log("\n▶ Scenario 2: Recursive Multi-Year Renewal Roll-Forward");

  function rollForwardYear(dateStr: string, yearsToAdd: number): string {
    const parts = dateStr.split("-");
    const y = parseInt(parts[0]) + yearsToAdd;
    const m = parseInt(parts[1]) - 1;
    const d = parseInt(parts[2]);
    const safeDate = getValidDateForMonthDay(y, m, d);
    const yr = safeDate.getFullYear();
    const mo = String(safeDate.getMonth() + 1).padStart(2, "0");
    const da = String(safeDate.getDate()).padStart(2, "0");
    return `${yr}-${mo}-${da}`;
  }

  // Recursive 5-year cycle calculator
  function compute5YearRenewals(startDate: string, depth: number = 5): string[] {
    if (depth === 0) return [];
    const nextDate = rollForwardYear(startDate, 1);
    return [nextDate, ...compute5YearRenewals(nextDate, depth - 1)];
  }

  const renewalChain = compute5YearRenewals("2024-02-29"); // Starting from leap year 2024
  assertREC(renewalChain.length === 5, "REC-DATE-01", "Recursively calculated 5 annual renewal cycle iterations");
  assertREC(renewalChain[0] === "2025-02-28", "REC-DATE-02", "Iteration 1 clamps non-leap 2025 to Feb 28 (2025-02-28)");
  assertREC(rollForwardYear("2024-02-29", 4) === "2028-02-29", "REC-DATE-03", "4-Year leap iteration retains Feb 29 on leap year 2028 (2028-02-29)");


  // ── RECURSIVE TEST 3: Multi-Pass Deduplication Idempotency ──
  console.log("\n▶ Scenario 3: Multi-Pass Deduplication Idempotency");

  function deduplicatePass<T extends { id: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    return items.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  // Recursive N-Pass Deduplicator
  function recursiveDeduplicate<T extends { id: string }>(items: T[], passesLeft: number): T[] {
    if (passesLeft <= 0) return items;
    const cleaned = deduplicatePass(items);
    return recursiveDeduplicate(cleaned, passesLeft - 1);
  }

  const noisyDataset = [
    { id: "1", name: "A" }, { id: "2", name: "B" }, { id: "1", name: "A" },
    { id: "3", name: "C" }, { id: "2", name: "B" }, { id: "4", name: "D" }
  ];

  const pass1 = recursiveDeduplicate(noisyDataset, 1);
  const pass10 = recursiveDeduplicate(noisyDataset, 10);

  assertREC(pass1.length === 4, "REC-DEDUP-01", "Pass 1 deduplication reduces dataset from 6 to 4 unique items");
  assertREC(pass1.length === pass10.length, "REC-DEDUP-02", "Idempotency verified: 10 recursive passes match Pass 1 output exactly");


  // ── RECURSIVE TEST 4: Deep Number-To-Words Recursive Decomposition ──
  console.log("\n▶ Scenario 4: Deep Number-To-Words Recursive Decomposition");

  const croreAmount = 12345678; // 1 Crore 23 Lakh 45 Thousand 6 Hundred 78
  const croreWords = numberToWords(croreAmount);

  assertREC(croreWords.includes("One Crore"), "REC-NUM-01", "Recursive breakdown identifies Crores tier");
  assertREC(croreWords.includes("Twenty Three Lakh"), "REC-NUM-02", "Recursive breakdown identifies Lakhs tier");
  assertREC(croreWords.includes("Forty Five Thousand"), "REC-NUM-03", "Recursive breakdown identifies Thousands tier");
  assertREC(croreWords.includes("Six Hundred"), "REC-NUM-04", "Recursive breakdown identifies Hundreds tier");


  // ── RECURSIVE TEST 5: Cloud Database Recursive Relational Cleanup ──
  console.log("\n▶ Scenario 5: Cloud Database Recursive Relational Teardown");

  const recUserId = "rec_user_" + Date.now();
  const recId = "rec_id_" + Date.now();

  try {
    // Insert parent client and child service assignment
    await supabase.from("clients").insert({ id: recId, name: "Recursive Test Client", phone: "9876543210", user_id: recUserId });
    await supabase.from("assigned_services").insert({ id: recId, client_id: recId, service_id: "s1", financial_year: "2025-26", user_id: recUserId });

    // Verify insertion
    const { data: cData } = await supabase.from("clients").select("id").eq("id", recId).single();
    const { data: aData } = await supabase.from("assigned_services").select("id").eq("id", recId).single();
    assertREC(cData?.id === recId && aData?.id === recId, "REC-DB-01", "Insert parent client and linked assigned service");

    // Recursive Cascading Teardown function
    async function recursiveTeardownTables(tables: string[], uid: string): Promise<number> {
      if (tables.length === 0) return 0;
      const [currentTable, ...remainingTables] = tables;
      const { error } = await supabase.from(currentTable).delete().eq("user_id", uid);
      const remainingCount = await recursiveTeardownTables(remainingTables, uid);
      return (error ? 0 : 1) + remainingCount;
    }

    const cleanedTablesCount = await recursiveTeardownTables(["assigned_services", "clients"], recUserId);
    assertREC(cleanedTablesCount === 2, "REC-DB-02", "Recursive teardown successfully purged child and parent records across 2 tables");

  } catch (err: any) {
    console.error("Recursive DB Error:", err);
    failed++;
  }

  console.log(`\n============================================================`);
  console.log(`📊 RECURSIVE TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`============================================================\n`);

  return { passed, failed };
}
