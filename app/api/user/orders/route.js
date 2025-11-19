import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const supabase = createSupabaseRouteClient();

    // 1️⃣ Get user from cookies/session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ purchases: [] }, { status: 401 });
    }

    // 2️⃣ Fetch their PAID orders
    const { data: orders, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("id, game_id, amount, currency, status, paystack_ref, created_at")
      .eq("user_id", user.id)
      .eq("status", "paid")
      .order("created_at", { ascending: false });

    if (orderErr) throw orderErr;

    // 3️⃣ Fetch game metadata
    const gameIds = orders.map((o) => o.game_id);

    const { data: games, error: gamesErr } = await supabaseAdmin
      .from("games")
      .select(
        "id, game_name, game_type, booking_code, total_odds, game_date, price"
      )
      .in("id", gameIds);

    if (gamesErr) throw gamesErr;

    const gameMap = {};
    games.forEach((g) => (gameMap[g.id] = g));

    // 4️⃣ Final response
    const purchases = orders.map((o) => ({
      id: o.id,
      amount: o.amount,
      currency: o.currency ?? "GHS",
      status: o.status,
      paystackRef: o.paystack_ref,
      createdAt: o.created_at,
      gameName: gameMap[o.game_id]?.game_name,
      gameType: gameMap[o.game_id]?.game_type,
      bookingCode: gameMap[o.game_id]?.booking_code,
      gameDate: gameMap[o.game_id]?.game_date,
      totalOdds: gameMap[o.game_id]?.total_odds,
    }));

    return NextResponse.json({ purchases });
  } catch (err) {
    console.error("API ERROR /api/user/orders:", err);
    return NextResponse.json({ purchases: [] }, { status: 500 });
  }
}
