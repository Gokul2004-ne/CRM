import { supabase } from "./supabase";
import {
  Client, Service, SubService, RequiredDoc,
  AssignedService, BankingEntry, Lead, DocumentDraft
} from "./types";
import {
  mockClients, mockServices, mockSubServices, mockRequiredDocs,
  mockAssignedServices, mockBankingEntries, mockLeads, mockDrafts
} from "./mockData";

// Fetch all CRM data from Supabase
export async function fetchAllCRMData() {
  try {
    const [
      { data: clients },
      { data: services },
      { data: subServices },
      { data: requiredDocs },
      { data: assignedServices },
      { data: bankingEntries },
      { data: leads },
      { data: drafts },
    ] = await Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("services").select("*"),
      supabase.from("sub_services").select("*"),
      supabase.from("required_docs").select("*"),
      supabase.from("assigned_services").select("*"),
      supabase.from("banking_entries").select("*"),
      supabase.from("leads").select("*"),
      supabase.from("drafts").select("*"),
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

    // If tables are empty in Supabase, seed initial data
    if (formattedClients.length === 0) {
      await seedInitialDataToSupabase();
      return {
        clients: mockClients,
        services: mockServices,
        subServices: mockSubServices,
        requiredDocs: mockRequiredDocs,
        assignedServices: mockAssignedServices,
        bankingEntries: mockBankingEntries,
        leads: mockLeads,
        drafts: mockDrafts,
      };
    }

    return {
      clients: formattedClients,
      services: formattedServices,
      subServices: formattedSubServices,
      requiredDocs: formattedRequiredDocs,
      assignedServices: formattedAssignedServices,
      bankingEntries: formattedBankingEntries,
      leads: formattedLeads,
      drafts: formattedDrafts,
    };
  } catch (error) {
    console.error("Error fetching CRM data from Supabase:", error);
    return null;
  }
}

export async function seedInitialDataToSupabase() {
  try {
    const clientsToInsert = mockClients.map((c) => ({
      id: c.id,
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
      contact_person: c.contactPerson,
      city: c.city,
      status: c.status,
      registration_no: c.registrationNo,
      incorporation_date: c.incorporationDate,
      acquired_date: c.acquiredDate,
      address: c.address,
      notes: c.notes,
      created_at: c.createdAt || new Date().toISOString(),
    }));
    await supabase.from("clients").upsert(clientsToInsert);

    const servicesToInsert = mockServices.map((s) => ({
      id: s.id,
      name: s.name,
      due_date: s.dueDate,
      price: s.price,
      recurrence: s.recurrence,
      applicable_months: s.applicableMonths,
    }));
    await supabase.from("services").upsert(servicesToInsert);

    const subServicesToInsert = mockSubServices.map((ss) => ({
      id: ss.id,
      service_id: ss.serviceId,
      name: ss.name,
      due_date: ss.dueDate,
    }));
    await supabase.from("sub_services").upsert(subServicesToInsert);

    const requiredDocsToInsert = mockRequiredDocs.map((rd) => ({
      id: rd.id,
      sub_service_id: rd.subServiceId,
      name: rd.name,
      is_mandatory: rd.isMandatory,
    }));
    await supabase.from("required_docs").upsert(requiredDocsToInsert);

    const assignedServicesToInsert = mockAssignedServices.map((a) => ({
      id: a.id,
      client_id: a.clientId,
      service_id: a.serviceId,
      sub_service_ids: a.subServiceIds,
      financial_year: a.financialYear,
      amount_billed: a.amountBilled,
      amount_received: a.amountReceived,
      amount_pending: a.amountPending,
      total_fee: a.totalFee || a.amountBilled,
      paid_amount: a.paidAmount || a.amountReceived,
      pending_amount: a.pendingAmount || a.amountPending,
      status: a.status || "PENDING",
      due_date: a.dueDate,
    }));
    await supabase.from("assigned_services").upsert(assignedServicesToInsert);

    const bankingToInsert = mockBankingEntries.map((b) => ({
      id: b.id,
      financial_year: b.financialYear,
      client_id: b.clientId,
      service_id: b.serviceId,
      sub_service_id: b.subServiceId,
      amount_billed: b.amountBilled,
      amount_received: b.amountReceived,
      amount_pending: b.amountPending,
      remark: b.remark,
    }));
    await supabase.from("banking_entries").upsert(bankingToInsert);

    const leadsToInsert = mockLeads.map((l) => ({
      id: l.id,
      name: l.name,
      mobile: l.mobile,
      phone: l.phone,
      source: l.source,
      status: l.status,
      converted_client_id: l.convertedClientId,
      notes: l.notes,
      created_at: l.createdAt || new Date().toISOString(),
    }));
    await supabase.from("leads").upsert(leadsToInsert);

    const draftsToInsert = mockDrafts.map((d) => ({
      id: d.id,
      title: d.title,
      content: d.content,
      updated_at: d.updatedAt || new Date().toISOString(),
    }));
    await supabase.from("drafts").upsert(draftsToInsert);
  } catch (err) {
    console.error("Error seeding initial data to Supabase:", err);
  }
}

// Clients Sync
export async function syncClientToSupabase(c: Client) {
  await supabase.from("clients").upsert({
    id: c.id,
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
  await supabase.from("services").upsert({
    id: s.id,
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
  await supabase.from("sub_services").upsert({
    id: ss.id,
    service_id: ss.serviceId,
    name: ss.name,
    due_date: ss.dueDate,
  });
}

export async function removeSubServiceFromSupabase(id: string) {
  await supabase.from("sub_services").delete().eq("id", id);
}

// RequiredDocs Sync
export async function syncRequiredDocToSupabase(rd: RequiredDoc) {
  await supabase.from("required_docs").upsert({
    id: rd.id,
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
  await supabase.from("assigned_services").upsert({
    id: a.id,
    client_id: a.clientId,
    service_id: a.serviceId,
    sub_service_ids: a.subServiceIds,
    financial_year: a.financialYear,
    amount_billed: a.amountBilled,
    amount_received: a.amountReceived,
    amount_pending: a.amountPending,
    total_fee: a.totalFee || a.amountBilled,
    paid_amount: a.paidAmount || a.amountReceived,
    pending_amount: a.pendingAmount || a.amountPending,
    status: a.status || "PENDING",
    due_date: a.dueDate,
  });
}

export async function removeAssignedServiceFromSupabase(id: string) {
  await supabase.from("assigned_services").delete().eq("id", id);
}

// BankingEntries Sync
export async function syncBankingEntryToSupabase(b: BankingEntry) {
  await supabase.from("banking_entries").upsert({
    id: b.id,
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
  await supabase.from("leads").upsert({
    id: l.id,
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
  await supabase.from("drafts").upsert({
    id: d.id,
    title: d.title,
    content: d.content,
    updated_at: d.updatedAt || new Date().toISOString(),
  });
}

export async function removeDraftFromSupabase(id: string) {
  await supabase.from("drafts").delete().eq("id", id);
}
