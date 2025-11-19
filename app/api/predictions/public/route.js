// app/api/predictions/public/route.js
//-----------------------------------------------------------
// PUBLIC ENDPOINT
//
// Anyone can access this.
// It returns the list of active games.
//
// IMPORTANT:
// - NO booking_code is ever selected here.
// - This endpoint feeds the predictions page.
//-----------------------------------------------------------

import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

// Normalize game types for frontend display
function mapGameType(raw) {
  const t = raw?.toLowerCase() || "";

  if (t.includes("vip")) return "VIP";
  if (t.includes("correct")) return "Correct Score";
  if (t.includes("recovery")) return "Recovery";
  if (t.includes("free")) return "Free";
  return raw || "Unknown";
}

export async function GET() {
  try {
    // Only fetch NON-SENSITIVE columns
    const { data, error } = await supabaseAdmin
      .from("games")
      .select(
        "id, game_name, game_type, total_odds, price, status, match_data, game_date, created_at"
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("🔥 Failed to load games:", error);
      return NextResponse.json(
        { error: "Failed to load games" },
        { status: 500 }
      );
    }

    // Format games into safe structure
    const safeGames = (data || []).map((g) => ({
      id: g.id,
      gameName: g.game_name,
      displayType: mapGameType(g.game_type),
      totalOdds: g.total_odds,
      price: g.price,
      matchData: g.match_data,
      gameDate: g.game_date,
      createdAt: g.created_at,
    }));

    return NextResponse.json({ games: safeGames });
  } catch (err) {
    console.error("🔥 Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
