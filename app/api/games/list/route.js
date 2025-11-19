import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("games")
      .select(
        `
        *,
        purchases(count)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ games: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
