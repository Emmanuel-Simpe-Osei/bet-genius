import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function POST(req) {
  try {
    const { gameId } = await req.json();

    if (!gameId) {
      return NextResponse.json({ error: "Missing game ID" }, { status: 400 });
    }

    // 1️⃣ Get logged-in user
    const supabase = await createSupabaseRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    // 2️⃣ Load game details
    const { data: game, error: gameError } = await supabaseAdmin
      .from("games")
      .select("id, price, booking_code, game_name")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // 3️⃣ Create Paystack session
    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email, // user’s REAL email
          amount: Math.round(Number(game.price) * 100),
          metadata: {
            userId: user.id, // 🔥 REQUIRED
            gameId: game.id, // 🔥 REQUIRED
            booking_code: game.booking_code,
            game_name: game.game_name,
          },
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/purchase/callback`,
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

    // 4️⃣ Return redirect URL
    return NextResponse.json({
      authorizationUrl: paystackJson.data.authorization_url,
    });
  } catch (err) {
    console.error("INIT ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
