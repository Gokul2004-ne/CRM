import { create } from "zustand";
import {
  Client, Service, SubService, RequiredDoc,
  AssignedService, BankingEntry, Lead, DocumentDraft, Collaboration, Invoice, OneTimeService
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
  removeCollaborationFromSupabase,
  syncInvoiceToSupabase,
  removeInvoiceFromSupabase,
  syncOneTimeServiceToSupabase,
  removeOneTimeServiceFromSupabase
} from "./supabaseData";

// User-Scoped LocalStorage Persistence Helpers (Strict Multi-Tenant Privacy)
function getScopedUserKey(key: string): string {
  if (typeof window === "undefined") return `zpluscrm_${key}`;
  try {
    const rawSession = localStorage.getItem("zpluscrm_active_session");
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      const uid = parsed?.user?.id || parsed?.user?.email;
      if (uid) return `zpluscrm_user_${String(uid).replace(/[^a-zA-Z0-9_]/g, "_")}_${key}`;
    }

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("sb-") || k.includes("auth-token"))) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          const uid = parsed?.user?.id || parsed?.user?.email || parsed?.currentSession?.user?.id;
          if (uid) return `zpluscrm_user_${String(uid).replace(/[^a-zA-Z0-9_]/g, "_")}_${key}`;
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
  oneTimeServices: OneTimeService[];
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
  deleteLead: (id: string) => void;
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

  // Actions - One Time Services
  addOneTimeService: (ots: OneTimeService) => void;
  updateOneTimeService: (ots: OneTimeService) => void;
  deleteOneTimeService: (id: string) => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  // Initialize from user-scoped localStorage so data persists across page refreshes.
  // getScopedUserKey() reads the saved session token, so the correct scoped key is
  // used even at module init time. New users get empty arrays (no mock data).
  clients: loadFromLocal("clients", []),
  services: loadFromLocal("services", []),
  subServices: loadFromLocal("subServices", []),
  requiredDocs: loadFromLocal("requiredDocs", []),
  assignedServices: loadFromLocal("assignedServices", []),
  bankingEntries: loadFromLocal("bankingEntries", []),
  leads: loadFromLocal("leads", []),
  drafts: loadFromLocal("drafts", []),
  collaborations: loadFromLocal("collaborations", []),
  invoices: loadFromLocal("invoices", []),
  oneTimeServices: loadFromLocal("oneTimeServices", []),
  selectedFY: getCurrentFY(),
  sidebarCollapsed: false,
  isLoadingSupabase: false,

  loadSupabaseData: async () => {
    set({ isLoadingSupabase: true });

    // Load user-scoped local data AFTER auth is established (key is now correct)
    const localClients = loadFromLocal<Client[]>("clients", []);
    const localServices = loadFromLocal<Service[]>("services", []);
    const localSubServices = loadFromLocal<SubService[]>("subServices", []);
    const localRequiredDocs = loadFromLocal<RequiredDoc[]>("requiredDocs", []);
    const localAssigned = loadFromLocal<AssignedService[]>("assignedServices", []);
    const localBanking = loadFromLocal<BankingEntry[]>("bankingEntries", []);
    const localLeads = loadFromLocal<Lead[]>("leads", []);
    const localCollabs = loadFromLocal<Collaboration[]>("collaborations", []);
    const localDrafts = loadFromLocal<DocumentDraft[]>("drafts", []);
    const localInvoices = loadFromLocal<any[]>("invoices", []);
    const localOneTime = loadFromLocal<any[]>("oneTimeServices", []);

    // ── MIGRATION: Read any old unscoped local data (zpluscrm_local_*) ──
    // This handles data that was saved before the user-scoping fix was applied.
    const migrateOldKey = <T>(key: string): T[] => {
      if (typeof window === "undefined") return [];
      try {
        const raw = localStorage.getItem(`zpluscrm_local_${key}`);
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    };
    const oldClients = migrateOldKey<Client>("clients");
    const oldServices = migrateOldKey<Service>("services");
    const oldSubServices = migrateOldKey<SubService>("subServices");
    const oldRequiredDocs = migrateOldKey<RequiredDoc>("requiredDocs");
    const oldAssigned = migrateOldKey<AssignedService>("assignedServices");
    const oldBanking = migrateOldKey<BankingEntry>("bankingEntries");
    const oldLeads = migrateOldKey<Lead>("leads");
    const oldDrafts = migrateOldKey<DocumentDraft>("drafts");
    const oldCollabs = migrateOldKey<Collaboration>("collaborations");
    const oldInvoices = migrateOldKey<any>("invoices");
    const oldOneTime = migrateOldKey<any>("oneTimeServices");

    // Merge old unscoped data into current user's local data
    const mergeLocal = <T extends { id: string }>(current: T[], old: T[]): T[] => {
      const merged = [...current];
      old.forEach(item => {
        if (!merged.some(m => m.id === item.id)) merged.push(item);
      });
      return merged;
    };

    const mergedLocalClients = mergeLocal(localClients, oldClients);
    const mergedLocalServices = mergeLocal(localServices, oldServices);
    const mergedLocalSubServices = mergeLocal(localSubServices, oldSubServices);
    const mergedLocalRequiredDocs = mergeLocal(localRequiredDocs, oldRequiredDocs);
    const mergedLocalAssigned = mergeLocal(localAssigned, oldAssigned);
    const mergedLocalBanking = mergeLocal(localBanking, oldBanking);
    const mergedLocalLeads = mergeLocal(localLeads, oldLeads);
    const mergedLocalDrafts = mergeLocal(localDrafts, oldDrafts);
    const mergedLocalCollabs = mergeLocal(localCollabs, oldCollabs);
    const mergedLocalInvoices = mergeLocal(localInvoices, oldInvoices);
    const mergedLocalOneTime = mergeLocal(localOneTime, oldOneTime);

    const data = await fetchAllCRMData();
    if (data) {
      // Merge: remote data takes priority; only add local items not present in remote
      const mergeArrays = <T extends { id: string }>(remote: T[] = [], local: T[] = []) => {
        const merged = [...remote];
        local.forEach(item => {
          if (!merged.some(m => m.id === item.id)) {
            merged.push(item);
          }
        });
        return merged;
      };

      const finalClients = mergeArrays(data.clients, mergedLocalClients);
      const finalServices = mergeArrays(data.services, mergedLocalServices);
      const finalSubServices = mergeArrays(data.subServices, mergedLocalSubServices);
      const finalRequiredDocs = mergeArrays(data.requiredDocs, mergedLocalRequiredDocs);
      const finalAssigned = mergeArrays(data.assignedServices, mergedLocalAssigned);
      const finalBanking = mergeArrays(data.bankingEntries, mergedLocalBanking);
      const finalLeads = mergeArrays(data.leads, mergedLocalLeads);
      const finalDrafts = mergeArrays(data.drafts, mergedLocalDrafts);
      const finalCollabs = mergeArrays(data.collaborations, mergedLocalCollabs);

      set({
        clients: finalClients,
        services: finalServices,
        subServices: finalSubServices,
        requiredDocs: finalRequiredDocs,
        assignedServices: finalAssigned,
        bankingEntries: finalBanking,
        leads: finalLeads,
        drafts: finalDrafts,
        collaborations: finalCollabs,
        invoices: mergedLocalInvoices,
        oneTimeServices: mergedLocalOneTime,
        isLoadingSupabase: false,
      });

      // Save merged data under scoped key
      saveToLocal("clients", finalClients);
      saveToLocal("services", finalServices);
      saveToLocal("subServices", finalSubServices);
      saveToLocal("requiredDocs", finalRequiredDocs);
      saveToLocal("assignedServices", finalAssigned);
      saveToLocal("bankingEntries", finalBanking);
      saveToLocal("leads", finalLeads);
      saveToLocal("drafts", finalDrafts);
      saveToLocal("collaborations", finalCollabs);
      saveToLocal("invoices", mergedLocalInvoices);
      saveToLocal("oneTimeServices", mergedLocalOneTime);

      // Sync any migrated old data up to Supabase
      if (oldClients.length > 0 || oldServices.length > 0 || oldAssigned.length > 0 || oldInvoices.length > 0) {
        const { syncClientToSupabase, syncServiceToSupabase, syncSubServiceToSupabase,
                syncAssignedServiceToSupabase, syncLeadToSupabase, syncDraftToSupabase,
                syncCollaborationToSupabase, syncBankingEntryToSupabase,
                syncInvoiceToSupabase, syncOneTimeServiceToSupabase } = await import("./supabaseData");
        finalClients.forEach(c => syncClientToSupabase(c));
        finalServices.forEach(s => syncServiceToSupabase(s));
        finalSubServices.forEach(ss => syncSubServiceToSupabase(ss));
        finalAssigned.forEach(a => syncAssignedServiceToSupabase(a));
        finalLeads.forEach(l => syncLeadToSupabase(l));
        finalDrafts.forEach(d => syncDraftToSupabase(d));
        finalCollabs.forEach(c => syncCollaborationToSupabase(c));
        finalBanking.forEach(b => syncBankingEntryToSupabase(b));
        mergedLocalInvoices.forEach(inv => syncInvoiceToSupabase(inv));
        mergedLocalOneTime.forEach(ots => syncOneTimeServiceToSupabase(ots));

        // Clean up old unscoped keys so they don't migrate again
        const keysToClean = ["clients","services","subServices","requiredDocs",
          "assignedServices","bankingEntries","leads","drafts","collaborations","invoices","oneTimeServices"];
        keysToClean.forEach(k => {
          try { localStorage.removeItem(`zpluscrm_local_${k}`); } catch {}
        });
      }
    } else {
      // Supabase unavailable: use user-scoped local data only
      set({
        clients: mergedLocalClients,
        services: mergedLocalServices,
        subServices: mergedLocalSubServices,
        requiredDocs: mergedLocalRequiredDocs,
        assignedServices: mergedLocalAssigned,
        bankingEntries: mergedLocalBanking,
        leads: mergedLocalLeads,
        drafts: mergedLocalDrafts,
        collaborations: mergedLocalCollabs,
        invoices: mergedLocalInvoices,
        oneTimeServices: mergedLocalOneTime,
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
    set((s) => {
      const next = [...s.requiredDocs, d];
      saveToLocal("requiredDocs", next);
      return { requiredDocs: next };
    });
    syncRequiredDocToSupabase(d);
  },
  updateRequiredDoc: (d) => {
    set((s) => {
      const next = s.requiredDocs.map(x => x.id === d.id ? d : x);
      saveToLocal("requiredDocs", next);
      return { requiredDocs: next };
    });
    syncRequiredDocToSupabase(d);
  },
  deleteRequiredDoc: (id) => {
    set((s) => {
      const next = s.requiredDocs.filter(x => x.id !== id);
      saveToLocal("requiredDocs", next);
      return { requiredDocs: next };
    });
    removeRequiredDocFromSupabase(id);
  },

  // Assigned Services Sync
  addAssignedService: (a) => {
    set((s) => {
      const nextAssigned = [...s.assignedServices, a];
      saveToLocal("assignedServices", nextAssigned);
      return { assignedServices: nextAssigned };
    });
    syncAssignedServiceToSupabase(a);
  },
  updateAssignedService: (a) => {
    set((s) => {
      const nextAssigned = s.assignedServices.map(x => x.id === a.id ? a : x);
      saveToLocal("assignedServices", nextAssigned);
      return { assignedServices: nextAssigned };
    });
    syncAssignedServiceToSupabase(a);
  },
  deleteAssignedService: (id) => {
    set((s) => {
      const nextAssigned = s.assignedServices.filter(x => x.id !== id);
      saveToLocal("assignedServices", nextAssigned);
      return { assignedServices: nextAssigned };
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
  deleteLead: (id) => {
    set((s) => {
      const next = s.leads.filter(x => x.id !== id);
      saveToLocal("leads", next);
      return { leads: next };
    });
    removeLeadFromSupabase(id);
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

  // Collaborations Sync
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

  // Invoices Sync
  addInvoice: (inv) => {
    set((s) => {
      const next = [inv, ...s.invoices];
      saveToLocal("invoices", next);

      if (inv.type !== "PROFORMA" && inv.clientId) {
        const rcv = inv.amountReceived || (inv.status === "PAID" ? inv.total : 0);
        const billed = inv.total || 0;
        if (billed > 0 || rcv > 0) {
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
          saveToLocal("bankingEntries", nextBanking);
          syncBankingEntryToSupabase(bEntry);
          return { invoices: next, bankingEntries: nextBanking };
        }
      }

      return { invoices: next };
    });
    syncInvoiceToSupabase(inv);
  },
  updateInvoice: (inv) => {
    set((s) => {
      const next = s.invoices.map(x => x.id === inv.id ? inv : x);
      saveToLocal("invoices", next);

      if (inv.type !== "PROFORMA" && inv.clientId) {
        const rcv = inv.amountReceived || (inv.status === "PAID" ? inv.total : 0);
        const billed = inv.total || 0;
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
        saveToLocal("bankingEntries", nextBanking);
        syncBankingEntryToSupabase(bEntry);
        return { invoices: next, bankingEntries: nextBanking };
      }

      return { invoices: next };
    });
    syncInvoiceToSupabase(inv);
  },
  deleteInvoice: (id) => {
    set((s) => {
      const nextInvoices = s.invoices.filter(x => x.id !== id);
      saveToLocal("invoices", nextInvoices);

      const targetBankingId = `b_inv_${id}`;
      const nextBanking = s.bankingEntries.filter(b => b.id !== targetBankingId && b.id !== id);
      saveToLocal("bankingEntries", nextBanking);

      removeBankingEntryFromSupabase(targetBankingId);

      return { invoices: nextInvoices, bankingEntries: nextBanking };
    });
    removeInvoiceFromSupabase(id);
  },

  // Actions - One Time Services
  addOneTimeService: (ots) => {
    set((s) => {
      const next = [ots, ...s.oneTimeServices];
      saveToLocal("oneTimeServices", next);
      return { oneTimeServices: next };
    });
    syncOneTimeServiceToSupabase(ots);
  },
  updateOneTimeService: (ots) => {
    set((s) => {
      const next = s.oneTimeServices.map(x => x.id === ots.id ? ots : x);
      saveToLocal("oneTimeServices", next);
      return { oneTimeServices: next };
    });
    syncOneTimeServiceToSupabase(ots);
  },
  deleteOneTimeService: (id) => {
    set((s) => {
      const next = s.oneTimeServices.filter(x => x.id !== id);
      saveToLocal("oneTimeServices", next);
      return { oneTimeServices: next };
    });
    removeOneTimeServiceFromSupabase(id);
  },
}));
