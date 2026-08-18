// app/api/admin/dashboard/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (usersError) throw usersError;

    const { data: allGames, error: gamesError } = await supabaseAdmin
      .from("games")
      .select("id, match_data, status, archived_at, created_at");

    if (gamesError) throw gamesError;

    const now = new Date();
    const threeDaysAgoIso = new Date(
      now.getTime() - 3 * 24 * 60 * 60 * 1000
    ).toISOString();

    const totalGames = allGames.length;

    const activeGames = allGames.filter((g) =>
      (g.match_data || []).some(
        (m) => m.status && m.status.toLowerCase() === "pending"
      )
    ).length;

    const archivedGames = allGames.filter((g) => {
      if (g.status !== "archived") return false;
      if (!g.archived_at) return true;
      return g.archived_at > threeDaysAgoIso;
    }).length;

    const autoDeleteCandidates = allGames.filter((g) => {
      if (g.status !== "archived" || !g.archived_at) return false;
      return g.archived_at < threeDaysAgoIso;
    });

    const autoDeletedGames = autoDeleteCandidates.length;

    if (autoDeletedGames > 0) {
      const idsToDelete = autoDeleteCandidates.map((g) => g.id);
      const { error: deleteError } = await supabaseAdmin
        .from("games")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) {
        console.error("Auto-delete failed:", deleteError.message);
      }
    }

    const { count: totalOrders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true });

    if (ordersError) throw ordersError;

    const { data: recentOrders, error: recentError } = await supabaseAdmin
      .from("orders")
      .select(
        `
        id,
        user_id,
        amount,
        currency,
        status,
        paystack_ref,
        created_at,
        profiles ( full_name, email )
      `
      )
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalGames,
      activeGames,
      archivedGames,
      autoDeletedGames,
      totalOrders: totalOrders || 0,
      recentOrders: recentOrders || [],
    });
  } catch (err) {
    console.error("Admin dashboard API error:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
