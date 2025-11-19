"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function GameForm({ onGameAdded, showToast }) {
  const [bookingCode, setBookingCode] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gameType, setGameType] = useState("Free");
  const [totalOdds, setTotalOdds] = useState("");
  const [price, setPrice] = useState("");

  // Unique React keys
  const getMatchKey = (match, i) =>
    (match.eventId ||
      `${match.homeTeam}-${match.awayTeam}`.replace(/\s+/g, "-")) +
    "-" +
    i;

  // 1️⃣ Load matches from SportyBet API
  const handleLoad = async () => {
    if (!bookingCode.trim())
      return showToast?.("Enter booking code", "warning");

    setLoading(true);

    try {
      const res = await fetch(`/api/sportybet/${bookingCode}`);
      if (!res.ok) throw new Error("Failed to fetch booking");

      const data = await res.json();

      if (!data.matches?.length) {
        setMatches([]);
        setTotalOdds("");
        return showToast?.("No matches found", "error");
      }

      // Ensure correct shape + add pending status
      const editable = data.matches.map((m) => ({
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        odds: m.odds,
        league: m.league,
        eventId: m.eventId || null,
        status: "Pending",
      }));

      // Calculate odds safely
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

  // Normalize game types
  const normalizeType = (t) => {
    t = t.toLowerCase();

    if (t.includes("custom vip")) return "custom vip";
    if (t.includes("custom correct")) return "custom correct score";
    if (t.includes("correct score")) return "correct score";
    if (t.includes("recovery")) return "recovery";
    if (t.includes("vip")) return "vip";
    return "free";
  };

  // 2️⃣ Upload game using API
  const handleUpload = async () => {
    if (!bookingCode.trim())
      return showToast?.("Booking code required", "warning");
    if (!matches.length)
      return showToast?.("Load matches before uploading", "warning");
    if (!totalOdds || isNaN(totalOdds))
      return showToast?.("Invalid total odds", "warning");
    if (!price || isNaN(price)) return showToast?.("Enter a price", "warning");

    setUploading(true);

    try {
      const now = new Date().toISOString();
      const normalized = normalizeType(gameType);

      const payload = {
        booking_code: bookingCode.trim().toUpperCase(),
        game_type: normalized,
        game_name: `${normalized.toUpperCase()} - ${bookingCode}`,
        total_odds: Number(totalOdds),
        price: Number(price),
        status: "pending",
        match_data: matches,
        created_at: now,
        updated_at: now,
      };

      const res = await fetch("/api/games/upload", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      showToast?.("Game uploaded successfully!", "success");

      // Reset form
      setMatches([]);
      setBookingCode("");
      setPrice("");
      setTotalOdds("");
      setGameType("Free");

      onGameAdded?.();
    } catch (err) {
      console.error(err);
      showToast?.(`Upload error: ${err.message}`, "error");
    }

    setUploading(false);
  };

  // Update match status manually
  const handleStatusChange = (index, value) => {
    const updated = [...matches];
    updated[index].status = value;
    setMatches(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#142B6F] rounded-2xl shadow-lg border border-[#FFD601]/25 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-[#FFD601]/25 text-white">
        <h2 className="text-xl font-bold text-[#FFD601]">Upload New Game</h2>
        <p className="text-sm text-white/60">Add betting tips from SportyBet</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Booking Input */}
        <div>
          <label className="text-white text-sm font-semibold">
            SportyBet Booking Code
          </label>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <input
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value)}
              placeholder="Enter code..."
              className="flex-1 px-4 py-3 bg-[#1B2F7E] border border-[#FFD601]/40 rounded-xl text-white placeholder-white/50"
            />

            <motion.button
              onClick={handleLoad}
              disabled={loading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-[#FFD601] text-[#142B6F] font-semibold px-6 py-3 rounded-xl"
            >
              {loading ? "Loading..." : "Load Matches"}
            </motion.button>
          </div>
        </div>

        {/* Loaded Matches */}
        <AnimatePresence>
          {matches.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Game Settings */}
              <div className="p-4 rounded-xl bg-[#1B2F7E] border border-[#FFD601]/30 text-white">
                <h3 className="font-semibold text-[#FFD601] mb-3">
                  Game Settings
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm">Game Type</label>
                    <select
                      value={gameType}
                      onChange={(e) => setGameType(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-[#142B6F] border border-[#FFD601]/30 text-white"
                    >
                      <option>Free</option>
                      <option>VIP</option>
                      <option>Correct Score</option>
                      <option>Custom VIP</option>
                      <option>Custom Correct Score</option>
                      <option>Recovery</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm">Total Odds</label>
                    <input
                      type="number"
                      min="0"
                      value={totalOdds}
                      onChange={(e) => setTotalOdds(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-[#142B6F] border border-[#FFD601]/30 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm">Price (₵)</label>
                    <input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-[#142B6F] border border-[#FFD601]/30 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Matches */}
              <div className="text-white">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Matches ({matches.length})</h3>

                  <span className="px-3 py-1 bg-[#FFD601] text-[#142B6F] rounded-full font-semibold">
                    Total Odds: {totalOdds}
                  </span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {matches.map((match, i) => (
                    <div
                      key={getMatchKey(match, i)}
                      className="p-4 rounded-xl bg-[#142B6F] border border-[#FFD601]/25"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {match.homeTeam} vs {match.awayTeam}
                          </p>
                          {match.league && (
                            <p className="text-xs text-white/60">
                              {match.league}
                            </p>
                          )}
                          <p className="text-xs text-[#FFD601] font-medium">
                            Odds: {match.odds}
                          </p>
                        </div>

                        <select
                          value={match.status}
                          onChange={(e) =>
                            handleStatusChange(i, e.target.value)
                          }
                          className="px-3 py-2 bg-[#1B2F7E] border border-[#FFD601]/30 rounded-lg text-white text-sm"
                        >
                          <option>Pending</option>
                          <option>Won</option>
                          <option>Lost</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Button */}
              <motion.button
                onClick={handleUpload}
                disabled={uploading}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl bg-[#FFD601] text-[#142B6F] font-bold disabled:opacity-50"
              >
                {uploading ? "Uploading game…" : "Upload Game"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
