// app/api/predictions/purchased/route.js
//-----------------------------------------------------------
// PRIVATE ENDPOINT
//
// Returns ALL games the current user purchased.
// Includes booking_code.
// Booking code ONLY appears here (protected by RLS).
//-----------------------------------------------------------

import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function GET() {
  const supabase = createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data } = await supabaseAdmin
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
    .order("created_at", { ascending: false });

  return NextResponse.json({ purchased: data });
}
