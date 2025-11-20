// app/api/purchase/init/route.js
import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
    const { gameId } = await req.json();
    const supabase = await createSupabaseRouteClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get game
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
          email: user.email,
          amount: Math.round(Number(game.price) * 100),
          metadata: {
            userId: user.id, // ✅ FIXED
            gameId: game.id, // ✅ FIXED
            booking_code: game.booking_code,
          },
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/purchase/callback`,
        }),
      }
    );

    const paystackJson = await paystackRes.json();

    if (!paystackJson.status) {
      return NextResponse.json(
        { error: paystackJson.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authorizationUrl: paystackJson.data.authorization_url,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
