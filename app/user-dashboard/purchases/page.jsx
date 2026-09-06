"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingBag, ExternalLink, Calendar, Clock, X } from "lucide-react";
import CopyButton from "@/components/CopyButton";

async function fetchPurchases() {
  const res = await fetch("/api/user/purchases", { cache: "no-store" });
  return await res.json();
}

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
  try { return new Date(value).toLocaleString(); } catch { return String(value); }
}

function StatusBadge({ status }) {
  if (status === "paid") {
    return <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-accent/15 text-accent">Paid</span>;
  }
  if (status === "pending_review") {
    return (
      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-300 flex items-center gap-1">
        <Clock size={12} /> Pending Verification
      </span>
    );
  }
  return (
    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-300 flex items-center gap-1">
      <X size={12} /> Not Verified
    </span>
  );
}

export default function PurchasesPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await fetchPurchases();
      setPurchases(data.purchases || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!orderId || purchases.length === 0) return;
    const element = document.getElementById(`order-${orderId}`);
    if (element) setTimeout(() => element.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
  }, [purchases, orderId]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-surface rounded-2xl w-48 animate-pulse" />
        {[1, 2, 3].map((i) => <div key={i} className="bg-surface rounded-3xl p-6 h-32 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-ink">My <span className="text-accent">Purchases</span></h2>
          <p className="text-sm text-ink/60 mt-2 max-w-2xl">Booking codes appear here once your payment is verified.</p>
        </div>
        <Link href="/predictions"
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-full text-sm font-bold bg-accent text-bg hover:shadow-lg hover:shadow-accent/30 transition-all">
          <ShoppingBag size={16} /> Browse New Predictions <ExternalLink size={14} />
        </Link>
      </div>

      {purchases.length === 0 ? (
        <div className="mt-4 rounded-3xl bg-surface p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface2 flex items-center justify-center">
            <ShoppingBag size={24} className="text-ink/40" />
          </div>
          <p className="text-sm text-ink/60">You haven't bought any VIP or Correct Score games yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((p, index) => (
            <div key={p.id} id={`order-${p.id}`}
              className="rounded-3xl bg-surface p-6 hover:shadow-lg hover:shadow-black/20 transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface2 text-ink/70">
                      {mapGameType(p.gameType)}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink">{p.gameName}</h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-ink/50">
                      <Calendar size={12} />
                      <span className="font-mono tabular-nums">{formatDate(p.createdAt)}</span>
                    </div>
                  </div>

                  {p.status === "paid" && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-ink/60">Booking Code:</span>
                      <div className="flex items-center gap-2">
                        <span className="px-4 py-2 rounded-2xl text-sm font-black tracking-wider bg-accent text-bg font-mono">
                          {p.bookingCode}
                        </span>
                        <CopyButton value={p.bookingCode} label="Booking code copied!" size={14} />
                      </div>
                    </div>
                  )}
                  {p.status === "pending_review" && (
                    <p className="text-sm text-yellow-300/80">
                      We're verifying your payment{p.senderName ? ` from ${p.senderName}` : ""}. Your booking code will appear here once approved.
                    </p>
                  )}
                  {p.status === "rejected" && (
                    <p className="text-sm text-red-300/80">
                      {p.rejectionReason || "We couldn't verify this payment."} Feel free to try purchasing again.
                    </p>
                  )}
                </div>

                <div className="lg:text-right">
                  <div className="text-sm text-ink/50">Amount</div>
                  <div className="text-2xl font-black text-accent font-mono tabular-nums">
                    {p.currency} {Number(p.amount || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
