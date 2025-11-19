import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    // 1. Fetch full game with match_data
    const { data: game, error: fetchError } = await supabaseAdmin
      .from("games")
      .select("match_data")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Archive while preserving match_data
    const { error } = await supabaseAdmin
      .from("games")
      .update({
        status: "archived",
        archived_at: new Date().toISOString(),
        match_data: game.match_data, // IMPORTANT: NEVER REMOVE
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
