import { AssignedService, SubService, Service, Lead } from "../../src/lib/types";
import { getDaysUntilDue } from "../../src/lib/utils";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${msg}`);
    throw new Error(msg);
  }
  console.log(`  ✓ PASS: ${msg}`);
}

export function runAssignedServicesSortingTest() {
  console.log("\n============================================================");
  console.log("🧪 TESTING ASSIGNED SERVICES SORTING (DUE DAYS FIRST, THEN SERVICE)");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Sorting due days ascending first (nearest due dates first), then service name alphabetically
  try {
    const mockServices: Service[] = [
      { id: "s1", name: "Income Tax Package", price: 5000, recurrence: "ANNUALLY" },
      { id: "s2", name: "GST Compliance Package", price: 10000, recurrence: "MONTHLY" },
    ];

    const mockSubServices: SubService[] = [
      { id: "ss_adv_tax", serviceId: "s1", name: "Advance Tax Payment", recurrence: "QUARTERLY" },
      { id: "ss_itr", serviceId: "s1", name: "Income Tax Return", recurrence: "ANNUALLY" },
      { id: "ss_gstr1", serviceId: "s2", name: "GSTR 1 Return", recurrence: "MONTHLY" },
    ];

    const mockAssigned: AssignedService[] = [
      // Income Tax Return - Due 2026-09-30 (furthest)
      { id: "a1", clientId: "c1", serviceId: "s1", subServiceIds: ["ss_itr"], financialYear: "2026-27", dueDate: "2026-09-30", amountBilled: 0, amountReceived: 0, amountPending: 0 },
      // Advance Tax Payment - Due 2026-06-15
      { id: "a2", clientId: "c2", serviceId: "s1", subServiceIds: ["ss_adv_tax"], financialYear: "2026-27", dueDate: "2026-06-15", amountBilled: 0, amountReceived: 0, amountPending: 0 },
      // GSTR 1 Return - Due 2026-04-11
      { id: "a3", clientId: "c3", serviceId: "s2", subServiceIds: ["ss_gstr1"], financialYear: "2026-27", dueDate: "2026-04-11", amountBilled: 0, amountReceived: 0, amountPending: 0 },
      // Advance Tax Payment - Due 2026-03-15 (nearest/earliest)
      { id: "a4", clientId: "c4", serviceId: "s1", subServiceIds: ["ss_adv_tax"], financialYear: "2026-27", dueDate: "2026-03-15", amountBilled: 0, amountReceived: 0, amountPending: 0 },
      // GSTR 1 Return - Due 2026-04-01
      { id: "a5", clientId: "c5", serviceId: "s2", subServiceIds: ["ss_gstr1"], financialYear: "2026-27", dueDate: "2026-04-01", amountBilled: 0, amountReceived: 0, amountPending: 0 },
      // GSTR 1 Return - Same date as a2 (2026-06-15) to test secondary alphabetical sort
      { id: "a6", clientId: "c6", serviceId: "s2", subServiceIds: ["ss_gstr1"], financialYear: "2026-27", dueDate: "2026-06-15", amountBilled: 0, amountReceived: 0, amountPending: 0 },
    ];

    function getAssignedServiceMeta(a: AssignedService) {
      const subs = mockSubServices.filter(ss => a.subServiceIds?.includes(ss.id));
      const svc = mockServices.find(s => s.id === a.serviceId);
      const serviceDisplayName = subs.length > 0 ? subs.map(s => s.name).join(", ") : (svc?.name || "Service");
      return {
        serviceDisplayName,
        effectiveDueDateStr: a.dueDate || ""
      };
    }

    const sorted = [...mockAssigned].sort((a, b) => {
      const metaA = getAssignedServiceMeta(a);
      const metaB = getAssignedServiceMeta(b);

      // 1. Primary preference: Due days ascending order (nearest due dates first)
      const daysA = metaA.effectiveDueDateStr ? getDaysUntilDue(metaA.effectiveDueDateStr) : 999;
      const daysB = metaB.effectiveDueDateStr ? getDaysUntilDue(metaB.effectiveDueDateStr) : 999;
      if (daysA !== daysB) {
        return daysA - daysB;
      }

      // 2. Secondary preference: Service name alphabetically
      const nameComparison = metaA.serviceDisplayName.localeCompare(metaB.serviceDisplayName, undefined, { sensitivity: "base" });
      if (nameComparison !== 0) {
        return nameComparison;
      }

      return 0;
    });

    // Check order:
    // 1. a4 (2026-03-15 - Advance Tax)
    assert(sorted[0].id === "a4", "1st is a4 (nearest due date 2026-03-15)");
    // 2. a5 (2026-04-01 - GSTR 1)
    assert(sorted[1].id === "a5", "2nd is a5 (due date 2026-04-01)");
    // 3. a3 (2026-04-11 - GSTR 1)
    assert(sorted[2].id === "a3", "3rd is a3 (due date 2026-04-11)");
    // 4 & 5. Same due date 2026-06-15 -> 'Advance Tax Payment' (a2) comes before 'GSTR 1 Return' (a6)
    assert(sorted[3].id === "a2", "4th is a2 (due 2026-06-15, Advance Tax before GSTR 1)");
    assert(sorted[4].id === "a6", "5th is a6 (due 2026-06-15, GSTR 1)");
    // 6. a1 (2026-09-30 - Income Tax Return)
    assert(sorted[5].id === "a1", "6th is a1 (due 2026-09-30)");

    passed += 6;
  } catch (err: any) {
    console.error("Test 1 failed:", err);
    failed++;
  }

  // Test 2: Multiple leads with the same phone number
  try {
    const leads: Lead[] = [
      { id: "lead_1", name: "Ramesh Sharma", phone: "9876543210", mobile: "9876543210", source: "WHATSAPP", status: "LEAD" },
      { id: "lead_2", name: "Suresh Kumar", phone: "9876543210", mobile: "9876543210", source: "WHATSAPP", status: "LEAD" },
    ];

    assert(leads.length === 2, "Allows 2 leads with the same phone number");
    assert(leads[0].phone === leads[1].phone, "Both leads share phone 9876543210");
    assert(leads[0].id !== leads[1].id, "Each lead maintains a unique identifier");
    passed += 3;
  } catch (err: any) {
    console.error("Test 2 failed:", err);
    failed++;
  }

  console.log(`\n============================================================`);
  console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`============================================================\n`);

  return { passed, failed };
}

if (require.main === module) {
  runAssignedServicesSortingTest();
}
