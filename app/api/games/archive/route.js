// app/api/games/archive/route.js
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
    const { id, status } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    // Determine the target status (default to "archived" for backward compatibility)
    const targetStatus = status || "archived";

    if (!["archived", "active"].includes(targetStatus)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'archived' or 'active'" },
        { status: 400 }
      );
    }

    // 1. Fetch full game with match_data to preserve it
    const { data: game, error: fetchError } = await supabaseAdmin
      .from("games")
      .select("match_data, status")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Prepare update data
    const updateData = {
      status: targetStatus,
      updated_at: new Date().toISOString(),
      match_data: game.match_data, // IMPORTANT: ALWAYS PRESERVE MATCH_DATA
    };

    // Set or clear archived_at based on the target status
    if (targetStatus === "archived") {
      updateData.archived_at = new Date().toISOString();
    } else {
      updateData.archived_at = null;
    }

    // 2. Update the game status
    const { data: updatedGame, error: updateError } = await supabaseAdmin
      .from("games")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      game: updatedGame,
      message: `Game ${
        targetStatus === "archived" ? "archived" : "unarchived"
      } successfully`,
    });
  } catch (err) {
    console.error("Archive/Unarchive error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
