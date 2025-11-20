// app/api/purchase/callback/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

    // 1️⃣ VERIFY PAYMENT WITH PAYSTACK
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

    // 2️⃣ Extract metadata
    const gameId = result.data.metadata.gameId;
    const userId = result.data.metadata.userId;
    const amount = result.data.amount / 100;

    if (!userId) {
      console.error("❌ Missing userId in metadata!");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/purchases?error=MissingUser`
      );
    }

    // 3️⃣ Insert into orders
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        game_id: gameId,
        amount,
        currency: "GHS",
        status: "paid",
        paystack_ref: reference,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Insert error:", error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/purchases?error=DBError`
      );
    }

    // 4️⃣ Redirect to My Purchases
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/purchases?success=1`
    );
  } catch (err) {
    console.error("🔥 CALLBACK SERVER ERROR:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/user-dashboard/purchases?error=ServerError`
    );
  }
}
