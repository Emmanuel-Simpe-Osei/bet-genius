// app/api/games/archive/route.js
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    const targetStatus = status || "archived";

    if (!["archived", "active"].includes(targetStatus)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'archived' or 'active'" },
        { status: 400 }
      );
    }

    const { data: game, error: fetchError } = await supabaseAdmin
      .from("games")
      .select("match_data, status")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const updateData = {
      status: targetStatus,
      updated_at: new Date().toISOString(),
      match_data: game.match_data,
    };

    if (targetStatus === "archived") {
      updateData.archived_at = new Date().toISOString();
    } else {
      updateData.archived_at = null;
    }

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
