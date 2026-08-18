// app/api/purchase/callback/route.js
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://bet-genius.vercel.app";
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

function redirectWith(q) {
  return NextResponse.redirect(`${APP_URL}/user-dashboard/purchases?${q}`);
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");

    if (!reference) return redirectWith("error=NoReference");
    if (!PAYSTACK_SECRET) return redirectWith("error=Config");

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    if (!verifyRes.ok) return redirectWith("error=VerifyHttp");

    const result = await verifyRes.json();

    if (!result?.status || !result?.data) return redirectWith("error=InvalidPayload");
    if (result.data.status !== "success") return redirectWith("error=PaymentFailed");

    const { metadata, amount } = result.data;
    if (!metadata?.userId || !metadata?.gameId) return redirectWith("error=MissingMetadata");

    // Idempotent — the webhook may have already recorded this exact
    // reference. Don't insert a duplicate order.
    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("paystack_ref", reference)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabaseAdmin.from("orders").insert({
        user_id: metadata.userId,
        game_id: metadata.gameId,
        amount: (amount || 0) / 100,
        currency: "GHS",
        status: "paid",
        paystack_ref: reference,
      });

      if (error) return redirectWith("error=DBError");
    }

    return redirectWith("success=1");
  } catch (err) {
    console.error("🔥 CALLBACK FATAL ERROR:", err);
    return redirectWith("error=ServerError");
  }
}
