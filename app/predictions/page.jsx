// app/predictions/page.jsx
//--------------------------------------------------------------
// SERVER COMPONENT (Next.js 15 compatible)
// - Fetches active games from Supabase
// - Masks game types
// - Safely parses match_data
// - Checks logged-in state via route client (must be awaited)
// - Renders <PredictionsClient />
//--------------------------------------------------------------

import supabaseAdmin from "@/lib/supabaseAdmin";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import PredictionsClient from "@/components/PredictionsClient";

// ------------------------------------------------------------
// Mask game types
// ------------------------------------------------------------
function mapGameType(raw) {
  if (!raw) return "Free";

  const t = raw.toLowerCase();

  if (t.includes("free")) return "Free";
  if (t.includes("vip")) return "VIP";
  if (t.includes("correct")) return "Correct Score";

  return raw;
}

// ------------------------------------------------------------
// Safe JSON parsing for match_data
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// Fetch active games
// ------------------------------------------------------------
async function getActiveGames() {
  const { data, error } = await supabaseAdmin
    .from("games")
    .select(
      "id, game_name, game_type, total_odds, price, status, match_data, game_date, booking_code, created_at"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error loading games:", error);
    return [];
  }

  return (data || []).map((g) => {
    const rawType = g.game_type || "";
    const displayType = mapGameType(rawType);

    return {
      id: g.id,
      title: displayType,
      displayType,
      rawType,
      gameName: g.game_name || displayType,
      totalOdds: g.total_odds ?? null,
      price: g.price ?? null,
      status: g.status || "active",
      matchData: parseMatchData(g.match_data),
      bookingCode: g.booking_code || null,
      gameDate: g.game_date || null,
      createdAt: g.created_at || null,
    };
  });
}

// ------------------------------------------------------------
// PAGE COMPONENT
// ------------------------------------------------------------
export default async function PredictionsPage() {
  // Load games
  const games = await getActiveGames();

  // ✔ FIXED: must await the route client
  const supabase = await createSupabaseRouteClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = !!user;

  return (
    <main
      className="
        min-h-screen
        bg-[#0B1A4A]
        pt-36
        pb-16
        px-4
        md:pt-40
      "
    >
      <PredictionsClient games={games} isLoggedIn={isLoggedIn} />
    </main>
  );
}
