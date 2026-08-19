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

// GET /api/clients/[id]: Fetch a single client with ownership validation
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = getUserIdFromRequest(req);
    const dbId = ensureUUID(id);

    const { data: client, error } = await supabase
      .from("clients")
      .select("*")
      .or(`id.eq.${dbId},id.eq.${id}`)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    if (client.user_id && client.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client does not belong to your user account" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: client });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/clients/[id]: Strictly isolated client deletion by unique ID and user_id ownership
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = getUserIdFromRequest(req);

    if (!id) {
      return NextResponse.json({ success: false, error: "Client ID is required" }, { status: 400 });
    }

    const dbId = ensureUUID(id);

    // 1. Inspect client existence and account ownership
    const { data: client, error: fetchErr } = await supabase
      .from("clients")
      .select("id, user_id, name")
      .or(`id.eq.${dbId},id.eq.${id}`)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
    }

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    // 2. Return 403 Forbidden if user attempts to delete a client ID belonging to another user_id
    if (client.user_id && client.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client does not belong to your user account" },
        { status: 403 }
      );
    }

    // 3. Root Cause Fix: Execute strictly scoped deletion queries (DELETE FROM clients WHERE id = :clientId AND user_id = :authenticatedUserId)
    await supabase.from("assigned_services").delete().eq("client_id", dbId).eq("user_id", userId);
    await supabase.from("banking_entries").delete().eq("client_id", dbId).eq("user_id", userId);
    await supabase.from("invoices").delete().eq("client_id", dbId).eq("user_id", userId);
    await supabase.from("drafts").delete().eq("client_id", dbId).eq("user_id", userId);

    if (id && id !== dbId) {
      await supabase.from("assigned_services").delete().eq("client_id", id).eq("user_id", userId);
      await supabase.from("banking_entries").delete().eq("client_id", id).eq("user_id", userId);
      await supabase.from("invoices").delete().eq("client_id", id).eq("user_id", userId);
      await supabase.from("drafts").delete().eq("client_id", id).eq("user_id", userId);
      await supabase.from("clients").delete().eq("id", id).eq("user_id", userId);
    }

    const { error: deleteErr } = await supabase
      .from("clients")
      .delete()
      .eq("id", dbId)
      .eq("user_id", userId);

    if (deleteErr) {
      return NextResponse.json({ success: false, error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Client "${client.name || id}" successfully deleted from account`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
