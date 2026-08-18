import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req) {
  try {
    const body = await req.json();
    const gameId = body?.metadata?.gameId;

    if (!gameId) {
      return NextResponse.json({ error: "gameId is required" }, { status: 400 });
    }

    // Derive the user from the session — never trust client-supplied
    // email/amount/userId for what to charge.
    const supabase = await createSupabaseRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: game, error: gameError } = await supabaseAdmin
      .from("games")
      .select("id, price")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Invalid gameId" }, { status: 400 });
    }

    const amountInPesewas = Math.round(Number(game.price) * 100);

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: amountInPesewas,
          currency: "GHS",
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/purchase/callback`,
          metadata: { userId: user.id, gameId: game.id },
        }),
      }
    );

    const data = await response.json();

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || "Failed to initialize transaction" },
        { status: 400 }
      );
    }

    return NextResponse.json(data.data);
  } catch (err) {
    console.error("Paystack initialize error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
