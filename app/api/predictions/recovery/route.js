// app/api/predictions/recovery/route.js
// -----------------------------------------------------------
// PRIVATE ENDPOINT
//
// Returns all RECOVERY ACCESS games for the logged-in user.
//
// access_type = 'recovery'
//
// Only recovery games appear here.
// Booking codes appear ONLY here (protected by RLS).
//
// Used on the user dashboard → Recovery tab.
// -----------------------------------------------------------

import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

// Map game_type to clean text
function mapGameType(raw) {
  if (!raw) return "Unknown";
  const t = raw.toLowerCase();

  if (t.includes("vip")) return "VIP";
  if (t.includes("correct")) return "Correct Score";
  if (t.includes("free")) return "Free";
  if (t.includes("recovery")) return "Recovery";

  return raw;
}

export async function GET() {
  try {
    // 🔐 Get logged-in user
    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 🔍 Query recovery access
    const { data, error } = await supabaseAdmin
      .from("user_game_access")
      .select(
        `
        id,
        booking_code,
        access_type,
        created_at,
        games (
          id,
          game_name,
          game_type,
          match_data,
          total_odds,
          game_date
        )
      `
      )
      .eq("user_id", user.id)
      .eq("access_type", "recovery")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("🔥 Failed to load recovery games:", error);
      return NextResponse.json(
        { error: "Failed to load recovery games" },
        { status: 500 }
      );
    }

    // 🧹 Format output
    const formatted = (data || []).map((row) => ({
      id: row.id,
      bookingCode: row.booking_code,
      accessType: row.access_type,
      createdAt: row.created_at,
      game: {
        id: row.games.id,
        name: row.games.game_name,
        displayType: mapGameType(row.games.game_type),
        matchData: row.games.match_data,
        totalOdds: row.games.total_odds,
        gameDate: row.games.game_date,
      },
    }));

    return NextResponse.json({ recovery: formatted });
  } catch (err) {
    console.error("🔥 Unexpected recovery error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
