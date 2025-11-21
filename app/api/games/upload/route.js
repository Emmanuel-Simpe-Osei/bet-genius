// app/api/games/upload/route.js
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      booking_code,
      game_type,
      game_name,
      total_odds,
      price,
      match_data,
      game_date,
    } = body;

    // ----------------------------------------
    // 🛑 VALIDATION
    // ----------------------------------------
    if (!booking_code) {
      return NextResponse.json(
        { error: "Booking code is required" },
        { status: 400 }
      );
    }

    if (!match_data || match_data.length === 0) {
      return NextResponse.json(
        { error: "Match data is required" },
        { status: 400 }
      );
    }

    if (!game_name) {
      return NextResponse.json(
        { error: "Game name is required" },
        { status: 400 }
      );
    }

    // 🛑 Ensure match_data is ARRAY
    const safeMatchData =
      typeof match_data === "string" ? JSON.parse(match_data) : match_data;

    // 🛑 Cast numeric fields
    const safeTotalOdds = Number(total_odds);
    const safePrice = Number(price);

    // ----------------------------------------
    // 🚀 INSERT NEW GAME
    // ----------------------------------------
    const { data, error } = await supabaseAdmin
      .from("games")
      .insert([
        {
          booking_code,
          game_type,
          game_name,
          total_odds: safeTotalOdds,
          price: safePrice,
          match_data: safeMatchData,
          game_date,

          // Ensure visible on user side
          status: "active",
          archived_at: null,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to upload game: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, game: data }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
