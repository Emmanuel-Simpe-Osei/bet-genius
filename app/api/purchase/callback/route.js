import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.redirect(
        "/user-dashboard/purchases?error=NoReference"
      );
    }

    // VERIFY PAYMENT WITH PAYSTACK
    const verify = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await verify.json();

    if (!result.status || result.data.status !== "success") {
      return NextResponse.redirect(
        "/user-dashboard/purchases?error=PaymentFailed"
      );
    }

    const gameId = result.data.metadata.gameId;
    const userId = result.data.metadata.userId;

    // SAVE ORDER
    await supabaseAdmin.from("orders").insert({
      user_id: userId,
      game_id: gameId,
      amount: result.data.amount / 100,
      currency: "GHS",
      status: "paid",
      paystack_ref: reference,
    });

    return NextResponse.redirect("/user-dashboard/purchases?success=1");
  } catch (err) {
    console.error("Callback error:", err);
    return NextResponse.redirect("/user-dashboard/purchases?error=ServerError");
  }
}
