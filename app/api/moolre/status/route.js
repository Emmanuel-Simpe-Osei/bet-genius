// app/api/moolre/status/route.js
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { checkMoolrePaymentStatus } from "@/lib/moolre";

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
  try {
    const { externalref } = await req.json();

    if (!externalref) {
      return NextResponse.json({ error: "Missing externalref" }, { status: 400 });
    }

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("moolre_ref", externalref)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "paid" || order.status === "failed") {
      return NextResponse.json({ status: order.status });
    }

    const result = await checkMoolrePaymentStatus(externalref);

    if (result.status !== 1) {
      return NextResponse.json({ status: "pending" });
    }

    const txstatus = result.data?.txstatus;

    if (txstatus === 1) {
      const { data: game } = await supabaseAdmin
        .from("games")
        .select("booking_code, match_data")
        .eq("id", order.game_id)
        .single();

      const { data: updated } = await supabaseAdmin
        .from("orders")
        .update({
          status: "paid",
          booking_code: game?.booking_code,
          match_data: game?.match_data,
        })
        .eq("id", order.id)
        .eq("status", "pending")
        .select()
        .single();

      if (updated) await grantAccess(updated);

      return NextResponse.json({ status: "success" });
    }

    if (txstatus === 2) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", order.id)
        .eq("status", "pending");

      return NextResponse.json({ status: "failed" });
    }

    return NextResponse.json({ status: "pending" });
  } catch (err) {
    console.error("Moolre status check error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
