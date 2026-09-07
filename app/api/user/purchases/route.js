import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import supabaseAdmin from "@/lib/supabaseAdmin";

function mapDisplayType(raw) {
  const t = (raw || "").toLowerCase();
  if (t.includes("vip")) return "VIP";
  if (t.includes("correct")) return "Correct Score";
  if (t.includes("recovery")) return "Recovery";
  if (t.includes("free")) return "Free";
  return "Prediction";
}

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

    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["paid", "pending_review", "rejected"])
      .order("created_at", { ascending: false });

    if (!orders || orders.length === 0) {
      return NextResponse.json({ purchases: [] });
    }

    const gameIds = [...new Set(orders.map((o) => o.game_id))];

    const { data: games } = await supabaseAdmin
      .from("games")
      .select("id, game_name, game_type, total_odds, price")
      .in("id", gameIds);

    const gamesById = Object.fromEntries((games || []).map((g) => [g.id, g]));

    const purchases = orders.map((o) => {
      const game = gamesById[o.game_id] || {};
      const safeGameType = o.game_type || game.game_type;
      const rawGameName = o.game_name || game.game_name || "Unknown Game";

      return {
        id: o.id,
        amount: o.amount,
        currency: o.currency,
        status: o.status,
        createdAt: o.created_at,
        senderName: o.sender_name,
        rejectionReason: o.rejection_reason,
        gameName: o.status === "paid" ? rawGameName : `${mapDisplayType(safeGameType)} Prediction`,
        gameType: safeGameType,
        totalOdds: game.total_odds,
        bookingCode: o.status === "paid" ? o.booking_code || "Unavailable" : null,
      };
    });

    return NextResponse.json({ purchases });
  } catch (err) {
    console.error("User purchase API error:", err);
    return NextResponse.json({ purchases: [] });
  }
}
