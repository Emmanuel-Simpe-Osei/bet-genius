import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
    const { gameId } = await req.json();

    if (!gameId) {
      return NextResponse.json({ error: "Missing game ID" }, { status: 400 });
    }

    // Get game details
    const { data: game, error: gameError } = await supabaseAdmin
      .from("games")
      .select("id, price, booking_code, game_name")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Create Paystack session
    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "placeholder@example.com", // will be replaced by Paystack next
          amount: Math.round(Number(game.price) * 100),
          metadata: {
            gameId: gameId,
            booking_code: game.booking_code,
          },
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/purchase/success`,
        }),
      }
    );

    const paystackJson = await paystackRes.json();

    if (!paystackJson.status) {
      return NextResponse.json(
        { error: paystackJson.message || "Paystack error" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authorizationUrl: paystackJson.data.authorization_url,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
