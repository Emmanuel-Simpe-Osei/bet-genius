// app/api/moolre/webhook/route.js
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import supabaseAdmin from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function isValidSecret(received) {
  const expected = process.env.MOOLRE_WEBHOOK_SECRET;
  if (!expected || !received) return false;

  const a = Buffer.from(String(received));
  const b = Buffer.from(String(expected));

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

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
    const body = await req.json();
    const data = body?.data;

    if (!data) {
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    if (!isValidSecret(data.secret)) {
      console.warn("Moolre webhook: invalid or missing secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { txstatus, externalref } = data;

    if (!externalref) {
      return NextResponse.json({ error: "Missing externalref" }, { status: 400 });
    }

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("moolre_ref", externalref)
      .maybeSingle();

    if (!order) {
      console.warn("Moolre webhook: no matching order for", externalref);
      return NextResponse.json({ received: true });
    }

    if (txstatus !== 1) {
      if (txstatus === 2) {
        await supabaseAdmin
          .from("orders")
          .update({ status: "failed" })
          .eq("id", order.id)
          .eq("status", "pending");
      }
      return NextResponse.json({ received: true });
    }

    if (order.status === "paid") {
      return NextResponse.json({ received: true, message: "Already processed" });
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
      })
      .eq("id", order.id)
      .eq("status", "pending")
      .select()
      .single();

    if (updateError) throw updateError;

    if (updated) await grantAccess(updated);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Moolre webhook error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
