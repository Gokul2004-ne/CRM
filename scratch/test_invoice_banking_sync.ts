import { syncInvoiceToSupabase, syncBankingEntryToSupabase, fetchAllCRMData, removeInvoiceFromSupabase, removeBankingEntryFromSupabase, getUserId } from "../src/lib/supabaseData";
import { generateUUID, ensureUUID } from "../src/lib/utils";
import { useAppStore } from "../src/lib/store";
import { Invoice, BankingEntry } from "../src/lib/types";

async function testInvoiceBankingSync() {
  console.log("============================================================");
  console.log("🧪 TESTING INVOICE & BANKING BIDIRECTIONAL SYNC & NO-DUPLICATES");
  console.log("============================================================");

  const userId = await getUserId();
  console.log("Current User ID:", userId);

  // 1. Initial State
  const initialData = await fetchAllCRMData();
  const initialBankingCount = initialData?.bankingEntries?.length || 0;
  const initialInvoiceCount = initialData?.invoices?.length || 0;
  console.log(`Initial Banking: ${initialBankingCount}, Invoices: ${initialInvoiceCount}`);

  // 2. Add a new Invoice
  const invoiceId = generateUUID();
  const clientId = generateUUID();
  const testInvoice: Invoice = {
    id: invoiceId,
    invoiceNumber: "INV/2026-TEST99",
    type: "INVOICE",
    clientId: clientId,
    clientName: "Sync Test Corp",
    items: [{ id: "item1", description: "Audit Services", quantity: 1, rate: 20000, amount: 20000 }],
    subtotal: 20000,
    gstRate: 18,
    gstAmount: 3600,
    total: 23600,
    amountReceived: 0,
    balanceDue: 23600,
    financialYear: "2025-2026",
    status: "SENT",
    createdAt: new Date().toISOString(),
    dueDate: "2026-03-31",
  };

  console.log(`\n1. Creating invoice #${testInvoice.invoiceNumber} (${invoiceId})...`);
  await useAppStore.getState().addInvoice(testInvoice);

  // Verify in Supabase
  let crmData = await fetchAllCRMData();
  let foundInv = crmData?.invoices?.find((i: any) => i.id === invoiceId);
  let matchingBanking = crmData?.bankingEntries?.filter((b: any) => b.remark?.includes(`#${testInvoice.invoiceNumber} `));

  console.log("Found invoice in Supabase:", !!foundInv);
  console.log("Matching banking entries count:", matchingBanking.length);
  if (matchingBanking.length !== 1) {
    throw new Error(`Expected exactly 1 banking entry, found ${matchingBanking.length}`);
  }
  if (matchingBanking[0].amountBilled !== 23600 || matchingBanking[0].paymentStatus !== "PENDING") {
    throw new Error(`Banking amounts/status mismatch: billed=${matchingBanking[0].amountBilled}, status=${matchingBanking[0].paymentStatus}`);
  }

  // 3. Edit and save the Invoice multiple times (simulate editing amount received)
  console.log("\n2. Updating invoice (Amount Received: ₹10,000)...");
  const updatedInv: Invoice = {
    ...testInvoice,
    amountReceived: 10000,
    balanceDue: 13600,
    status: "SENT",
  };
  await useAppStore.getState().updateInvoice(updatedInv);

  crmData = await fetchAllCRMData();
  matchingBanking = crmData?.bankingEntries?.filter((b: any) => b.remark?.includes(`#${testInvoice.invoiceNumber} `));
  console.log("Matching banking entries after update 1:", matchingBanking.length);
  if (matchingBanking.length !== 1) {
    throw new Error(`Expected exactly 1 banking entry after update, found ${matchingBanking.length}`);
  }
  if (matchingBanking[0].amountReceived !== 10000 || matchingBanking[0].paymentStatus !== "PARTIAL") {
    throw new Error(`Banking status should be PARTIAL: received=${matchingBanking[0].amountReceived}, status=${matchingBanking[0].paymentStatus}`);
  }

  console.log("\n3. Updating invoice again (Status: PAID, Amount Received: ₹23,600)...");
  const fullyPaidInv: Invoice = {
    ...testInvoice,
    amountReceived: 23600,
    balanceDue: 0,
    status: "PAID",
  };
  await useAppStore.getState().updateInvoice(fullyPaidInv);

  crmData = await fetchAllCRMData();
  matchingBanking = crmData?.bankingEntries?.filter((b: any) => b.remark?.includes(`#${testInvoice.invoiceNumber} `));
  console.log("Matching banking entries after update 2:", matchingBanking.length);
  if (matchingBanking.length !== 1) {
    throw new Error(`Expected exactly 1 banking entry after paid update, found ${matchingBanking.length}`);
  }
  if (matchingBanking[0].amountReceived !== 23600 || matchingBanking[0].paymentStatus !== "PAID") {
    throw new Error(`Banking status should be PAID: received=${matchingBanking[0].amountReceived}, status=${matchingBanking[0].paymentStatus}`);
  }

  // 4. Update from Banking Page back to Invoice
  console.log("\n4. Updating entry from Banking side back to Invoice (Received: ₹15,000)...");
  const bEntry = matchingBanking[0];
  const updatedBEntry: BankingEntry = {
    ...bEntry,
    amountReceived: 15000,
    amountPending: 8600,
    paymentStatus: "PARTIAL",
  };
  await useAppStore.getState().updateBankingEntry(updatedBEntry);

  crmData = await fetchAllCRMData();
  foundInv = crmData?.invoices?.find((i: any) => i.id === invoiceId);
  console.log(`Invoice amount received synced back: ₹${foundInv?.amountReceived}, status: ${foundInv?.status}`);
  if (foundInv?.amountReceived !== 15000 || foundInv?.balanceDue !== 8600) {
    throw new Error(`Invoice did not sync from banking update! Amount: ${foundInv?.amountReceived}`);
  }

  // 5. Delete Invoice
  console.log("\n5. Deleting invoice...");
  await useAppStore.getState().deleteInvoice(invoiceId);

  crmData = await fetchAllCRMData();
  const stillInv = crmData?.invoices?.find((i: any) => i.id === invoiceId);
  const stillBanking = crmData?.bankingEntries?.filter((b: any) => b.remark?.includes(`#${testInvoice.invoiceNumber} `));

  console.log("Invoice remaining after delete:", !!stillInv);
  console.log("Banking entry remaining after delete:", stillBanking.length);
  if (stillInv || stillBanking.length > 0) {
    throw new Error("Teardown failed: record still in database!");
  }

  console.log("\n============================================================");
  console.log("🎉 ALL INVOICE & BANKING SYNC TESTS PASSED (ZERO DUPLICATES)!");
  console.log("============================================================\n");
}

testInvoiceBankingSync().catch((err) => {
  console.error(err);
  process.exit(1);
});
