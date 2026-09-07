"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function getMatchKey(m, i) {
  return `${m.homeTeam}-${m.awayTeam}-${i}-${m.eventId || ""}`.replace(/\s+/g, "-");
}

export default function GameForm({ onGameAdded, showToast }) {
  const [bookingCode, setBookingCode] = useState("");
  const [matches, setMatches] = useState([]);
  const [gameType, setGameType] = useState("Free");
  const [totalOdds, setTotalOdds] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const normalizeType = (t) => {
    t = t.toLowerCase();
    if (t.includes("custom vip")) return "custom vip";
    if (t.includes("custom correct")) return "custom correct score";
    if (t.includes("correct score")) return "correct score";
    if (t.includes("recovery")) return "recovery";
    if (t.includes("vip")) return "vip";
    return "free";
  };

  const handleLoad = async () => {
    if (!bookingCode.trim()) return showToast?.("Enter a booking code", "warning");
    setLoading(true);
    try {
      const res = await fetch(`/api/sportybet/${bookingCode.trim()}`);
      const data = await res.json();
      if (!data || !data.matches) throw new Error("No matches found");

      const editable = data.matches.map((m) => ({ ...m, status: m.status || "Pending" }));
      const calc = editable.reduce((acc, m) => {
        const n = parseFloat(m.odds);
        return acc * (isNaN(n) ? 1 : n);
      }, 1);

      setMatches(editable);
      setTotalOdds(calc.toFixed(2));
      showToast?.("Matches loaded successfully", "success");
    } catch (err) {
      console.error(err);
      showToast?.("Error loading booking", "error");
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!bookingCode.trim()) return showToast?.("Booking code required", "warning");
    if (!matches.length) return showToast?.("Load matches before uploading", "warning");
    if (!totalOdds || isNaN(totalOdds)) return showToast?.("Invalid total odds", "warning");
    if (!price || isNaN(price)) return showToast?.("Enter a price", "warning");

    setUploading(true);
    try {
      const now = new Date().toISOString();
      const normalized = normalizeType(gameType);

      // IMPORTANT: game_name is a display label shown in places that
      // are NOT gated behind payment status (e.g. it used to be shown
      // unconditionally on a customer's own purchases page before
      // approval). It must NEVER contain the real booking_code — that
      // secret only ever goes in the booking_code column, which every
      // surface correctly checks before revealing. Use a random
      // public-safe reference instead, unrelated to the real code.
      const publicRef = Math.random().toString(36).slice(2, 8).toUpperCase();

      const payload = {
        booking_code: bookingCode.trim().toUpperCase(),
        game_type: normalized,
        game_name: `${normalized.toUpperCase()} - ${publicRef}`,
        total_odds: Number(totalOdds), price: Number(price),
        status: "pending", match_data: matches, created_at: now, updated_at: now,
      };
      const res = await fetch("/api/games/upload", { method: "POST", body: JSON.stringify(payload) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      showToast?.("Game uploaded successfully!", "success");
      setMatches([]); setBookingCode(""); setPrice(""); setTotalOdds(""); setGameType("Free");
      onGameAdded?.();
    } catch (err) {
      console.error(err);
      showToast?.(`Upload error: ${err.message}`, "error");
    }
    setUploading(false);
  };

  const handleStatusChange = (index, value) => {
    const updated = [...matches];
    updated[index].status = value;
    setMatches(updated);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-ink/5">
        <h2 className="text-xl font-bold text-accent">Upload New Game</h2>
        <p className="text-sm text-ink/50">Add betting tips from SportyBet</p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="text-ink text-sm font-semibold">Load Booking Code</label>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <input value={bookingCode} onChange={(e) => setBookingCode(e.target.value)} placeholder="Enter code..."
              className="flex-1 min-h-[48px] px-4 bg-surface2 border border-ink/10 rounded-xl text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-accent/40" />
            <motion.button onClick={handleLoad} disabled={loading} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
              className="min-h-[48px] bg-accent text-bg font-bold px-6 rounded-xl">
              {loading ? "Loading..." : "Load Matches"}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {matches.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="p-4 rounded-xl bg-surface2">
                <h3 className="font-semibold text-accent mb-3">Game Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-ink/60">Game Type</label>
                    <select value={gameType} onChange={(e) => setGameType(e.target.value)}
                      className="w-full mt-1 min-h-[44px] px-3 rounded-lg bg-bg border border-ink/10 text-ink">
                      <option>Free</option><option>VIP</option><option>Correct Score</option>
                      <option>Custom VIP</option><option>Custom Correct Score</option><option>Recovery</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-ink/60">Total Odds</label>
                    <input type="number" min="0" value={totalOdds} onChange={(e) => setTotalOdds(e.target.value)}
                      className="w-full mt-1 min-h-[44px] px-3 rounded-lg bg-bg border border-ink/10 text-ink" />
                  </div>
                  <div>
                    <label className="text-sm text-ink/60">Price (₵)</label>
                    <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
                      className="w-full mt-1 min-h-[44px] px-3 rounded-lg bg-bg border border-ink/10 text-ink" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-ink">Matches ({matches.length})</h3>
                  <span className="px-3 py-1 bg-accent text-bg rounded-full font-semibold text-sm font-mono tabular-nums">
                    Total Odds: {totalOdds}
                  </span>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {matches.map((match, i) => (
                    <div key={getMatchKey(match, i)} className="p-4 rounded-xl bg-surface2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-ink">{match.homeTeam} vs {match.awayTeam}</p>
                          {match.league && <p className="text-xs text-ink/50">{match.league}</p>}
                          <p className="text-xs text-accent font-medium font-mono tabular-nums">Odds: {match.odds}</p>
                        </div>
                        <select value={match.status} onChange={(e) => handleStatusChange(i, e.target.value)}
                          className="min-h-[40px] px-3 bg-bg border border-ink/10 rounded-lg text-ink text-sm">
                          <option>Pending</option><option>Won</option><option>Lost</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <motion.button onClick={handleUpload} disabled={uploading} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                className="w-full min-h-[48px] rounded-xl bg-accent text-bg font-bold disabled:opacity-50">
                {uploading ? "Uploading game…" : "Upload Game"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
