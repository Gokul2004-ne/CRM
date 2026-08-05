import { create } from "zustand";
import {
  Client, Service, SubService, RequiredDoc,
  AssignedService, BankingEntry, Lead, DocumentDraft, Collaboration, Invoice
} from "./types";
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
  removeDraftFromSupabase,
  syncCollaborationToSupabase,
  removeCollaborationFromSupabase
} from "./supabaseData";

// User-Scoped LocalStorage Persistence Helpers (Strict Multi-Tenant Privacy)
function getScopedUserKey(key: string): string {
  if (typeof window === "undefined") return `zpluscrm_${key}`;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("sb-") || k.includes("auth-token"))) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          const uid = parsed?.user?.id || parsed?.user?.email || parsed?.currentSession?.user?.id;
          if (uid) return `zpluscrm_user_${uid}_${key}`;
        }
      }
    }
  } catch {}
  return `zpluscrm_local_${key}`;
}

function loadFromLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const fullKey = getScopedUserKey(key);
    const item = localStorage.getItem(fullKey);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToLocal(key: string, data: any) {
  if (typeof window === "undefined") return;
  try {
    const fullKey = getScopedUserKey(key);
    localStorage.setItem(fullKey, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

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
  collaborations: Collaboration[];
  invoices: Invoice[];
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
  addSubServicesBatch?: (ssList: SubService[]) => void;
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

  // Actions - Collaborations
  addCollaboration: (c: Collaboration) => void;
  updateCollaboration: (c: Collaboration) => void;
  deleteCollaboration: (id: string) => void;

  // Actions - Invoices (Persisted + Banking Link)
  addInvoice: (inv: Invoice) => void;
  updateInvoice: (inv: Invoice) => void;
  deleteInvoice: (id: string) => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  clients: [],
  services: [],
  subServices: [],
  requiredDocs: [],
  assignedServices: [],
  bankingEntries: [],
  leads: [],
  drafts: loadFromLocal("drafts", []),
  collaborations: loadFromLocal("collaborations", []),
  invoices: loadFromLocal("invoices", []),
  selectedFY: getCurrentFY(),
  sidebarCollapsed: false,
  isLoadingSupabase: false,

  loadSupabaseData: async () => {
    set({ isLoadingSupabase: true });
    const localCollabs = loadFromLocal<Collaboration[]>("collaborations", []);
    const localSubServices = loadFromLocal<SubService[]>("subServices", []);
    const localDrafts = loadFromLocal<DocumentDraft[]>("drafts", []);

    const data = await fetchAllCRMData();
    if (data) {
      // Merge remote collaborations with local collaborations so local creations are never lost
      const combinedCollabs = [...(data.collaborations || [])];
      localCollabs.forEach(lc => {
        if (!combinedCollabs.some(c => c.id === lc.id)) {
          combinedCollabs.push(lc);
        }
      });

      const combinedSubServices = [...(data.subServices || [])];
      localSubServices.forEach(lss => {
        if (!combinedSubServices.some(ss => ss.id === lss.id)) {
          combinedSubServices.push(lss);
        }
      });

      const combinedDrafts = [...(data.drafts || [])];
      localDrafts.forEach(ld => {
        if (!combinedDrafts.some(d => d.id === ld.id)) {
          combinedDrafts.push(ld);
        }
      });

      set({
        clients: data.clients,
        services: data.services,
        subServices: combinedSubServices,
        requiredDocs: data.requiredDocs,
        assignedServices: data.assignedServices,
        bankingEntries: data.bankingEntries,
        leads: data.leads,
        drafts: combinedDrafts,
        collaborations: combinedCollabs,
        isLoadingSupabase: false,
      });

      saveToLocal("collaborations", combinedCollabs);
      saveToLocal("subServices", combinedSubServices);
      saveToLocal("drafts", combinedDrafts);
    } else {
      set({
        collaborations: localCollabs,
        subServices: localSubServices,
        drafts: localDrafts,
        isLoadingSupabase: false
      });
    }
  },

  setSelectedFY: (fy) => set({ selectedFY: fy }),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  // Clients Sync
  addClient: (c) => {
    set((s) => {
      const next = [...s.clients, c];
      saveToLocal("clients", next);
      return { clients: next };
    });
    syncClientToSupabase(c);
  },
  updateClient: (c) => {
    set((s) => {
      const next = s.clients.map(x => x.id === c.id ? c : x);
      saveToLocal("clients", next);
      return { clients: next };
    });
    syncClientToSupabase(c);
  },
  deleteClient: (id) => {
    set((s) => {
      const next = s.clients.filter(x => x.id !== id);
      saveToLocal("clients", next);
      return { clients: next };
    });
    removeClientFromSupabase(id);
  },

  // Services Sync (Packages)
  addService: (sv) => {
    set((s) => {
      const next = [...s.services, sv];
      saveToLocal("services", next);
      return { services: next };
    });
    syncServiceToSupabase(sv);
  },
  updateService: (sv) => {
    set((s) => {
      const next = s.services.map(x => x.id === sv.id ? sv : x);
      saveToLocal("services", next);
      return { services: next };
    });
    syncServiceToSupabase(sv);
  },
  deleteService: (id) => {
    set((s) => {
      const next = s.services.filter(x => x.id !== id);
      saveToLocal("services", next);
      return { services: next };
    });
    removeServiceFromSupabase(id);
  },

  // SubServices Sync (Services)
  addSubService: (ss) => {
    set((s) => {
      const next = [...s.subServices, ss];
      saveToLocal("subServices", next);
      return { subServices: next };
    });
    syncSubServiceToSupabase(ss);
  },
  addSubServicesBatch: (ssList) => {
    set((s) => {
      const next = [...s.subServices, ...ssList];
      saveToLocal("subServices", next);
      return { subServices: next };
    });
    ssList.forEach(ss => syncSubServiceToSupabase(ss));
  },
  updateSubService: (ss) => {
    set((s) => {
      const next = s.subServices.map(x => x.id === ss.id ? ss : x);
      saveToLocal("subServices", next);
      return { subServices: next };
    });
    syncSubServiceToSupabase(ss);
  },
  deleteSubService: (id) => {
    set((s) => {
      const next = s.subServices.filter(x => x.id !== id);
      saveToLocal("subServices", next);
      return { subServices: next };
    });
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

  // Assigned Services Sync (Reflects ONLY in Compliance Calendar and Assigned Packages — NOT Banking or Ledger)
  addAssignedService: (a) => {
    set((s) => {
      const nextAssigned = [...s.assignedServices, a];
      saveToLocal("assignedServices", nextAssigned);
      return {
        assignedServices: nextAssigned
      };
    });
    syncAssignedServiceToSupabase(a);
  },

  updateAssignedService: (a) => {
    set((s) => {
      const nextAssigned = s.assignedServices.map(x => x.id === a.id ? a : x);
      saveToLocal("assignedServices", nextAssigned);
      return {
        assignedServices: nextAssigned
      };
    });
    syncAssignedServiceToSupabase(a);
  },

  deleteAssignedService: (id) => {
    set((s) => {
      const nextAssigned = s.assignedServices.filter(x => x.id !== id);
      saveToLocal("assignedServices", nextAssigned);
      return {
        assignedServices: nextAssigned
      };
    });
    removeAssignedServiceFromSupabase(id);
  },

  // Banking Sync
  addBankingEntry: (b) => {
    set((s) => {
      const next = [...s.bankingEntries, b];
      saveToLocal("bankingEntries", next);
      return { bankingEntries: next };
    });
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

      // Bi-directional Sync from Banking to Invoices
      const invoiceId = b.id.startsWith("b_inv_") ? b.id.replace("b_inv_", "") : null;
      const updatedInvoices = invoiceId ? s.invoices.map(inv => {
        if (inv.id === invoiceId) {
          const rcv = b.amountReceived;
          const total = inv.total || b.amountBilled;
          const bal = Math.max(0, total - rcv);
          const status = rcv >= total && total > 0 ? "PAID" as const : inv.status;
          return { ...inv, amountReceived: rcv, balanceDue: bal, status };
        }
        return inv;
      }) : s.invoices;

      const nextBanking = s.bankingEntries.map(x => x.id === b.id ? b : x);
      saveToLocal("bankingEntries", nextBanking);
      saveToLocal("assignedServices", updatedAssigned);
      if (invoiceId) saveToLocal("invoices", updatedInvoices);

      return {
        bankingEntries: nextBanking,
        assignedServices: updatedAssigned,
        invoices: updatedInvoices
      };
    });
    syncBankingEntryToSupabase(b);
  },
  deleteBankingEntry: (id) => {
    set((s) => {
      const next = s.bankingEntries.filter(x => x.id !== id);
      saveToLocal("bankingEntries", next);
      return { bankingEntries: next };
    });
    removeBankingEntryFromSupabase(id);
  },

  // Leads Sync
  addLead: (l) => {
    set((s) => {
      const next = [...s.leads, l];
      saveToLocal("leads", next);
      return { leads: next };
    });
    syncLeadToSupabase(l);
  },
  updateLead: (l) => {
    set((s) => {
      const next = s.leads.map(x => x.id === l.id ? l : x);
      saveToLocal("leads", next);
      return { leads: next };
    });
    syncLeadToSupabase(l);
  },
  convertLead: (leadId, clientId) => {
    set((s) => {
      const updatedLeads = s.leads.map(x => x.id === leadId ? { ...x, status: "CONVERTED" as const, convertedClientId: clientId } : x);
      const convertedLead = updatedLeads.find(x => x.id === leadId);
      if (convertedLead) {
        syncLeadToSupabase(convertedLead);
      }
      saveToLocal("leads", updatedLeads);
      return { leads: updatedLeads };
    });
  },

  // Drafts Sync
  addDraft: (d) => {
    set((s) => {
      const next = [...s.drafts, d];
      saveToLocal("drafts", next);
      return { drafts: next };
    });
    syncDraftToSupabase(d);
  },
  updateDraft: (d) => {
    set((s) => {
      const next = s.drafts.map(x => x.id === d.id ? d : x);
      saveToLocal("drafts", next);
      return { drafts: next };
    });
    syncDraftToSupabase(d);
  },
  deleteDraft: (id) => {
    set((s) => {
      const next = s.drafts.filter(x => x.id !== id);
      saveToLocal("drafts", next);
      return { drafts: next };
    });
    removeDraftFromSupabase(id);
  },

  // Collaborations Sync (Permanently Persisted)
  addCollaboration: (c) => {
    set((s) => {
      const next = [...s.collaborations, c];
      saveToLocal("collaborations", next);
      return { collaborations: next };
    });
    syncCollaborationToSupabase(c);
  },
  updateCollaboration: (c) => {
    set((s) => {
      const next = s.collaborations.map(x => x.id === c.id ? c : x);
      saveToLocal("collaborations", next);
      return { collaborations: next };
    });
    syncCollaborationToSupabase(c);
  },
  deleteCollaboration: (id) => {
    set((s) => {
      const next = s.collaborations.filter(x => x.id !== id);
      saveToLocal("collaborations", next);
      return { collaborations: next };
    });
    removeCollaborationFromSupabase(id);
  },

  // Invoices Sync (Permanently Persisted & Linked with Banking Ledger)
  addInvoice: (inv) => {
    set((s) => {
      const next = [inv, ...s.invoices];
      saveToLocal("invoices", next);

      // Auto-link with Banking Ledger if amount received > 0 or invoice paid
      const rcv = inv.amountReceived || (inv.status === "PAID" ? inv.total : 0);
      const billed = inv.total || 0;
      if (inv.clientId && (billed > 0 || rcv > 0)) {
        const bEntry: BankingEntry = {
          id: `b_inv_${inv.id}`,
          financialYear: inv.financialYear || s.selectedFY || getCurrentFY(),
          clientId: inv.clientId,
          serviceId: s.services[0]?.id || "s1",
          amountBilled: billed,
          amountReceived: rcv,
          amountPending: Math.max(0, billed - rcv),
          paymentStatus: rcv >= billed ? "PAID" : rcv > 0 ? "PARTIAL" : "PENDING",
          remark: `${inv.type} #${inv.invoiceNumber} payment record`
        };
        const nextBanking = [...s.bankingEntries.filter(b => b.id !== bEntry.id), bEntry];
        saveToLocal("banking", nextBanking);
        syncBankingEntryToSupabase(bEntry);
        return { invoices: next, bankingEntries: nextBanking };
      }

      return { invoices: next };
    });
  },
  updateInvoice: (inv) => {
    set((s) => {
      const next = s.invoices.map(x => x.id === inv.id ? inv : x);
      saveToLocal("invoices", next);

      // Sync with Banking Ledger
      const rcv = inv.amountReceived || (inv.status === "PAID" ? inv.total : 0);
      const billed = inv.total || 0;
      if (inv.clientId) {
        const bEntry: BankingEntry = {
          id: `b_inv_${inv.id}`,
          financialYear: inv.financialYear || s.selectedFY || getCurrentFY(),
          clientId: inv.clientId,
          serviceId: s.services[0]?.id || "s1",
          amountBilled: billed,
          amountReceived: rcv,
          amountPending: Math.max(0, billed - rcv),
          paymentStatus: rcv >= billed ? "PAID" : rcv > 0 ? "PARTIAL" : "PENDING",
          remark: `${inv.type} #${inv.invoiceNumber} payment record`
        };
        const nextBanking = [...s.bankingEntries.filter(b => b.id !== bEntry.id), bEntry];
        saveToLocal("banking", nextBanking);
        syncBankingEntryToSupabase(bEntry);
        return { invoices: next, bankingEntries: nextBanking };
      }

      return { invoices: next };
    });
  },
  deleteInvoice: (id) => {
    set((s) => {
      const nextInvoices = s.invoices.filter(x => x.id !== id);
      saveToLocal("invoices", nextInvoices);

      const targetBankingId = `b_inv_${id}`;
      const nextBanking = s.bankingEntries.filter(b => b.id !== targetBankingId && b.id !== id);
      saveToLocal("bankingEntries", nextBanking);
      saveToLocal("banking", nextBanking);

      removeBankingEntryFromSupabase(targetBankingId);

      return { invoices: nextInvoices, bankingEntries: nextBanking };
    });
  },
}));
