"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";

// ✅ Safe Paystack Loader
async function loadPaystack() {
  if (
    typeof window !== "undefined" &&
    window.PaystackPop &&
    typeof window.PaystackPop.setup === "function"
  ) {
    return window.PaystackPop;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;

    script.onload = () => {
      if (
        window.PaystackPop &&
        typeof window.PaystackPop.setup === "function"
      ) {
        resolve(window.PaystackPop);
      } else {
        reject("Paystack failed to initialize properly.");
      }
    };

    script.onerror = () => reject("Failed to load Paystack script.");
    document.body.appendChild(script);
  });
}

export default function PredictionCard({ game, user, onShowModal }) {
  const gameType = game.game_type?.toLowerCase();
  const isFree = gameType === "free";
  const isVip = gameType === "vip" || gameType === "custom vip";
  const isCorrectScore =
    gameType === "correct score" || gameType === "custom correct score";
  const isCustom =
    gameType === "custom vip" || gameType === "custom correct score";
  const isRecovery = gameType === "recovery";

  const [owned, setOwned] = useState(isFree); // free games treated as owned
  const [revealed, setRevealed] = useState(isFree); // free games revealed by default
  const [processing, setProcessing] = useState(false);

  const displayType = isVip
    ? "VIP"
    : isCorrectScore
    ? "Correct Score"
    : isRecovery
    ? "Recovery"
    : "Free";

  // 🔍 Check if user already purchased (only for paid games)
  useEffect(() => {
    const checkOwnership = async () => {
      if (!user || isFree) return;

      // check orders first
      const { data: orderData } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .eq("game_id", game.id)
        .eq("status", "paid")
        .maybeSingle();

      // then check purchases table
      const { data: purchaseData } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("game_id", game.id)
        .eq("is_purchased", true)
        .maybeSingle();

      if (orderData || purchaseData) {
        setOwned(true);
        setRevealed(true);
      }
    };

    checkOwnership();
  }, [user, game.id, isFree]);

  // 🎯 Matches list (from match_data)
  const matches = useMemo(
    () => (Array.isArray(game.match_data) ? game.match_data : []),
    [game.match_data]
  );

  const copyCode = async (code) => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    onShowModal?.("📋 Booking code copied — bet responsibly & good luck!");
  };

  // Can this user actually see the booking code?
  const canSeeCode =
    isFree || (owned && !!game.booking_code && !isRecovery && !isCustom);

  // 💳 Handle Paystack purchase
  const handlePurchase = async () => {
    if (!user) {
      return onShowModal?.("Please log in to unlock this game.");
    }
    if (owned) {
      setRevealed(true);
      return;
    }

    if (isCustom)
      return onShowModal?.(
        "⚠️ Slot Full — Please wait for the next game drop!"
      );
    if (isRecovery)
      return onShowModal?.(
        "🔄 Recovery Game — Only available to users who lost a previous match."
      );

    try {
      setProcessing(true);
      const PaystackPop = await loadPaystack();

      if (!PaystackPop || typeof PaystackPop.setup !== "function") {
        throw new Error("Paystack not fully initialized — please refresh.");
      }

      const paystackCallback = async (response) => {
        try {
          // Insert into orders table
          const { error: orderError } = await supabase.from("orders").insert({
            user_id: user.id,
            game_id: game.id,
            amount: game.price || 0,
            currency: "GHS",
            status: "paid",
            paystack_ref: response.reference,
          });

          if (orderError) throw orderError;

          // Also insert into purchases table
          const { error: purchaseError } = await supabase
            .from("purchases")
            .insert({
              user_id: user.id,
              game_id: game.id,
              is_purchased: true,
            });

          if (purchaseError)
            console.error("Purchase insert error:", purchaseError);

          setOwned(true);
          setRevealed(true);
          onShowModal?.("✅ Payment successful! Your code is now unlocked.");
        } catch (err) {
          console.error("Insert error:", err);
          onShowModal?.(
            "⚠️ Payment saved but could not verify. Please contact support."
          );
        }
      };

      const handler = PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: (game.price || 0) * 100,
        currency: "GHS",
        callback: (resp) => paystackCallback(resp),
        onClose: () =>
          onShowModal?.("💳 Payment window closed. You can try again anytime."),
      });

      handler.openIframe();
    } catch (err) {
      console.error("Paystack setup error:", err);
      onShowModal?.("❌ Payment failed. Please refresh and retry.");
    } finally {
      setProcessing(false);
    }
  };

  // Decide footer CTA text for paid games
  const getCtaProps = () => {
    if (isFree) return null;

    if (!user) {
      return {
        label: "Login to unlock",
        onClick: () =>
          onShowModal?.("Please log in to purchase and unlock this game."),
        disabled: false,
      };
    }

    if (owned) {
      return {
        label: "Purchased — Revealed",
        onClick: () => setRevealed(true),
        disabled: false,
      };
    }

    if (isRecovery) {
      return {
        label: "Recovery Game (restricted)",
        onClick: () =>
          onShowModal?.(
            "🔄 Recovery games are only for users who lost a previous VIP bet."
          ),
        disabled: true,
      };
    }

    if (isCustom) {
      return {
        label: "Slot Full",
        onClick: () =>
          onShowModal?.(
            "⚠️ Custom correct score slot is full. Wait for the next drop."
          ),
        disabled: true,
      };
    }

    return {
      label: processing ? "Processing…" : `Unlock for ₵${game.price || 0}`,
      onClick: handlePurchase,
      disabled: processing,
    };
  };

  const cta = getCtaProps();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:scale-[1.02] transition-all"
    >
      {/* 🏷 Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-[#FFD601] capitalize">{displayType}</h3>
        <p className="text-xs text-white/70">
          {new Date(game.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* 🎯 Odds & Price */}
      <div className="flex justify-between text-sm mb-4">
        <p>Total Odds: {game.total_odds}</p>
        <p>₵{game.price || 0}</p>
      </div>

      {/* 🏆 Matches */}
      <div className="bg-white/5 rounded-xl p-3 mb-4 max-h-36 overflow-y-auto text-sm text-white/80">
        {matches.map((m, i) => (
          <div
            key={i}
            className="flex justify-between border-b border-white/10 py-1 last:border-none"
          >
            <span>
              {m.homeTeam} vs {m.awayTeam}
            </span>
            <span
              className={
                m.status === "Win"
                  ? "text-emerald-400"
                  : m.status === "Loss"
                  ? "text-red-400"
                  : "text-yellow-400"
              }
            >
              {m.status || "Pending"}
            </span>
          </div>
        ))}
      </div>

      {/* 🎫 Booking Code */}
      <div className="bg-white/5 rounded-xl p-3 flex justify-between items-center">
        <span className="text-white/80">Booking:</span>
        {canSeeCode ? (
          <button
            onClick={() => copyCode(game.booking_code)}
            className="bg-[#FFD601] text-[#142B6F] px-4 py-1 rounded-lg font-bold"
          >
            {game.booking_code}
          </button>
        ) : (
          <span className="blur-sm select-none">XXXXXX 🔒</span>
        )}
      </div>

      {/* 🔓 Footer */}
      {isFree ? (
        <p className="text-emerald-400 text-sm mt-3 text-center">
          🎉 Free Tip — Copy & Bet Smart!
        </p>
      ) : (
        cta && (
          <button
            onClick={cta.onClick}
            disabled={cta.disabled}
            className="w-full mt-3 bg-[#FFD601] text-[#142B6F] font-bold py-2 rounded-xl hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cta.label}
          </button>
        )
      )}
    </motion.div>
  );
}
