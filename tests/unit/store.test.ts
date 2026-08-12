import {
  Client, Service, SubService, RequiredDoc, AssignedService,
  BankingEntry, Lead, DocumentDraft, Collaboration, Invoice, OneTimeService
} from "../../src/lib/types";

// Replicate key functions and deduplication logic from store.ts for isolated unit testing
const getClientKey = (c: Client) => {
  const name = (c.name || '').toLowerCase().trim();
  const detail = (c.mobile || c.phone || c.email || c.pan || c.panNo || c.gstin || c.gstNo || '').toLowerCase().trim();
  return name ? `${name}_${detail}` : '';
};

const getServiceKey = (s: Service) => (s.name || '').toLowerCase().trim();
const getSubServiceKey = (ss: SubService) => `${(ss.serviceId || '').trim()}_${(ss.name || '').toLowerCase().trim()}`;
const getRequiredDocKey = (rd: RequiredDoc) => `${(rd.subServiceId || '').trim()}_${(rd.name || '').toLowerCase().trim()}`;
const getAssignedServiceKey = (a: AssignedService) => `${(a.clientId || '').trim()}_${(a.serviceId || '').trim()}_${(a.financialYear || '').trim()}_${(a.dueDate || '').trim()}`;
const getBankingEntryKey = (b: BankingEntry) => `${(b.clientId || '').trim()}_${(b.serviceId || '').trim()}_${(b.financialYear || '').trim()}_${b.amountBilled || 0}_${b.amountReceived || 0}`;
const getLeadKey = (l: Lead) => {
  const name = (l.name || '').toLowerCase().trim();
  const contact = (l.mobile || l.phone || '').toLowerCase().trim();
  return name ? `${name}_${contact}` : '';
};
const getDraftKey = (d: DocumentDraft) => (d.title || '').toLowerCase().trim();
const getCollabKey = (c: Collaboration) => {
  const name = (c.name || '').toLowerCase().trim();
  const detail = (c.number || c.email || '').toLowerCase().trim();
  return name ? `${name}_${detail}` : '';
};
const getInvoiceKey = (inv: Invoice) => `${(inv.invoiceNumber || '').toLowerCase().trim()}_${(inv.type || '').toLowerCase().trim()}`;
const getOneTimeKey = (ots: OneTimeService) => `${(ots.clientName || '').toLowerCase().trim()}_${(ots.serviceName || '').toLowerCase().trim()}`;

function deduplicateItems<T extends { id: string }>(
  items: T[],
  getKey?: (item: T) => string
): { unique: T[]; duplicateIds: string[] } {
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  const unique: T[] = [];
  const duplicateIds: string[] = [];

  items.forEach((item) => {
    if (!item || !item.id) return;

    if (seenIds.has(item.id)) {
      duplicateIds.push(item.id);
      return;
    }

    if (getKey) {
      const key = getKey(item);
      if (key && seenKeys.has(key)) {
        duplicateIds.push(item.id);
        return;
      }
      if (key) seenKeys.add(key);
    }

    seenIds.add(item.id);
    unique.push(item);
  });

  return { unique, duplicateIds };
}

export async function runStoreTests() {
  console.log("\n🧪 RUNNING UNIT TESTS: Store Key Generators & Deduplication (src/lib/store.ts)\n" + "─".repeat(60));
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

  // 1. Client Key Generation & Deduplication
  const clientA = { id: "c1", name: "Acme Corp", phone: "9876543210" } as Client;
  const clientB = { id: "c2", name: "Acme Corp", phone: "9876543210" } as Client;
  const clientC = { id: "c3", name: "Beta LLC", phone: "9123456789" } as Client;
  assert(getClientKey(clientA) === "acme corp_9876543210", "getClientKey formats lowercase name and phone");
  const clientDedup = deduplicateItems([clientA, clientB, clientC], getClientKey);
  assert(clientDedup.unique.length === 2, "deduplicateItems filters out duplicate clients by business key");
  assert(clientDedup.duplicateIds.includes("c2"), "deduplicateItems tracks c2 as duplicate ID");

  // 2. Service Key Generation & Deduplication
  const serviceA = { id: "s1", name: "GST Return" } as Service;
  const serviceB = { id: "s2", name: "gst return" } as Service;
  assert(getServiceKey(serviceA) === "gst return", "getServiceKey lowercases service name");
  const serviceDedup = deduplicateItems([serviceA, serviceB], getServiceKey);
  assert(serviceDedup.unique.length === 1, "deduplicateItems filters case-insensitive duplicate services");

  // 3. SubService Key Generation
  const subA = { id: "ss1", serviceId: "s1", name: "GSTR-1" } as SubService;
  assert(getSubServiceKey(subA) === "s1_gstr-1", "getSubServiceKey combines serviceId and subService name");

  // 4. RequiredDoc Key Generation
  const docA = { id: "d1", subServiceId: "ss1", name: "Purchase Register" } as RequiredDoc;
  assert(getRequiredDocKey(docA) === "ss1_purchase register", "getRequiredDocKey combines subServiceId and doc name");

  // 5. AssignedService Key Generation
  const assA = { id: "a1", clientId: "c1", serviceId: "s1", financialYear: "2025-26", dueDate: "2025-10-20" } as AssignedService;
  assert(getAssignedServiceKey(assA) === "c1_s1_2025-26_2025-10-20", "getAssignedServiceKey combines assignment composite key");

  // 6. Banking Entry Key Generation
  const bankA = { id: "b1", clientId: "c1", serviceId: "s1", financialYear: "2025-26", amountBilled: 5000, amountReceived: 2000 } as BankingEntry;
  assert(getBankingEntryKey(bankA) === "c1_s1_2025-26_5000_2000", "getBankingEntryKey generates unique billing key");

  // 7. Lead & Collaboration Key Generation
  const leadA = { id: "l1", name: "John Doe", mobile: "9988776655" } as Lead;
  assert(getLeadKey(leadA) === "john doe_9988776655", "getLeadKey lowercases lead name and mobile");
  const collabA = { id: "col1", name: "Partner CA", email: "ca@partner.com" } as Collaboration;
  assert(getCollabKey(collabA) === "partner ca_ca@partner.com", "getCollabKey formats partner name and email");

  // 8. Invoice & OneTime Key Generation
  const invA = { id: "inv1", invoiceNumber: "INV-2026-001", type: "INVOICE" } as unknown as Invoice;
  assert(getInvoiceKey(invA) === "inv-2026-001_invoice", "getInvoiceKey formats invoice number and type");
  const otsA = { id: "ots1", clientName: "Acme Corp", serviceName: "PAN Registration" } as OneTimeService;
  assert(getOneTimeKey(otsA) === "acme corp_pan registration", "getOneTimeKey formats client name and service name");

  console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);
  return { passed, failed };
}
