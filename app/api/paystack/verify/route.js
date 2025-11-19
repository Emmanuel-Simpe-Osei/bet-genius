import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
    const { reference, user_id, game_id, amount } = await req.json();

    if (!reference || !user_id || !game_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. VERIFY WITH PAYSTACK
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // 2. RECORD PURCHASE
    const { error } = await supabaseAdmin.from("purchases").insert({
      user_id,
      game_id,
      amount,
      currency: "GHS",
      is_purchased: true,
      paystack_ref: reference,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
