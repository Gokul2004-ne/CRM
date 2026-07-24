import { Client, Service, SubService, RequiredDoc, AssignedService, BankingEntry, Lead, DocumentDraft } from "./types";

export const mockClients: Client[] = [
  {
    id: "c1",
    name: "Acme Logistics Pvt Ltd",
    ownerName: "Rajesh Sharma",
    type: "PRIVATE_LIMITED",
    phone: "9820198201",
    mobile: "9820198201",
    email: "contact@acmelogistics.in",
    pan: "AAACA1234F",
    gstin: "27AAACA1234F1Z5",
    contactPerson: "Rajesh Sharma",
    city: "Mumbai",
    status: "ACTIVE",
    documentCount: 6,
    documents: [
      { id: "cd1", clientId: "c1", name: "Bank Statement FY25-26", type: "PDF", category: "Financials", uploadDate: "2026-07-01", size: "2.4 MB", status: "RECEIVED" },
      { id: "cd2", clientId: "c1", name: "GSTR-3B Sales Summary", type: "XLSX", category: "GST", uploadDate: "2026-07-10", size: "1.1 MB", status: "VERIFIED" },
      { id: "cd3", clientId: "c1", name: "HSN Code & Invoice Master", type: "PDF", category: "GST", uploadDate: "2026-07-15", size: "850 KB", status: "RECEIVED" },
      { id: "cd4", clientId: "c1", name: "Portal Login Credentials Key", type: "TXT", category: "Credentials", uploadDate: "2026-07-18", size: "12 KB", status: "VERIFIED" },
    ],
    createdAt: "2026-01-15"
  },
  {
    id: "c2",
    name: "Apex Global Traders",
    ownerName: "Sunil Verma",
    type: "PROPRIETORSHIP",
    phone: "9876543210",
    mobile: "9876543210",
    email: "sunil@apextraders.com",
    pan: "BBBPB5678K",
    gstin: "27BBBPB5678K1Z2",
    contactPerson: "Sunil Verma",
    city: "Pune",
    status: "ACTIVE",
    documentCount: 4,
    documents: [
      { id: "cd5", clientId: "c2", name: "Purchase Register Q1", type: "PDF", category: "GST", uploadDate: "2026-07-05", size: "1.8 MB", status: "RECEIVED" },
      { id: "cd6", clientId: "c2", name: "Form 26AS Statement", type: "PDF", category: "Income Tax", uploadDate: "2026-07-12", size: "620 KB", status: "VERIFIED" },
    ],
    createdAt: "2026-02-10"
  },
  {
    id: "c3",
    name: "Zenith Software Solutions LLP",
    ownerName: "Priya Mehta",
    type: "LLP",
    phone: "9123456789",
    mobile: "9123456789",
    email: "finance@zenithsoft.io",
    pan: "CCCZ9012M",
    gstin: "27CCCZ9012M1Z8",
    contactPerson: "Priya Mehta",
    city: "Bengaluru",
    status: "ACTIVE",
    documentCount: 8,
    documents: [
      { id: "cd7", clientId: "c3", name: "Audited Balance Sheet FY25", type: "PDF", category: "Audit", uploadDate: "2026-06-20", size: "4.5 MB", status: "VERIFIED" },
      { id: "cd8", clientId: "c3", name: "TDS Return Computations", type: "PDF", category: "TDS", uploadDate: "2026-07-14", size: "940 KB", status: "RECEIVED" },
    ],
    createdAt: "2026-03-01"
  }
];

export const mockServices: Service[] = [
  { id: "s1", name: "GST Compliance & Filing", price: 15000, recurrence: "MONTHLY", applicableMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: "s2", name: "Income Tax Return & Audit", price: 35000, recurrence: "ANNUAL", applicableMonths: [7,9,10] },
  { id: "s3", name: "TDS Quarterly Returns", price: 12000, recurrence: "QUARTERLY", applicableMonths: [4,7,10,1] },
  { id: "s4", name: "ROC & Corporate Secretarial", price: 20000, recurrence: "ANNUAL", applicableMonths: [9,10] },
];

export const mockSubServices: SubService[] = [
  { id: "ss1", serviceId: "s1", name: "GSTR-1 Monthly Sales Return", serviceIds: ["s1"] },
  { id: "ss2", serviceId: "s1", name: "GSTR-3B Summary Return", serviceIds: ["s1"] },
  { id: "ss3", serviceId: "s2", name: "ITR-6 Corporate Income Tax", serviceIds: ["s2"] },
  { id: "ss4", serviceId: "s2", name: "Tax Audit Report 3CA/3CB", serviceIds: ["s2"] },
  { id: "ss5", serviceId: "s3", name: "Form 26Q Non-Salary TDS", serviceIds: ["s3"] },
];

export const mockRequiredDocs: RequiredDoc[] = [
  { id: "d1", subServiceId: "ss1", name: "Outward Sales Invoices Summary", isMandatory: true },
  { id: "d2", subServiceId: "ss1", name: "HSN Summary Data Sheet", isMandatory: true },
  { id: "d3", subServiceId: "ss2", name: "Purchase Invoices / GSTR-2B Recon", isMandatory: true },
  { id: "d4", subServiceId: "ss2", name: "Electronic Cash Ledger Statement", isMandatory: false },
  { id: "d5", subServiceId: "ss3", name: "Bank Statements & Credit Card Logs", isMandatory: true },
  { id: "d6", subServiceId: "ss3", name: "GST Annual Filing Copy", isMandatory: true },
  { id: "d7", subServiceId: "ss4", name: "Fixed Asset Register & Depreciation", isMandatory: true },
  { id: "d8", subServiceId: "ss5", name: "TDS Payment Challans", isMandatory: true },
];

export const mockAssignedServices: AssignedService[] = [
  {
    id: "as1",
    clientId: "c1",
    serviceId: "s1",
    subServiceIds: ["ss1", "ss2"],
    financialYear: "2026-27",
    amountBilled: 15000,
    amountReceived: 10000,
    amountPending: 5000,
    totalFee: 15000,
    paidAmount: 10000,
    pendingAmount: 5000,
    status: "IN_PROGRESS",
    dueDate: "2026-08-05" // ~12 days left (YELLOW)
  },
  {
    id: "as2",
    clientId: "c2",
    serviceId: "s2",
    subServiceIds: ["ss3", "ss4"],
    financialYear: "2026-27",
    amountBilled: 35000,
    amountReceived: 0,
    amountPending: 35000,
    totalFee: 35000,
    paidAmount: 0,
    pendingAmount: 35000,
    status: "PENDING",
    dueDate: "2026-07-28" // ~4 days left (RED - CRITICAL)
  },
  {
    id: "as3",
    clientId: "c3",
    serviceId: "s3",
    subServiceIds: ["ss5"],
    financialYear: "2026-27",
    amountBilled: 12000,
    amountReceived: 12000,
    amountPending: 0,
    totalFee: 12000,
    paidAmount: 12000,
    pendingAmount: 0,
    status: "COMPLETED",
    dueDate: "2026-08-25" // ~32 days left (GREEN)
  },
  {
    id: "as4",
    clientId: "c1",
    serviceId: "s2",
    subServiceIds: ["ss3"],
    financialYear: "2026-27",
    amountBilled: 25000,
    amountReceived: 5000,
    amountPending: 20000,
    totalFee: 25000,
    paidAmount: 5000,
    pendingAmount: 20000,
    status: "OVERDUE",
    dueDate: "2026-07-15" // Overdue (RED)
  }
];

export const mockBankingEntries: BankingEntry[] = [];

export const mockLeads: Lead[] = [
  {
    id: "l1",
    name: "Rohan Kapoor",
    mobile: "9988776655",
    phone: "9988776655",
    source: "WHATSAPP",
    status: "LEAD",
    notes: "Inquired via WhatsApp for Private Limited Incorporation & GST Registration",
    createdAt: "2026-07-20"
  },
  {
    id: "l2",
    name: "Vikram Malhotra",
    mobile: "9876123456",
    phone: "9876123456",
    source: "WHATSAPP_BUSINESS",
    status: "LEAD",
    notes: "Tagged as prospective Client in WhatsApp Business — needs Tax Audit package",
    createdAt: "2026-07-22"
  }
];

export const mockDrafts: DocumentDraft[] = [];

