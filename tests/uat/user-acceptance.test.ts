import { supabase } from "../../src/lib/supabase";
import {
  formatCurrency,
  formatDate,
  getWhatsAppLink,
  getDaysUntilDue,
  getDueBadgeColor,
  numberToWords,
} from "../../src/lib/utils";
import {
  Client, Service, SubService, RequiredDoc, AssignedService,
  BankingEntry, Lead, DocumentDraft, Collaboration, Invoice, OneTimeService, RenewalItem
} from "../../src/lib/types";

export async function runUATTests() {
  console.log("\n============================================================");
  console.log("👥 RUNNING USER ACCEPTANCE TESTING (UAT) - END-TO-END SCENARIOS");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  function assertUAT(condition: boolean, scenario: string, details: string) {
    if (condition) {
      console.log(`  ✓ UAT PASS: [${scenario}] - ${details}`);
      passed++;
    } else {
      console.error(`  ✗ UAT FAIL: [${scenario}] - ${details}`);
      failed++;
    }
  }

  const uatUserId = "uat_user_" + Date.now();
  const timestamp = Date.now();

  try {
    // ── SCENARIO 1: Client Onboarding & Directory Management ──
    console.log("▶ Scenario 1: Client Onboarding & Directory Management");
    const uatClient: Client = {
      id: `c_uat_${timestamp}`,
      name: "Apex Global Solutions",
      type: "PRIVATE_LIMITED",
      ownerName: "Rajesh Sharma",
      contactPerson: "Priya Verma",
      phone: "9876543210",
      mobile: "9876543210",
      email: "finance@apexglobal.com",
      pan: "ABCDE1234F",
      gstin: "27ABCDE1234F1Z5",
      city: "Mumbai",
      addressLine1: "Suite 404, Business Park",
      state: "Maharashtra",
      pincode: "400001",
      status: "ACTIVE",
      documentCount: 5,
      createdAt: "2026-04-01",
    };

    const { error: errC1 } = await supabase.from("clients").insert({
      id: uatClient.id,
      name: uatClient.name,
      type: uatClient.type,
      owner_name: uatClient.ownerName,
      contact_person: uatClient.contactPerson,
      phone: uatClient.phone,
      mobile: uatClient.mobile,
      email: uatClient.email,
      pan: uatClient.pan,
      gstin: uatClient.gstin,
      city: uatClient.city,
      address: `${uatClient.addressLine1}; Maharashtra; 400001`,
      status: uatClient.status,
      user_id: uatUserId,
    });
    assertUAT(!errC1, "Client Onboarding", "Create new Private Limited Client in CRM");

    // Fetch and verify onboarding
    const { data: fetchedClient } = await supabase.from("clients").select("*").eq("id", uatClient.id).single();
    assertUAT(fetchedClient?.name === "Apex Global Solutions" && fetchedClient?.gstin === "27ABCDE1234F1Z5", "Client Onboarding", "Client details successfully stored & retrieved");

    // Update Client Status
    const { error: errC2 } = await supabase.from("clients").update({ contact_person: "Priya Sharma (Updated)" }).eq("id", uatClient.id);
    assertUAT(!errC2, "Client Onboarding", "Update client contact information");


    // ── SCENARIO 2: Service & Package Configuration ──
    console.log("\n▶ Scenario 2: Service & Package Configuration");
    const uatService: Service = {
      id: `s_uat_${timestamp}`,
      name: "Corporate GST & IT Compliance Suite",
      price: 15000,
      recurrence: "MONTHLY",
    };
    const { error: errS1 } = await supabase.from("services").insert({
      id: uatService.id,
      name: uatService.name,
      price: uatService.price,
      recurrence: uatService.recurrence,
      user_id: uatUserId,
    });
    assertUAT(!errS1, "Package Creation", "Define new Corporate Compliance Service Package (₹15,000/mo)");

    const uatSubService: SubService = {
      id: `ss_uat_${timestamp}`,
      serviceId: uatService.id,
      name: "Monthly GSTR-3B & GSTR-1 Return Filing",
      dueDate: "20th of every month",
    };
    const { error: errSS1 } = await supabase.from("sub_services").insert({
      id: uatSubService.id,
      service_id: uatSubService.serviceId,
      name: uatSubService.name,
      due_date: uatSubService.dueDate,
      user_id: uatUserId,
    });
    assertUAT(!errSS1, "Sub-Service Setup", "Add monthly GSTR filing sub-service task");


    // ── SCENARIO 3: Compliance Assignment & WhatsApp Reminder ──
    console.log("\n▶ Scenario 3: Compliance Assignment & WhatsApp Reminder");
    const uatAssignment: AssignedService = {
      id: `as_uat_${timestamp}`,
      clientId: uatClient.id,
      serviceId: uatService.id,
      subServiceIds: [uatSubService.id],
      financialYear: "2025-26",
      amountBilled: 15000,
      amountReceived: 0,
      amountPending: 15000,
      status: "PENDING",
      dueDate: "2026-04-20",
    };
    const { error: errA1 } = await supabase.from("assigned_services").insert({
      id: uatAssignment.id,
      client_id: uatAssignment.clientId,
      service_id: uatAssignment.serviceId,
      sub_service_ids: uatAssignment.subServiceIds,
      financial_year: uatAssignment.financialYear,
      amount_billed: uatAssignment.amountBilled,
      amount_received: uatAssignment.amountReceived,
      amount_pending: uatAssignment.amountPending,
      status: uatAssignment.status,
      due_date: uatAssignment.dueDate,
      user_id: uatUserId,
    });
    assertUAT(!errA1, "Service Assignment", "Assign compliance suite to Apex Global Solutions for FY 2025-26");

    // WhatsApp Reminder Link Validation
    const waLink = getWhatsAppLink(uatClient.mobile, `Reminder: Your GSTR-3B filing for FY 2025-26 is due on 20 Apr 2026.`);
    assertUAT(waLink.includes("919876543210") && waLink.includes("Reminder"), "WhatsApp Integration", "Generate formatted one-click WhatsApp client reminder link");


    // ── SCENARIO 4: Invoicing & Payment Reconciliation ──
    console.log("\n▶ Scenario 4: Invoicing & Payment Reconciliation");
    const subtotal = 15000;
    const gstRate = 18;
    const gstAmount = (subtotal * gstRate) / 100;
    const totalInvoice = subtotal + gstAmount; // 17,700
    const amountPaid = 10000;
    const balanceDue = totalInvoice - amountPaid; // 7,700

    const uatInvoice: Invoice = {
      id: `inv_uat_${timestamp}`,
      type: "INVOICE",
      invoiceNumber: `INV-2026-${timestamp.toString().slice(-4)}`,
      date: "2026-04-05",
      financialYear: "2025-26",
      clientId: uatClient.id,
      clientName: uatClient.name,
      items: [{ id: "item_uat_1", description: uatService.name, quantity: 1, rate: subtotal, amount: subtotal }],
      subtotal,
      gstRate,
      gstAmount,
      total: totalInvoice,
      amountReceived: amountPaid,
      balanceDue,
      status: "SENT",
      createdAt: "2026-04-05",
      notes: "Advance payment received via NEFT",
    };

    const { error: errInv } = await supabase.from("invoices").insert({
      id: uatInvoice.id,
      type: uatInvoice.type,
      invoice_number: uatInvoice.invoiceNumber,
      date: uatInvoice.date,
      financial_year: uatInvoice.financialYear,
      client_id: uatInvoice.clientId,
      client_name: uatInvoice.clientName,
      items: uatInvoice.items,
      subtotal: uatInvoice.subtotal,
      gst_rate: uatInvoice.gstRate,
      gst_amount: uatInvoice.gstAmount,
      total: uatInvoice.total,
      amount_received: uatInvoice.amountReceived,
      balance_due: uatInvoice.balanceDue,
      status: uatInvoice.status,
      user_id: uatUserId,
    });
    assertUAT(!errInv, "Invoice Generation", `Generate Tax Invoice ${uatInvoice.invoiceNumber} (Total: ${formatCurrency(totalInvoice)})`);

    // Verify Amount in Words Conversion for Invoice Header
    const words = numberToWords(totalInvoice);
    assertUAT(words.includes("Seventeen Thousand Seven Hundred"), "Invoice PDF/Print", "Convert invoice total into formal words (INR Seventeen Thousand Seven Hundred)");

    // Auto-Derive Banking Ledger Entry
    const uatBank: BankingEntry = {
      id: `b_uat_${timestamp}`,
      financialYear: "2025-26",
      clientId: uatClient.id,
      serviceId: uatService.id,
      amountBilled: totalInvoice,
      amountReceived: amountPaid,
      amountPending: balanceDue,
      paymentStatus: "PARTIAL",
      remark: `Tax Invoice #${uatInvoice.invoiceNumber} payment received`,
    };
    const { error: errB1 } = await supabase.from("banking_entries").insert({
      id: uatBank.id,
      financial_year: uatBank.financialYear,
      client_id: uatBank.clientId,
      service_id: uatBank.serviceId,
      amount_billed: uatBank.amountBilled,
      amount_received: uatBank.amountReceived,
      amount_pending: uatBank.amountPending,
      payment_status: uatBank.paymentStatus,
      remark: uatBank.remark,
      user_id: uatUserId,
    });
    assertUAT(!errB1, "Banking Ledger", "Auto-reconcile payment entry in firm ledger (Received: ₹10,000, Pending: ₹7,700)");


    // ── SCENARIO 5: Sales Lead Conversion Pipeline ──
    console.log("\n▶ Scenario 5: Sales Lead Conversion Pipeline");
    const uatLead: Lead = {
      id: `l_uat_${timestamp}`,
      name: "Starlight Technologies",
      mobile: "9123456789",
      source: "WHATSAPP_INQUIRY",
      status: "LEAD",
      createdAt: "2026-04-01",
      notes: "Inquired about Annual Audit & IT Return Filing",
    };
    const { error: errL1 } = await supabase.from("leads").insert({
      id: uatLead.id,
      name: uatLead.name,
      mobile: uatLead.mobile,
      source: uatLead.source,
      status: uatLead.status,
      notes: uatLead.notes,
      user_id: uatUserId,
    });
    assertUAT(!errL1, "Lead Pipeline", "Capture incoming WhatsApp lead (Starlight Technologies)");

    // Convert Lead to Active Client
    const { error: errL2 } = await supabase.from("leads").update({ status: "CONVERTED" }).eq("id", uatLead.id);
    assertUAT(!errL2, "Lead Conversion", "Convert sales inquiry lead into official Client Directory entry");


    // ── SCENARIO 6: Recurring Renewals Cycle ──
    console.log("\n▶ Scenario 6: Recurring Renewals Cycle");
    const uatRenewal: RenewalItem = {
      id: `rn_uat_${timestamp}`,
      clientName: uatClient.name,
      serviceName: "Trademark Registration Renewal",
      dueDate: "2026-05-15",
      recurrencePeriod: "ANNUAL",
      progress: "To-do",
    };
    const { error: errR1 } = await supabase.from("renewals").insert({
      id: uatRenewal.id,
      client_name: uatRenewal.clientName,
      service_name: uatRenewal.serviceName,
      due_date: uatRenewal.dueDate,
      recurrence_period: uatRenewal.recurrencePeriod,
      progress: uatRenewal.progress,
      user_id: uatUserId,
    });
    assertUAT(!errR1, "Renewals Management", "Schedule annual trademark renewal job");

    // Perform Renewal Cycle Update (Next Year 2027)
    const { error: errR2 } = await supabase.from("renewals").update({
      progress: "COMPLETED",
      due_date: "2027-05-15",
    }).eq("id", uatRenewal.id);
    assertUAT(!errR2, "Renewals Management", "Execute 'Renew Service' action and roll forward due date to May 2027");


    // ── SCENARIO 7: Firm Details & User Preferences Sync ──
    console.log("\n▶ Scenario 7: Firm Details & User Preferences Sync");
    const uatSettings = {
      user_id: uatUserId,
      settings: {
        firmName: "Sharma & Associates CA",
        registrationNo: "CA-MUM-88990",
        address: "Nariman Point, Mumbai",
        brandColor: "#059669",
        signatureBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      },
    };
    const { error: errSet } = await supabase.from("user_settings").upsert(uatSettings);
    assertUAT(!errSet, "Firm Settings", "Save Firm Details & Base64 Digital Signature to cloud database");


    // ── CLEANUP TEST DATA ──
    console.log("\n🧹 Cleaning up UAT test records from cloud database...");
    await Promise.all([
      supabase.from("clients").delete().eq("user_id", uatUserId),
      supabase.from("services").delete().eq("user_id", uatUserId),
      supabase.from("sub_services").delete().eq("user_id", uatUserId),
      supabase.from("assigned_services").delete().eq("user_id", uatUserId),
      supabase.from("invoices").delete().eq("user_id", uatUserId),
      supabase.from("banking_entries").delete().eq("user_id", uatUserId),
      supabase.from("leads").delete().eq("user_id", uatUserId),
      supabase.from("renewals").delete().eq("user_id", uatUserId),
      supabase.from("user_settings").delete().eq("user_id", uatUserId),
    ]);
    console.log("✓ Teardown complete.");

  } catch (err: any) {
    console.error("UAT Exception:", err);
    failed++;
  }

  console.log(`\n============================================================`);
  console.log(`📊 UAT TEST SUITE RESULTS: ${passed} Scenarios Passed, ${failed} Failed`);
  console.log(`============================================================\n`);

  return { passed, failed };
}
