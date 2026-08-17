import { create } from "zustand";
import {
  Client, Service, SubService, RequiredDoc,
  AssignedService, BankingEntry, Lead, DocumentDraft, Collaboration, Invoice, OneTimeService, RenewalItem
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
  removeOneTimeServiceFromSupabase,
  syncRenewalToSupabase,
  removeRenewalFromSupabase,
  purgeDuplicatesFromSupabase
} from "./supabaseData";

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

const getClientKey = (c: Client) => {
  const name = (c.name || '').toLowerCase().trim();
  const detail = (c.mobile || c.phone || c.email || c.pan || c.panNo || c.gstin || c.gstNo || '').toLowerCase().trim();
  return name ? `${name}_${detail}` : '';
};
const getServiceKey = (s: Service) => `${(s.id || '').trim()}_${(s.name || '').toLowerCase().trim()}_${s.price || 0}`;
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
  renewals: RenewalItem[];
  selectedFY: string;
  sidebarCollapsed: boolean;
  isLoadingSupabase: boolean;

  resetStore: () => void;

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

  // Actions - Renewals
  addRenewal: (rn: RenewalItem) => void;
  updateRenewal: (rn: RenewalItem) => void;
  deleteRenewal: (id: string) => void;
  renewService: (id: string) => void;
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
  renewals: loadFromLocal("renewals", []),
  selectedFY: getCurrentFY(),
  sidebarCollapsed: false,
  isLoadingSupabase: false,

  resetStore: () => set({
    clients: [],
    services: [],
    subServices: [],
    requiredDocs: [],
    assignedServices: [],
    bankingEntries: [],
    leads: [],
    drafts: [],
    collaborations: [],
    invoices: [],
    oneTimeServices: [],
    renewals: [],
    isLoadingSupabase: false,
  }),

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
    const localRenewals = loadFromLocal<any[]>("renewals", []);

    const data = await fetchAllCRMData();

    if (data?.userSettings && typeof window !== "undefined") {
      try {
        localStorage.setItem("zpluscrm_settings", JSON.stringify(data.userSettings));
        saveToLocal("settings", data.userSettings);
      } catch {}
    }

    const rawClients = data ? data.clients : localClients;
    const rawServices = data ? data.services : localServices;
    const rawSubServices = data ? data.subServices : localSubServices;
    const rawRequiredDocs = data ? data.requiredDocs : localRequiredDocs;
    const rawAssigned = data ? data.assignedServices : localAssigned;
    const rawBanking = data ? data.bankingEntries : localBanking;
    const rawLeads = data ? data.leads : localLeads;
    const rawDrafts = data ? data.drafts : localDrafts;
    const rawCollabs = data ? data.collaborations : localCollabs;
    const rawInvoices = data ? (data.invoices || []) : localInvoices;
    const rawOneTime = data ? (data.oneTimeServices || []) : localOneTime;
    const rawRenewals = data ? (data.renewals || []) : localRenewals;

    const clientsRes = deduplicateItems(rawClients, getClientKey);
    const servicesRes = deduplicateItems(rawServices, getServiceKey);
    const subServicesRes = deduplicateItems(rawSubServices, getSubServiceKey);
    const requiredDocsRes = deduplicateItems(rawRequiredDocs, getRequiredDocKey);
    const assignedRes = deduplicateItems(rawAssigned, getAssignedServiceKey);
    const bankingRes = deduplicateItems(rawBanking, getBankingEntryKey);
    const leadsRes = deduplicateItems(rawLeads, getLeadKey);
    const draftsRes = deduplicateItems(rawDrafts, getDraftKey);
    const collabsRes = deduplicateItems(rawCollabs, getCollabKey);
    const invoicesRes = deduplicateItems(rawInvoices, getInvoiceKey);
    const oneTimeRes = deduplicateItems(rawOneTime, getOneTimeKey);
    const renewalsRes = deduplicateItems(rawRenewals, (rn: any) => `${(rn.clientName || '').toLowerCase()}_${(rn.serviceName || '').toLowerCase()}`);

    // Auto-derive missing banking entries ONLY from Tax Invoices (assigned services do NOT create banking entries)
    const existingBankingIds = new Set(bankingRes.unique.map(b => b.id));
    const derivedBanking: BankingEntry[] = [];

    invoicesRes.unique.forEach((inv) => {
      if (inv.type !== "PROFORMA" && inv.clientId) {
        const invBId = `b_inv_${inv.id}`;
        if (!existingBankingIds.has(invBId)) {
          const rcv = inv.amountReceived || (inv.status === "PAID" ? inv.total : 0);
          const billed = inv.total || 0;
          derivedBanking.push({
            id: invBId,
            financialYear: inv.financialYear || getCurrentFY(),
            clientId: inv.clientId,
            serviceId: servicesRes.unique[0]?.id || "s1",
            amountBilled: billed,
            amountReceived: rcv,
            amountPending: Math.max(0, billed - rcv),
            paymentStatus: rcv >= billed && billed > 0 ? "PAID" : rcv > 0 ? "PARTIAL" : "PENDING",
            remark: `${inv.type} #${inv.invoiceNumber} payment record`
          });
        }
      }
    });

    const finalBanking = deduplicateItems([...bankingRes.unique, ...derivedBanking], getBankingEntryKey).unique;

    set({
      clients: clientsRes.unique,
      services: servicesRes.unique,
      subServices: subServicesRes.unique,
      requiredDocs: requiredDocsRes.unique,
      assignedServices: assignedRes.unique,
      bankingEntries: finalBanking,
      leads: leadsRes.unique,
      drafts: draftsRes.unique,
      collaborations: collabsRes.unique,
      invoices: invoicesRes.unique,
      oneTimeServices: oneTimeRes.unique,
      renewals: renewalsRes.unique,
      isLoadingSupabase: false,
    });

    saveToLocal("clients", clientsRes.unique);
    saveToLocal("services", servicesRes.unique);
    saveToLocal("subServices", subServicesRes.unique);
    saveToLocal("requiredDocs", requiredDocsRes.unique);
    saveToLocal("assignedServices", assignedRes.unique);
    saveToLocal("bankingEntries", finalBanking);
    saveToLocal("leads", leadsRes.unique);
    saveToLocal("drafts", draftsRes.unique);
    saveToLocal("collaborations", collabsRes.unique);
    saveToLocal("invoices", invoicesRes.unique);
    saveToLocal("oneTimeServices", oneTimeRes.unique);
    saveToLocal("renewals", renewalsRes.unique);

    // Sync clean data & purge duplicate IDs from Supabase
    if (clientsRes.duplicateIds.length) purgeDuplicatesFromSupabase("clients", clientsRes.duplicateIds);
    if (servicesRes.duplicateIds.length) purgeDuplicatesFromSupabase("services", servicesRes.duplicateIds);
    if (subServicesRes.duplicateIds.length) purgeDuplicatesFromSupabase("sub_services", subServicesRes.duplicateIds);
    if (requiredDocsRes.duplicateIds.length) purgeDuplicatesFromSupabase("required_docs", requiredDocsRes.duplicateIds);
    if (assignedRes.duplicateIds.length) purgeDuplicatesFromSupabase("assigned_services", assignedRes.duplicateIds);
    if (bankingRes.duplicateIds.length) purgeDuplicatesFromSupabase("banking_entries", bankingRes.duplicateIds);
    if (leadsRes.duplicateIds.length) purgeDuplicatesFromSupabase("leads", leadsRes.duplicateIds);
    if (draftsRes.duplicateIds.length) purgeDuplicatesFromSupabase("drafts", draftsRes.duplicateIds);
    if (collabsRes.duplicateIds.length) purgeDuplicatesFromSupabase("collaborations", collabsRes.duplicateIds);
    if (invoicesRes.duplicateIds.length) purgeDuplicatesFromSupabase("invoices", invoicesRes.duplicateIds);
    if (oneTimeRes.duplicateIds.length) purgeDuplicatesFromSupabase("one_time_services", oneTimeRes.duplicateIds);

    // Clean up old unscoped keys
    const keysToClean = ["clients","services","subServices","requiredDocs",
      "assignedServices","bankingEntries","leads","drafts","collaborations","invoices","oneTimeServices"];
    keysToClean.forEach(k => {
      try { localStorage.removeItem(`zpluscrm_local_${k}`); } catch {}
    });
  },

  setSelectedFY: (fy) => set({ selectedFY: fy }),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  // Clients Sync
  addClient: (c) => {
    // Auto-provision initial portal credentials if missing
    const panId = (c.pan || c.panNo || "").trim();
    const gstId = (c.gstNo || c.gstin || "").trim();
    const portalCredentials = (c.portalCredentials && c.portalCredentials.length > 0)
      ? c.portalCredentials
      : [
          { id: `cred_gst_${Date.now()}`, portalName: "GST Portal", portalId: gstId || "Not Set", password: c.gstPortalPassword || "TempPass@123" },
          { id: `cred_it_${Date.now()}`, portalName: "Income Tax Portal", portalId: panId || "Not Set", password: "TempPass@123" }
        ];

    const preparedClient: Client = {
      ...c,
      documents: c.documents || [],
      documentCount: c.documents?.length || 0,
      portalCredentials,
    };

    // Cloud-First Execution: Await/Trigger Supabase write, then commit to local state
    syncClientToSupabase(preparedClient);

    set((s) => {
      const key = getClientKey(preparedClient);
      if (s.clients.some(x => x.id === preparedClient.id || (key && getClientKey(x) === key))) return s;
      const next = [...s.clients, preparedClient];
      saveToLocal("clients", next);
      return { clients: next };
    });
  },
  updateClient: (c) => {
    syncClientToSupabase(c);
    set((s) => {
      const next = s.clients.map(x => x.id === c.id ? c : x);
      saveToLocal("clients", next);
      return { clients: next };
    });
  },
  deleteClient: (id) => {
    removeClientFromSupabase(id);
    set((s) => {
      const next = s.clients.filter(x => x.id !== id);
      saveToLocal("clients", next);
      return { clients: next };
    });
  },

  // Services Sync (Packages)
  addService: (sv) => {
    set((s) => {
      const key = getServiceKey(sv);
      if (s.services.some(x => x.id === sv.id || (key && getServiceKey(x) === key))) return s;
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
      const key = getSubServiceKey(ss);
      if (s.subServices.some(x => x.id === ss.id || (key && getSubServiceKey(x) === key))) return s;
      const next = [...s.subServices, ss];
      saveToLocal("subServices", next);
      return { subServices: next };
    });
    syncSubServiceToSupabase(ss);
  },
  addSubServicesBatch: (ssList) => {
    set((s) => {
      const uniqueBatch = ssList.filter(ss => {
        const key = getSubServiceKey(ss);
        return !s.subServices.some(x => x.id === ss.id || (key && getSubServiceKey(x) === key));
      });
      if (uniqueBatch.length === 0) return s;
      const next = [...s.subServices, ...uniqueBatch];
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

  // Actions - Renewals
  addRenewal: (rn) => {
    set((s) => {
      const next = [rn, ...(s.renewals || [])];
      saveToLocal("renewals", next);
      return { renewals: next };
    });
    syncRenewalToSupabase(rn);
  },
  updateRenewal: (rn) => {
    set((s) => {
      const next = (s.renewals || []).map(x => x.id === rn.id ? rn : x);
      saveToLocal("renewals", next);
      return { renewals: next };
    });
    syncRenewalToSupabase(rn);
  },
  deleteRenewal: (id) => {
    set((s) => {
      const next = (s.renewals || []).filter(x => x.id !== id);
      saveToLocal("renewals", next);
      return { renewals: next };
    });
    removeRenewalFromSupabase(id);
  },
  renewService: (id) => {
    set((s) => {
      const target = (s.renewals || []).find(x => x.id === id);
      if (!target) return s;

      // 1. Calculate duration in years from existing dates or recurrence period
      let yearsToAdd = 1;
      if (target.fromDate && target.toDate) {
        const yFrom = new Date(target.fromDate).getFullYear();
        const yTo = new Date(target.toDate).getFullYear();
        if (!isNaN(yFrom) && !isNaN(yTo) && yTo > yFrom) {
          yearsToAdd = yTo - yFrom;
        }
      } else {
        const rec = (target.recurrencePeriod || "").toLowerCase();
        if (rec.includes("2 year")) yearsToAdd = 2;
        else if (rec.includes("3 year")) yearsToAdd = 3;
        else if (rec.includes("5 year")) yearsToAdd = 5;
      }

      // 2. Next cycle starts from previous cycle's To Date (e.g. 10/08/2029)
      let nextFromDate = target.toDate || target.fromDate;
      let nextToDate = target.toDate;
      let nextDueDate = target.dueDate;
      let nextFY = target.financialYear;

      if (nextFromDate) {
        // Calculate new To Date starting from nextFromDate + yearsToAdd (e.g. 10/08/2029 -> 10/08/2032)
        const dTo = new Date(nextFromDate);
        dTo.setFullYear(dTo.getFullYear() + yearsToAdd);
        nextToDate = dTo.toISOString().split("T")[0];
        nextDueDate = nextToDate;
      } else if (target.fromDate) {
        const dFrom = new Date(target.fromDate);
        dFrom.setFullYear(dFrom.getFullYear() + yearsToAdd);
        nextFromDate = dFrom.toISOString().split("T")[0];

        const dTo = new Date(nextFromDate);
        dTo.setFullYear(dTo.getFullYear() + yearsToAdd);
        nextToDate = dTo.toISOString().split("T")[0];
        nextDueDate = nextToDate;
      }

      // 3. Compute Financial Year string (e.g. 2029 - 2032 or FY 2029-30)
      if (nextFromDate && nextToDate) {
        const y1 = new Date(nextFromDate).getFullYear();
        const y2 = new Date(nextToDate).getFullYear();
        if (y2 - y1 === 1) {
          const endYStr = String(y2).slice(-2);
          nextFY = `FY ${y1}-${endYStr}`;
        } else {
          nextFY = y1 === y2 ? `FY ${y1}` : `${y1} - ${y2}`;
        }
      }

      const renewedItem: RenewalItem = {
        ...target,
        fromDate: nextFromDate,
        toDate: nextToDate,
        dueDate: nextDueDate,
        financialYear: nextFY,
        progress: "To-do", // Reset progress to To-do for the new cycle
      };

      const next = (s.renewals || []).map(x => x.id === id ? renewedItem : x);
      saveToLocal("renewals", next);
      syncRenewalToSupabase(renewedItem);
      return { renewals: next };
    });
  },
}));
