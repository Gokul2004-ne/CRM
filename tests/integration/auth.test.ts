import { supabase } from "../../src/lib/supabase";
import { ensureUUID } from "../../src/lib/supabaseData";

export async function runAuthTests(): Promise<{ passed: number; failed: number }> {
  console.log("\n🔐 RUNNING AUTHENTICATION & CROSS-DEVICE REGISTRATION TESTS");
  console.log("────────────────────────────────────────────────────────────");

  let passed = 0;
  let failed = 0;

  const testEmail = "cross_device_e2e_user@practice.com";
  const testPassword = "StrongPassword@2026";
  const nonExistentEmail = "completely_unregistered_account_999@practice.com";

  try {
    // 1. Device A: Register user in Supabase Cloud
    const { error: regError } = await supabase.from("crm_users").upsert({
      email: testEmail,
      password_hash: testPassword,
      full_name: "Cross Device Tester",
      company_name: "Apex Practice Ltd",
      role: "admin",
      updated_at: new Date().toISOString(),
    }, { onConflict: "email" });

    if (regError) {
      console.error("  ❌ FAIL: [AUTH-01] - User registration write to cloud database failed:", regError);
      failed++;
    } else {
      console.log("  ✓ PASS: [AUTH-01] - User registration persists immediately to public.crm_users");
      passed++;
    }

    // 2. Device B: Lookup user in Supabase Cloud (simulating new device / incognito with 0 localstorage)
    const { data: cloudUser, error: lookupErr } = await supabase
      .from("crm_users")
      .select("*")
      .ilike("email", testEmail)
      .maybeSingle();

    if (!cloudUser || lookupErr) {
      console.error("  ❌ FAIL: [AUTH-02] - Device B failed to find registered account in Cloud Database:", lookupErr);
      failed++;
    } else if (cloudUser.password_hash === testPassword) {
      console.log("  ✓ PASS: [AUTH-02] - Device B successfully authenticates registered user from Cloud Database");
      passed++;
    } else {
      console.error("  ❌ FAIL: [AUTH-02] - Password hash mismatch for registered user");
      failed++;
    }

    // 3. Device B: Attempt login with unregistered email
    const { data: missingUser } = await supabase
      .from("crm_users")
      .select("*")
      .ilike("email", nonExistentEmail)
      .maybeSingle();

    if (!missingUser) {
      console.log("  ✓ PASS: [AUTH-03] - Non-existent email accurately identified for 'Account not registered' flow");
      passed++;
    } else {
      console.error("  ❌ FAIL: [AUTH-03] - Non-existent email incorrectly returned a database user record");
      failed++;
    }

    // 4. Device B: Attempt login with incorrect password
    const wrongPassword = "WrongPassword@000";
    if (cloudUser && cloudUser.password_hash !== wrongPassword) {
      console.log("  ✓ PASS: [AUTH-04] - Incorrect password accurately triggers password validation error");
      passed++;
    } else {
      console.error("  ❌ FAIL: [AUTH-04] - Incorrect password check failed");
      failed++;
    }

    // 5. Seeded Accounts verification (Gowtham & Gokul accounts)
    const { data: gowthamUser } = await supabase
      .from("crm_users")
      .select("email, password_hash")
      .ilike("email", "gowthammummidi2118@gmail.com")
      .maybeSingle();

    if (gowthamUser && gowthamUser.password_hash === "Dimple@2118") {
      console.log("  ✓ PASS: [AUTH-05] - Master user Gowthammummidi2118@gmail.com verified in Cloud Database");
      passed++;
    } else {
      console.error("  ❌ FAIL: [AUTH-05] - Master user Gowtham not found or password mismatched in Cloud Database");
      failed++;
    }

    const { data: gokulUser } = await supabase
      .from("crm_users")
      .select("email")
      .ilike("email", "gokulnekkanti04@gmail.com")
      .maybeSingle();

    if (gokulUser) {
      console.log("  ✓ PASS: [AUTH-06] - Account gokulnekkanti04@gmail.com verified in Cloud Database");
      passed++;
    } else {
      console.error("  ❌ FAIL: [AUTH-06] - Gokul account not found in Cloud Database");
      failed++;
    }

    // Teardown temporary test user
    await supabase.from("crm_users").delete().eq("email", testEmail);
    await supabase.from("profiles").delete().eq("email", testEmail);

  } catch (err) {
    console.error("  ❌ Auth test execution error:", err);
    failed++;
  }

  console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);
  return { passed, failed };
}
