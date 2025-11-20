// app/api/purchase/init/route.js
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
          amount: Number(game.price) * 100,
          metadata: {
            userId: user.id,
            gameId: game.id,
            booking_code: game.booking_code,
          },
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/purchase/callback`,
        }),
      }
    );

    const data = await paystackRes.json();

    return NextResponse.json({
      authorizationUrl: data.data.authorization_url,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
