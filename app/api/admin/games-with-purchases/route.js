import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("game_id", g.id)
      .eq("status", "paid");

    processed.push({ ...g, purchases: count ?? 0 });
  }

  return NextResponse.json(processed);
}
