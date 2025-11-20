"use client";

import { useEffect, useState } from "react";
import GameForm from "./GameForm";
import GameCard from "./GameCard";
import { motion, AnimatePresence } from "framer-motion";

// ---------------- TOAST COMPONENT ----------------
const Toast = ({ message, type = "success", onClose }) => {
  const colors = {
    success: "border-green-500 bg-green-50 text-green-800",
    error: "border-red-500 bg-red-50 text-red-800",
    warning: "border-yellow-500 bg-yellow-50 text-yellow-800",
    info: "border-blue-500 bg-blue-50 text-blue-800",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`fixed top-4 right-4 z-50 max-w-sm w-full p-4 rounded-xl shadow-md border-l-4 ${colors[type]}`}
    >
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">{message}</p>

        <button
          onClick={onClose}
          className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
};

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const makeId = () =>
    crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const showToast = (message, type = "success", duration = 4000) => {
    const id = makeId();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  };

  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return { toasts, showToast, removeToast };
};

// ---------------- MAIN PAGE ----------------

export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { toasts, showToast, removeToast } = useToast();

  // Enable client-side UI
  useEffect(() => setIsClient(true), []);

  // ---------------- FETCH GAMES (FROM API) ----------------
  const fetchGames = async () => {
    try {
      setIsLoading(true);

      const res = await fetch("/api/admin/games-with-purchases", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch games");

      const data = await res.json();

      setGames(data);
      showToast(`Loaded ${data.length} games successfully`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to load games", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // First load
  useEffect(() => {
    fetchGames();
  }, []);

  // ---------------- FILTER ----------------
  useEffect(() => {
    const needle = searchTerm.toLowerCase();

    setFilteredGames(
      games.filter((g) =>
        [g.booking_code, g.game_type, g.status, g.total_odds]
          .filter(Boolean)
          .some((val) => val.toString().toLowerCase().includes(needle))
      )
    );
  }, [searchTerm, games]);

  // ---------------- SKELETON (SSR SAFE) ----------------
  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#142B6F]/5 p-6">
        <div className="animate-pulse space-y-6 max-w-6xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------------- RENDER ----------------

  return (
    <div className="min-h-screen bg-[#142B6F]/5 p-6">
      {/* TOASTS */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-[#142B6F]">
            Game Management
          </h1>
          <p className="text-gray-500 text-sm">Manage uploaded betting games</p>
        </div>

        {/* SEARCH BAR */}
        <div className="max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search games…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 
                       focus:border-[#FFD601] focus:ring-2 focus:ring-[#FFD601]/30
                       bg-white shadow-sm text-gray-800"
          />
        </div>

        {/* FORM */}
        <motion.section
          id="game-form"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-200 shadow-sm"
        >
          <GameForm onGameAdded={fetchGames} showToast={showToast} />
        </motion.section>

        {/* STATS BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600 mt-6">
          <span>
            Showing {filteredGames.length} of {games.length} games
          </span>

          {isLoading && (
            <div className="flex items-center space-x-2 text-[#142B6F]">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#142B6F] border-t-transparent"></div>
              <span>Loading games…</span>
            </div>
          )}
        </div>

        {/* LOADING GRID */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-56 bg-gray-100 rounded-2xl animate-pulse"
              ></div>
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <h3 className="text-lg font-medium mb-1">No games found</h3>
            <p className="text-sm">Try adding a game or adjust the search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onStatusChange={fetchGames}
                onDelete={fetchGames}
                showToast={showToast}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
