// Shared TypeScript types for the entire application

export type Recurrence = "MONTHLY" | "QUARTERLY" | "ANNUAL" | "ANNUALLY" | "CUSTOM";
export type LeadStatus = "LEAD" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST";
export type LeadSource = "WHATSAPP" | "WEBSITE" | "REFERRAL" | "DIRECT_CALL" | "CAMPAIGN" | "WALK_IN" | "SOCIAL_MEDIA" | "EMAIL" | "OTHER";
export type ServiceStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";

export interface ClientDocument {
  id: string;
  clientId: string;
  name: string;
  type: string;
  category?: string;
  uploadDate: string;
  fileUrl?: string;
  size?: string;
  status?: "RECEIVED" | "PENDING" | "VERIFIED";
}

export interface PortalCredential {
  id: string;
  portalName: string;
  portalId: string;
  password: string;
}

export interface Client {
  id: string;
  name: string;
  ownerName?: string;
  type?: string;
  referredBy?: string;
  phone?: string;
  mobile: string;
  email?: string;
  pan?: string;
  panNo?: string;
  gstin?: string;
  gstNo?: string;
  gstPortalId?: string;
  gstPortalPassword?: string;
  portalCredentials?: PortalCredential[];
  contactPerson?: string;
  city?: string;
  status?: string;
  registrationNo?: string;
  incorporationDate?: string;
  acquiredDate?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  state?: string;
  pincode?: string;
  notes?: string;
  documentCount?: number;
  documents?: ClientDocument[];
  createdAt?: string;
}

// NOTE: In the UI, Service is displayed as "Package"
export interface Service {
  id: string;
  name: string;
  price: number;
  recurrence?: Recurrence;
  applicableMonths?: string[];
  dueDateDay?: number;
  dueDate?: string;
}

// NOTE: In the UI, SubService is displayed as "Service"
export interface SubService {
  id: string;
  serviceId: string;
  name: string;
  serviceIds?: string[];
  clientId?: string;
  clientName?: string;
  recurrence?: Recurrence | "MONTHLY" | "QUARTERLY" | "ANNUALLY" | "CUSTOM";
  applicableMonths?: string[];
  dueDateDay?: number;
  dueDate?: string;
}

export interface RequiredDoc {
  id: string;
  subServiceId: string;
  name: string;
  isMandatory: boolean;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
}

export type ProgressStatus = "To-do" | "In-progress" | "Completed";

export interface OneTimeService {
  id: string;
  clientName: string;
  serviceName: string;
  dueDate?: string;
  progress: ProgressStatus;
  notes?: string;
  createdAt?: string;
}

export interface RenewalItem {
  id: string;
  clientName: string;
  serviceName: string;
  registrationDate?: string;
  dueDate?: string;
  fromDate?: string;
  toDate?: string;
  financialYear?: string;
  recurrencePeriod?: string;
  progress: ProgressStatus;
  notes?: string;
  createdAt?: string;
}

export interface AssignedService {
  id: string;
  clientId: string;
  serviceId: string;
  subServiceIds: string[];
  financialYear: string;
  amountBilled: number;
  amountReceived: number;
  amountPending: number;
  status?: ServiceStatus;
  dueDate?: string;
}

export interface BankingEntry {
  id: string;
  financialYear: string;
  clientId: string;
  serviceId: string;
  subServiceId?: string | null;
  amountBilled: number;
  amountReceived: number;
  amountPending: number;
  paymentStatus?: string;
  remark?: string;
}

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  phone?: string;
  email?: string;
  source: string;
  type?: string;
  city?: string;
  status: LeadStatus;
  convertedClientId?: string;
  notes?: string;
  createdAt: string;
}

export interface DocumentDraft {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface Collaboration {
  id: string;
  name: string;
  number: string;
  email: string;
  type?: string;
  notes?: string;
  createdAt?: string;
}

export type InvoiceType = "PROFORMA" | "INVOICE";

export interface InvoiceItem {
  id: string;
  description: string;
  hsn?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  type: InvoiceType;
  invoiceNumber: string;
  date: string;
  financialYear?: string;
  clientId: string;
  clientName?: string;
  items: InvoiceItem[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  amountReceived?: number;
  balanceDue?: number;
  notes?: string;
  status: "DRAFT" | "SENT" | "PAID";
  createdAt: string;
}

// Dashboard computed types
export interface DashboardStats {
  totalClients: number;
  totalServices: number;
  totalBilled: number;
  totalReceived: number;
  totalPending: number;
}

export interface DueDateRow {
  assignedServiceId: string;
  serviceName: string;
  dueDate: string;
  clientName: string;
  clientMobile: string;
  daysPending: number;
}
