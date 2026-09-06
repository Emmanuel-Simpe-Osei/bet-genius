"use client";
import { useEffect, useState } from "react";
import GameForm from "./GameForm";
import GameCard from "./GameCard";
import { motion, AnimatePresence } from "framer-motion";

const Toast = ({ message, type = "success", onClose }) => {
  const colors = {
    success: "border-accent bg-accent/10 text-accent",
    error: "border-red-500 bg-red-500/10 text-red-300",
    warning: "border-yellow-500 bg-yellow-500/10 text-yellow-300",
    info: "border-ink/30 bg-ink/5 text-ink",
  };
  return (
    <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
      className={`fixed top-4 right-4 z-50 max-w-sm w-full p-4 rounded-xl border-l-4 bg-surface ${colors[type]}`}>
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">{message}</p>
        <button onClick={onClose} className="ml-3 text-ink/40 hover:text-ink">✕</button>
      </div>
    </motion.div>
  );
};

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const makeId = () => crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const showToast = (message, type = "success", duration = 4000) => {
    const id = makeId();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) setTimeout(() => removeToast(id), duration);
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));
  return { toasts, showToast, removeToast };
};

export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => setIsClient(true), []);

  const fetchGames = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/games-with-purchases", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch games");
      const data = await res.json();
      setGames(data);
      showToast(`Loaded ${data.length} games successfully`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to load games", "error");
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchGames(); }, []);

  useEffect(() => {
    const needle = searchTerm.toLowerCase();
    setFilteredGames(games.filter((g) =>
      [g.booking_code, g.game_type, g.status, g.total_odds].filter(Boolean)
        .some((val) => val.toString().toLowerCase().includes(needle))));
  }, [searchTerm, games]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-bg p-6">
        <div className="animate-pulse space-y-6 max-w-6xl mx-auto">
          <div className="h-8 bg-surface rounded w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-surface rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-6">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-ink">Game Management</h1>
          <p className="text-ink/50 text-sm">Manage uploaded betting games</p>
        </div>

        <div className="max-w-md mx-auto">
          <input type="text" placeholder="Search games…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-[48px] px-4 rounded-xl border border-ink/10 bg-surface text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-accent/40" />
        </div>

        <GameForm onGameAdded={fetchGames} showToast={showToast} />

        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-ink/60 mt-6">
          <span>Showing {filteredGames.length} of {games.length} games</span>
          {isLoading && (
            <div className="flex items-center space-x-2 text-accent">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent" />
              <span>Loading games…</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-56 bg-surface rounded-2xl animate-pulse" />)}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-16 text-ink/50">
            <h3 className="text-lg font-medium mb-1">No games found</h3>
            <p className="text-sm">Try adding a game or adjust the search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} onStatusChange={fetchGames} onDelete={fetchGames} showToast={showToast} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
