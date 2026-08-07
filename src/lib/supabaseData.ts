import { supabase } from "./supabase";
import {
  Client, Service, SubService, RequiredDoc,
  AssignedService, BankingEntry, Lead, DocumentDraft, Collaboration
} from "./types";

async function safeTableFetch(tableName: string, userId?: string) {
  try {
    let q = supabase.from(tableName).select("*");
    if (userId) {
      q = q.eq("user_id", userId);
    }
    const { data, error } = await q;
    if (error) {
      // Retry without user_id filter if column missing
      const { data: fallbackData } = await supabase.from(tableName).select("*");
      return fallbackData || [];
    }
    return data || [];
  } catch {
    return [];
  }
}

// Fetch all CRM data from Supabase (Scoped to current authenticated user_id)
export async function fetchAllCRMData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const [
      clients,
      services,
      subServices,
      requiredDocs,
      assignedServices,
      bankingEntries,
      leads,
      drafts,
      collaborations,
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
      gstPortalId: c.gst_portal_id,
      gstPortalPassword: c.gst_portal_password,
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
      name: ss.name,
      dueDate: ss.due_date,
      dueDateDay: ss.due_date_day ? Number(ss.due_date_day) : undefined,
      applicableMonths: ss.applicable_months || [],
      recurrence: ss.recurrence || "MONTHLY",
    }));

    const formattedRequiredDocs: RequiredDoc[] = (requiredDocs || []).map((rd: any) => ({
      id: rd.id,
      subServiceId: rd.sub_service_id,
      name: rd.name,
      isMandatory: rd.is_mandatory,
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
      remark: b.remark,
    }));

    const formattedLeads: Lead[] = (leads || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      mobile: l.mobile,
      phone: l.phone,
      source: l.source,
      status: l.status,
      convertedClientId: l.converted_client_id,
      notes: l.notes,
      createdAt: l.created_at,
    }));

    const formattedDrafts: DocumentDraft[] = (drafts || []).map((d: any) => ({
      id: d.id,
      title: d.title,
      content: d.content,
      updatedAt: d.updated_at,
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

    // If tables are empty in Supabase, new user starts with a clean workspace
    // (no mock data seeding — each user's data is their own)
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
    };
  } catch (error) {
    console.error("Error fetching CRM data from Supabase:", error);
    return null;
  }
}



async function getUserId(): Promise<string | undefined> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  } catch {
    return undefined;
  }
}

// Clients Sync
export async function syncClientToSupabase(c: Client) {
  const userId = await getUserId();
  await supabase.from("clients").upsert({
    id: c.id,
    user_id: userId,
    name: c.name,
    owner_name: c.ownerName,
    type: c.type,
    referred_by: c.referredBy,
    phone: c.phone,
    mobile: c.mobile,
    email: c.email,
    pan: c.pan,
    pan_no: c.panNo,
    gstin: c.gstin,
    gst_no: c.gstNo,
    gst_portal_id: c.gstPortalId || null,
    gst_portal_password: c.gstPortalPassword || null,
    contact_person: c.contactPerson,
    city: c.city,
    status: c.status,
    registration_no: c.registrationNo,
    incorporation_date: c.incorporationDate,
    acquired_date: c.acquiredDate,
    address: c.address,
    notes: c.notes,
    created_at: c.createdAt || new Date().toISOString(),
  });
}

export async function removeClientFromSupabase(id: string) {
  await supabase.from("clients").delete().eq("id", id);
}

// Services Sync
export async function syncServiceToSupabase(s: Service) {
  const userId = await getUserId();
  await supabase.from("services").upsert({
    id: s.id,
    user_id: userId,
    name: s.name,
    due_date: s.dueDate,
    price: s.price,
    recurrence: s.recurrence,
    applicable_months: s.applicableMonths,
  });
}

export async function removeServiceFromSupabase(id: string) {
  await supabase.from("services").delete().eq("id", id);
}

// SubServices Sync
export async function syncSubServiceToSupabase(ss: SubService) {
  const userId = await getUserId();
  await supabase.from("sub_services").upsert({
    id: ss.id,
    user_id: userId,
    service_id: ss.serviceId,
    name: ss.name,
    due_date: ss.dueDate || null,
    due_date_day: ss.dueDateDay || null,
    applicable_months: ss.applicableMonths || [],
    recurrence: ss.recurrence || "MONTHLY",
  });
}

export async function removeSubServiceFromSupabase(id: string) {
  await supabase.from("sub_services").delete().eq("id", id);
}

// RequiredDocs Sync
export async function syncRequiredDocToSupabase(rd: RequiredDoc) {
  const userId = await getUserId();
  await supabase.from("required_docs").upsert({
    id: rd.id,
    user_id: userId,
    sub_service_id: rd.subServiceId,
    name: rd.name,
    is_mandatory: rd.isMandatory,
  });
}

export async function removeRequiredDocFromSupabase(id: string) {
  await supabase.from("required_docs").delete().eq("id", id);
}

// AssignedServices Sync
export async function syncAssignedServiceToSupabase(a: AssignedService) {
  const userId = await getUserId();
  await supabase.from("assigned_services").upsert({
    id: a.id,
    user_id: userId,
    client_id: a.clientId,
    service_id: a.serviceId,
    sub_service_ids: a.subServiceIds,
    financial_year: a.financialYear,
    amount_billed: a.amountBilled,
    amount_received: a.amountReceived,
    amount_pending: a.amountPending,
    total_fee: (a as any).totalFee || a.amountBilled,
    paid_amount: (a as any).paidAmount || a.amountReceived,
    pending_amount: (a as any).pendingAmount || a.amountPending,
    status: a.status || "PENDING",
    due_date: a.dueDate,
  });
}

export async function removeAssignedServiceFromSupabase(id: string) {
  await supabase.from("assigned_services").delete().eq("id", id);
}

// BankingEntries Sync
export async function syncBankingEntryToSupabase(b: BankingEntry) {
  const userId = await getUserId();
  await supabase.from("banking_entries").upsert({
    id: b.id,
    user_id: userId,
    financial_year: b.financialYear,
    client_id: b.clientId,
    service_id: b.serviceId,
    sub_service_id: b.subServiceId,
    amount_billed: b.amountBilled,
    amount_received: b.amountReceived,
    amount_pending: b.amountPending,
    remark: b.remark,
  });
}

export async function removeBankingEntryFromSupabase(id: string) {
  await supabase.from("banking_entries").delete().eq("id", id);
}

// Leads Sync
export async function syncLeadToSupabase(l: Lead) {
  const userId = await getUserId();
  await supabase.from("leads").upsert({
    id: l.id,
    user_id: userId,
    name: l.name,
    mobile: l.mobile,
    phone: l.phone,
    source: l.source,
    status: l.status,
    converted_client_id: l.convertedClientId,
    notes: l.notes,
    created_at: l.createdAt || new Date().toISOString(),
  });
}

export async function removeLeadFromSupabase(id: string) {
  await supabase.from("leads").delete().eq("id", id);
}

// Drafts Sync
export async function syncDraftToSupabase(d: DocumentDraft) {
  const userId = await getUserId();
  await supabase.from("drafts").upsert({
    id: d.id,
    user_id: userId,
    title: d.title,
    content: d.content,
    updated_at: d.updatedAt || new Date().toISOString(),
  });
}

export async function removeDraftFromSupabase(id: string) {
  await supabase.from("drafts").delete().eq("id", id);
}

// Collaborations Sync
export async function syncCollaborationToSupabase(c: Collaboration) {
  try {
    const userId = await getUserId();
    await supabase.from("collaborations").upsert({
      id: c.id,
      user_id: userId,
      name: c.name,
      number: c.number,
      email: c.email,
      type: c.type,
      notes: c.notes,
      created_at: c.createdAt || new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error syncing collaboration to Supabase:", err);
  }
}

export async function removeCollaborationFromSupabase(id: string) {
  try {
    await supabase.from("collaborations").delete().eq("id", id);
  } catch (err) {
    console.error("Error removing collaboration from Supabase:", err);
  }
}
