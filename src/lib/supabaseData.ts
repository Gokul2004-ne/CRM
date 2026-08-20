import { supabase } from "./supabase";
import {
  Client, Service, SubService, RequiredDoc,
  AssignedService, BankingEntry, Lead, DocumentDraft, Collaboration
} from "./types";
export { ensureUUID } from "./utils";
import { ensureUUID } from "./utils";

async function safeTableFetch(tableName: string, userId?: string) {
  try {
    if (!userId) return [];
    const { data, error } = await supabase.from(tableName).select("*").eq("user_id", userId);
    if (error) {
      if (error.code !== "22P02" && error.code !== "PGRST205") {
        console.warn(`Supabase fetch for table ${tableName} returned error:`, error);
      }
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}

export function getUserIdSync(): string {
  if (typeof window === "undefined") return "usr_default_account";
  try {
    const rawSession = localStorage.getItem("zpluscrm_active_session");
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      const email = parsed?.user?.email || parsed?.email;
      if (email) {
        const clean = String(email).toLowerCase().trim();
        if (clean.includes("saivarala33@gmail.com")) return "usr_saivarala33_gmail_com";
        return "usr_" + clean.replace(/[^a-z0-9]/gi, "_");
      }
      const uid = parsed?.user?.id;
      if (uid) {
        const clean = String(uid).toLowerCase().trim();
        if (clean.includes("saivarala33")) return "usr_saivarala33_gmail_com";
        return clean.startsWith("usr_") ? clean : `usr_${clean.replace(/[^a-z0-9_]/gi, "_")}`;
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("sb-") || k.includes("auth-token"))) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          const email = parsed?.user?.email || parsed?.currentSession?.user?.email;
          if (email) {
            const clean = String(email).toLowerCase().trim();
            if (clean.includes("saivarala33@gmail.com")) return "usr_saivarala33_gmail_com";
            return "usr_" + clean.replace(/[^a-z0-9]/gi, "_");
          }
        }
      }
    }
  } catch {}
  return "usr_default_account";
}

export async function getUserId(): Promise<string> {
  const syncId = getUserIdSync();
  if (syncId !== "usr_default_account") return syncId;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const clean = user.email.toLowerCase().trim();
      if (clean.includes("saivarala33@gmail.com")) return "usr_saivarala33_gmail_com";
      return "usr_" + clean.replace(/[^a-z0-9]/gi, "_");
    }
    if (user?.id) {
      return "usr_" + String(user.id).replace(/[^a-zA-Z0-9_]/g, "_");
    }
  } catch {}

  return "usr_default_account";
}

// Fetch all CRM data from Supabase (Scoped to current authenticated user_id)
export async function fetchAllCRMData() {
  try {
    const userId = await getUserId();
    const isSaivarala = userId === "usr_saivarala33_gmail_com";
    const targetSaivaralaId = "usr_saivarala33_gmail_com";

    // ── MIGRATION: Re-assign legacy/unassigned records in Supabase to saivarala33@gmail.com ──
    if (isSaivarala) {
      const tablesToClaim = [
        "clients", "services", "sub_services", "required_docs",
        "assigned_services", "banking_entries", "leads", "drafts",
        "collaborations", "invoices", "one_time_services"
      ];
      await Promise.all(tablesToClaim.map(async (table) => {
        try {
          await supabase.from(table).update({ user_id: targetSaivaralaId }).is("user_id", null);
          await supabase.from(table).update({ user_id: targetSaivaralaId }).eq("user_id", "zpluscrm_local");
          await supabase.from(table).update({ user_id: targetSaivaralaId }).eq("user_id", "usr_gokul_gmail_com");
          await supabase.from(table).update({ user_id: targetSaivaralaId }).eq("user_id", "usr_practice_management");
        } catch {}
      }));
    }

    let [
      clients,
      services,
      subServices,
      requiredDocs,
      assignedServices,
      bankingEntries,
      leads,
      drafts,
      collaborations,
      invoices,
      oneTimeServices,
      renewals,
      userSettingsData,
    ] = await Promise.all([
      safeTableFetch("clients", userId),
      safeTableFetch("services", userId),
      safeTableFetch("sub_services", userId),
      safeTableFetch("required_docs", userId),
      safeTableFetch("assigned_services", userId),
      safeTableFetch("banking_entries", userId),
      safeTableFetch("leads", userId),
      safeTableFetch("drafts", userId),
      safeTableFetch("collaborations", userId),
      safeTableFetch("invoices", userId),
      safeTableFetch("one_time_services", userId),
      safeTableFetch("renewals", userId),
      safeTableFetch("user_settings", userId),
    ]);

    const formattedClients: Client[] = (clients || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      ownerName: c.owner_name,
      type: c.type,
      referredBy: c.referred_by,
      phone: c.phone,
      mobile: c.mobile,
      email: c.email,
      pan: c.pan,
      panNo: c.pan_no,
      gstin: c.gstin,
      gstNo: c.gst_no,
      gstPortalId: c.gst_portal_id || null,
      gstPortalPassword: c.gst_portal_password || null,
      portalCredentials: c.gst_portal_id || c.gst_portal_password
        ? [
            { id: `cred_gst_${c.id}`, portalName: "GST Portal", portalId: c.gst_portal_id || "Not Set", password: c.gst_portal_password || "" }
          ]
        : [],
      documents: (Array.isArray(c.documents) ? c.documents : (typeof c.documents === "string" ? JSON.parse(c.documents) : [])).map((d: any) => ({
        id: d.id,
        clientId: d.clientId || c.id,
        name: d.name || d.fileName || "Document",
        fileName: d.fileName || d.name || "Document",
        type: d.type || "PDF",
        category: d.category || "General",
        uploadDate: d.uploadDate || d.upload_date || new Date().toISOString().split("T")[0],
        size: d.size || "",
        status: d.status || "RECEIVED",
        fileUrl: d.fileUrl || d.file_url || c.document_url || "",
      })),
      documentCount: Number(c.document_count || (Array.isArray(c.documents) ? c.documents.length : 0)),
      documentUrl: c.document_url || (Array.isArray(c.documents) && c.documents[0] ? (c.documents[0].fileUrl || c.documents[0].file_url) : undefined),
      contactPerson: c.contact_person,
      city: c.city,
      status: c.status,
      registrationNo: c.registration_no,
      incorporationDate: c.incorporation_date,
      acquiredDate: c.acquired_date,
      address: c.address,
      notes: c.notes,
      createdAt: c.created_at,
    }));

    const formattedServices: Service[] = (services || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      dueDate: s.due_date,
      price: Number(s.price || 0),
      recurrence: s.recurrence,
      applicableMonths: s.applicable_months || [],
    }));

    const formattedSubServices: SubService[] = (subServices || []).map((ss: any) => ({
      id: ss.id,
      serviceId: ss.service_id,
      serviceIds: ss.service_ids || (ss.service_id ? [ss.service_id] : []),
      name: ss.name,
      dueDate: ss.due_date,
      dueDateDay: ss.due_date_day ? Number(ss.due_date_day) : undefined,
      applicableMonths: ss.applicable_months || [],
      recurrence: ss.recurrence || "MONTHLY",
      clientId: ss.client_id || undefined,
      clientName: ss.client_name || undefined,
    }));

    const formattedRequiredDocs: RequiredDoc[] = (requiredDocs || []).map((rd: any) => ({
      id: rd.id,
      subServiceId: rd.sub_service_id,
      name: rd.name,
      isMandatory: rd.is_mandatory ?? true,
      fileName: rd.file_name || undefined,
      fileUrl: rd.file_url || rd.doc_url || undefined,
      docUrl: rd.doc_url || rd.file_url || undefined,
      fileType: rd.file_type || undefined,
    }));

    const formattedAssignedServices: AssignedService[] = (assignedServices || []).map((a: any) => ({
      id: a.id,
      clientId: a.client_id,
      serviceId: a.service_id,
      subServiceIds: a.sub_service_ids || [],
      financialYear: a.financial_year,
      amountBilled: Number(a.amount_billed || 0),
      amountReceived: Number(a.amount_received || 0),
      amountPending: Number(a.amount_pending || 0),
      totalFee: Number(a.total_fee || 0),
      paidAmount: Number(a.paid_amount || 0),
      pendingAmount: Number(a.pending_amount || 0),
      status: a.status,
      dueDate: a.due_date,
    }));

    const formattedBankingEntries: BankingEntry[] = (bankingEntries || []).map((b: any) => ({
      id: b.id,
      financialYear: b.financial_year,
      clientId: b.client_id,
      serviceId: b.service_id,
      subServiceId: b.sub_service_id,
      amountBilled: Number(b.amount_billed || 0),
      amountReceived: Number(b.amount_received || 0),
      amountPending: Number(b.amount_pending || 0),
      paymentStatus: (b.payment_status as any) || (Number(b.amount_received || 0) >= Number(b.amount_billed || 0) && Number(b.amount_billed || 0) > 0 ? "PAID" : Number(b.amount_received || 0) > 0 ? "PARTIAL" : "PENDING"),
      remark: b.remark,
    }));

    const formattedLeads: Lead[] = (leads || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      mobile: l.mobile || l.phone || "",
      phone: l.phone || l.mobile || "",
      email: l.email || undefined,
      source: l.source || "WHATSAPP",
      type: l.type || undefined,
      city: l.city || undefined,
      status: (l.status as any) || "LEAD",
      convertedClientId: l.converted_client_id || undefined,
      notes: l.notes || "",
      createdAt: l.created_at || new Date().toISOString().split("T")[0],
    }));

    const formattedDrafts: DocumentDraft[] = (drafts || []).map((d: any) => ({
      id: d.id,
      clientId: d.client_id || undefined,
      documentType: d.document_type || undefined,
      financialYear: d.financial_year || undefined,
      title: d.title,
      content: d.content,
      status: d.status || "DRAFT",
      updatedAt: d.updated_at || new Date().toISOString(),
    }));

    const formattedCollaborations: Collaboration[] = (collaborations || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      number: c.number,
      email: c.email,
      type: c.type,
      notes: c.notes,
      createdAt: c.created_at,
    }));

    const formattedInvoices: any[] = (invoices || []).map((inv: any) => ({
      id: inv.id,
      type: inv.type,
      invoiceNumber: inv.invoice_number,
      date: inv.date,
      financialYear: inv.financial_year,
      clientId: inv.client_id,
      clientName: inv.client_name,
      items: inv.items || [],
      subtotal: Number(inv.subtotal || 0),
      gstRate: Number(inv.gst_rate || 0),
      gstAmount: Number(inv.gst_amount || 0),
      total: Number(inv.total || 0),
      amountReceived: Number(inv.amount_received || 0),
      balanceDue: Number(inv.balance_due || 0),
      notes: inv.notes,
      status: inv.status,
      createdAt: inv.created_at,
    }));

    const formattedOneTimeServices: any[] = (oneTimeServices || []).map((ots: any) => ({
      id: ots.id,
      clientName: ots.client_name,
      serviceName: ots.service_name,
      dueDate: ots.due_date,
      progress: ots.progress,
      notes: ots.notes,
      createdAt: ots.created_at,
    }));

    const formattedRenewals: any[] = (renewals || []).map((rn: any) => ({
      id: rn.id,
      clientName: rn.client_name,
      serviceName: rn.service_name,
      registrationDate: rn.registration_date,
      dueDate: rn.due_date,
      fromDate: rn.from_date,
      toDate: rn.to_date,
      financialYear: rn.financial_year,
      recurrencePeriod: rn.recurrence_period,
      progress: rn.progress,
      notes: rn.notes,
      createdAt: rn.created_at,
    }));

    const userSettings = userSettingsData?.[0]?.settings || null;

    return {
      clients: formattedClients,
      services: formattedServices,
      subServices: formattedSubServices,
      requiredDocs: formattedRequiredDocs,
      assignedServices: formattedAssignedServices,
      bankingEntries: formattedBankingEntries,
      leads: formattedLeads,
      drafts: formattedDrafts,
      collaborations: formattedCollaborations,
      invoices: formattedInvoices,
      oneTimeServices: formattedOneTimeServices,
      renewals: formattedRenewals,
      userSettings: userSettings,
    };
  } catch (error) {
    console.error("Error fetching CRM data from Supabase:", error);
    return null;
  }
}

// User Settings Sync
export async function syncUserSettingsToSupabase(settings: any) {
  try {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from("user_settings").upsert({
      user_id: userId,
      settings: settings,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  } catch (err) {
    console.error("Error syncing user settings to Supabase:", err);
  }
}


// Clients Sync
export async function syncClientToSupabase(c: Client) {
  try {
    const userId = await getUserId();
    const dbId = ensureUUID(c.id);
    console.log("[CRM SYNC] syncClientToSupabase:", { clientId: c.id, dbId, userId, name: c.name });

    // Extract GST portal credentials from portalCredentials array or direct fields
    const gstCred = c.portalCredentials?.find(p => p.portalName.toLowerCase().includes("gst"));
    const gstPortalId = gstCred?.portalId || c.gstPortalId || null;
    const gstPortalPassword = (gstCred !== undefined ? gstCred.password : c.gstPortalPassword) || null;

    const docList = Array.isArray(c.documents) ? c.documents.map((d: any) => ({
      id: d.id,
      clientId: d.clientId || c.id,
      name: d.name || d.fileName || "Document",
      fileName: d.fileName || d.name || "Document",
      type: d.type || "PDF",
      category: d.category || "General",
      uploadDate: d.uploadDate || d.upload_date || new Date().toISOString().split("T")[0],
      size: d.size || "",
      status: d.status || "RECEIVED",
      fileUrl: d.fileUrl || d.file_url || "",
    })) : [];

    const extractedDocUrl = c.documentUrl || (docList.length > 0 ? (docList[0].fileUrl || (docList[0] as any).file_url) : null);

    const { error, data } = await supabase.from("clients").upsert({
      id: dbId,
      user_id: userId,
      name: c.name,
      owner_name: c.ownerName || c.name,
      type: c.type,
      referred_by: c.referredBy,
      phone: c.phone,
      mobile: c.mobile,
      email: c.email,
      pan: c.pan,
      pan_no: c.panNo,
      gstin: c.gstin,
      gst_no: c.gstNo,
      gst_portal_id: gstPortalId,
      gst_portal_password: gstPortalPassword,
      documents: docList,
      document_url: extractedDocUrl,
      document_count: docList.length,
      contact_person: c.contactPerson,
      city: c.city,
      status: c.status,
      registration_no: c.registrationNo,
      incorporation_date: c.incorporationDate,
      acquired_date: c.acquiredDate,
      address: c.address,
      notes: c.notes,
      created_at: c.createdAt || new Date().toISOString(),
    }).select();
    if (error) {
      console.error("[CRM SYNC] ❌ syncClientToSupabase FAILED:", error.code, error.message, error.hint);
    } else {
      console.log("[CRM SYNC] ✅ syncClientToSupabase OK:", dbId, "rows:", (data as any[])?.length);
    }
  } catch (err) {
    console.error("[CRM SYNC] ❌ syncClientToSupabase EXCEPTION:", err);
  }
}

export async function removeClientFromSupabase(id: string, name?: string) {
  try {
    const dbId = ensureUUID(id);
    console.log("[CRM DELETE] removeClientFromSupabase:", { originalId: id, dbId });

    // 1. Delete parent client row by exact UUID
    const { error, data } = await supabase.from("clients").delete().eq("id", dbId).select("id");
    if (error || !data || data.length === 0) {
      await supabase.from("clients").delete().eq("id", id);
    }
    
    // 2. Purge linked child records across all dependent tables
    await Promise.all([
      supabase.from("assigned_services").delete().or(`client_id.eq.${dbId},client_id.eq.${id}`),
      supabase.from("banking_entries").delete().or(`client_id.eq.${dbId},client_id.eq.${id}`),
      supabase.from("invoices").delete().or(`client_id.eq.${dbId},client_id.eq.${id}`),
      supabase.from("drafts").delete().or(`client_id.eq.${dbId},client_id.eq.${id}`),
      supabase.from("sub_services").delete().or(`client_id.eq.${dbId},client_id.eq.${id}`),
    ]);
    return { success: true };
  } catch (err) {
    console.error("[CRM DELETE] ❌ EXCEPTION in removeClientFromSupabase:", err);
    throw err;
  }
}

// Services Sync (Packages)
export async function syncServiceToSupabase(s: Service) {
  const userId = await getUserId();
  const dbId = ensureUUID(s.id);
  const months = s.applicableMonths || [];
  const computedRecurrence = s.recurrence || (months.length === 12 ? "MONTHLY" : months.length === 4 ? "QUARTERLY" : months.length === 1 ? "ANNUALLY" : "CUSTOM");
  const { error } = await supabase.from("services").upsert({
    id: dbId,
    user_id: userId,
    name: s.name,
    due_date: s.dueDate || null,
    price: s.price || 0,
    recurrence: computedRecurrence,
    applicable_months: months,
  });
  if (error) {
    console.error("Supabase syncServiceToSupabase error:", error);
  }
}

export async function removeServiceFromSupabase(id: string, name?: string) {
  try {
    const dbId = ensureUUID(id);
    const { error, data } = await supabase.from("services").delete().eq("id", dbId).select("id");
    if (error || !data || data.length === 0) {
      await supabase.from("services").delete().eq("id", id);
    }
    // Purge linked sub_services, assigned_services, and banking_entries
    await Promise.all([
      supabase.from("sub_services").delete().or(`service_id.eq.${dbId},service_id.eq.${id}`),
      supabase.from("assigned_services").delete().or(`service_id.eq.${dbId},service_id.eq.${id}`),
      supabase.from("banking_entries").delete().or(`service_id.eq.${dbId},service_id.eq.${id}`),
    ]);
    return { success: true };
  } catch (err) {
    console.error("Error removing service from Supabase:", err);
    throw err;
  }
}

// SubServices Sync
export async function syncSubServiceToSupabase(ss: SubService) {
  if (!ss.applicableMonths || ss.applicableMonths.length === 0) {
    console.warn("syncSubServiceToSupabase blocked: At least one month must be selected for the service");
    return;
  }
  const userId = await getUserId();
  const dbId = ensureUUID(ss.id);
  const months = ss.applicableMonths || [];
  const computedRecurrence = ss.recurrence || (months.length === 12 ? "MONTHLY" : months.length === 4 ? "QUARTERLY" : months.length === 1 ? "ANNUALLY" : "CUSTOM");
  const { error } = await supabase.from("sub_services").upsert({
    id: dbId,
    user_id: userId,
    service_id: ss.serviceId ? ensureUUID(ss.serviceId) : null,
    service_ids: ss.serviceIds || (ss.serviceId ? [ss.serviceId] : []),
    name: ss.name,
    due_date: ss.dueDate || null,
    applicable_months: months,
    recurrence: computedRecurrence,
    due_date_day: ss.dueDateDay ? Number(ss.dueDateDay) : 15,
    client_id: ss.clientId || null,
    client_name: ss.clientName || null,
  });
  if (error) {
    console.error("Supabase syncSubServiceToSupabase error:", error);
  }
}

export async function removeSubServiceFromSupabase(id: string, name?: string) {
  try {
    const dbId = ensureUUID(id);
    const { error, data } = await supabase.from("sub_services").delete().eq("id", dbId).select("id");
    if (error || !data || data.length === 0) {
      await supabase.from("sub_services").delete().eq("id", id);
    }
    // Purge linked required_docs
    await supabase.from("required_docs").delete().or(`sub_service_id.eq.${dbId},sub_service_id.eq.${id}`);
    return { success: true };
  } catch (err) {
    console.error("Error removing sub-service from Supabase:", err);
    throw err;
  }
}

// RequiredDocs Sync
export async function syncRequiredDocToSupabase(rd: RequiredDoc) {
  const userId = await getUserId();
  const dbId = ensureUUID(rd.id);
  const { error } = await supabase.from("required_docs").upsert({
    id: dbId,
    user_id: userId,
    sub_service_id: rd.subServiceId ? ensureUUID(rd.subServiceId) : null,
    name: rd.name,
    is_mandatory: rd.isMandatory ?? true,
    file_name: rd.fileName || null,
    file_url: rd.fileUrl || null,
    doc_url: rd.docUrl || rd.fileUrl || null,
    file_type: rd.fileType || null,
  });
  if (error) {
    console.error("Supabase syncRequiredDocToSupabase error:", error);
  }
}

export async function removeRequiredDocFromSupabase(id: string, name?: string) {
  try {
    const dbId = ensureUUID(id);
    const { error, data } = await supabase.from("required_docs").delete().eq("id", dbId).select("id");
    if (error || !data || data.length === 0) {
      await supabase.from("required_docs").delete().eq("id", id);
    }
    return { success: true };
  } catch (err) {
    console.error("Error removing required doc from Supabase:", err);
    throw err;
  }
}

// AssignedServices Sync
export async function syncAssignedServiceToSupabase(a: AssignedService) {
  const userId = await getUserId();
  const dbId = ensureUUID(a.id);
  const { error } = await supabase.from("assigned_services").upsert({
    id: dbId,
    user_id: userId,
    client_id: a.clientId ? ensureUUID(a.clientId) : "00000000-0000-0000-0000-000000000000",
    service_id: a.serviceId ? ensureUUID(a.serviceId) : "00000000-0000-0000-0000-000000000000",
    sub_service_ids: a.subServiceIds || [],
    financial_year: a.financialYear || "2025-26",
    amount_billed: a.amountBilled || 0,
    amount_received: a.amountReceived || 0,
    amount_pending: a.amountPending || 0,
    total_fee: (a as any).totalFee || a.amountBilled || 0,
    paid_amount: (a as any).paidAmount || a.amountReceived || 0,
    pending_amount: (a as any).pendingAmount || a.amountPending || 0,
    status: a.status || "PENDING",
    due_date: a.dueDate || null,
  });
  if (error) {
    console.error("Supabase syncAssignedServiceToSupabase error:", error);
  }
}

export async function removeAssignedServiceFromSupabase(id: string) {
  try {
    const dbId = ensureUUID(id);
    const { error, data } = await supabase.from("assigned_services").delete().eq("id", dbId).select("id");
    if (error || !data || data.length === 0) {
      await supabase.from("assigned_services").delete().eq("id", id);
    }
    return { success: true };
  } catch (err) {
    console.error("Error removing assigned service from Supabase:", err);
    throw err;
  }
}

// BankingEntries Sync
export async function syncBankingEntryToSupabase(b: BankingEntry) {
  const userId = await getUserId();
  const dbId = ensureUUID(b.id);
  const { error } = await supabase.from("banking_entries").upsert({
    id: dbId,
    user_id: userId,
    financial_year: b.financialYear || "2025-26",
    client_id: b.clientId ? ensureUUID(b.clientId) : "00000000-0000-0000-0000-000000000000",
    service_id: b.serviceId ? ensureUUID(b.serviceId) : "00000000-0000-0000-0000-000000000000",
    sub_service_id: b.subServiceId ? ensureUUID(b.subServiceId) : null,
    amount_billed: b.amountBilled || 0,
    amount_received: b.amountReceived || 0,
    amount_pending: b.amountPending || 0,
    payment_status: (b as any).paymentStatus || (Number(b.amountReceived || 0) >= Number(b.amountBilled || 0) && Number(b.amountBilled || 0) > 0 ? "PAID" : Number(b.amountReceived || 0) > 0 ? "PARTIAL" : "PENDING"),
    remark: b.remark || null,
  });
  if (error) {
    console.error("Supabase syncBankingEntryToSupabase error:", error);
  }
}

export async function removeBankingEntryFromSupabase(id: string) {
  try {
    const dbId = ensureUUID(id);
    const { error, data } = await supabase.from("banking_entries").delete().eq("id", dbId).select("id");
    if (error || !data || data.length === 0) {
      await supabase.from("banking_entries").delete().eq("id", id);
    }
    return { success: true };
  } catch (err) {
    console.error("Error removing banking entry from Supabase:", err);
    throw err;
  }
}

// Leads Sync
export async function syncLeadToSupabase(l: Lead) {
  const userId = await getUserId();
  const dbId = ensureUUID(l.id);
  const phoneVal = l.phone || l.mobile || "";
  const { error } = await supabase.from("leads").upsert({
    id: dbId,
    user_id: userId,
    name: l.name,
    mobile: phoneVal,
    phone: phoneVal,
    source: l.source || "WHATSAPP",
    type: (l as any).type || "PROPRIETORSHIP",
    referred_by: (l as any).referredBy || null,
    email: (l as any).email || null,
    pan: (l as any).pan || null,
    gstin: (l as any).gstin || null,
    city: (l as any).city || null,
    status: l.status || "LEAD",
    notes: l.notes || null,
    created_at: l.createdAt || new Date().toISOString(),
  });
  if (error) {
    console.error("Supabase syncLeadToSupabase error:", error);
  }
}

export async function removeLeadFromSupabase(id: string, name?: string) {
  try {
    const dbId = ensureUUID(id);
    const { error, data } = await supabase.from("leads").delete().eq("id", dbId).select("id");
    if (error || !data || data.length === 0) {
      await supabase.from("leads").delete().eq("id", id);
    }
    return { success: true };
  } catch (err) {
    console.error("Error removing lead from Supabase:", err);
    throw err;
  }
}

// Drafts Sync
export async function syncDraftToSupabase(d: DocumentDraft) {
  const userId = await getUserId();
  const dbId = ensureUUID(d.id);
  const { error } = await supabase.from("drafts").upsert({
    id: dbId,
    user_id: userId,
    client_id: (d as any).clientId ? ensureUUID((d as any).clientId) : "00000000-0000-0000-0000-000000000000",
    document_type: (d as any).documentType || "GENERAL",
    financial_year: (d as any).financialYear || "2025-26",
    title: d.title,
    content: d.content || "",
    status: (d as any).status || "DRAFT",
    updated_at: d.updatedAt || new Date().toISOString(),
  });
  if (error) {
    console.error("Supabase syncDraftToSupabase error:", error);
  }
}

export async function removeDraftFromSupabase(id: string) {
  try {
    const dbId = ensureUUID(id);
    const { error, data } = await supabase.from("drafts").delete().eq("id", dbId).select("id");
    if (error || !data || data.length === 0) {
      await supabase.from("drafts").delete().eq("id", id);
    }
    return { success: true };
  } catch (err) {
    console.error("Error removing draft from Supabase:", err);
    throw err;
  }
}

// Collaborations Sync
export async function syncCollaborationToSupabase(c: Collaboration) {
  try {
    const userId = await getUserId();
    const dbId = ensureUUID(c.id);
    const { error } = await supabase.from("collaborations").upsert({
      id: dbId,
      user_id: userId,
      name: c.name,
      number: c.number,
      email: c.email,
      type: c.type,
      notes: c.notes,
      created_at: c.createdAt || new Date().toISOString(),
    });
    if (error) console.error("Supabase syncCollaborationToSupabase error:", error);
  } catch (err) {
    console.error("Error syncing collaboration to Supabase:", err);
  }
}

export async function removeCollaborationFromSupabase(id: string, name?: string) {
  try {
    const dbId = ensureUUID(id);
    const { error, data } = await supabase.from("collaborations").delete().eq("id", dbId).select("id");
    if (error || !data || data.length === 0) {
      await supabase.from("collaborations").delete().eq("id", id);
    }
    return { success: true };
  } catch (err) {
    console.error("Error removing collaboration from Supabase:", err);
    throw err;
  }
}

// Invoices Sync
export async function syncInvoiceToSupabase(inv: any) {
  try {
    const userId = await getUserId();
    const dbId = ensureUUID(inv.id);
    const { error } = await supabase.from("invoices").upsert({
      id: dbId,
      user_id: userId,
      type: inv.type,
      invoice_number: inv.invoiceNumber,
      date: inv.date,
      financial_year: inv.financialYear,
      client_id: inv.clientId ? ensureUUID(inv.clientId) : null,
      client_name: inv.clientName,
      items: inv.items,
      subtotal: inv.subtotal,
      gst_rate: inv.gstRate,
      gst_amount: inv.gstAmount,
      total: inv.total,
      amount_received: inv.amountReceived,
      balance_due: inv.balanceDue,
      notes: inv.notes,
      status: inv.status,
      created_at: inv.createdAt || new Date().toISOString(),
    });
    if (error) console.error("Supabase syncInvoiceToSupabase error:", error);
  } catch (err) {
    console.error("Error syncing invoice to Supabase:", err);
  }
}

export async function removeInvoiceFromSupabase(id: string) {
  try {
    const dbId = ensureUUID(id);
    const { error, data } = await supabase.from("invoices").delete().eq("id", dbId).select("id");
    if (error || !data || data.length === 0) {
      await supabase.from("invoices").delete().eq("id", id);
    }
    return { success: true };
  } catch (err) {
    console.error("Error removing invoice from Supabase:", err);
    throw err;
  }
}

// One Time Services Sync
export async function syncOneTimeServiceToSupabase(ots: any) {
  try {
    const userId = await getUserId();
    const dbId = ensureUUID(ots.id);
    const { error } = await supabase.from("one_time_services").upsert({
      id: dbId,
      user_id: userId,
      client_name: ots.clientName,
      service_name: ots.serviceName,
      due_date: ots.dueDate || null,
      progress: ots.progress,
      notes: ots.notes,
      created_at: ots.createdAt || new Date().toISOString(),
    });
    if (error) console.error("Supabase syncOneTimeServiceToSupabase error:", error);
  } catch (err) {
    console.error("Error syncing one-time service to Supabase:", err);
  }
}

export async function removeOneTimeServiceFromSupabase(id: string) {
  try {
    const dbId = ensureUUID(id);
    const { error, data } = await supabase.from("one_time_services").delete().eq("id", dbId).select("id");
    if (error || !data || data.length === 0) {
      await supabase.from("one_time_services").delete().eq("id", id);
    }
    return { success: true };
  } catch (err) {
    console.error("Error removing one-time service from Supabase:", err);
    throw err;
  }
}

// Renewals Sync
export async function syncRenewalToSupabase(rn: any) {
  try {
    const userId = await getUserId();
    const dbId = ensureUUID(rn.id);
    const { error } = await supabase.from("renewals").upsert({
      id: dbId,
      user_id: userId,
      client_name: rn.clientName,
      service_name: rn.serviceName,
      registration_date: rn.registrationDate || null,
      due_date: rn.dueDate || null,
      from_date: rn.fromDate || null,
      to_date: rn.toDate || null,
      financial_year: rn.financialYear || null,
      recurrence_period: rn.recurrencePeriod || null,
      progress: rn.progress,
      notes: rn.notes,
      created_at: rn.createdAt || new Date().toISOString(),
    });
    if (error) console.error("Supabase syncRenewalToSupabase error:", error);
  } catch (err) {
    console.error("Error syncing renewal to Supabase:", err);
  }
}

export async function removeRenewalFromSupabase(id: string) {
  try {
    const dbId = ensureUUID(id);
    const { error, data } = await supabase.from("renewals").delete().eq("id", dbId).select("id");
    if (error || !data || data.length === 0) {
      await supabase.from("renewals").delete().eq("id", id);
    }
    return { success: true };
  } catch (err) {
    console.error("Error removing renewal from Supabase:", err);
    throw err;
  }
}

// Purge Duplicates from Supabase Table
export async function purgeDuplicatesFromSupabase(tableName: string, ids: string[]) {
  if (!ids || ids.length === 0) return;
  try {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from(tableName).delete().eq("user_id", userId).in("id", ids);
  } catch (err) {
    console.error(`Error purging duplicates from ${tableName}:`, err);
  }
}

// Purge ALL User Data from Supabase Tables
export async function purgeAllUserDataFromSupabase(userId?: string) {
  try {
    const targetId = userId || await getUserId();
    if (!targetId) return;
    const tables = [
      "assigned_services", "banking_entries", "invoices", "drafts",
      "required_docs", "sub_services", "services",
      "leads", "collaborations", "one_time_services", "renewals", "clients"
    ];
    for (const t of tables) {
      await supabase.from(t).delete().eq("user_id", targetId);
    }
  } catch (err) {
    console.error("Error purging all user data from Supabase:", err);
  }
}

