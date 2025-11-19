import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
    const body = await req.json();

    const { id, match_data, total_odds, price, game_type } = body;

    if (!id) {
      return NextResponse.json({ error: "Game ID required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("games")
      .update({
        match_data,
        total_odds,
        price,
        game_type,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, game: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
