import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
    const { gameId, matchIndex, newStatus } = await req.json();

    if (!gameId)
      return NextResponse.json({ error: "Game ID missing" }, { status: 400 });

    const { data: game } = await supabaseAdmin
      .from("games")
      .select("match_data")
      .eq("id", gameId)
      .single();

    if (!game) throw new Error("Game not found");

    const updated = [...game.match_data];
    updated[matchIndex].status = newStatus;

    const { error } = await supabaseAdmin
      .from("games")
      .update({ match_data: updated })
      .eq("id", gameId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
