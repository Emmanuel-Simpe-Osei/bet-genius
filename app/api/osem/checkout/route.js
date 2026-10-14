// app/api/osem/checkout/route.js
//
// Starts an online (card / mobile money) payment for a game via OSEM Pay.
// Creates a `pending` order, uses its id as the OSEM reference, and
// returns the hosted payment_url. The order only becomes `paid` once
// OSEM reports the payment as settled (webhook or status check).

import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { createPayment, markOrderFailed, normalizeGhanaPhone } from "@/lib/osemPay";

export async function POST(req) {
  try {
    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const gameId = body?.gameId;
    const phone = normalizeGhanaPhone(body?.phone);

    if (!gameId) {
      return NextResponse.json({ error: "Missing gameId" }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json(
        { error: "Enter a valid Ghana phone number, e.g. 0241234567." },
        { status: 400 }
      );
    }

    const { data: game, error: gameError } = await supabaseAdmin
      .from("games")
      .select("id, price, game_name, game_type")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Invalid gameId" }, { status: 400 });
    }

    const amount = Number(game.price);
    if (!(amount >= 1 && amount <= 20000)) {
      return NextResponse.json(
        { error: "This game can't be paid online. Please pay via Mobile Money instead." },
        { status: 409 }
      );
    }

    const { data: order, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        game_id: game.id,
        amount: game.price,
        currency: "GHS",
        status: "pending",
        payment_provider: "osem_pay",
        game_name: game.game_name,
        game_type: game.game_type,
      })
      .select("id")
      .single();

    if (insertError || !order) {
      console.error("Order insert failed:", insertError);
      return NextResponse.json({ error: "Could not create order" }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const { ok, status, data } = await createPayment({
      amount,
      phone,
      reference: order.id,
      name: user.user_metadata?.full_name,
      email: user.email,
      callbackUrl: `${appUrl}/payment-complete?order=${order.id}`,
    });

    if (!ok) {
      await markOrderFailed(order.id);
      console.error("OSEM create payment failed:", status, data);
      const message =
        status === 429
          ? "Too many payment attempts. Please wait a few minutes and try again."
          : data?.error || "Online payment is unavailable right now.";
      return NextResponse.json({ error: message }, { status: status === 429 ? 429 : 502 });
    }

    return NextResponse.json({
      order_id: order.id,
      payment_url: data.payment_url || null,
    });
  } catch (err) {
    console.error("OSEM checkout error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
