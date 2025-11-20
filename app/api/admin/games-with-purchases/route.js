import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function GET() {
  const supabase = await createSupabaseRouteClient();

  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });

  if (gamesError) {
    return NextResponse.json({ error: gamesError.message }, { status: 500 });
  }

  const processed = [];

  for (const g of games) {
    const { count, error: countError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("game_id", g.id)
      .eq("status", "paid");

    processed.push({
      ...g,
      purchases: count ?? 0, // <<<<<< THE ONLY ACCEPTABLE SHAPE
    });
  }

  return NextResponse.json(processed);
}
