import { GET as getClients, POST as createClient, DELETE as deleteClients } from "../../src/app/api/clients/route";
import { DELETE as deleteClientById } from "../../src/app/api/clients/[id]/route";
import { supabase } from "../../src/lib/supabase";
import { ensureUUID } from "../../src/lib/utils";

export async function runClientIsolationTests() {
  console.log("\n🧪 RUNNING MULTI-TENANT ISOLATION & CLIENT DELETION SCOPING TESTS\n" + "─".repeat(60));
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

  const userA = "usr_account_a_krishna_test";
  const userB = "usr_account_b_krishna_test";

  const clientAId = ensureUUID("c_krishna_account_a_111");
  const clientBId = ensureUUID("c_krishna_account_b_222");

  try {
    // 0. Clean up pre-existing test data
    await supabase.from("clients").delete().eq("user_id", userA);
    await supabase.from("clients").delete().eq("user_id", userB);

    // 1. Create client "Krishna" under Account A
    const reqCreateA = new Request("http://localhost:3000/api/clients", {
      method: "POST",
      body: JSON.stringify({
        id: clientAId,
        user_id: userA,
        name: "Krishna",
        type: "PROPRIETORSHIP",
        phone: "9876543210",
        email: "krishna.a@example.com",
      }),
    });
    const resCreateA = await createClient(reqCreateA);
    const jsonCreateA = await resCreateA.json();
    assert(resCreateA.status === 201 && jsonCreateA.success === true, "Account A creates client named 'Krishna'");

    // 2. Create client "Krishna" under Account B
    const reqCreateB = new Request("http://localhost:3000/api/clients", {
      method: "POST",
      body: JSON.stringify({
        id: clientBId,
        user_id: userB,
        name: "Krishna",
        type: "PRIVATE_LIMITED",
        phone: "9123456789",
        email: "krishna.b@example.com",
      }),
    });
    const resCreateB = await createClient(reqCreateB);
    const jsonCreateB = await resCreateB.json();
    assert(resCreateB.status === 201 && jsonCreateB.success === true, "Account B creates matching client named 'Krishna'");

    // 3. Verify both accounts see only their own "Krishna"
    const reqGetA = new Request(`http://localhost:3000/api/clients?userId=${userA}`);
    const resGetA = await getClients(reqGetA);
    const jsonGetA = await resGetA.json();
    assert(jsonGetA.data.length === 1 && jsonGetA.data[0].id === clientAId, "Account A GET /api/clients returns only Account A's client");

    const reqGetB = new Request(`http://localhost:3000/api/clients?userId=${userB}`);
    const resGetB = await getClients(reqGetB);
    const jsonGetB = await resGetB.json();
    assert(jsonGetB.data.length === 1 && jsonGetB.data[0].id === clientBId, "Account B GET /api/clients returns only Account B's client");

    // 4. Cross-account deletion attempt: Account A attempts to delete Account B's client ID -> Must return HTTP 403 Forbidden
    const reqDeleteCross = new Request(`http://localhost:3000/api/clients/${clientBId}?userId=${userA}`, {
      method: "DELETE",
    });
    const resDeleteCross = await deleteClientById(reqDeleteCross, { params: Promise.resolve({ id: clientBId }) });
    const jsonDeleteCross = await resDeleteCross.json();
    assert(
      resDeleteCross.status === 403 && jsonDeleteCross.success === false,
      "DELETE /api/clients/:id blocks cross-account deletion attempt with HTTP 403 Forbidden"
    );

    // 5. Account A deletes its own "Krishna"
    const reqDeleteA = new Request(`http://localhost:3000/api/clients/${clientAId}?userId=${userA}`, {
      method: "DELETE",
    });
    const resDeleteA = await deleteClientById(reqDeleteA, { params: Promise.resolve({ id: clientAId }) });
    const jsonDeleteA = await resDeleteA.json();
    assert(resDeleteA.status === 200 && jsonDeleteA.success === true, "Account A successfully deletes its own client 'Krishna'");

    // 6. Verify Account A's "Krishna" is removed
    const resGetAAfter = await getClients(new Request(`http://localhost:3000/api/clients?userId=${userA}`));
    const jsonGetAAfter = await resGetAAfter.json();
    assert(jsonGetAAfter.data.length === 0, "Account A's client list is now empty after deletion");

    // 7. Critical Fix Verification: Verify Account B's "Krishna" remains INTACT
    const resGetBAfter = await getClients(new Request(`http://localhost:3000/api/clients?userId=${userB}`));
    const jsonGetBAfter = await resGetBAfter.json();
    assert(
      jsonGetBAfter.data.length === 1 && jsonGetBAfter.data[0].id === clientBId && jsonGetBAfter.data[0].name === "Krishna",
      "Account B's 'Krishna' remains completely INTACT after Account A deleted its own 'Krishna'"
    );

    // 8. Test 404 Not Found for non-existent client deletion
    const reqDelete404 = new Request(`http://localhost:3000/api/clients/c_nonexistent_999?userId=${userA}`, {
      method: "DELETE",
    });
    const resDelete404 = await deleteClientById(reqDelete404, { params: Promise.resolve({ id: "c_nonexistent_999" }) });
    assert(resDelete404.status === 404, "DELETE /api/clients/:id returns HTTP 404 Not Found for non-existent client ID");

    // Cleanup test data
    await supabase.from("clients").delete().eq("user_id", userA);
    await supabase.from("clients").delete().eq("user_id", userB);
  } catch (err: any) {
    console.error("Client isolation test error:", err);
    failed++;
  }

  console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);
  return { passed, failed };
}
