import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Client, Service, SubService, RequiredDoc,
  AssignedService, BankingEntry, Lead, DocumentDraft
} from "./types";
import {
  mockClients, mockServices, mockSubServices, mockRequiredDocs,
  mockAssignedServices, mockBankingEntries, mockLeads, mockDrafts
} from "./mockData";
import { getCurrentFY } from "./utils";

interface AppState {
  // Data
  clients: Client[];
  services: Service[];
  subServices: SubService[];
  requiredDocs: RequiredDoc[];
  assignedServices: AssignedService[];
  bankingEntries: BankingEntry[];
  leads: Lead[];
  drafts: DocumentDraft[];
  selectedFY: string;
  sidebarCollapsed: boolean;

  // Actions - Clients
  setSelectedFY: (fy: string) => void;
  setSidebarCollapsed: (v: boolean) => void;
  addClient: (c: Client) => void;
  updateClient: (c: Client) => void;
  deleteClient: (id: string) => void;

  // Actions - Services
  addService: (s: Service) => void;
  updateService: (s: Service) => void;
  deleteService: (id: string) => void;

  // Actions - SubServices
  addSubService: (s: SubService) => void;
  updateSubService: (s: SubService) => void;
  deleteSubService: (id: string) => void;

  // Actions - Required Docs
  addRequiredDoc: (d: RequiredDoc) => void;
  updateRequiredDoc: (d: RequiredDoc) => void;
  deleteRequiredDoc: (id: string) => void;

  // Actions - Assigned Services
  addAssignedService: (a: AssignedService) => void;
  updateAssignedService: (a: AssignedService) => void;
  deleteAssignedService: (id: string) => void;

  // Actions - Banking
  addBankingEntry: (b: BankingEntry) => void;
  updateBankingEntry: (b: BankingEntry) => void;
  deleteBankingEntry: (id: string) => void;

  // Actions - Leads
  addLead: (l: Lead) => void;
  updateLead: (l: Lead) => void;
  convertLead: (leadId: string, clientId: string) => void;

  // Actions - Drafts
  addDraft: (d: DocumentDraft) => void;
  updateDraft: (d: DocumentDraft) => void;
  deleteDraft: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      clients: mockClients,
      services: mockServices,
      subServices: mockSubServices,
      requiredDocs: mockRequiredDocs,
      assignedServices: mockAssignedServices,
      bankingEntries: mockBankingEntries,
      leads: mockLeads,
      drafts: mockDrafts,
      selectedFY: getCurrentFY(),
      sidebarCollapsed: false,

      setSelectedFY: (fy) => set({ selectedFY: fy }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      addClient: (c) => set((s) => ({ clients: [...s.clients, c] })),
      updateClient: (c) => set((s) => ({ clients: s.clients.map(x => x.id === c.id ? c : x) })),
      deleteClient: (id) => set((s) => ({ clients: s.clients.filter(x => x.id !== id) })),

      addService: (sv) => set((s) => ({ services: [...s.services, sv] })),
      updateService: (sv) => set((s) => ({ services: s.services.map(x => x.id === sv.id ? sv : x) })),
      deleteService: (id) => set((s) => ({ services: s.services.filter(x => x.id !== id) })),

      addSubService: (ss) => set((s) => ({ subServices: [...s.subServices, ss] })),
      updateSubService: (ss) => set((s) => ({ subServices: s.subServices.map(x => x.id === ss.id ? ss : x) })),
      deleteSubService: (id) => set((s) => ({ subServices: s.subServices.filter(x => x.id !== id) })),

      addRequiredDoc: (d) => set((s) => ({ requiredDocs: [...s.requiredDocs, d] })),
      updateRequiredDoc: (d) => set((s) => ({ requiredDocs: s.requiredDocs.map(x => x.id === d.id ? d : x) })),
      deleteRequiredDoc: (id) => set((s) => ({ requiredDocs: s.requiredDocs.filter(x => x.id !== id) })),

      addAssignedService: (a) => set((s) => ({ assignedServices: [...s.assignedServices, a] })),
      updateAssignedService: (a) => set((s) => ({ assignedServices: s.assignedServices.map(x => x.id === a.id ? a : x) })),
      deleteAssignedService: (id) => set((s) => ({ assignedServices: s.assignedServices.filter(x => x.id !== id) })),

      addBankingEntry: (b) => set((s) => ({ bankingEntries: [...s.bankingEntries, b] })),
      updateBankingEntry: (b) => set((s) => ({ bankingEntries: s.bankingEntries.map(x => x.id === b.id ? b : x) })),
      deleteBankingEntry: (id) => set((s) => ({ bankingEntries: s.bankingEntries.filter(x => x.id !== id) })),

      addLead: (l) => set((s) => ({ leads: [...s.leads, l] })),
      updateLead: (l) => set((s) => ({ leads: s.leads.map(x => x.id === l.id ? l : x) })),
      convertLead: (leadId, clientId) => set((s) => ({
        leads: s.leads.map(x => x.id === leadId ? { ...x, status: "CONVERTED" as const, convertedClientId: clientId } : x)
      })),

      addDraft: (d) => set((s) => ({ drafts: [...s.drafts, d] })),
      updateDraft: (d) => set((s) => ({ drafts: s.drafts.map(x => x.id === d.id ? d : x) })),
      deleteDraft: (id) => set((s) => ({ drafts: s.drafts.filter(x => x.id !== id) })),
    }),
    { name: "cmaexpert-store" }
  )
);
