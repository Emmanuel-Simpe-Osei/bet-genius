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

    if (!reference) {
      console.error("❌ Callback hit with no reference");
      return redirectWith("error=NoReference");
    }

    if (!PAYSTACK_SECRET) {
      console.error("❌ PAYSTACK_SECRET_KEY is missing in env");
      return redirectWith("error=Config");
    }

    // 1️⃣ VERIFY WITH PAYSTACK
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!verifyRes.ok) {
      const text = await verifyRes.text();
      console.error(
        "❌ Paystack verify HTTP error:",
        verifyRes.status,
        verifyRes.statusText,
        text
      );
      return redirectWith("error=VerifyHttp");
    }

    let result;
    try {
      result = await verifyRes.json();
    } catch (e) {
      console.error("❌ Failed to parse Paystack JSON:", e);
      return redirectWith("error=BadJson");
    }

    if (!result || !result.status || !result.data) {
      console.error("❌ Invalid Paystack verify payload:", result);
      return redirectWith("error=InvalidPayload");
    }

    if (result.data.status !== "success") {
      console.error("❌ Paystack status not success:", result.data.status);
      return redirectWith("error=PaymentFailed");
    }

    const { metadata, amount } = result.data;

    if (!metadata || !metadata.userId || !metadata.gameId) {
      console.error("❌ Missing metadata in Paystack data:", metadata);
      return redirectWith("error=MissingMetadata");
    }

    const userId = metadata.userId;
    const gameId = metadata.gameId;
    const amountGhs = (amount || 0) / 100;

    // 2️⃣ INSERT ORDER IN SUPABASE
    const { error } = await supabaseAdmin.from("orders").insert({
      user_id: userId,
      game_id: gameId,
      amount: amountGhs,
      currency: "GHS",
      status: "paid",
      paystack_ref: reference,
    });

    if (error) {
      console.error("❌ Supabase orders insert error:", error);
      return redirectWith("error=DBError");
    }

    console.log("✅ Order recorded for user", userId, "game", gameId);

    // 3️⃣ SUCCESS → GO TO MY PURCHASES
    return redirectWith("success=1");
  } catch (err) {
    console.error("🔥 CALLBACK FATAL ERROR:", err);
    return redirectWith("error=ServerError");
  }
}
