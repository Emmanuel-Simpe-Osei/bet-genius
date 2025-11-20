import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

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

    // Fetch game
    const { data: game } = await supabaseAdmin
      .from("games")
      .select("id, price, booking_code, game_name")
      .eq("id", gameId)
      .single();

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

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

    return NextResponse.json({
      authorizationUrl: paystackJson.data.authorization_url,
    });
  } catch (err) {
    console.error("INIT ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
