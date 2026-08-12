import {
  formatCurrency,
  formatDate,
  getWhatsAppLink,
  getDaysUntilDue,
  getDaysRemaining,
  getDueBadgeColor,
  getCurrentFY,
  getFYOptions,
  getFYDateRange,
  getFYMonths,
  numberToWords,
  getValidDateForMonthDay,
} from "../../src/lib/utils";

export async function runUtilsTests() {
  console.log("\n🧪 RUNNING UNIT TESTS: Utility Functions (src/lib/utils.ts)\n" + "─".repeat(60));
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

  // 1. Currency Formatting
  assert(formatCurrency(1500).includes("1,500"), "formatCurrency(1500) formats INR number");
  assert(formatCurrency(0).includes("0"), "formatCurrency(0) handles zero");

  // 2. Date Formatting & Safety
  assert(formatDate("2026-03-31") === "31 Mar 2026", "formatDate('2026-03-31') returns 31 Mar 2026");
  assert(formatDate("") === "-", "formatDate('') returns '-'");
  assert(formatDate("invalid-date") === "invalid-date", "formatDate('invalid-date') handles malformed string safely");

  // 3. WhatsApp Link Generation
  assert(getWhatsAppLink("9876543210").includes("phone=919876543210"), "getWhatsAppLink adds 91 prefix to 10-digit number");
  assert(getWhatsAppLink("+91 9876543210").includes("phone=919876543210"), "getWhatsAppLink cleans formatted phone number");
  assert(getWhatsAppLink("", "Hello").includes("?text=Hello"), "getWhatsAppLink handles empty phone with message");

  // 4. Days Until Due & Remaining
  assert(typeof getDaysUntilDue("2030-01-01") === "number", "getDaysUntilDue returns numeric difference");
  assert(getDaysUntilDue("") === 999, "getDaysUntilDue handles empty date safely");
  assert(getDaysRemaining("") === 999, "getDaysRemaining handles empty date safely");

  // 5. Due Badge Color Logic
  assert(getDueBadgeColor(-5).includes("bg-red-600"), "getDueBadgeColor(-5) returns red-600 badge for past due");
  assert(getDueBadgeColor(5).includes("bg-red-500"), "getDueBadgeColor(5) returns red-500 badge for due within 7 days");
  assert(getDueBadgeColor(15).includes("bg-orange-500"), "getDueBadgeColor(15) returns orange badge for due within 30 days");
  assert(getDueBadgeColor(45).includes("bg-emerald-500"), "getDueBadgeColor(45) returns emerald badge for safe due dates");

  // 6. Financial Year Helpers
  const currentFY = getCurrentFY();
  assert(/^\d{4}-\d{2}$/.test(currentFY), `getCurrentFY() returns valid FY format: ${currentFY}`);
  const fyOptions = getFYOptions();
  assert(fyOptions.length === 5, "getFYOptions() returns 5 FY options");
  const fyRange = getFYDateRange("2025-26");
  assert(fyRange.start.getMonth() === 3 && fyRange.start.getDate() === 1, "getFYDateRange start date is April 1");
  assert(fyRange.end.getMonth() === 2 && fyRange.end.getDate() === 31, "getFYDateRange end date is March 31");
  const fyMonths = getFYMonths("2025-26");
  assert(fyMonths.length === 12, "getFYMonths returns 12 months");

  // 7. Number to Words Helper
  assert(numberToWords(0) === "INR Zero Rupees Only.", "numberToWords(0) returns Zero Rupees");
  assert(numberToWords(1500).includes("One Thousand Five Hundred"), "numberToWords(1500) returns One Thousand Five Hundred");
  assert(numberToWords(100000).includes("One Lakh"), "numberToWords(100000) converts Lakhs correctly");
  assert(numberToWords(10000000).includes("One Crore"), "numberToWords(10000000) converts Crores correctly");

  // 8. Month Day Boundary Helper
  const leapFebDate = getValidDateForMonthDay(2024, 1, 31); // Feb 2024 (Leap year) max day 29
  assert(leapFebDate.getDate() === 29, "getValidDateForMonthDay clamps Feb 31 to Feb 29 in leap year");

  console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);
  return { passed, failed };
}
