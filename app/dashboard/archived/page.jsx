// app/dashboard/archived/page.jsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import GameCard from "../games/GameCard";

function normalizeGame(raw) {
  let matchData = [];

  if (Array.isArray(raw.match_data)) {
    matchData = raw.match_data;
  } else if (typeof raw.match_data === "string") {
    try {
      const parsed = JSON.parse(raw.match_data);
      if (Array.isArray(parsed)) matchData = parsed;
    } catch {
      matchData = [];
    }
  }

  return {
    ...raw,
    match_data: matchData,
  };
}

export default function ArchivedPage() {
  const [archivedGames, setArchivedGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState(null);

  // 🧭 Fetch archived games
  const fetchArchivedGames = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("status", "archived")
        .order("archived_at", { ascending: false });

      if (error) throw error;

      const normalized = (data || []).map(normalizeGame);
      setArchivedGames(normalized);
    } catch (err) {
      console.error("Error fetching archived games:", err.message);
      setMessage("⚠️ Failed to load archived games.");
    } finally {
      setIsLoading(false);
    }
  };

  // ♻️ Restore archived game
  const restoreGame = async (id) => {
    try {
      const res = await fetch("/api/games/restore", {
        method: "POST",
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage("✅ Game restored successfully!");
      fetchArchivedGames();
    } catch (err) {
      console.error("Restore error:", err.message);
      setMessage("⚠️ Failed to restore game.");
    }
  };

  // ❌ Permanently delete
  const deleteGame = async (id) => {
    if (!confirm("This will permanently delete the game. Continue?")) return;

    try {
      const res = await fetch("/api/games/delete", {
        method: "POST",
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage("🗑️ Game permanently deleted.");
      fetchArchivedGames();
    } catch (err) {
      console.error("Delete error:", err.message);
      setMessage("⚠️ Failed to delete game.");
    }
  };

  useEffect(() => {
    fetchArchivedGames();
  }, []);

  // 🔍 Search
  const filtered = archivedGames.filter((g) => {
    const needle = searchTerm.toLowerCase();
    return (
      g.booking_code?.toLowerCase().includes(needle) ||
      g.game_type?.toLowerCase().includes(needle)
    );
  });

  return (
    <div className="min-h-screen bg-[#142B6F]/5 p-6">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-semibold text-[#142B6F]">
          Archived Games
        </h1>
        <p className="text-gray-500 text-sm">
          View, restore or permanently delete archived games.
        </p>
      </motion.div>

      {/* SEARCH */}
      <div className="max-w-md mx-auto mb-6">
        <input
          type="text"
          placeholder="Search archived games..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#FFD601] focus:ring-2 focus:ring-[#FFD601]/30 outline-none bg-white shadow-sm"
        />
      </div>

      {/* STATUS MESSAGE */}
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-4 text-sm text-gray-800 font-medium"
        >
          {message}
        </motion.div>
      )}

      {/* ARCHIVE GRID */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 text-gray-500">
          No archived games found.
        </div>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filtered.map((game) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-4"
              >
                {/* FULL, READ-ONLY GameCard */}
                <GameCard
                  game={game}
                  archivedMode={true}
                  // showToast is mostly unused in archived mode, but kept for safety
                  showToast={(msg) => setMessage(msg)}
                />

                {/* ACTION BUTTONS BELOW CARD */}
                <div className="flex items-center justify-between w-full px-3 gap-3">
                  <button
                    onClick={() => restoreGame(game.id)}
                    className="flex-1 px-4 py-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition"
                  >
                    Restore
                  </button>

                  <button
                    onClick={() => deleteGame(game.id)}
                    className="flex-1 px-4 py-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
