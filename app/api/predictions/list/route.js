// app/api/predictions/list/route.js
//-------------------------------------------------------------
// USER SAFE GAME LIST
//
// This route exposes ONLY public details.
// NO booking code, NO match data, NOTHING sensitive.
//-------------------------------------------------------------

import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function GET(req) {
  const supabase = createSupabaseRouteClient();

  // Fetch all active games
  const { data: games, error } = await supabase
    .from("games")
    .select("id, game_type, price, total_odds, created_at, match_data")
    .is("archived_at", null)
    .is("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mask custom types and hide sensitive data
  const formatted = games.map((g) => ({
    id: g.id,
    price: g.price,
    totalOdds: g.total_odds,
    createdAt: g.created_at,

    // Show custom VIP as VIP only
    // Show custom Correct Score as Correct Score only
    displayType: maskGameType(g.game_type),

    // Show only match count (not the match list)
    matchCount: Array.isArray(g.match_data) ? g.match_data.length : 0,
  }));

  return NextResponse.json({ games: formatted });
}

//-------------------------------------------
// 🔒 Mask game types to protect custom ones
//-------------------------------------------
function maskGameType(type) {
  if (!type) return "Unknown";

  const t = type.toLowerCase();

  if (t.includes("vip")) return "VIP";
  if (t.includes("correct")) return "Correct Score";
  if (t.includes("recovery")) return "Recovery";

  return type; // leave normal types untouched
}
