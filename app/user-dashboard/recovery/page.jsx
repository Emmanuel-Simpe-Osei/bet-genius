// app/user-dashboard/recovery/page.jsx
import Link from "next/link";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { RefreshCw, ExternalLink, Shield, Calendar } from "lucide-react";

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white">
            Recovery <span style={{ color: GOLD }}>Center</span> 🛡️
          </h2>
          <p className="text-sm text-[#AFC3FF]/80 mt-2 max-w-2xl">
            When a VIP slip fails and you buy a recovery ticket, the details
            appear here. Booking codes are visible only to you in this secure
            dashboard.
          </p>
        </div>

        <Link
          href="/predictions"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-[#FFD601] to-[#FFE769] text-[#0B1A4A] hover:shadow-lg hover:shadow-[#FFD601]/25 transition-all duration-200"
        >
          <RefreshCw size={16} />
          Buy Recovery Ticket
          <ExternalLink size={14} />
        </Link>
      </div>

      {/* Empty State */}
      {tickets.length === 0 && (
        <div className="mt-4 rounded-3xl border border-[#1c2b66]/50 bg-gradient-to-br from-[#0F1E4D] to-[#152862] p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <Shield size={24} className="text-[#AFC3FF]" />
          </div>
          <p className="text-sm text-[#AFC3FF]">No recovery tickets yet.</p>
          <p className="text-xs text-[#AFC3FF]/80 mt-1">
            If a VIP slip fails and you buy a recovery game, it will show up
            here with its booking code.
          </p>
        </div>
      )}

      {/* Recovery Tickets List */}
      {tickets.length > 0 && (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="rounded-3xl bg-gradient-to-br from-[#0F1E4D] to-[#152862] border border-[#1c2b66]/50 p-6 hover:border-[#FFD601]/30 transition-all duration-300 group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Left Content */}
                <div className="flex-1 space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-[#AFC3FF] border border-[#1c2b66]">
                      Recovery
                    </span>
                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                      {t.status === "paid" ? "Active 🟢" : t.status}
                    </span>
                  </div>

                  {/* Game Info */}
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#FFD601] transition-colors">
                      {t.gameName}
                    </h3>

                    <div className="flex items-center gap-4 mt-2 text-xs text-[#AFC3FF]/80 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>Purchased: {formatDate(t.createdAt)}</span>
                      </div>
                      {t.gameDate && (
                        <div className="flex items-center gap-1">
                          <span>•</span>
                          <span>Game Date: {formatDate(t.gameDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Code */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#AFC3FF]">
                      Booking Code:
                    </span>
                    <span
                      className="px-4 py-2 rounded-2xl text-sm font-black tracking-wider"
                      style={{ backgroundColor: GOLD, color: NAVY }}
                    >
                      {t.bookingCode}
                    </span>
                  </div>
                </div>

                {/* Right Content */}
                <div className="lg:text-right space-y-2">
                  <div className="text-sm text-[#AFC3FF]">Ticket Value</div>
                  <div
                    className="text-2xl font-black leading-tight"
                    style={{ color: GOLD }}
                  >
                    {t.currency} {Number(t.amount || 0).toLocaleString()}
                  </div>

                  {t.paystackRef && (
                    <div className="mt-2 text-xs text-[#AFC3FF]/60">
                      Ref:{" "}
                      <span className="font-mono bg-white/5 px-2 py-1 rounded-lg">
                        {t.paystackRef}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
