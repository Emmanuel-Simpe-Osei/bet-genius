import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const supabase = await createSupabaseRouteClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ purchases: [] });
    }

    // Get all paid orders
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "paid")
      .order("created_at", { ascending: false });

    if (!orders || orders.length === 0) {
      return NextResponse.json({ purchases: [] });
    }

    const gameIds = [...new Set(orders.map((o) => o.game_id))];

    const { data: games } = await supabaseAdmin
      .from("games")
      .select("id, game_name, game_type, booking_code, total_odds, price")
      .in("id", gameIds);

    const gamesById = Object.fromEntries(games.map((g) => [g.id, g]));

    // Build final response
    const purchases = orders.map((o) => {
      const game = gamesById[o.game_id] || {};

      return {
        id: o.id,
        amount: o.amount,
        currency: o.currency,
        status: o.status,
        createdAt: o.created_at,
        paystackRef: o.paystack_ref,
        gameName: game.game_name || "Unknown Game",
        gameType: game.game_type,
        totalOdds: game.total_odds,
        bookingCode: game.booking_code || "Unavailable",
      };
    });

    return NextResponse.json({ purchases });
  } catch (err) {
    console.error("User purchase API error:", err);
    return NextResponse.json({ purchases: [] });
  }
}
