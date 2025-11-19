//--------------------------------------------------------------
// /user-dashboard/recovery
// Shows only Recovery-type purchases
//--------------------------------------------------------------

import Link from "next/link";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

const NAVY = "#0B1A4A";
const GOLD = "#FFD601";

function formatDate(value) {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

async function getRecoveryPurchases() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, tickets: [] };

  const { data: orders, error: ordersError } = await supabaseAdmin
    .from("orders")
    .select(
      "id, user_id, game_id, amount, currency, status, paystack_ref, created_at"
    )
    .eq("user_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  if (ordersError) {
    console.error("Error loading recovery orders:", ordersError);
    return { user, tickets: [] };
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
      console.error("Error loading games for recovery:", gamesError);
    } else {
      gamesById = (games || []).reduce((acc, g) => {
        acc[g.id] = g;
        return acc;
      }, {});
    }
  }

  // Only keep games whose type includes "recovery"
  const tickets = orders
    .map((o) => {
      const game = gamesById[o.game_id] || {};
      const rawType = (game.game_type || "").toLowerCase();
      if (!rawType.includes("recovery")) return null;

      return {
        id: o.id,
        createdAt: o.created_at,
        amount: o.amount,
        currency: o.currency || "GHS",
        status: o.status,
        paystackRef: o.paystack_ref,
        gameName: game.game_name || "Recovery Ticket",
        bookingCode: game.booking_code || "Not available",
        gameDate: game.game_date,
        totalOdds: game.total_odds,
      };
    })
    .filter(Boolean);

  return { user, tickets };
}

export default async function RecoveryPage() {
  const { tickets } = await getRecoveryPurchases();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            Recovery <span style={{ color: GOLD }}>Center</span>
          </h2>
          <p className="text-xs md:text-sm text-[#AFC3FF] mt-1">
            When a VIP slip fails and you buy a recovery ticket, the details
            appear here. Booking codes are visible only to you.
          </p>
        </div>

        <Link
          href="/predictions"
          className="inline-flex items-center justify-center px-5 py-2 rounded-full text-xs md:text-sm font-semibold bg-[#FFD601] text-[#0B1A4A] hover:bg-yellow-400 transition"
        >
          Buy recovery ticket →
        </Link>
      </div>

      {tickets.length === 0 && (
        <div className="mt-4 rounded-2xl border border-[#1c2b66] bg-[#0F1E4D] p-6 text-center">
          <p className="text-sm text-[#AFC3FF]">No recovery tickets yet.</p>
          <p className="text-xs text-[#AFC3FF] mt-1">
            If a VIP slip fails and you buy a recovery game, it will show up
            here with its booking code.
          </p>
        </div>
      )}

      {tickets.length > 0 && (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="rounded-3xl bg-[#0F1E4D] border border-[#1c2b66] p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs uppercase tracking-wide text-[#AFC3FF]">
                    Recovery
                  </span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#255142] text-[#c1ffe0]">
                    {t.status === "paid" ? "Active" : t.status}
                  </span>
                </div>

                <h3 className="mt-1 text-sm md:text-base font-semibold text-white">
                  {t.gameName}
                </h3>

                <p className="mt-1 text-[11px] text-[#AFC3FF]">
                  Purchased:{" "}
                  <span className="font-medium">{formatDate(t.createdAt)}</span>
                  {t.gameDate && (
                    <>
                      {" • "}Game Date:{" "}
                      <span className="font-medium">
                        {formatDate(t.gameDate)}
                      </span>
                    </>
                  )}
                </p>

                <p className="mt-2 text-xs text-[#AFC3FF]">
                  Booking Code:{" "}
                  <span
                    className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-semibold"
                    style={{ backgroundColor: GOLD, color: NAVY }}
                  >
                    {t.bookingCode}
                  </span>
                </p>
              </div>

              <div className="w-full md:w-auto md:text-right">
                <div className="text-xs text-[#AFC3FF]">Ticket Value</div>
                <div
                  className="text-lg font-extrabold leading-tight"
                  style={{ color: GOLD }}
                >
                  {t.currency} {Number(t.amount || 0).toLocaleString()}
                </div>
                {t.paystackRef && (
                  <div className="mt-1 text-[10px] text-[#AFC3FF]">
                    Ref:{" "}
                    <span className="font-mono break-all">{t.paystackRef}</span>
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
