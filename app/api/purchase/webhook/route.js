import { NextResponse } from "next/server";
import crypto from "crypto";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event !== "charge.success") {
      return NextResponse.json({ status: "ignored" });
    }

    const reference = event.data.reference;

    // Fetch the order
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("*, game_id")
      .eq("id", reference)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Load game
    const { data: game } = await supabaseAdmin
      .from("games")
      .select("booking_code, match_data")
      .eq("id", order.game_id)
      .single();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Update order with booking code + match_data
    await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        paystack_ref: reference,
        booking_code: game.booking_code,
        match_data: game.match_data,
      })
      .eq("id", reference);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
