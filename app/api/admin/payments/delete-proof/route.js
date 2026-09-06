import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, status, payment_proof_url")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Safety: only ever delete screenshots for orders already reviewed —
    // never one still awaiting a decision.
    if (order.status === "pending_review") {
      return NextResponse.json(
        { error: "Can't delete a screenshot that's still pending review" },
        { status: 400 }
      );
    }

    if (!order.payment_proof_url) {
      return NextResponse.json({ error: "Screenshot already removed" }, { status: 400 });
    }

    const { error: removeError } = await supabaseAdmin.storage
      .from("payment-proofs")
      .remove([order.payment_proof_url]);

    if (removeError) {
      return NextResponse.json({ error: removeError.message }, { status: 500 });
    }

    await supabaseAdmin
      .from("orders")
      .update({ payment_proof_url: null })
      .eq("id", orderId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete proof error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
