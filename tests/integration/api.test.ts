import { POST as sendOtpPost } from "../../src/app/api/send-otp/route";
import { POST as servicesPost, PUT as servicesPut } from "../../src/app/api/services/route";

export async function runApiTests() {
  console.log("\n🧪 RUNNING INTEGRATION TESTS: Next.js API Routes (/api/send-otp & /api/services)\n" + "─".repeat(60));
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

  // 1. Test POST /api/send-otp with missing fields (should return HTTP 400)
  try {
    const mockInvalidReq = new Request("http://localhost:3000/api/send-otp", {
      method: "POST",
      body: JSON.stringify({ email: "" }),
    });
    const resInvalid = await sendOtpPost(mockInvalidReq);
    const jsonInvalid = await resInvalid.json();
    assert(resInvalid.status === 400 && jsonInvalid.success === false, "POST /api/send-otp returns HTTP 400 when missing email/code");
  } catch (err: any) {
    console.error("API test error:", err);
    failed++;
  }

  // 2. Test POST /api/send-otp with valid payload (should return HTTP 200)
  try {
    const mockValidReq = new Request("http://localhost:3000/api/send-otp", {
      method: "POST",
      body: JSON.stringify({ email: "e2e_test@crmexpert.com", code: "889900", name: "E2E Tester" }),
    });
    const resValid = await sendOtpPost(mockValidReq);
    const jsonValid = await resValid.json();
    assert(resValid.status === 200 && jsonValid.success === true, "POST /api/send-otp returns HTTP 200 and success status for valid request");
  } catch (err: any) {
    console.error("API test error:", err);
    failed++;
  }

  // 3. Test POST /api/services with 0 months selected (should return HTTP 400 Bad Request)
  try {
    const mockEmptyMonthsReq = new Request("http://localhost:3000/api/services", {
      method: "POST",
      body: JSON.stringify({ name: "Corporate Compliance", price: 10000, applicableMonths: [] }),
    });
    const resEmpty = await servicesPost(mockEmptyMonthsReq);
    const jsonEmpty = await resEmpty.json();
    assert(
      resEmpty.status === 400 && jsonEmpty.error === "At least one month must be selected for the service",
      "POST /api/services blocks 0 months with HTTP 400 'At least one month must be selected for the service'"
    );
  } catch (err: any) {
    console.error("API services validation error:", err);
    failed++;
  }

  // 4. Test POST /api/services with valid months selected (should return HTTP 200)
  try {
    const mockValidMonthsReq = new Request("http://localhost:3000/api/services", {
      method: "POST",
      body: JSON.stringify({ name: "Corporate Compliance", price: 10000, applicableMonths: ["APRIL", "OCTOBER"] }),
    });
    const resValidMonths = await servicesPost(mockValidMonthsReq);
    const jsonValidMonths = await resValidMonths.json();
    assert(
      resValidMonths.status === 200 && jsonValidMonths.success === true && jsonValidMonths.data.applicableMonths.length === 2,
      "POST /api/services succeeds with valid selected months array"
    );
  } catch (err: any) {
    console.error("API services validation error:", err);
    failed++;
  }

  // 5. Test PUT /api/services with 0 months selected (should return HTTP 400 Bad Request)
  try {
    const mockPutEmptyReq = new Request("http://localhost:3000/api/services", {
      method: "PUT",
      body: JSON.stringify({ id: "srv_test_123", name: "Audit Service", price: 5000, applicableMonths: [] }),
    });
    const resPutEmpty = await servicesPut(mockPutEmptyReq);
    const jsonPutEmpty = await resPutEmpty.json();
    assert(
      resPutEmpty.status === 400 && jsonPutEmpty.error === "At least one month must be selected for the service",
      "PUT /api/services blocks 0 months with HTTP 400 'At least one month must be selected for the service'"
    );
  } catch (err: any) {
    console.error("API services validation error:", err);
    failed++;
  }

  console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);
  return { passed, failed };
}
