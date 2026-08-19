import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ensureUUID } from "@/lib/utils";

function getUserIdFromRequest(req: Request): string {
  const url = new URL(req.url);
  const paramUserId = url.searchParams.get("userId") || url.searchParams.get("user_id");
  if (paramUserId) return paramUserId;

  const headerUserId = req.headers.get("x-user-id");
  if (headerUserId) return headerUserId;

  return "usr_default_account";
}

// GET /api/clients: Scoped strictly by user_id
export async function GET(req: Request) {
  try {
    const userId = getUserIdFromRequest(req);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: (data || []).length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// POST /api/clients: Create client isolated to active user_id
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body.userId || body.user_id || getUserIdFromRequest(req);

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ success: false, error: "Client name is required" }, { status: 400 });
    }

    const clientId = ensureUUID(body.id || `c_${Date.now()}`);

    const clientRecord = {
      id: clientId,
      user_id: userId,
      name: body.name.trim(),
      owner_name: body.ownerName || body.name.trim(),
      type: body.type || "PROPRIETORSHIP",
      phone: body.phone || body.mobile || null,
      mobile: body.mobile || body.phone || null,
      email: body.email || null,
      pan: body.pan || null,
      gstin: body.gstin || null,
      city: body.city || null,
      address: body.address || null,
      status: body.status || "ACTIVE",
      created_at: body.createdAt || new Date().toISOString().split("T")[0],
    };

    const { data, error } = await supabase
      .from("clients")
      .upsert(clientRecord)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || clientRecord,
      message: "Client created successfully",
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/clients?id=:id: Delete client scoped by id AND user_id
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get("id");
    const userId = getUserIdFromRequest(req);

    if (!clientId) {
      return NextResponse.json({ success: false, error: "Client ID is required" }, { status: 400 });
    }

    const dbId = ensureUUID(clientId);

    // Verify existence & ownership
    const { data: existingClient, error: fetchErr } = await supabase
      .from("clients")
      .select("id, user_id")
      .or(`id.eq.${dbId},id.eq.${clientId}`)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
    }

    if (!existingClient) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    if (existingClient.user_id !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Client does not belong to your user account" }, { status: 403 });
    }

    // Scoped deletion query
    await supabase.from("assigned_services").delete().eq("client_id", dbId).eq("user_id", userId);
    await supabase.from("banking_entries").delete().eq("client_id", dbId).eq("user_id", userId);
    await supabase.from("invoices").delete().eq("client_id", dbId).eq("user_id", userId);
    await supabase.from("drafts").delete().eq("client_id", dbId).eq("user_id", userId);

    const { error: deleteErr } = await supabase
      .from("clients")
      .delete()
      .eq("id", dbId)
      .eq("user_id", userId);

    if (deleteErr) {
      return NextResponse.json({ success: false, error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Client deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
