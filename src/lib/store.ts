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
import {
  fetchAllCRMData,
  syncClientToSupabase,
  removeClientFromSupabase,
  syncServiceToSupabase,
  removeServiceFromSupabase,
  syncSubServiceToSupabase,
  removeSubServiceFromSupabase,
  syncRequiredDocToSupabase,
  removeRequiredDocFromSupabase,
  syncAssignedServiceToSupabase,
  removeAssignedServiceFromSupabase,
  syncBankingEntryToSupabase,
  removeBankingEntryFromSupabase,
  syncLeadToSupabase,
  removeLeadFromSupabase,
  syncDraftToSupabase,
  removeDraftFromSupabase
} from "./supabaseData";

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
  isLoadingSupabase: boolean;

  // Supabase sync
  loadSupabaseData: () => Promise<void>;

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
    (set, get) => ({
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
      isLoadingSupabase: false,

      loadSupabaseData: async () => {
        set({ isLoadingSupabase: true });
        const data = await fetchAllCRMData();
        if (data) {
          set({
            clients: data.clients,
            services: data.services,
            subServices: data.subServices,
            requiredDocs: data.requiredDocs,
            assignedServices: data.assignedServices,
            bankingEntries: data.bankingEntries,
            leads: data.leads,
            drafts: data.drafts,
            isLoadingSupabase: false,
          });
        } else {
          set({ isLoadingSupabase: false });
        }
      },

      setSelectedFY: (fy) => set({ selectedFY: fy }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      // Clients Sync
      addClient: (c) => {
        set((s) => ({ clients: [...s.clients, c] }));
        syncClientToSupabase(c);
      },
      updateClient: (c) => {
        set((s) => ({ clients: s.clients.map(x => x.id === c.id ? c : x) }));
        syncClientToSupabase(c);
      },
      deleteClient: (id) => {
        set((s) => ({ clients: s.clients.filter(x => x.id !== id) }));
        removeClientFromSupabase(id);
      },

      // Services Sync
      addService: (sv) => {
        set((s) => ({ services: [...s.services, sv] }));
        syncServiceToSupabase(sv);
      },
      updateService: (sv) => {
        set((s) => ({ services: s.services.map(x => x.id === sv.id ? sv : x) }));
        syncServiceToSupabase(sv);
      },
      deleteService: (id) => {
        set((s) => ({ services: s.services.filter(x => x.id !== id) }));
        removeServiceFromSupabase(id);
      },

      // SubServices Sync
      addSubService: (ss) => {
        set((s) => ({ subServices: [...s.subServices, ss] }));
        syncSubServiceToSupabase(ss);
      },
      updateSubService: (ss) => {
        set((s) => ({ subServices: s.subServices.map(x => x.id === ss.id ? ss : x) }));
        syncSubServiceToSupabase(ss);
      },
      deleteSubService: (id) => {
        set((s) => ({ subServices: s.subServices.filter(x => x.id !== id) }));
        removeSubServiceFromSupabase(id);
      },

      // Required Docs Sync
      addRequiredDoc: (d) => {
        set((s) => ({ requiredDocs: [...s.requiredDocs, d] }));
        syncRequiredDocToSupabase(d);
      },
      updateRequiredDoc: (d) => {
        set((s) => ({ requiredDocs: s.requiredDocs.map(x => x.id === d.id ? d : x) }));
        syncRequiredDocToSupabase(d);
      },
      deleteRequiredDoc: (id) => {
        set((s) => ({ requiredDocs: s.requiredDocs.filter(x => x.id !== id) }));
        removeRequiredDocFromSupabase(id);
      },

      // Assigned Services Sync & Automatic Banking Ledger Redirect
      addAssignedService: (a) => {
        const newBanking: BankingEntry = {
          id: `b-${a.id}`,
          financialYear: a.financialYear,
          clientId: a.clientId,
          serviceId: a.serviceId,
          subServiceId: a.subServiceIds?.[0] || null,
          amountBilled: a.amountBilled || 0,
          amountReceived: a.amountReceived || 0,
          amountPending: Math.max(0, (a.amountBilled || 0) - (a.amountReceived || 0)),
          paymentStatus: (a.amountReceived || 0) >= (a.amountBilled || 0) && (a.amountBilled || 0) > 0 ? "PAID" : (a.amountReceived || 0) > 0 ? "PARTIAL" : "PENDING",
          remark: "Auto-synced from Assign Services"
        };

        set((s) => {
          const existingBkIndex = s.bankingEntries.findIndex(b => b.id === `b-${a.id}` || (b.clientId === a.clientId && b.serviceId === a.serviceId && b.financialYear === a.financialYear));
          let updatedBkList = [...s.bankingEntries];
          if (existingBkIndex >= 0) {
            updatedBkList[existingBkIndex] = { ...updatedBkList[existingBkIndex], ...newBanking };
          } else {
            updatedBkList.push(newBanking);
          }
          return {
            assignedServices: [...s.assignedServices, a],
            bankingEntries: updatedBkList
          };
        });

        syncAssignedServiceToSupabase(a);
        syncBankingEntryToSupabase(newBanking);
      },

      updateAssignedService: (a) => {
        const newBanking: BankingEntry = {
          id: `b-${a.id}`,
          financialYear: a.financialYear,
          clientId: a.clientId,
          serviceId: a.serviceId,
          subServiceId: a.subServiceIds?.[0] || null,
          amountBilled: a.amountBilled || 0,
          amountReceived: a.amountReceived || 0,
          amountPending: Math.max(0, (a.amountBilled || 0) - (a.amountReceived || 0)),
          paymentStatus: (a.amountReceived || 0) >= (a.amountBilled || 0) && (a.amountBilled || 0) > 0 ? "PAID" : (a.amountReceived || 0) > 0 ? "PARTIAL" : "PENDING",
          remark: "Auto-synced from Assign Services"
        };

        set((s) => {
          const existingBkIndex = s.bankingEntries.findIndex(b => b.id === `b-${a.id}` || (b.clientId === a.clientId && b.serviceId === a.serviceId && b.financialYear === a.financialYear));
          let updatedBkList = [...s.bankingEntries];
          if (existingBkIndex >= 0) {
            updatedBkList[existingBkIndex] = { ...updatedBkList[existingBkIndex], amountBilled: a.amountBilled, amountReceived: a.amountReceived, amountPending: Math.max(0, a.amountBilled - a.amountReceived) };
          } else {
            updatedBkList.push(newBanking);
          }

          return {
            assignedServices: s.assignedServices.map(x => x.id === a.id ? a : x),
            bankingEntries: updatedBkList
          };
        });

        syncAssignedServiceToSupabase(a);
        syncBankingEntryToSupabase(newBanking);
      },

      deleteAssignedService: (id) => {
        set((s) => ({
          assignedServices: s.assignedServices.filter(x => x.id !== id),
          bankingEntries: s.bankingEntries.filter(x => x.id !== `b-${id}`)
        }));
        removeAssignedServiceFromSupabase(id);
        removeBankingEntryFromSupabase(`b-${id}`);
      },

      // Banking Sync
      addBankingEntry: (b) => {
        set((s) => ({ bankingEntries: [...s.bankingEntries, b] }));
        syncBankingEntryToSupabase(b);
      },
      updateBankingEntry: (b) => {
        set((s) => {
          const updatedAssigned = s.assignedServices.map(a => {
            if (a.id === b.id.replace(/^b-/, "") || (a.clientId === b.clientId && a.serviceId === b.serviceId && a.financialYear === b.financialYear)) {
              return {
                ...a,
                amountReceived: b.amountReceived,
                amountPending: b.amountPending
              };
            }
            return a;
          });

          return {
            bankingEntries: s.bankingEntries.map(x => x.id === b.id ? b : x),
            assignedServices: updatedAssigned
          };
        });
        syncBankingEntryToSupabase(b);
      },
      deleteBankingEntry: (id) => {
        set((s) => ({ bankingEntries: s.bankingEntries.filter(x => x.id !== id) }));
        removeBankingEntryFromSupabase(id);
      },

      // Leads Sync
      addLead: (l) => {
        set((s) => ({ leads: [...s.leads, l] }));
        syncLeadToSupabase(l);
      },
      updateLead: (l) => {
        set((s) => ({ leads: s.leads.map(x => x.id === l.id ? l : x) }));
        syncLeadToSupabase(l);
      },
      convertLead: (leadId, clientId) => {
        set((s) => {
          const updatedLeads = s.leads.map(x => x.id === leadId ? { ...x, status: "CONVERTED" as const, convertedClientId: clientId } : x);
          const convertedLead = updatedLeads.find(x => x.id === leadId);
          if (convertedLead) {
            syncLeadToSupabase(convertedLead);
          }
          return { leads: updatedLeads };
        });
      },

      // Drafts Sync
      addDraft: (d) => {
        set((s) => ({ drafts: [...s.drafts, d] }));
        syncDraftToSupabase(d);
      },
      updateDraft: (d) => {
        set((s) => ({ drafts: s.drafts.map(x => x.id === d.id ? d : x) }));
        syncDraftToSupabase(d);
      },
      deleteDraft: (id) => {
        set((s) => ({ drafts: s.drafts.filter(x => x.id !== id) }));
        removeDraftFromSupabase(id);
      },
    }),
    {
      name: "crmexpert-store-v2",
      version: 2,
      migrate: () => ({
        clients: [],
        services: [],
        subServices: [],
        requiredDocs: [],
        assignedServices: [],
        bankingEntries: [],
        leads: [],
        drafts: [],
        selectedFY: getCurrentFY(),
        sidebarCollapsed: false,
        isLoadingSupabase: false,
      }),
    }
  )
);
