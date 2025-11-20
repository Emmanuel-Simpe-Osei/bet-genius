import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function GET() {
  const supabase = await createSupabaseRouteClient();

  // 1. Fetch all games
  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });

  if (gamesError) {
    console.error("Failed to load games:", gamesError);
    return NextResponse.json(
      { error: "Failed to load games." },
      { status: 500 }
    );
  }

  // 2. Build final result array
  const finalGames = [];

  for (const game of games) {
    // Count purchases for this game
    const { count, error: purchaseError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("game_id", game.id)
      .eq("status", "paid");

    if (purchaseError) {
      console.error("Purchase count error:", purchaseError);
    }

    finalGames.push({
      ...game,
      purchases: count ?? 0,
    });
  }

  return NextResponse.json(finalGames);
}
