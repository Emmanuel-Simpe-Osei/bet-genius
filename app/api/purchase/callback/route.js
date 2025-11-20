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

    // VERIFY PAYMENT
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
        "/user-dashboard/purchases?error=PaymentFailed"
      );
    }

    const { gameId, userId } = result.data.metadata;

    if (!gameId || !userId) {
      return NextResponse.redirect(
        "/user-dashboard/purchases?error=BadMetadata"
      );
    }

    // SAVE ORDER
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        game_id: gameId,
        amount: result.data.amount / 100,
        currency: "GHS",
        status: "paid",
        paystack_ref: reference,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.redirect(
        "/user-dashboard/purchases?error=InsertFailed"
      );
    }

    const successUrl = `/user-dashboard/purchases?success=1&orderId=${order.id}`;

    return NextResponse.redirect(successUrl);
  } catch (err) {
    console.error("Callback error:", err);
    return NextResponse.redirect("/user-dashboard/purchases?error=ServerError");
  }
}
