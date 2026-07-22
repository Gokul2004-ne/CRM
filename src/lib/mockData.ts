// Central mock data store — swap this layer for real API/DB calls later
import { Client, Service, SubService, RequiredDoc, AssignedService, BankingEntry, Lead } from "./types";

export const mockClients: Client[] = [
  {
    id: "c1", name: "Sharma Enterprises", ownerName: "Rakesh Sharma",
    referredBy: "Anil Mehta", mobile: "9876543210", email: "rakesh@sharmaent.com",
    registrationNo: "U74999MH2019PTC123456", panNo: "AABCS1234D",
    gstNo: "27AABCS1234D1Z5", incorporationDate: "2019-03-15",
    acquiredDate: "2022-06-01", address: "Andheri West, Mumbai", notes: ""
  },
  {
    id: "c2", name: "Patel Traders", ownerName: "Suresh Patel",
    referredBy: "Direct", mobile: "9123456789", email: "suresh@pateltraders.com",
    registrationNo: "U74999GJ2018PTC098765", panNo: "AABCP9876K",
    gstNo: "24AABCP9876K1Z2", incorporationDate: "2018-07-20",
    acquiredDate: "2021-01-15", address: "Navrangpura, Ahmedabad", notes: ""
  },
  {
    id: "c3", name: "Krishna Constructions", ownerName: "Vijay Krishna",
    referredBy: "Sharma Enterprises", mobile: "9988776655", email: "vijay@krishnacon.in",
    registrationNo: "U45200KA2020PTC234567", panNo: "AACKV4567M",
    gstNo: "29AACKV4567M1Z3", incorporationDate: "2020-01-10",
    acquiredDate: "2023-03-01", address: "Indiranagar, Bengaluru", notes: "Priority client"
  },
  {
    id: "c4", name: "Mehta & Sons", ownerName: "Dinesh Mehta",
    referredBy: "Patel Traders", mobile: "9765432100", email: "dinesh@mehtasons.com",
    registrationNo: "U70200RJ2017PTC345678", panNo: "AABDM3456N",
    gstNo: "08AABDM3456N1Z1", incorporationDate: "2017-05-22",
    acquiredDate: "2020-09-10", address: "MI Road, Jaipur", notes: ""
  },
  {
    id: "c5", name: "Gupta IT Solutions", ownerName: "Priya Gupta",
    referredBy: "Direct", mobile: "9654321098", email: "priya@guptait.com",
    registrationNo: "U72200DL2021PTC456789", panNo: "AABPG6789P",
    gstNo: "07AABPG6789P1Z8", incorporationDate: "2021-08-01",
    acquiredDate: "2023-11-01", address: "Connaught Place, Delhi", notes: "New client"
  },
];

export const mockServices: Service[] = [
  { id: "s1", name: "GST Filing", dueDate: "2025-07-20", price: 2500, recurrence: "MONTHLY", applicableMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { id: "s2", name: "Income Tax Return", dueDate: "2025-07-31", price: 5000, recurrence: "ANNUAL", applicableMonths: [7] },
  { id: "s3", name: "TDS Filing", dueDate: "2025-07-15", price: 1500, recurrence: "QUARTERLY", applicableMonths: [7,10,1,4] },
  { id: "s4", name: "ROC Filing", dueDate: "2025-08-30", price: 8000, recurrence: "ANNUAL", applicableMonths: [9] },
  { id: "s5", name: "Audit Services", dueDate: "2025-09-30", price: 15000, recurrence: "ANNUAL", applicableMonths: [9] },
  { id: "s6", name: "Payroll Processing", dueDate: "2025-07-05", price: 3000, recurrence: "MONTHLY", applicableMonths: [1,2,3,4,5,6,7,8,9,10,11,12] },
];

export const mockSubServices: SubService[] = [
  { id: "ss1", serviceId: "s1", name: "GSTR-1", dueDate: "2025-07-11" },
  { id: "ss2", serviceId: "s1", name: "GSTR-3B", dueDate: "2025-07-20" },
  { id: "ss3", serviceId: "s2", name: "ITR-3 Filing", dueDate: "2025-07-31" },
  { id: "ss4", serviceId: "s2", name: "Tax Computation", dueDate: "2025-07-25" },
  { id: "ss5", serviceId: "s3", name: "Form 24Q", dueDate: "2025-07-15" },
  { id: "ss6", serviceId: "s3", name: "Form 26Q", dueDate: "2025-07-15" },
  { id: "ss7", serviceId: "s4", name: "MGT-7 (Annual Return)", dueDate: "2025-08-30" },
  { id: "ss8", serviceId: "s4", name: "AOC-4 (Financial Statements)", dueDate: "2025-08-29" },
  { id: "ss9", serviceId: "s5", name: "Statutory Audit", dueDate: "2025-09-30" },
  { id: "ss10", serviceId: "s5", name: "Tax Audit (3CD)", dueDate: "2025-09-30" },
];

export const mockRequiredDocs: RequiredDoc[] = [
  { id: "d1", subServiceId: "ss1", name: "Sales Register", isMandatory: true },
  { id: "d2", subServiceId: "ss1", name: "Purchase Register", isMandatory: true },
  { id: "d3", subServiceId: "ss1", name: "Export Invoices", isMandatory: false },
  { id: "d4", subServiceId: "ss2", name: "Bank Statements", isMandatory: true },
  { id: "d5", subServiceId: "ss2", name: "Input Tax Credit Details", isMandatory: true },
  { id: "d6", subServiceId: "ss3", name: "Balance Sheet", isMandatory: true },
  { id: "d7", subServiceId: "ss3", name: "P&L Statement", isMandatory: true },
  { id: "d8", subServiceId: "ss3", name: "Bank Statements (all accounts)", isMandatory: true },
  { id: "d9", subServiceId: "ss3", name: "Investment Proofs", isMandatory: false },
  { id: "d10", subServiceId: "ss5", name: "Employee Salary Slips", isMandatory: true },
  { id: "d11", subServiceId: "ss5", name: "PAN Cards of Employees", isMandatory: true },
];

export const mockAssignedServices: AssignedService[] = [
  { id: "as1", clientId: "c1", serviceId: "s1", subServiceIds: ["ss1","ss2"], financialYear: "2025-26", amountBilled: 30000, amountReceived: 20000, amountPending: 10000, dueDate: "2025-07-20" },
  { id: "as2", clientId: "c1", serviceId: "s2", subServiceIds: ["ss3","ss4"], financialYear: "2025-26", amountBilled: 5000, amountReceived: 5000, amountPending: 0, dueDate: "2025-07-31" },
  { id: "as3", clientId: "c2", serviceId: "s1", subServiceIds: ["ss1","ss2"], financialYear: "2025-26", amountBilled: 30000, amountReceived: 15000, amountPending: 15000, dueDate: "2025-07-20" },
  { id: "as4", clientId: "c2", serviceId: "s3", subServiceIds: ["ss5","ss6"], financialYear: "2025-26", amountBilled: 6000, amountReceived: 6000, amountPending: 0, dueDate: "2025-07-15" },
  { id: "as5", clientId: "c3", serviceId: "s4", subServiceIds: ["ss7","ss8"], financialYear: "2025-26", amountBilled: 8000, amountReceived: 4000, amountPending: 4000, dueDate: "2025-08-30" },
  { id: "as6", clientId: "c3", serviceId: "s5", subServiceIds: ["ss9","ss10"], financialYear: "2025-26", amountBilled: 15000, amountReceived: 7500, amountPending: 7500, dueDate: "2025-09-30" },
  { id: "as7", clientId: "c4", serviceId: "s6", subServiceIds: [], financialYear: "2025-26", amountBilled: 36000, amountReceived: 24000, amountPending: 12000, dueDate: "2025-07-05" },
  { id: "as8", clientId: "c5", serviceId: "s2", subServiceIds: ["ss3"], financialYear: "2025-26", amountBilled: 5000, amountReceived: 0, amountPending: 5000, dueDate: "2025-07-31" },
  // Previous FY
  { id: "as9", clientId: "c1", serviceId: "s1", subServiceIds: ["ss1","ss2"], financialYear: "2024-25", amountBilled: 24000, amountReceived: 24000, amountPending: 0, dueDate: "2024-07-20" },
  { id: "as10", clientId: "c2", serviceId: "s2", subServiceIds: ["ss3"], financialYear: "2024-25", amountBilled: 5000, amountReceived: 3000, amountPending: 2000, dueDate: "2024-07-31" },
];

export const mockBankingEntries: BankingEntry[] = mockAssignedServices.map(as => ({
  id: `b${as.id}`,
  financialYear: as.financialYear,
  clientId: as.clientId,
  serviceId: as.serviceId,
  subServiceId: as.subServiceIds[0] || null,
  amountBilled: as.amountBilled,
  amountReceived: as.amountReceived,
  amountPending: as.amountPending,
  remark: "",
}));

export const mockLeads: Lead[] = [
  { id: "l1", name: "Ankit Shah", mobile: "9111222333", source: "WHATSAPP", status: "LEAD", notes: "Interested in GST filing", createdAt: "2025-07-10" },
  { id: "l2", name: "Reena Joshi", mobile: "9222333444", source: "WHATSAPP", status: "LEAD", notes: "Wants ITR filing", createdAt: "2025-07-12" },
  { id: "l3", name: "Manish Tiwari", mobile: "9333444555", source: "WHATSAPP", status: "CONVERTED", convertedClientId: "c5", notes: "Converted successfully", createdAt: "2025-07-01" },
];

export const mockDrafts = [
  { id: "dr1", title: "Engagement Letter Template", content: "<h2>Engagement Letter</h2><p>Dear [Client Name],</p><p>We are pleased to confirm our engagement for the following services...</p>", updatedAt: "2025-07-15" },
  { id: "dr2", title: "NOC Certificate Format", content: "<h2>No Objection Certificate</h2><p>This is to certify that...</p>", updatedAt: "2025-07-10" },
];
