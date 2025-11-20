import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

// 🚀 Upload a new game (Admin Only)
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

    // ----------------------------------------
    // 🚀 INSERT NEW GAME
    // Status MUST be ACTIVE so users see the game
    // archived_at MUST be null
    // ----------------------------------------
    const { data, error } = await supabaseAdmin
      .from("games")
      .insert([
        {
          booking_code,
          game_type,
          game_name,
          total_odds,
          price,
          match_data,
          game_date,

          // ⭐ ALWAYS make new games visible
          status: "active",
          archived_at: null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("UPLOAD GAME ERROR →", error);
      return NextResponse.json(
        { error: "Failed to upload game: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, game: data }, { status: 200 });
  } catch (err) {
    console.error("SERVER ERROR →", err);
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
