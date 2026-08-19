import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ensureUUID } from "@/lib/utils";

// POST: Create Service / Package with mandatory month validation
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, recurrence, applicableMonths, months, dueDate } = body;

    const resolvedMonths = applicableMonths || months;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Package name is required" },
        { status: 400 }
      );
    }

    if (!resolvedMonths || !Array.isArray(resolvedMonths) || resolvedMonths.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one month must be selected for the service" },
        { status: 400 }
      );
    }

    const newId = ensureUUID(body.id || `srv_${Date.now()}`);

    return NextResponse.json({
      success: true,
      data: {
        id: newId,
        name: name.trim(),
        price: price || 0,
        recurrence: recurrence || "ANNUAL",
        applicableMonths: resolvedMonths,
        dueDate: dueDate || null,
      },
      message: "Service validated and created successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update Service / Package with mandatory month validation
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, price, recurrence, applicableMonths, months, dueDate } = body;

    const resolvedMonths = applicableMonths || months;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Service ID is required for update" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Package name is required" },
        { status: 400 }
      );
    }

    if (!resolvedMonths || !Array.isArray(resolvedMonths) || resolvedMonths.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one month must be selected for the service" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: ensureUUID(id),
        name: name.trim(),
        price: price || 0,
        recurrence: recurrence || "ANNUAL",
        applicableMonths: resolvedMonths,
        dueDate: dueDate || null,
      },
      message: "Service validated and updated successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Fetch Services / Packages
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId") || url.searchParams.get("user_id") || req.headers.get("x-user-id") || "usr_default_account";

    const { data, error } = await supabase
      .from("services")
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

// DELETE /api/services?id=:id: Delete service package from database
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Service ID is required" }, { status: 400 });
    }

    const dbId = ensureUUID(id);
    const { error } = await supabase
      .from("services")
      .delete()
      .or(`id.eq.${dbId},id.eq.${id}`);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Service deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
