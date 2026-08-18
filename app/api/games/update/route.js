// app/api/games/update/route.js
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";

const normalizeMatchStatus = (status) => {
  if (!status) return "Pending";
  const statusStr = String(status).toLowerCase();
  if (statusStr === "won") return "Won";
  if (statusStr === "lost") return "Lost";
  return "Pending";
};

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, match_data, total_odds, price, game_type } = body;

    if (!id) {
      return NextResponse.json({ error: "Game ID required" }, { status: 400 });
    }

    let safeMatchData;
    if (typeof match_data === "string") {
      safeMatchData = JSON.parse(match_data);
    } else {
      safeMatchData = match_data;
    }

    safeMatchData = safeMatchData.map((match) => ({
      ...match,
      status: normalizeMatchStatus(match.status),
    }));

    const safeTotalOdds = Number(total_odds) || 0;
    const safePrice = Number(price) || 0;

    const { data, error } = await supabaseAdmin
      .from("games")
      .update({
        match_data: safeMatchData,
        total_odds: safeTotalOdds,
        price: safePrice,
        game_type: game_type || "free",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, game: data });
  } catch (err) {
    console.error("Update game error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
