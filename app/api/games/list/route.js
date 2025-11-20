import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    // Fetch games + count from the orders table
    const { data, error } = await supabaseAdmin
      .from("games")
      .select(
        `
        id,
        game_name,
        game_type,
        booking_code,
        match_data,
        total_odds,
        price,
        status,
        created_at,
        updated_at,
        archived_at,
        orders:orders(count)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Flatten into clean objects
    const games = (data || []).map((g) => ({
      id: g.id,
      game_name: g.game_name,
      game_type: g.game_type,
      booking_code: g.booking_code,
      match_data: g.match_data || [],
      total_odds: g.total_odds,
      price: g.price,
      status: g.status,
      created_at: g.created_at,
      updated_at: g.updated_at,
      archived_at: g.archived_at,

      // 👇 purchase count from orders
      purchase_count: g.orders?.[0]?.count || 0,
    }));

    return NextResponse.json({ games });
  } catch (err) {
    console.error("❌ LIST ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
