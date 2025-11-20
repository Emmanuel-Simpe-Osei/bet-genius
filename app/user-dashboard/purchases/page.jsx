"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

const NAVY = "#0B1A4A";
const GOLD = "#FFD601";

// ------------------------------------------------------------------
// SERVER COMPONENT DATA FETCHING MOVED ↓ (Wrapped inside client)
// ------------------------------------------------------------------
async function fetchPurchases() {
  const res = await fetch("/api/user/purchases", {
    cache: "no-store",
  });

  return await res.json();
}

// 🔁 Map game type
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
  const scrollTargetRef = useRef(null);

  // ---------------------------------------------------------------
  // LOAD PURCHASES
  // ---------------------------------------------------------------
  useEffect(() => {
    (async () => {
      const data = await fetchPurchases();
      setPurchases(data.purchases || []);
    })();
  }, []);

  // ---------------------------------------------------------------
  // PLAY SUCCESS MESSAGE
  // ---------------------------------------------------------------
  useEffect(() => {
    if (success === "1") {
      toast.success("Payment successful! Booking code unlocked.");
    }
  }, [success]);

  // ---------------------------------------------------------------
  // AUTO-SCROLL TO PURCHASED ITEM
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!orderId || purchases.length === 0) return;

    const element = document.getElementById(`order-${orderId}`);
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
    }
  }, [purchases, orderId]);

  // ---------------------------------------------------------------
  // COPY BOOKING CODE
  // ---------------------------------------------------------------
  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Booking code copied!");
  };

  // ---------------------------------------------------------------
  // UI SECTION
  // ---------------------------------------------------------------
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
              id={`order-${p.id}`}
              className="rounded-3xl bg-[#0F1E4D] border border-[#1c2b66] p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              {/* Left */}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs uppercase tracking-wide text-[#AFC3FF]">
                    {mapGameType(p.gameType)}
                  </span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#18285c] text-[#AFC3FF]">
                    Paid
                  </span>
                </div>

                <h3 className="mt-1 text-sm md:text-base font-semibold text-white">
                  {p.gameName}
                </h3>

                <p className="mt-1 text-[11px] text-[#AFC3FF]">
                  Purchased:{" "}
                  <span className="font-medium">{formatDate(p.createdAt)}</span>
                </p>

                {p.totalOdds && (
                  <p className="text-[11px] text-[#AFC3FF] mt-0.5">
                    Total Odds:{" "}
                    <span className="font-semibold">
                      {Number(p.totalOdds).toLocaleString()}
                    </span>
                  </p>
                )}

                {/* Booking Code + Copy Button */}
                <div className="mt-2 text-xs text-[#AFC3FF] flex items-center gap-2">
                  <span>Booking Code:</span>
                  <span
                    className="px-3 py-1 rounded-full text-[11px] font-semibold"
                    style={{ backgroundColor: GOLD, color: NAVY }}
                  >
                    {p.bookingCode}
                  </span>
                  <button
                    onClick={() => copyCode(p.bookingCode)}
                    className="text-[10px] px-2 py-1 bg-[#1b2b66] text-white rounded hover:bg-[#24367a]"
                  >
                    Copy
                  </button>
                </div>
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
