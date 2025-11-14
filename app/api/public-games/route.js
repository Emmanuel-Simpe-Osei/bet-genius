// app/api/public-games/route.js
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ✅ Return ALL games but WITHOUT booking_code
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("games")
      .select(
        `
        id,
        game_type,
        total_odds,
        price,
        status,
        created_at,
        game_name,
        game_date,
        match_data
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("public-games API error:", error.message);
      return NextResponse.json(
        { error: "Failed to load games" },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("public-games API crash:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
