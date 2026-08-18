import { NextResponse } from "next/server";
import crypto from "crypto";
import supabaseAdmin from "@/lib/supabaseAdmin";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  const expectedSignature = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    console.warn("Paystack webhook signature mismatch — rejecting");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const { reference, amount, metadata } = event.data;
    const userId = metadata?.userId;
    const gameId = metadata?.gameId;

    if (!userId || !gameId) {
      console.warn("Paystack webhook: missing metadata for", reference);
      return NextResponse.json({ received: true });
    }

    // Idempotent: if this reference was already recorded (by the
    // redirect callback, or a prior webhook retry), don't duplicate it.
    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("paystack_ref", reference)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabaseAdmin.from("orders").insert({
        user_id: userId,
        game_id: gameId,
        amount: (amount || 0) / 100,
        currency: "GHS",
        status: "paid",
        paystack_ref: reference,
      });

      if (error) {
        console.error("Paystack webhook DB insert error:", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
