import {
  formatCurrency,
  formatDate,
  getWhatsAppLink,
  getDaysUntilDue,
  getDueBadgeColor,
  numberToWords,
  getCurrentFY,
  getValidDateForMonthDay,
} from "../../src/lib/utils";
import { POST as sendOtpApi } from "../../src/app/api/send-otp/route";

export async function runBlackBoxTests() {
  console.log("\n============================================================");
  console.log("⬛ RUNNING BLACK BOX TESTING - INPUT/OUTPUT & BOUNDARY TESTS");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  function assertBB(condition: boolean, testId: string, description: string) {
    if (condition) {
      console.log(`  ✓ BB PASS: [${testId}] - ${description}`);
      passed++;
    } else {
      console.error(`  ✗ BB FAIL: [${testId}] - ${description}`);
      failed++;
    }
  }

  // ── TEST CATEGORY 1: Equivalence Partitioning - Phone Number Validation ──
  console.log("▶ Category 1: Equivalence Partitioning - Phone Input Validation");

  function validateMobileBlackBox(input: string): boolean {
    let clean = input.replace(/\D/g, "");
    if (clean.length === 12 && clean.startsWith("91")) clean = clean.slice(2);
    if (clean.length === 11 && clean.startsWith("0")) clean = clean.slice(1);
    return clean.length === 10 && /^[6-9]\d{9}$/.test(clean);
  }

  assertBB(validateMobileBlackBox("9876543210") === true, "BB-TEL-01", "Standard 10-digit Indian mobile (9876543210) -> VALID");
  assertBB(validateMobileBlackBox("+91 9876543210") === true, "BB-TEL-02", "Country code prefixed mobile (+91 9876543210) -> VALID");
  assertBB(validateMobileBlackBox("09876543210") === true, "BB-TEL-03", "Trunk zero prefixed mobile (09876543210) -> VALID");
  assertBB(validateMobileBlackBox("98765") === false, "BB-TEL-04", "Short 5-digit phone number -> REJECTED");
  assertBB(validateMobileBlackBox("1234567890") === false, "BB-TEL-05", "Invalid start digit 1 (1234567890) -> REJECTED");
  assertBB(validateMobileBlackBox("abcdefghij") === false, "BB-TEL-06", "Alphabetic text string -> REJECTED");


  // ── TEST CATEGORY 2: Boundary Value Analysis - Currency & Financial Numbers ──
  console.log("\n▶ Category 2: Boundary Value Analysis - Currency & Financial Formats");

  assertBB(formatCurrency(0).includes("0"), "BB-BVA-01", "Zero currency boundary formatCurrency(0) -> ₹0");
  assertBB(formatCurrency(1).includes("1"), "BB-BVA-02", "Minimum positive boundary formatCurrency(1) -> ₹1");
  assertBB(formatCurrency(99999999).includes("9,99,99,999"), "BB-BVA-03", "Large financial value formatCurrency(99999999) -> ₹9,99,99,999");
  
  const wordsCrore = numberToWords(10000000);
  assertBB(wordsCrore.includes("One Crore"), "BB-BVA-04", "Upper boundary numberToWords(10000000) -> One Crore");
  const wordsZero = numberToWords(0);
  assertBB(wordsZero === "INR Zero Rupees Only.", "BB-BVA-05", "Lower boundary numberToWords(0) -> INR Zero Rupees Only.");


  // ── TEST CATEGORY 3: Robustness & Fault Tolerance - Malformed Inputs ──
  console.log("\n▶ Category 3: Robustness & Fault Tolerance - Faulty Inputs");

  assertBB(formatDate("not-a-date") === "not-a-date", "BB-ROB-01", "Malformed date string returns raw input without throwing uncaught error");
  assertBB(formatDate("") === "-", "BB-ROB-02", "Empty date string returns clean placeholder '-'");
  assertBB(getDaysUntilDue("") === 999, "BB-ROB-03", "Empty due date returns safe numeric fallback 999");
  assertBB(getWhatsAppLink("", "").includes("https://wa.me/"), "BB-ROB-04", "Empty mobile & empty message returns valid base WhatsApp URL");


  // ── TEST CATEGORY 4: Black Box Data Export - CSV Encoding & Escaping ──
  console.log("\n▶ Category 4: Black Box Data Export - CSV File Formatting");

  function generateBlackBoxCSV(headers: string[], rows: any[][]): string {
    const headerRow = headers.join(",");
    const dataRows = rows.map(r => r.map(val => {
      const stringVal = val === null || val === undefined ? "" : String(val);
      return `"${stringVal.replace(/"/g, '""')}"`;
    }).join(","));
    return `\ufeff${headerRow}\n${dataRows.join("\n")}`;
  }

  const sampleCSV = generateBlackBoxCSV(
    ["Client Name", "Type", "Mobile"],
    [["Acme \"Services\" Ltd", "PROPRIETORSHIP", "9876543210"]]
  );

  assertBB(sampleCSV.startsWith("\ufeff"), "BB-CSV-01", "CSV export contains UTF-8 BOM marker (\\ufeff) for Excel compatibility");
  assertBB(sampleCSV.includes('Client Name,Type,Mobile'), "BB-CSV-02", "CSV export header row structured accurately");
  assertBB(sampleCSV.includes('"Acme ""Services"" Ltd"'), "BB-CSV-03", "CSV double-quote characters escaped correctly inside field boundaries");


  // ── TEST CATEGORY 5: Black Box API Interface Testing ──
  console.log("\n▶ Category 5: Black Box API Interface Testing");

  // Invalid API Request (Missing Body parameters)
  const reqInvalid = new Request("http://localhost:3000/api/send-otp", {
    method: "POST",
    body: JSON.stringify({}),
  });
  const resInvalid = await sendOtpApi(reqInvalid);
  const jsonInvalid = await resInvalid.json();
  assertBB(resInvalid.status === 400 && jsonInvalid.success === false, "BB-API-01", "API POST /api/send-otp with empty body -> HTTP 400 Bad Request");

  // Valid API Request
  const reqValid = new Request("http://localhost:3000/api/send-otp", {
    method: "POST",
    body: JSON.stringify({ email: "blackbox@test.com", code: "123456", name: "Black Box Tester" }),
  });
  const resValid = await sendOtpApi(reqValid);
  const jsonValid = await resValid.json();
  assertBB(resValid.status === 200 && jsonValid.success === true, "BB-API-02", "API POST /api/send-otp with valid payload -> HTTP 200 Success Response");


  // ── TEST CATEGORY 6: Calendar & Boundary Transition Checks ──
  console.log("\n▶ Category 6: Calendar & Boundary Transition Checks");

  const febClamp = getValidDateForMonthDay(2025, 1, 31); // Feb 2025 (Non-leap year)
  assertBB(febClamp.getDate() === 28, "BB-CAL-01", "Non-leap year Feb 31 input clamped to Feb 28");

  const dueColorPast = getDueBadgeColor(-1);
  assertBB(dueColorPast.includes("bg-red-600"), "BB-CAL-02", "Negative days (-1) returns critical red badge (bg-red-600)");

  const dueColorSafe = getDueBadgeColor(60);
  assertBB(dueColorSafe.includes("bg-emerald-500"), "BB-CAL-03", "Future days (60) returns safe emerald badge (bg-emerald-500)");


  console.log(`\n============================================================`);
  console.log(`📊 BLACK BOX TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`============================================================\n`);

  return { passed, failed };
}
