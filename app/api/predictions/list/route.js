// app/api/predictions/list/route.js

import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function GET(req) {
  const supabase = createSupabaseRouteClient();

  // Fetch ONLY games visible to users
  const { data: games, error } = await supabase
    .from("games")
    .select("id, game_type, price, total_odds, created_at, match_data")
    .is("archived_at", null) // must not be archived
    .eq("status", "active") // 🔥 FIX — show active games
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // User-safe format
  const formatted = games.map((g) => ({
    id: g.id,
    price: g.price,
    totalOdds: g.total_odds,
    createdAt: g.created_at,
    displayType: maskGameType(g.game_type),
    matchCount: Array.isArray(g.match_data) ? g.match_data.length : 0,
  }));

  return NextResponse.json({ games: formatted });
}

// Mask custom game types
function maskGameType(type) {
  if (!type) return "Unknown";

  const t = type.toLowerCase();

  if (t.includes("vip")) return "VIP";
  if (t.includes("correct")) return "Correct Score";
  if (t.includes("recovery")) return "Recovery";

  return type;
}
