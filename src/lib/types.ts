// Shared TypeScript types for the entire application

export type Recurrence = "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM";
export type LeadStatus = "LEAD" | "CONVERTED";
export type ServiceStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";

export interface Client {
  id: string;
  name: string;
  ownerName: string;
  referredBy?: string;
  mobile: string;
  email?: string;
  registrationNo?: string;
  panNo?: string;
  gstNo?: string;
  incorporationDate?: string;
  acquiredDate: string;
  address?: string;
  notes?: string;
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
  dueDate?: string;
}

export interface RequiredDoc {
  id: string;
  subServiceId: string;
  name: string;
  isMandatory: boolean;
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
  remark?: string;
}

export interface Lead {
  id: string;
  name: string;
  mobile: string;
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
