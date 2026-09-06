import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendEmail } from "@/lib/resend";

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, reason } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*, profiles ( email, full_name )")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending_review") {
      return NextResponse.json({ error: `Order is already ${order.status}` }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "rejected",
        rejection_reason: reason || "Payment could not be verified.",
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "pending_review");

    if (updateError) throw updateError;

    if (order.profiles?.email) {
      await sendEmail({
        to: order.profiles.email,
        subject: `Update on your payment — ${order.game_name}`,
        html: `
          <h2>We couldn't verify your payment</h2>
          <p>Hi ${order.profiles.full_name || "there"},</p>
          <p>We were unable to verify your payment for <strong>${order.game_name}</strong>.</p>
          <p><strong>Reason:</strong> ${reason || "Payment could not be verified."}</p>
          <p>You're welcome to try again from the Predictions page.</p>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reject payment error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
