import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendEmail } from "@/lib/resend";

async function grantAccess(order) {
  const { data: existing } = await supabaseAdmin
    .from("user_game_access")
    .select("id")
    .eq("order_id", order.id)
    .maybeSingle();

  if (existing) return;

  await supabaseAdmin.from("user_game_access").insert({
    user_id: order.user_id,
    game_id: order.game_id,
    order_id: order.id,
    booking_code: order.booking_code,
    access_type: "purchase",
  });
}

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

    const { data: game } = await supabaseAdmin
      .from("games")
      .select("booking_code, match_data")
      .eq("id", order.game_id)
      .single();

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        booking_code: game?.booking_code,
        match_data: game?.match_data,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "pending_review")
      .select()
      .single();

    if (updateError) throw updateError;

    if (updated) await grantAccess(updated);

    if (order.profiles?.email) {
      await sendEmail({
        to: order.profiles.email,
        subject: `Your payment has been verified — ${order.game_name}`,
        html: `
          <h2>Payment verified</h2>
          <p>Hi ${order.profiles.full_name || "there"},</p>
          <p>Your payment for <strong>${order.game_name}</strong> has been verified.</p>
          <p>Your booking code is now available in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/purchases">purchases dashboard</a>.</p>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Approve payment error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
