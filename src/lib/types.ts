// Shared TypeScript types for the entire application

export type Recurrence = "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM";
export type LeadStatus = "LEAD" | "CONVERTED";
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
  contactPerson?: string;
  city?: string;
  status?: string;
  registrationNo?: string;
  incorporationDate?: string;
  acquiredDate?: string;
  address?: string;
  notes?: string;
  documentCount?: number;
  documents?: ClientDocument[];
  createdAt?: string;
}

export interface Service {
  id: string;
  name: string;
  dueDate?: string;
  price: number;
  recurrence: Recurrence;
  applicableMonths: number[];
}

export interface SubService {
  id: string;
  serviceId: string;
  name: string;
  serviceIds?: string[]; // Grouped services under sub-service
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

export interface AssignedService {
  id: string;
  clientId: string;
  serviceId: string;
  subServiceIds: string[];
  financialYear: string;
  amountBilled: number;
  amountReceived: number;
  amountPending: number;
  totalFee?: number;
  paidAmount?: number;
  pendingAmount?: number;
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
  source: string;
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
