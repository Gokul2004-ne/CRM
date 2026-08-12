import { POST } from "../../src/app/api/send-otp/route";

export async function runApiTests() {
  console.log("\n🧪 RUNNING INTEGRATION TESTS: Next.js API Routes (/api/send-otp)\n" + "─".repeat(60));
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

  // 1. Test POST with missing fields (should return HTTP 400)
  try {
    const mockInvalidReq = new Request("http://localhost:3000/api/send-otp", {
      method: "POST",
      body: JSON.stringify({ email: "" }),
    });
    const resInvalid = await POST(mockInvalidReq);
    const jsonInvalid = await resInvalid.json();
    assert(resInvalid.status === 400 && jsonInvalid.success === false, "POST /api/send-otp returns HTTP 400 when missing email/code");
  } catch (err: any) {
    console.error("API test error:", err);
    failed++;
  }

  // 2. Test POST with valid payload (should return HTTP 200)
  try {
    const mockValidReq = new Request("http://localhost:3000/api/send-otp", {
      method: "POST",
      body: JSON.stringify({ email: "e2e_test@crmexpert.com", code: "889900", name: "E2E Tester" }),
    });
    const resValid = await POST(mockValidReq);
    const jsonValid = await resValid.json();
    assert(resValid.status === 200 && jsonValid.success === true, "POST /api/send-otp returns HTTP 200 and success status for valid request");
  } catch (err: any) {
    console.error("API test error:", err);
    failed++;
  }

  console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);
  return { passed, failed };
}
