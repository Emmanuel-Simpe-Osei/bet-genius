"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import GameCard from "../games/GameCard";

function normalizeGame(raw) {
  let matchData = [];
  if (Array.isArray(raw.match_data)) matchData = raw.match_data;
  else if (typeof raw.match_data === "string") {
    try { const parsed = JSON.parse(raw.match_data); if (Array.isArray(parsed)) matchData = parsed; } catch {}
  }
  return { ...raw, match_data: matchData };
}

export default function ArchivedPage() {
  const [archivedGames, setArchivedGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState(null);

  const fetchArchivedGames = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from("games").select("*")
        .eq("status", "archived").order("archived_at", { ascending: false });
      if (error) throw error;
      setArchivedGames((data || []).map(normalizeGame));
    } catch (err) {
      console.error("Error fetching archived games:", err.message);
      setMessage("Failed to load archived games.");
    } finally { setIsLoading(false); }
  };

  const restoreGame = async (id) => {
    try {
      const res = await fetch("/api/games/restore", { method: "POST", body: JSON.stringify({ id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("Game restored successfully!");
      fetchArchivedGames();
    } catch (err) {
      setMessage("Failed to restore game.");
    }
  };

  const deleteGame = async (id) => {
    if (!confirm("This will permanently delete the game. Continue?")) return;
    try {
      const res = await fetch("/api/games/delete", { method: "POST", body: JSON.stringify({ id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("Game permanently deleted.");
      fetchArchivedGames();
    } catch (err) {
      setMessage("Failed to delete game.");
    }
  };

  useEffect(() => { fetchArchivedGames(); }, []);

  const filtered = archivedGames.filter((g) => {
    const needle = searchTerm.toLowerCase();
    return g.booking_code?.toLowerCase().includes(needle) || g.game_type?.toLowerCase().includes(needle);
  });

  return (
    <div className="min-h-screen bg-bg p-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="text-3xl font-bold text-ink">Archived Games</h1>
        <p className="text-ink/50 text-sm">View, restore or permanently delete archived games.</p>
      </motion.div>

      <div className="max-w-md mx-auto mb-6">
        <input type="text" placeholder="Search archived games..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full min-h-[48px] px-4 rounded-xl border border-ink/10 bg-surface text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-accent/40" />
      </div>

      {message && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-4 text-sm text-ink font-medium">
          {message}
        </motion.div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-surface rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 text-ink/50">No archived games found.</div>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filtered.map((game) => (
              <motion.div key={game.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center gap-4">
                <GameCard game={game} archivedMode={true} showToast={(msg) => setMessage(msg)} />
                <div className="flex items-center justify-between w-full px-3 gap-3">
                  <button onClick={() => restoreGame(game.id)}
                    className="flex-1 min-h-[40px] rounded-lg bg-accent/15 text-accent hover:bg-accent/25 transition">
                    Restore
                  </button>
                  <button onClick={() => deleteGame(game.id)}
                    className="flex-1 min-h-[40px] rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25 transition">
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
