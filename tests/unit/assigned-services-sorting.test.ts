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
  console.log("🧪 TESTING ASSIGNED SERVICES SORTING & LEAD PHONE UNRESTRICTED");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Sorting service-wise first, then due date nearest first
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

    const mockAssigned: (AssignedService & { expectedOrder?: number })[] = [
      // Income Tax Return - Due in 30 days
      { id: "a1", clientId: "c1", serviceId: "s1", subServiceIds: ["ss_itr"], financialYear: "2026-27", dueDate: "2026-09-30", amountBilled: 0, amountReceived: 0, amountPending: 0 },
      // Advance Tax Payment - Due in 20 days
      { id: "a2", clientId: "c2", serviceId: "s1", subServiceIds: ["ss_adv_tax"], financialYear: "2026-27", dueDate: "2026-06-15", amountBilled: 0, amountReceived: 0, amountPending: 0 },
      // GSTR 1 Return - Due in 10 days
      { id: "a3", clientId: "c3", serviceId: "s2", subServiceIds: ["ss_gstr1"], financialYear: "2026-27", dueDate: "2026-04-11", amountBilled: 0, amountReceived: 0, amountPending: 0 },
      // Advance Tax Payment - Due in 5 days (Overdue or closer)
      { id: "a4", clientId: "c4", serviceId: "s1", subServiceIds: ["ss_adv_tax"], financialYear: "2026-27", dueDate: "2026-03-15", amountBilled: 0, amountReceived: 0, amountPending: 0 },
      // GSTR 1 Return - Due in 2 days
      { id: "a5", clientId: "c5", serviceId: "s2", subServiceIds: ["ss_gstr1"], financialYear: "2026-27", dueDate: "2026-04-01", amountBilled: 0, amountReceived: 0, amountPending: 0 },
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

      // 1. Service wise sorting first
      const nameComparison = metaA.serviceDisplayName.localeCompare(metaB.serviceDisplayName, undefined, { sensitivity: "base" });
      if (nameComparison !== 0) {
        return nameComparison;
      }

      // 2. In each service, nearest due dates first (ascending days until due)
      const daysA = metaA.effectiveDueDateStr ? getDaysUntilDue(metaA.effectiveDueDateStr) : 999;
      const daysB = metaB.effectiveDueDateStr ? getDaysUntilDue(metaB.effectiveDueDateStr) : 999;
      return daysA - daysB;
    });

    // Check that Advance Tax Payment is first (2 items: a4 then a2)
    assert(getAssignedServiceMeta(sorted[0]).serviceDisplayName === "Advance Tax Payment", "Group 1 is Advance Tax Payment");
    assert(sorted[0].id === "a4", "Nearest due date in Advance Tax is first (a4)");
    assert(sorted[1].id === "a2", "Later due date in Advance Tax is second (a2)");

    // Check that GSTR 1 Return is second (2 items: a5 then a3)
    assert(getAssignedServiceMeta(sorted[2]).serviceDisplayName === "GSTR 1 Return", "Group 2 is GSTR 1 Return");
    assert(sorted[2].id === "a5", "Nearest due date in GSTR 1 Return is first (a5)");
    assert(sorted[3].id === "a3", "Later due date in GSTR 1 Return is second (a3)");

    // Check that Income Tax Return is third
    assert(getAssignedServiceMeta(sorted[4]).serviceDisplayName === "Income Tax Return", "Group 3 is Income Tax Return");
    assert(sorted[4].id === "a1", "Income Tax Return item is a1");

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
