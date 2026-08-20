import { create } from "zustand";
import {
  Client, Service, SubService, RequiredDoc,
  AssignedService, BankingEntry, Lead, DocumentDraft, Collaboration, Invoice, OneTimeService, RenewalItem
} from "./types";
import { getCurrentFY, ensureUUID } from "./utils";
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
  purgeDuplicatesFromSupabase,
  purgeAllUserDataFromSupabase
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
        // Drop secondary in-memory collision but do not purge unless identical ID
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
  const detail = (c.pan || c.panNo || c.gstin || c.gstNo || c.email || c.mobile || c.phone || '').toLowerCase().trim();
  return detail ? `${name}_${detail}` : `${name}_${c.id}`;
};
const getServiceKey = (s: Service) => s.id;
const getSubServiceKey = (ss: SubService) => `${(ss.serviceId || (ss.serviceIds && ss.serviceIds[0]) || '').trim()}_${(ss.name || '').toLowerCase().trim()}`;
const getRequiredDocKey = (rd: RequiredDoc) => `${(rd.subServiceId || '').trim()}_${(rd.name || '').toLowerCase().trim()}`;
const getAssignedServiceKey = (a: AssignedService) => `${(a.clientId || '').trim()}_${(a.serviceId || '').trim()}_${(a.financialYear || '').trim()}_${(a.dueDate || '').trim()}`;
const getBankingEntryKey = (b: BankingEntry) => {
  if (b.remark && b.remark.includes("#")) {
    const match = b.remark.match(/#([^\s]+)/);
    if (match) return `inv_${match[1].toLowerCase().trim()}`;
  }
  return b.id;
};
const getLeadKey = (l: Lead) => {
  const name = (l.name || '').toLowerCase().trim();
  const contact = (l.mobile || l.phone || l.email || '').toLowerCase().trim();
  return contact ? `${name}_${contact}` : `${name}_${l.id}`;
};
const getDraftKey = (d: DocumentDraft) => `${(d as any).clientId || ''}_${(d.title || '').toLowerCase().trim()}`;
const getCollabKey = (c: Collaboration) => {
  const name = (c.name || '').toLowerCase().trim();
  const detail = (c.number || c.email || '').toLowerCase().trim();
  return detail ? `${name}_${detail}` : `${name}_${c.id}`;
};
const getInvoiceKey = (inv: Invoice) => (inv.invoiceNumber || '').toLowerCase().trim() ? `${(inv.invoiceNumber || '').toLowerCase().trim()}_${(inv.type || '').toLowerCase().trim()}` : inv.id;
const getOneTimeKey = (ots: OneTimeService) => `${(ots.clientName || '').toLowerCase().trim()}_${(ots.serviceName || '').toLowerCase().trim()}_${(ots.dueDate || '').trim()}`;
const getRenewalKey = (rn: any) => `${(rn.clientName || '').toLowerCase().trim()}_${(rn.serviceName || '').toLowerCase().trim()}_${(rn.financialYear || rn.dueDate || '').trim()}`;

// Track in-flight client IDs being deleted so realtime re-fetch cannot restore them
const pendingDeletes = new Set<string>();

export function purgeUserLocalData(email?: string) {
  if (typeof window === "undefined") return;
  try {
    const clean = (email || "").toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (clean && key.toLowerCase().includes(clean)) {
        toRemove.push(key);
      } else if (key.startsWith("zpluscrm_local_")) {
        toRemove.push(key);
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.error("Error purging local data:", e);
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
  addClient: (c: Client) => Promise<void>;
  updateClient: (c: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  // Actions - Services
  addService: (s: Service) => Promise<void>;
  updateService: (s: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  // Actions - SubServices
  addSubService: (s: SubService) => Promise<void>;
  addSubServicesBatch?: (ssList: SubService[]) => Promise<void>;
  updateSubService: (s: SubService) => Promise<void>;
  deleteSubService: (id: string) => Promise<void>;

  // Actions - Required Docs
  addRequiredDoc: (d: RequiredDoc) => Promise<void>;
  updateRequiredDoc: (d: RequiredDoc) => Promise<void>;
  deleteRequiredDoc: (id: string) => Promise<void>;

  // Actions - Assigned Services
  addAssignedService: (a: AssignedService) => Promise<void>;
  updateAssignedService: (a: AssignedService) => Promise<void>;
  deleteAssignedService: (id: string) => Promise<void>;

  // Actions - Banking
  addBankingEntry: (b: BankingEntry) => Promise<void>;
  updateBankingEntry: (b: BankingEntry) => Promise<void>;
  deleteBankingEntry: (id: string) => Promise<void>;

  // Actions - Leads
  addLead: (l: Lead) => Promise<void>;
  updateLead: (l: Lead) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  convertLead: (leadId: string, clientId: string) => Promise<void>;

  // Actions - Drafts
  addDraft: (d: DocumentDraft) => Promise<void>;
  updateDraft: (d: DocumentDraft) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;

  // Actions - Collaborations
  addCollaboration: (c: Collaboration) => Promise<void>;
  updateCollaboration: (c: Collaboration) => Promise<void>;
  deleteCollaboration: (id: string) => Promise<void>;

  // Actions - Invoices (Persisted + Banking Link)
  addInvoice: (inv: Invoice) => Promise<void>;
  updateInvoice: (inv: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  // Actions - One Time Services
  addOneTimeService: (ots: OneTimeService) => Promise<void>;
  updateOneTimeService: (ots: OneTimeService) => Promise<void>;
  deleteOneTimeService: (id: string) => Promise<void>;

  // Actions - Renewals
  addRenewal: (rn: RenewalItem) => Promise<void>;
  updateRenewal: (rn: RenewalItem) => Promise<void>;
  deleteRenewal: (id: string) => Promise<void>;
  renewService: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>()((set, get) => ({
  // Cloud-only data architecture. Initial state starts with empty arrays until Supabase hydration completes.
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
  selectedFY: getCurrentFY(),
  sidebarCollapsed: false,
  isLoadingSupabase: false,

  resetStore: () => {
    // Reset local cache & state without deleting cloud database records

    set({
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
    });
  },

  loadSupabaseData: async () => {
    set({ isLoadingSupabase: true });

    const data = await fetchAllCRMData();

    if (data?.userSettings && typeof window !== "undefined") {
      try {
        localStorage.setItem("zpluscrm_settings", JSON.stringify(data.userSettings));
      } catch {}
    }

    const renewalKey = (rn: any) => `${(rn.clientName || '').toLowerCase()}_${(rn.serviceName || '').toLowerCase()}`;

    // Cloud is ALWAYS authoritative. No local storage caching for CRM entities.
    if (data === null) {
      set({ isLoadingSupabase: false });
      return;
    }

    // Cloud fetch succeeded — filter out any items currently being deleted
    const cloudClients = (data.clients || []).filter((c: Client) =>
      !pendingDeletes.has(c.id) && !pendingDeletes.has(ensureUUID(c.id))
    );

    const rawClients = cloudClients;
    const rawServices = data.services || [];
    const rawSubServices = data.subServices || [];
    const rawRequiredDocs = data.requiredDocs || [];
    const rawAssigned = data.assignedServices || [];
    const rawBanking = data.bankingEntries || [];
    const rawLeads = data.leads || [];
    const rawDrafts = data.drafts || [];
    const rawCollabs = data.collaborations || [];
    const rawInvoices = data.invoices || [];
    const rawOneTime = data.oneTimeServices || [];
    const rawRenewals = data.renewals || [];

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
    const renewalsRes = deduplicateItems(rawRenewals, renewalKey);

    // Ensure all Tax Invoices have a corresponding banking entry
    const existingBanking = [...bankingRes.unique];
    invoicesRes.unique.forEach((inv: Invoice) => {
      if (inv.type !== "PROFORMA" && inv.clientId) {
        const bEntryId = ensureUUID(`binv_${inv.id}`);
        const exists = existingBanking.some(b => b.id === bEntryId || ensureUUID(b.id) === bEntryId || (inv.invoiceNumber && b.remark?.includes(`#${inv.invoiceNumber} `)));
        if (!exists) {
          const rcv = Number(inv.amountReceived || (inv.status === "PAID" ? inv.total : 0));
          const billed = Number(inv.total || 0);
          const bEntry: BankingEntry = {
            id: bEntryId,
            financialYear: inv.financialYear || getCurrentFY(),
            clientId: inv.clientId,
            serviceId: servicesRes.unique[0]?.id || "00000000-0000-0000-0000-000000000000",
            amountBilled: billed,
            amountReceived: rcv,
            amountPending: Math.max(0, billed - rcv),
            paymentStatus: rcv >= billed && billed > 0 ? "PAID" : rcv > 0 ? "PARTIAL" : "PENDING",
            remark: `${inv.type} #${inv.invoiceNumber} payment record`
          };
          existingBanking.push(bEntry);
        }
      }
    });

    const finalBanking = deduplicateItems(existingBanking, getBankingEntryKey).unique;

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
  addClient: async (c) => {
    // Auto-provision initial portal credentials if missing
    const panId = (c.pan || c.panNo || "").trim();
    const gstId = (c.gstNo || c.gstin || "").trim();
    const portalCredentials = c.portalCredentials !== undefined
      ? c.portalCredentials
      : [
          { id: `cred_gst_${Date.now()}`, portalName: "GST Portal", portalId: gstId || "Not Set", password: c.gstPortalPassword || "" },
          { id: `cred_it_${Date.now()}`, portalName: "Income Tax Portal", portalId: panId || "Not Set", password: "" }
        ];

    const preparedClient: Client = {
      ...c,
      id: ensureUUID(c.id),
      documents: c.documents || [],
      documentCount: c.documents?.length || 0,
      portalCredentials,
    };

    // 1. Instantly update in-memory state and user-scoped localStorage
    set((s) => {
      const key = getClientKey(preparedClient);
      if (s.clients.some(x => x.id === preparedClient.id || (key && getClientKey(x) === key))) return s;
      const next = [...s.clients, preparedClient];
      return { clients: next };
    });

    // 2. Await cloud synchronization to Supabase
    await syncClientToSupabase(preparedClient);
  },
  updateClient: async (c) => {
    const cleanId = c.id;
    set((s) => {
      let found = false;
      const next = s.clients.map(x => {
        if (
          x.id === cleanId ||
          (cleanId && ensureUUID(x.id) === ensureUUID(cleanId))
        ) {
          found = true;
          return { ...x, ...c };
        }
        return x;
      });
      const finalClients = found ? next : [...s.clients, c];
      return { clients: finalClients };
    });
    await syncClientToSupabase(c);
  },
  deleteClient: async (id) => {
    // Mark this ID as pending delete so the realtime listener
    // cannot race and restore it during the delete operation
    const dbId = ensureUUID(id);
    pendingDeletes.add(id);
    pendingDeletes.add(dbId);

    // 1. Instantly remove from store along with all linked records
    set((s) => ({
      clients: s.clients.filter(x => x.id !== id && ensureUUID(x.id) !== dbId),
      assignedServices: s.assignedServices.filter(a => a.clientId !== id && a.clientId !== dbId && (!a.clientId || ensureUUID(a.clientId) !== dbId)),
      bankingEntries: s.bankingEntries.filter(b => b.clientId !== id && b.clientId !== dbId && (!b.clientId || ensureUUID(b.clientId) !== dbId)),
      invoices: s.invoices.filter(inv => inv.clientId !== id && inv.clientId !== dbId && (!inv.clientId || ensureUUID(inv.clientId) !== dbId)),
      drafts: s.drafts.filter(d => (d as any).clientId !== id && (d as any).clientId !== dbId && (!(d as any).clientId || ensureUUID((d as any).clientId) !== dbId)),
      subServices: s.subServices.filter(ss => ss.clientId !== id && ss.clientId !== dbId && (!ss.clientId || ensureUUID(ss.clientId) !== dbId)),
    }));

    try {
      await removeClientFromSupabase(id);
    } finally {
      // Remove from pending set after a safe window (5s) to allow
      // the realtime subscription to process without resurrecting the item
      setTimeout(() => {
        pendingDeletes.delete(id);
        pendingDeletes.delete(dbId);
      }, 5000);
    }
  },

  addService: async (sv) => {
    const svFixed: Service = { ...sv, id: ensureUUID(sv.id) };
    set((s) => {
      if (s.services.some(x => x.id === svFixed.id || (svFixed.id && ensureUUID(x.id) === svFixed.id))) return s;
      const next = [...s.services, svFixed];
      return { services: next };
    });
    await syncServiceToSupabase(svFixed);
  },
  updateService: async (sv) => {
    set((s) => {
      const next = s.services.map(x => x.id === sv.id ? sv : x);
      return { services: next };
    });
    await syncServiceToSupabase(sv);
  },
  deleteService: async (id) => {
    const dbId = ensureUUID(id);
    const target = useAppStore.getState().services.find(s => s.id === id || ensureUUID(s.id) === dbId);
    const targetName = target?.name;
    set((s) => ({
      services: s.services.filter(x => x.id !== id && ensureUUID(x.id) !== dbId && (!targetName || x.name?.toLowerCase().trim() !== targetName.toLowerCase().trim())),
      subServices: s.subServices.filter(ss => ss.serviceId !== id && ss.serviceId !== dbId && (!ss.serviceId || ensureUUID(ss.serviceId) !== dbId)),
      assignedServices: s.assignedServices.filter(a => a.serviceId !== id && a.serviceId !== dbId && (!a.serviceId || ensureUUID(a.serviceId) !== dbId)),
      bankingEntries: s.bankingEntries.filter(b => b.serviceId !== id && b.serviceId !== dbId && (!b.serviceId || ensureUUID(b.serviceId) !== dbId)),
    }));
    await removeServiceFromSupabase(id, targetName);
  },

  addSubService: async (ss) => {
    const ssFixed: SubService = { ...ss, id: ensureUUID(ss.id) };
    set((s) => {
      const key = getSubServiceKey(ssFixed);
      if (s.subServices.some(x => x.id === ssFixed.id || (key && getSubServiceKey(x) === key))) return s;
      const next = [...s.subServices, ssFixed];
      return { subServices: next };
    });
    await syncSubServiceToSupabase(ssFixed);
  },
  addSubServicesBatch: async (ssList) => {
    const fixedBatch = ssList.map(ss => ({ ...ss, id: ensureUUID(ss.id) }));
    set((s) => {
      const uniqueBatch = fixedBatch.filter(ss => {
        const key = getSubServiceKey(ss);
        return !s.subServices.some(x => x.id === ss.id || (key && getSubServiceKey(x) === key));
      });
      if (uniqueBatch.length === 0) return s;
      const next = [...s.subServices, ...uniqueBatch];
      return { subServices: next };
    });
    await Promise.all(fixedBatch.map(ss => syncSubServiceToSupabase(ss)));
  },
  updateSubService: async (ss) => {
    set((s) => {
      const next = s.subServices.map(x => x.id === ss.id ? ss : x);
      return { subServices: next };
    });
    await syncSubServiceToSupabase(ss);
  },
  deleteSubService: async (id) => {
    const dbId = ensureUUID(id);
    const target = useAppStore.getState().subServices.find(ss => ss.id === id || ensureUUID(ss.id) === dbId);
    const targetName = target?.name;
    set((s) => ({
      subServices: s.subServices.filter(x => x.id !== id && ensureUUID(x.id) !== dbId && (!targetName || x.name?.toLowerCase().trim() !== targetName.toLowerCase().trim())),
      requiredDocs: s.requiredDocs.filter(d => d.subServiceId !== id && d.subServiceId !== dbId && (!d.subServiceId || ensureUUID(d.subServiceId) !== dbId)),
    }));
    await removeSubServiceFromSupabase(id, targetName);
  },

  addRequiredDoc: async (d) => {
    const dFixed: RequiredDoc = {
      ...d,
      id: ensureUUID(d.id),
      subServiceId: d.subServiceId ? d.subServiceId.trim() : "",
      name: d.name.trim(),
    };
    set((s) => {
      const key = getRequiredDocKey(dFixed);
      if (s.requiredDocs.some(x => x.id === dFixed.id || (key && getRequiredDocKey(x) === key))) return s;
      const next = [...s.requiredDocs, dFixed];
      return { requiredDocs: next };
    });
    await syncRequiredDocToSupabase(dFixed);
  },
  updateRequiredDoc: async (d) => {
    const cleanId = d.id;
    const dFixed: RequiredDoc = { ...d, id: ensureUUID(d.id) };
    set((s) => {
      let found = false;
      const next = s.requiredDocs.map(x => {
        if (x.id === cleanId || (cleanId && ensureUUID(x.id) === ensureUUID(cleanId))) {
          found = true;
          return { ...x, ...dFixed };
        }
        return x;
      });
      const finalDocs = found ? next : [...s.requiredDocs, dFixed];
      return { requiredDocs: finalDocs };
    });
    await syncRequiredDocToSupabase(dFixed);
  },
  deleteRequiredDoc: async (id) => {
    const target = useAppStore.getState().requiredDocs.find(d => d.id === id || (id && ensureUUID(d.id) === ensureUUID(id)));
    const targetName = target?.name;
    set((s) => {
      const next = s.requiredDocs.filter(x => {
        if (x.id === id) return false;
        if (id && ensureUUID(x.id) === ensureUUID(id)) return false;
        return true;
      });
      return { requiredDocs: next };
    });
    await removeRequiredDocFromSupabase(id, targetName);
  },

  addAssignedService: async (a) => {
    const aFixed: AssignedService = { ...a, id: ensureUUID(a.id) };
    set((s) => {
      const isDuplicate = s.assignedServices.some(x =>
        x.id === aFixed.id ||
        (
          (x.clientId === aFixed.clientId || (aFixed.clientId && ensureUUID(x.clientId) === ensureUUID(aFixed.clientId))) &&
          (x.serviceId === aFixed.serviceId || (aFixed.serviceId && ensureUUID(x.serviceId) === ensureUUID(aFixed.serviceId))) &&
          x.financialYear === aFixed.financialYear &&
          (
            (!x.subServiceIds || x.subServiceIds.length === 0) ||
            (!aFixed.subServiceIds || aFixed.subServiceIds.length === 0) ||
            x.subServiceIds.some(sid => aFixed.subServiceIds?.some(asid => asid === sid || (sid && ensureUUID(asid) === ensureUUID(sid))))
          )
        )
      );
      if (isDuplicate) return s;
      const nextAssigned = [...s.assignedServices, aFixed];
      return { assignedServices: nextAssigned };
    });
    await syncAssignedServiceToSupabase(aFixed);
  },
  updateAssignedService: async (a) => {
    set((s) => {
      const nextAssigned = s.assignedServices.map(x => x.id === a.id ? a : x);
      return { assignedServices: nextAssigned };
    });
    await syncAssignedServiceToSupabase(a);
  },
  deleteAssignedService: async (id) => {
    set((s) => {
      const nextAssigned = s.assignedServices.filter(x => x.id !== id);
      return { assignedServices: nextAssigned };
    });
    await removeAssignedServiceFromSupabase(id);
  },

  addBankingEntry: async (b) => {
    set((s) => {
      const next = [...s.bankingEntries, b];
      return { bankingEntries: next };
    });
    await syncBankingEntryToSupabase(b);
  },
  updateBankingEntry: async (b) => {
    const bFixed: BankingEntry = { ...b, id: ensureUUID(b.id) };
    let invoiceToSync: Invoice | null = null;
    set((s) => {
      const updatedAssigned = s.assignedServices.map(a => {
        if (a.id === bFixed.id.replace(/^b-/, "") || (a.clientId === bFixed.clientId && a.serviceId === bFixed.serviceId && a.financialYear === bFixed.financialYear)) {
          return {
            ...a,
            amountReceived: bFixed.amountReceived,
            amountPending: bFixed.amountPending
          };
        }
        return a;
      });

      const invoiceNumberMatch = bFixed.remark?.match(/#([^\s]+)/);
      const invNumber = invoiceNumberMatch ? invoiceNumberMatch[1] : null;

      const updatedInvoices = s.invoices.map(inv => {
        const matches = (invNumber && inv.invoiceNumber?.toLowerCase().trim() === invNumber.toLowerCase().trim()) ||
          ensureUUID(`binv_${ensureUUID(inv.id)}`) === bFixed.id;
        
        if (matches) {
          const rcv = Number(bFixed.amountReceived || 0);
          const total = inv.total || Number(bFixed.amountBilled || 0);
          const bal = Math.max(0, total - rcv);
          const status = rcv >= total && total > 0 ? "PAID" as const : rcv > 0 ? "SENT" as const : inv.status;
          const updatedInv: Invoice = { ...inv, amountReceived: rcv, balanceDue: bal, status };
          invoiceToSync = updatedInv;
          return updatedInv;
        }
        return inv;
      });

      const nextBanking = s.bankingEntries.map(x => (x.id === bFixed.id || ensureUUID(x.id) === bFixed.id) ? bFixed : x);
      return {
        bankingEntries: nextBanking,
        assignedServices: updatedAssigned,
        invoices: updatedInvoices
      };
    });
    await syncBankingEntryToSupabase(bFixed);
    if (invoiceToSync) {
      await syncInvoiceToSupabase(invoiceToSync);
    }
  },
  deleteBankingEntry: async (id) => {
    set((s) => {
      const next = s.bankingEntries.filter(x => x.id !== id);
      return { bankingEntries: next };
    });
    await removeBankingEntryFromSupabase(id);
  },

  addLead: async (l) => {
    set((s) => {
      const next = [...s.leads, l];
      return { leads: next };
    });
    await syncLeadToSupabase(l);
  },
  updateLead: async (l) => {
    set((s) => {
      const next = s.leads.map(x => x.id === l.id ? l : x);
      return { leads: next };
    });
    await syncLeadToSupabase(l);
  },
  deleteLead: async (id) => {
    const target = useAppStore.getState().leads.find(l => l.id === id);
    const targetName = target?.name;
    set((s) => {
      const next = s.leads.filter(x => {
        if (x.id === id) return false;
        if (targetName && x.name?.toLowerCase().trim() === targetName.toLowerCase().trim()) return false;
        return true;
      });
      return { leads: next };
    });
    await removeLeadFromSupabase(id, targetName);
  },
  convertLead: async (leadId, clientId) => {
    const currentLeads = useAppStore.getState().leads;
    const updatedLeads = currentLeads.map(x => x.id === leadId ? { ...x, status: "CONVERTED" as const, convertedClientId: clientId } : x);
    const convertedLead = updatedLeads.find(x => x.id === leadId);
    set({ leads: updatedLeads });
    if (convertedLead) {
      await syncLeadToSupabase(convertedLead);
    }
  },

  addDraft: async (d) => {
    set((s) => {
      const next = [...s.drafts, d];
      return { drafts: next };
    });
    await syncDraftToSupabase(d);
  },
  updateDraft: async (d) => {
    set((s) => {
      const next = s.drafts.map(x => x.id === d.id ? d : x);
      return { drafts: next };
    });
    await syncDraftToSupabase(d);
  },
  deleteDraft: async (id) => {
    set((s) => {
      const next = s.drafts.filter(x => x.id !== id);
      return { drafts: next };
    });
    await removeDraftFromSupabase(id);
  },

  addCollaboration: async (c) => {
    set((s) => {
      const next = [...s.collaborations, c];
      return { collaborations: next };
    });
    await syncCollaborationToSupabase(c);
  },
  updateCollaboration: async (c) => {
    set((s) => {
      const next = s.collaborations.map(x => x.id === c.id ? c : x);
      return { collaborations: next };
    });
    await syncCollaborationToSupabase(c);
  },
  deleteCollaboration: async (id) => {
    const target = useAppStore.getState().collaborations.find(c => c.id === id);
    const targetName = target?.name;
    set((s) => {
      const next = s.collaborations.filter(x => {
        if (x.id === id) return false;
        if (targetName && x.name?.toLowerCase().trim() === targetName.toLowerCase().trim()) return false;
        return true;
      });
      return { collaborations: next };
    });
    await removeCollaborationFromSupabase(id, targetName);
  },

  addInvoice: async (inv) => {
    const invFixed: Invoice = { ...inv, id: ensureUUID(inv.id) };
    let bEntryToSync: BankingEntry | null = null;
    set((s) => {
      const next = [invFixed, ...s.invoices.filter(x => x.id !== invFixed.id && ensureUUID(x.id) !== invFixed.id)];

      if (invFixed.type !== "PROFORMA" && invFixed.clientId) {
        const rcv = Number(invFixed.amountReceived || (invFixed.status === "PAID" ? invFixed.total : 0));
        const billed = Number(invFixed.total || 0);
        if (billed > 0 || rcv > 0) {
          const bEntryId = ensureUUID(`binv_${invFixed.id}`);
          const bEntry: BankingEntry = {
            id: bEntryId,
            financialYear: invFixed.financialYear || s.selectedFY || getCurrentFY(),
            clientId: invFixed.clientId,
            serviceId: s.services[0]?.id || "00000000-0000-0000-0000-000000000000",
            amountBilled: billed,
            amountReceived: rcv,
            amountPending: Math.max(0, billed - rcv),
            paymentStatus: rcv >= billed && billed > 0 ? "PAID" : rcv > 0 ? "PARTIAL" : "PENDING",
            remark: `${invFixed.type} #${invFixed.invoiceNumber} payment record`
          };
          bEntryToSync = bEntry;
          const nextBanking = [...s.bankingEntries.filter(b => b.id !== bEntryId && ensureUUID(b.id) !== bEntryId && !b.remark?.includes(`#${invFixed.invoiceNumber} `)), bEntry];
          return { invoices: next, bankingEntries: nextBanking };
        }
      }

      return { invoices: next };
    });
    await syncInvoiceToSupabase(invFixed);
    if (bEntryToSync) {
      await syncBankingEntryToSupabase(bEntryToSync);
    }
  },
  updateInvoice: async (inv) => {
    const invFixed: Invoice = { ...inv, id: ensureUUID(inv.id) };
    let bEntryToSync: BankingEntry | null = null;
    set((s) => {
      const next = s.invoices.map(x => (x.id === invFixed.id || ensureUUID(x.id) === invFixed.id) ? invFixed : x);

      if (invFixed.type !== "PROFORMA" && invFixed.clientId) {
        const rcv = Number(invFixed.amountReceived || (invFixed.status === "PAID" ? invFixed.total : 0));
        const billed = Number(invFixed.total || 0);
        const bEntryId = ensureUUID(`binv_${invFixed.id}`);
        const bEntry: BankingEntry = {
          id: bEntryId,
          financialYear: invFixed.financialYear || s.selectedFY || getCurrentFY(),
          clientId: invFixed.clientId,
          serviceId: s.services[0]?.id || "00000000-0000-0000-0000-000000000000",
          amountBilled: billed,
          amountReceived: rcv,
          amountPending: Math.max(0, billed - rcv),
          paymentStatus: rcv >= billed && billed > 0 ? "PAID" : rcv > 0 ? "PARTIAL" : "PENDING",
          remark: `${invFixed.type} #${invFixed.invoiceNumber} payment record`
        };
        bEntryToSync = bEntry;
        const exists = s.bankingEntries.some(b => b.id === bEntryId || ensureUUID(b.id) === bEntryId || b.remark?.includes(`#${invFixed.invoiceNumber} `));
        const nextBanking = exists
          ? s.bankingEntries.map(b => (b.id === bEntryId || ensureUUID(b.id) === bEntryId || b.remark?.includes(`#${invFixed.invoiceNumber} `)) ? bEntry : b)
          : [...s.bankingEntries, bEntry];
        return { invoices: next, bankingEntries: nextBanking };
      }

      return { invoices: next };
    });
    await syncInvoiceToSupabase(invFixed);
    if (bEntryToSync) {
      await syncBankingEntryToSupabase(bEntryToSync);
    }
  },
  deleteInvoice: async (id) => {
    const dbId = ensureUUID(id);
    const bEntryId = ensureUUID(`binv_${dbId}`);
    const targetInvoice = useAppStore.getState().invoices.find(inv => inv.id === id || ensureUUID(inv.id) === dbId);
    const invNumber = targetInvoice?.invoiceNumber;
    set((s) => ({
      invoices: s.invoices.filter(x => x.id !== id && ensureUUID(x.id) !== dbId),
      bankingEntries: s.bankingEntries.filter(b =>
        b.id !== id &&
        b.id !== dbId &&
        b.id !== bEntryId &&
        ensureUUID(b.id) !== bEntryId &&
        (!invNumber || !b.remark?.includes(`#${invNumber} `))
      ),
    }));
    await Promise.all([
      removeInvoiceFromSupabase(id),
      removeBankingEntryFromSupabase(bEntryId),
    ]);
  },

  addOneTimeService: async (ots) => {
    const otsFixed = { ...ots, id: ensureUUID(ots.id) };
    set((s) => {
      const key = getOneTimeKey(otsFixed);
      if (s.oneTimeServices.some(x => x.id === otsFixed.id || (key && getOneTimeKey(x) === key))) return s;
      const next = [otsFixed, ...s.oneTimeServices];
      return { oneTimeServices: next };
    });
    await syncOneTimeServiceToSupabase(otsFixed);
  },
  updateOneTimeService: async (ots) => {
    set((s) => {
      const next = s.oneTimeServices.map(x => x.id === ots.id ? ots : x);
      return { oneTimeServices: next };
    });
    await syncOneTimeServiceToSupabase(ots);
  },
  deleteOneTimeService: async (id) => {
    set((s) => {
      const next = s.oneTimeServices.filter(x => x.id !== id);
      return { oneTimeServices: next };
    });
    await removeOneTimeServiceFromSupabase(id);
  },

  addRenewal: async (rn) => {
    const rnFixed = { ...rn, id: ensureUUID(rn.id) };
    set((s) => {
      const existing = s.renewals || [];
      const filtered = existing.filter(x => x.id !== rnFixed.id);
      const next = [rnFixed, ...filtered];
      return { renewals: next };
    });
    await syncRenewalToSupabase(rnFixed);
  },
  updateRenewal: async (rn) => {
    const rnFixed = { ...rn, id: ensureUUID(rn.id) };
    set((s) => {
      const next = (s.renewals || []).map(x => x.id === rnFixed.id ? rnFixed : x);
      return { renewals: next };
    });
    await syncRenewalToSupabase(rnFixed);
  },
  deleteRenewal: async (id) => {
    const targetId = ensureUUID(id);
    set((s) => {
      const next = (s.renewals || []).filter(x => x.id !== id && x.id !== targetId);
      return { renewals: next };
    });
    await removeRenewalFromSupabase(id);
  },
  renewService: async (id) => {
    let renewedItemToSync: RenewalItem | null = null;
    set((s) => {
      const target = (s.renewals || []).find(x => x.id === id);
      if (!target) return s;

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

      let nextFromDate = target.toDate || target.fromDate;
      let nextToDate = target.toDate;
      let nextDueDate = target.dueDate;
      let nextFY = target.financialYear;

      if (nextFromDate) {
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
        progress: "To-do",
      };

      renewedItemToSync = renewedItem;
      const next = (s.renewals || []).map(x => x.id === id ? renewedItem : x);
      return { renewals: next };
    });
    if (renewedItemToSync) {
      await syncRenewalToSupabase(renewedItemToSync);
    }
  },
}));
