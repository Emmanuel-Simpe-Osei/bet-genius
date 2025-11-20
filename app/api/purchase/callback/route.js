// app/api/purchase/callback/route.js

import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/purchases?error=NoReference`
      );
    }

    const verify = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const result = await verify.json();

    if (!result.status || result.data.status !== "success") {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/purchases?error=PaymentFailed`
      );
    }

    const { userId, gameId } = result.data.metadata;
    const amount = result.data.amount / 100;

    if (!userId || !gameId) {
      console.error("❌ Missing metadata:", result.data.metadata);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/purchases?error=BadMetadata`
      );
    }

    // Save order
    const { error } = await supabaseAdmin.from("orders").insert({
      user_id: userId,
      game_id: gameId,
      amount,
      status: "paid",
      currency: "GHS",
      paystack_ref: reference,
    });

    if (error) {
      console.error("❌ ORDER SAVE FAILED", error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/purchases?error=DBError`
      );
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/purchases?success=1`
    );
  } catch (err) {
    console.error("🔥 CALLBACK ERROR:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/purchases?error=ServerError`
    );
  }
}
