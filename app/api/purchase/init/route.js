import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const body = await req.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json({ error: "Game ID missing" }, { status: 400 });
    }

    // 1️⃣ Create route-level Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2️⃣ Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 3️⃣ Fetch game details
    const { data: game, error: gameError } = await supabaseAdmin
      .from("games")
      .select("id, price, booking_code, game_name")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // 4️⃣ Calculate price in pesewas
    const amount = Math.round(Number(game.price) * 100);

    // 5️⃣ Initialize Paystack transaction
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
          amount,
          metadata: {
            gameId: game.id,
            userId: user.id,
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

    // 6️⃣ Return authorization URL to frontend
    return NextResponse.json({
      authorizationUrl: paystackJson.data.authorization_url,
    });
  } catch (err) {
    console.error("INIT ROUTE ERROR:", err);
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
