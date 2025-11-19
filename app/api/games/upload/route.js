import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

// 🚀 Upload new game (Admin only)
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      booking_code,
      game_type,
      game_name,
      total_odds,
      price,
      status,
      match_data,
      created_at,
      updated_at,
    } = body;

    // 🔒 Validate
    if (!booking_code || !match_data || match_data.length === 0) {
      return NextResponse.json(
        { error: "Missing booking code or matches" },
        { status: 400 }
      );
    }

    // 🧨 Insert new game
    const { data, error } = await supabaseAdmin
      .from("games")
      .insert([
        {
          booking_code,
          game_type,
          game_name,
          total_odds,
          price,
          status,
          match_data,
          created_at,
          updated_at,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, game: data }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Server Error: " + err.message },
      { status: 500 }
    );
  }
}
