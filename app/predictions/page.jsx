"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

import { supabase } from "@/lib/supabaseClient";
import { fetchWithRetry } from "@/lib/apiHelpers";
import PredictionCard from "@/components/PredictionCard";
import MessageModal from "@/components/MessageModal";

// ✅ Dynamically import FiltersBar to avoid hydration issues
const FiltersBar = dynamic(() => import("@/components/FiltersBar"), {
  ssr: false,
  loading: () => (
    <div className="text-center text-white/50 py-4 animate-pulse">
      Loading filters...
    </div>
  ),
});

export default function PredictionsPage() {
  const [publicGames, setPublicGames] = useState([]); // from /api/public-games (no codes)
  const [privateGames, setPrivateGames] = useState([]); // from Supabase with RLS (codes)
  const [games, setGames] = useState([]); // merged result

  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("All");
  const [activeDay, setActiveDay] = useState("Today");
  const [selectedDate, setSelectedDate] = useState(null);
  const [user, setUser] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // ----------------------------------------------------------
  // 👤 Fetch logged-in user (if any)
  // ----------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => sub?.subscription?.unsubscribe();
  }, []);

  // ----------------------------------------------------------
  // 🌍 Fetch public games (no booking_code) via API route
  // ----------------------------------------------------------
  useEffect(() => {
    const loadPublicGames = async () => {
      try {
        const data = await fetchWithRetry("/api/public-games");
        setPublicGames(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Public games fetch error:", err.message);
      }
    };

    loadPublicGames();
  }, []);

  // ----------------------------------------------------------
  // 🔒 Fetch private games from Supabase with RLS
  //     - Not logged in: will only get FREE games (with booking_code)
  //     - Logged in: FREE + any purchased VIP/Correct Score (with booking_code)
  // ----------------------------------------------------------
  useEffect(() => {
    const loadPrivateGames = async () => {
      try {
        const { data, error } = await supabase
          .from("games")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPrivateGames(data || []);
      } catch (err) {
        console.error("Private games fetch error:", err.message);
      }
    };

    loadPrivateGames();
  }, [user]);

  // ----------------------------------------------------------
  // ♻️ Merge public + private lists
  //     - public gives us all cards
  //     - private overrides with booking_code and other restricted fields
  // ----------------------------------------------------------
  useEffect(() => {
    const map = new Map();

    // First put all public games (no codes)
    for (const g of publicGames) {
      map.set(g.id, { ...g });
    }

    // Then override with private data (adds booking_code where allowed)
    for (const g of privateGames) {
      const existing = map.get(g.id) || {};
      map.set(g.id, { ...existing, ...g });
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    setGames(merged);
    setLoading(false);
  }, [publicGames, privateGames]);

  // ----------------------------------------------------------
  // Helpers for date filtering
  // ----------------------------------------------------------
  const startOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };

  const dayRanges = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = startOfDay(addDays(now, 1));
    const yesterday = startOfDay(addDays(now, -1));
    return {
      Today: [today, tomorrow],
      Tomorrow: [tomorrow, addDays(now, 2)],
      Yesterday: [yesterday, today],
      All: [new Date(0), new Date(8640000000000000)],
    };
  }, []);

  // ----------------------------------------------------------
  // 🎯 Filtering by day + type
  // ----------------------------------------------------------
  const filtered = useMemo(() => {
    let start, end;

    if (selectedDate) {
      const chosen = new Date(selectedDate);
      start = startOfDay(chosen);
      end = addDays(start, 1);
    } else {
      [start, end] = dayRanges[activeDay] || dayRanges["All"];
    }

    return games.filter((g) => {
      const created = new Date(g.created_at);
      const type = g.game_type?.toLowerCase();

      if (!(created >= start && created < end)) return false;
      if (activeType === "All") return true;
      if (activeType === "VIP") return type === "vip" || type === "custom vip";
      if (activeType === "Correct Score")
        return type === "correct score" || type === "custom correct score";
      if (activeType === "Free") return type === "free";

      return type === activeType.toLowerCase();
    });
  }, [games, activeDay, activeType, dayRanges, selectedDate]);

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0E1D59] to-[#142B6F] text-white">
      <div className="pt-24 px-6">
        {/* 🧠 Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pb-6 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Pick Your <span className="text-[#FFD601]">Predictions</span>
          </h1>
          <p className="text-white/80 mt-2 max-w-2xl mx-auto">
            Filter by day and type. <span className="text-[#FFD601]">Free</span>{" "}
            tips are visible — <span className="text-[#FFD601]">VIP</span> &{" "}
            <span className="text-[#FFD601]">Correct Score</span> unlock after
            payment.
          </p>
        </motion.header>

        {/* 🔘 Filters */}
        <div className="max-w-6xl mx-auto px-4">
          <FiltersBar
            activeType={activeType}
            setActiveType={setActiveType}
            activeDay={activeDay}
            setActiveDay={setActiveDay}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            hideCustom
          />
        </div>

        {/* 🎯 Predictions Grid */}
        <div className="max-w-6xl mx-auto px-4 pb-16">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white/5 rounded-2xl h-56 animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-16"
            >
              <div className="text-5xl mb-3">🧐</div>
              <p className="text-white/80">
                No predictions found. Try another day or type.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
            >
              <AnimatePresence>
                {filtered.map((game) => (
                  <PredictionCard
                    key={game.id}
                    game={game}
                    user={user}
                    onShowModal={(msg) => {
                      setModalMessage(msg);
                      setShowModal(true);
                    }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* ✨ Glowing Modal */}
      <MessageModal
        show={showModal}
        message={modalMessage}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
