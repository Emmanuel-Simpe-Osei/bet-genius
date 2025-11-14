"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";

/* -----------------------------------------------
   SAFE PAYSTACK LOADER
------------------------------------------------ */
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
      if (window.PaystackPop?.setup) resolve(window.PaystackPop);
      else reject("Paystack failed to initialize.");
    };

    script.onerror = () => reject("Failed to load Paystack.");
    document.body.appendChild(script);
  });
}

export default function PredictionCard({ game, user, onShowModal }) {
  const gameType = game.game_type?.toLowerCase();

  /* --------------------------------------------------
     FIXED GAME LOGIC (AS YOU WANT)
  --------------------------------------------------- */
  const isFree = gameType === "free";
  const isVip = gameType === "vip";
  const isCorrectScore = gameType === "correct score";
  const isRecovery = gameType === "recovery";

  // Custom games should LOOK + ACT like normal ones
  const isCustomVip = gameType === "custom vip";
  const isCustomCorrectScore = gameType === "custom correct score";

  const behavesLikeVip = isVip || isCustomVip;
  const behavesLikeCorrectScore = isCorrectScore || isCustomCorrectScore;

  const displayType = behavesLikeVip
    ? "VIP"
    : behavesLikeCorrectScore
    ? "Correct Score"
    : isRecovery
    ? "Recovery"
    : "Free";

  const [owned, setOwned] = useState(isFree);
  const [revealed, setRevealed] = useState(isFree);
  const [processing, setProcessing] = useState(false);

  /* --------------------------------------------------
     CHECK OWNERSHIP
  --------------------------------------------------- */
  useEffect(() => {
    if (!user || isFree) return;

    const check = async () => {
      const { data: orderData } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .eq("game_id", game.id)
        .eq("status", "paid")
        .maybeSingle();

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

    check();
  }, [user, game.id, isFree]);

  /* --------------------------------------------------
     MATCH DATA
  --------------------------------------------------- */
  const matches = useMemo(
    () => (Array.isArray(game.match_data) ? game.match_data : []),
    [game.match_data]
  );

  /* --------------------------------------------------
     COPY BOOKING CODE
  --------------------------------------------------- */
  const copyCode = async (code) => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    onShowModal?.("📋 Booking code copied!");
  };

  /* --------------------------------------------------
     CAN SEE BOOKING CODE?
  --------------------------------------------------- */
  const canSeeCode = isFree || (owned && !!game.booking_code && !isRecovery);

  /* --------------------------------------------------
     PAYSTACK PURCHASE
  --------------------------------------------------- */
  const handlePurchase = async () => {
    if (!user) {
      return onShowModal?.("Please log in to unlock this game.");
    }

    if (owned) {
      setRevealed(true);
      return;
    }

    // ⭐ SLOT FULL LOGIC — as you want
    if (isCustomCorrectScore || isCustomVip) {
      return onShowModal?.(
        "⚠️ Slot Full — Please wait for the next game drop!"
      );
    }

    if (isRecovery) {
      return onShowModal?.(
        "🔄 Recovery game is restricted to users who lost a previous VIP bet."
      );
    }

    try {
      setProcessing(true);
      const PaystackPop = await loadPaystack();

      if (!PaystackPop?.setup) {
        throw new Error("Paystack not loaded properly.");
      }

      const callback = async (resp) => {
        await supabase.from("orders").insert({
          user_id: user.id,
          game_id: game.id,
          amount: game.price || 0,
          currency: "GHS",
          status: "paid",
          paystack_ref: resp.reference,
        });

        await supabase.from("purchases").insert({
          user_id: user.id,
          game_id: game.id,
          is_purchased: true,
        });

        setOwned(true);
        setRevealed(true);
        onShowModal?.("✅ Payment successful! Game unlocked.");
      };

      PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: (game.price || 0) * 100,
        currency: "GHS",
        callback,
        onClose: () => onShowModal?.("Payment window closed."),
      }).openIframe();
    } catch (err) {
      onShowModal?.("❌ Payment failed. Try again.");
    } finally {
      setProcessing(false);
    }
  };

  /* --------------------------------------------------
     CTA BUTTON LOGIC — FIXED
  --------------------------------------------------- */
  const getCtaProps = () => {
    if (isFree) return null;

    if (!user) {
      return {
        label: "Login to unlock",
        onClick: () => onShowModal?.("Please log in to unlock this game."),
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
        label: "Recovery (Restricted)",
        onClick: () =>
          onShowModal?.(
            "Recovery games are only for users who lost a previous VIP bet."
          ),
        disabled: true,
      };
    }

    // ⭐ Custom should NOT show slot full button — show normal unlock button
    if (isCustomVip || isCustomCorrectScore) {
      return {
        label: `Unlock for ₵${game.price}`,
        onClick: handlePurchase, // Will show slot full modal
        disabled: false,
      };
    }

    return {
      label: processing ? "Processing…" : `Unlock for ₵${game.price}`,
      onClick: handlePurchase,
      disabled: processing,
    };
  };

  const cta = getCtaProps();

  /* --------------------------------------------------
     UI
  --------------------------------------------------- */
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:scale-[1.02] transition-all"
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-[#FFD601] capitalize">{displayType}</h3>
        <p className="text-xs text-white/70">
          {new Date(game.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* ODDS */}
      <div className="flex justify-between text-sm mb-4">
        <p>Total Odds: {game.total_odds}</p>
        <p>₵{game.price}</p>
      </div>

      {/* MATCHES */}
      <div className="bg-white/5 rounded-xl p-3 mb-4 max-h-36 overflow-y-auto text-sm text-white/80">
        {matches.map((m, i) => (
          <div
            key={i}
            className="flex justify-between border-b border-white/10 py-1 last:border-none"
          >
            <span>
              {m.homeTeam} vs {m.awayTeam}
            </span>
            <span className="text-yellow-400">{m.status || "Pending"}</span>
          </div>
        ))}
      </div>

      {/* BOOKING CODE */}
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

      {/* CTA */}
      {!isFree && cta && (
        <button
          onClick={cta.onClick}
          disabled={cta.disabled}
          className="w-full mt-3 bg-[#FFD601] text-[#142B6F] font-bold py-2 rounded-xl hover:brightness-110 disabled:opacity-50"
        >
          {cta.label}
        </button>
      )}

      {isFree && (
        <p className="text-emerald-400 text-sm text-center mt-3">
          🎉 Free Tip — Copy & Bet Smart!
        </p>
      )}
    </motion.div>
  );
}
