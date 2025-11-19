//--------------------------------------------------------------
// /user-dashboard/purchases
// Shows all PAID orders for the logged-in user
//--------------------------------------------------------------

import Link from "next/link";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

const NAVY = "#0B1A4A";
const GOLD = "#FFD601";

function mapGameType(raw) {
  if (!raw) return "Free";
  const t = raw.toLowerCase();
  if (t.includes("vip")) return "VIP";
  if (t.includes("correct")) return "Correct Score";
  if (t.includes("recovery")) return "Recovery";
  if (t.includes("free")) return "Free";
  return raw;
}

function formatDate(value) {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

async function getUserPurchases() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, purchases: [] };
  }

  // Fetch paid orders
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from("orders")
    .select(
      "id, user_id, game_id, amount, currency, status, paystack_ref, created_at"
    )
    .eq("user_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  if (ordersError) {
    console.error("Error loading orders:", ordersError);
    return { user, purchases: [] };
  }

  const gameIds = [...new Set(orders.map((o) => o.game_id).filter(Boolean))];

  let gamesById = {};
  if (gameIds.length > 0) {
    const { data: games, error: gamesError } = await supabaseAdmin
      .from("games")
      .select(
        "id, game_name, game_type, booking_code, total_odds, game_date, price"
      )
      .in("id", gameIds);

    if (gamesError) {
      console.error("Error loading games:", gamesError);
    } else {
      gamesById = (games || []).reduce((acc, g) => {
        acc[g.id] = g;
        return acc;
      }, {});
    }
  }

  const purchases = orders.map((o) => {
    const game = gamesById[o.game_id] || {};
    const typeLabel = mapGameType(game.game_type);

    return {
      id: o.id,
      createdAt: o.created_at,
      amount: o.amount,
      currency: o.currency || "GHS",
      status: o.status,
      paystackRef: o.paystack_ref,
      gameName: game.game_name || "Unknown Game",
      gameType: typeLabel,
      rawType: game.game_type,
      bookingCode: game.booking_code || "Not available",
      totalOdds: game.total_odds,
      gameDate: game.game_date,
    };
  });

  return { user, purchases };
}

export default async function PurchasesPage() {
  const { purchases } = await getUserPurchases();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            My <span style={{ color: GOLD }}>Purchases</span>
          </h2>
          <p className="text-xs md:text-sm text-[#AFC3FF] mt-1">
            All your successful Paystack bookings live here. Booking codes are
            only visible inside this dashboard.
          </p>
        </div>

        <Link
          href="/predictions"
          className="inline-flex items-center justify-center px-5 py-2 rounded-full text-xs md:text-sm font-semibold bg-[#FFD601] text-[#0B1A4A] hover:bg-yellow-400 transition"
        >
          Browse new predictions →
        </Link>
      </div>

      {/* Empty state */}
      {purchases.length === 0 && (
        <div className="mt-4 rounded-2xl border border-[#1c2b66] bg-[#0F1E4D] p-6 text-center">
          <p className="text-sm text-[#AFC3FF]">
            You haven&apos;t bought any VIP or Correct Score games yet.
          </p>
          <p className="text-xs text-[#AFC3FF] mt-1">
            Go to{" "}
            <span className="font-semibold" style={{ color: GOLD }}>
              Predictions
            </span>{" "}
            and unlock a game to see it here.
          </p>
        </div>
      )}

      {/* List */}
      {purchases.length > 0 && (
        <div className="space-y-4">
          {purchases.map((p) => (
            <div
              key={p.id}
              className="rounded-3xl bg-[#0F1E4D] border border-[#1c2b66] p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              {/* Left */}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs uppercase tracking-wide text-[#AFC3FF]">
                    {p.gameType}
                  </span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#18285c] text-[#AFC3FF]">
                    {p.status === "paid" ? "Paid" : p.status}
                  </span>
                </div>

                <h3 className="mt-1 text-sm md:text-base font-semibold text-white">
                  {p.gameName}
                </h3>

                <p className="mt-1 text-[11px] text-[#AFC3FF]">
                  Purchased:{" "}
                  <span className="font-medium">{formatDate(p.createdAt)}</span>
                  {p.gameDate && (
                    <>
                      {" • "}Game Date:{" "}
                      <span className="font-medium">
                        {formatDate(p.gameDate)}
                      </span>
                    </>
                  )}
                </p>

                {p.totalOdds && (
                  <p className="text-[11px] text-[#AFC3FF] mt-0.5">
                    Total Odds:{" "}
                    <span className="font-semibold">
                      {Number(p.totalOdds).toLocaleString()}
                    </span>
                  </p>
                )}

                <p className="mt-2 text-xs text-[#AFC3FF]">
                  Booking Code:{" "}
                  <span
                    className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-semibold"
                    style={{ backgroundColor: GOLD, color: NAVY }}
                  >
                    {p.bookingCode}
                  </span>
                </p>
              </div>

              {/* Right */}
              <div className="w-full md:w-auto md:text-right">
                <div className="text-xs text-[#AFC3FF]">Amount Paid</div>
                <div
                  className="text-lg font-extrabold leading-tight"
                  style={{ color: GOLD }}
                >
                  {p.currency} {Number(p.amount || 0).toLocaleString()}
                </div>
                {p.paystackRef && (
                  <div className="mt-1 text-[10px] text-[#AFC3FF]">
                    Ref:{" "}
                    <span className="font-mono break-all">{p.paystackRef}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
