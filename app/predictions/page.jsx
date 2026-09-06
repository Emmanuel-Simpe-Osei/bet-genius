// app/predictions/page.jsx
//--------------------------------------------------------------
// SERVER COMPONENT
// No top padding here at all — the navbar is `sticky` (occupies its
// own space in document flow), so content starts immediately after
// it. Any spacing below the nav is handled inside PredictionsClient,
// not here — having both add padding is what caused the large gap.
//--------------------------------------------------------------

import supabaseAdmin from "@/lib/supabaseAdmin";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import PredictionsClient from "@/components/PredictionsClient";

function mapGameType(raw) {
  if (!raw) return "Free";
  const t = raw.toLowerCase();
  if (t.includes("free")) return "Free";
  if (t.includes("vip")) return "VIP";
  if (t.includes("correct")) return "Correct Score";
  return raw;
}

function parseMatchData(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("❌ Failed to parse match_data JSON:", err);
      return [];
    }
  }
  return [];
}

async function getActiveGames(userId) {
  const { data, error } = await supabaseAdmin
    .from("games")
    .select("id, game_name, game_type, total_odds, price, status, match_data, game_date, booking_code, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error loading games:", error);
    return [];
  }

  let paidGameIds = new Set();
  if (userId) {
    const { data: paidOrders, error: ordersError } = await supabaseAdmin
      .from("orders").select("game_id").eq("user_id", userId).eq("status", "paid");
    if (ordersError) console.error("❌ Error loading paid orders:", ordersError);
    else paidGameIds = new Set((paidOrders || []).map((o) => o.game_id));
  }

  return (data || []).map((g) => {
    const rawType = g.game_type || "";
    const displayType = mapGameType(rawType);
    const isFree = rawType.toLowerCase().includes("free");
    const canRevealCode = isFree || paidGameIds.has(g.id);

    return {
      id: g.id, title: displayType, displayType, rawType,
      gameName: g.game_name || displayType,
      totalOdds: g.total_odds ?? null, price: g.price ?? null,
      status: g.status || "active", matchData: parseMatchData(g.match_data),
      bookingCode: canRevealCode ? g.booking_code || null : null,
      gameDate: g.game_date || null, createdAt: g.created_at || null,
    };
  });
}

export default async function PredictionsPage() {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  const games = await getActiveGames(user?.id);

  return (
    <main className="bg-bg">
      <PredictionsClient games={games} isLoggedIn={isLoggedIn} />
    </main>
  );
}
