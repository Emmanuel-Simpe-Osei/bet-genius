"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ShoppingBag, ExternalLink, Calendar, Tag } from "lucide-react";

const NAVY = "#0B1A4A";
const GOLD = "#FFD601";

async function fetchPurchases() {
  const res = await fetch("/api/user/purchases", {
    cache: "no-store",
  });
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
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function PurchasesPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const orderId = searchParams.get("orderId");

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollTargetRef = useRef(null);

  useEffect(() => {
    (async () => {
      const data = await fetchPurchases();
      setPurchases(data.purchases || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (success === "1") {
      toast.success("🎉 Payment successful! Booking code unlocked.");
    }
  }, [success]);

  useEffect(() => {
    if (!orderId || purchases.length === 0) return;

    const element = document.getElementById(`order-${orderId}`);
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
    }
  }, [purchases, orderId]);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("📋 Booking code copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="h-8 bg-white/10 rounded-2xl w-48 mb-3 animate-pulse" />
            <div className="h-4 bg-white/5 rounded-xl w-64 animate-pulse" />
          </div>
          <div className="h-10 bg-white/5 rounded-2xl w-48 animate-pulse" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-[#0F1E4D] to-[#152862] border border-[#1c2b66]/50 rounded-3xl p-6 animate-pulse"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex gap-2">
                    <div className="h-6 bg-white/10 rounded-full w-20" />
                    <div className="h-6 bg-white/5 rounded-full w-16" />
                  </div>
                  <div className="h-5 bg-white/10 rounded-lg w-3/4" />
                  <div className="h-4 bg-white/5 rounded-lg w-1/2" />
                  <div className="h-8 bg-white/5 rounded-2xl w-40" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-4 bg-white/5 rounded-lg w-20 ml-auto" />
                  <div className="h-6 bg-white/10 rounded-lg w-24 ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-black text-white">
            My <span style={{ color: GOLD }}>Purchases</span> 🛒
          </h2>
          <p className="text-sm text-[#AFC3FF]/80 mt-2 max-w-2xl">
            All your successful Paystack bookings live here. Booking codes are
            only visible inside this secure dashboard.
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link
            href="/predictions"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-[#FFD601] to-[#FFE769] text-[#0B1A4A] hover:shadow-lg hover:shadow-[#FFD601]/25 transition-all duration-200"
          >
            <ShoppingBag size={16} />
            Browse New Predictions
            <ExternalLink size={14} />
          </Link>
        </motion.div>
      </motion.div>

      {/* Empty State */}
      <AnimatePresence>
        {purchases.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 rounded-3xl border border-[#1c2b66]/50 bg-gradient-to-br from-[#0F1E4D] to-[#152862] p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              <ShoppingBag size={24} className="text-[#AFC3FF]" />
            </div>
            <p className="text-sm text-[#AFC3FF]">
              You haven&apos;t bought any VIP or Correct Score games yet.
            </p>
            <p className="text-xs text-[#AFC3FF]/80 mt-1">
              Go to{" "}
              <span className="font-semibold" style={{ color: GOLD }}>
                Predictions
              </span>{" "}
              and unlock a game to see it here.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchases List */}
      <AnimatePresence>
        {purchases.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {purchases.map((p, index) => (
              <motion.div
                key={p.id}
                id={`order-${p.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-3xl bg-gradient-to-br from-[#0F1E4D] to-[#152862] border border-[#1c2b66]/50 p-6 hover:border-[#FFD601]/30 transition-all duration-300 group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Left Content */}
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-[#AFC3FF] border border-[#1c2b66]">
                        {mapGameType(p.gameType)}
                      </span>
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                        Paid ✅
                      </span>
                    </div>

                    {/* Game Info */}
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-[#FFD601] transition-colors">
                        {p.gameName}
                      </h3>

                      <div className="flex items-center gap-4 mt-2 text-xs text-[#AFC3FF]/80">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>Purchased: {formatDate(p.createdAt)}</span>
                        </div>
                        {p.totalOdds && (
                          <div className="flex items-center gap-1">
                            <Tag size={12} />
                            <span>
                              Total Odds: {Number(p.totalOdds).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Booking Code */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[#AFC3FF]">
                        Booking Code:
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-4 py-2 rounded-2xl text-sm font-black tracking-wider"
                          style={{ backgroundColor: GOLD, color: NAVY }}
                        >
                          {p.bookingCode}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => copyCode(p.bookingCode)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#AFC3FF] hover:text-white transition-all duration-200 border border-[#1c2b66]"
                          title="Copy booking code"
                        >
                          <Copy size={14} />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Right Content */}
                  <div className="lg:text-right space-y-2">
                    <div className="text-sm text-[#AFC3FF]">Amount Paid</div>
                    <div
                      className="text-2xl font-black leading-tight"
                      style={{ color: GOLD }}
                    >
                      {p.currency} {Number(p.amount || 0).toLocaleString()}
                    </div>

                    {p.paystackRef && (
                      <div className="mt-2 text-xs text-[#AFC3FF]/60">
                        Ref:{" "}
                        <span className="font-mono bg-white/5 px-2 py-1 rounded-lg">
                          {p.paystackRef}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
