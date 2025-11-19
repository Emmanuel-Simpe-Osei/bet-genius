// app/api/admin/dashboard/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🔐 Check admin header (server-side, uses private ADMIN_KEY)
function isAdminRequest(request) {
  const headerKey = request.headers.get("x-admin-key");
  const adminKey = process.env.ADMIN_KEY;

  // If you ever change ADMIN_KEY, just update .env – no code change needed
  return !!headerKey && !!adminKey && headerKey === adminKey;
}

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // ✅ 1. Total users
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (usersError) throw usersError;

    // ✅ 2. Fetch all games (no booking codes needed here)
    const { data: allGames, error: gamesError } = await supabaseAdmin
      .from("games")
      .select("id, match_data, status, archived_at, created_at");

    if (gamesError) throw gamesError;

    const now = new Date();
    const threeDaysAgoIso = new Date(
      now.getTime() - 3 * 24 * 60 * 60 * 1000
    ).toISOString();

    const totalGames = allGames.length;

    // Active games = at least one pending match in match_data
    const activeGames = allGames.filter((g) =>
      (g.match_data || []).some(
        (m) => m.status && m.status.toLowerCase() === "pending"
      )
    ).length;

    // Archived (within last 3 days)
    const archivedGames = allGames.filter((g) => {
      if (g.status !== "archived") return false;
      if (!g.archived_at) return true; // treat as "recently archived"
      return g.archived_at > threeDaysAgoIso;
    }).length;

    // Auto-delete: archived more than 3 days ago
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
      } else {
        console.log(
          `🗑️ Auto-deleted ${idsToDelete.length} archived games older than 3 days`
        );
      }
    }

    // ✅ 3. Total orders
    const { count: totalOrders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true });

    if (ordersError) throw ordersError;

    // ✅ 4. Recent orders (join profiles for display)
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
        profiles (
          full_name,
          email
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    // ✅ Send only what the dashboard needs
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
