// components/games/GameCard.jsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAVY = "#142B6F";
const GOLD = "#FFD601";

// Helper function to normalize match status
const normalizeMatchStatus = (status) => {
  if (!status) return "Pending";
  const statusStr = String(status).toLowerCase();
  if (statusStr === "won") return "Won";
  if (statusStr === "lost") return "Lost";
  return "Pending";
};

export default function GameCard({
  game,
  onStatusChange,
  onDelete,
  showToast,
  archivedMode = false,
}) {
  const [editing, setEditing] = useState(false);

  // Initialize matches with normalized status
  const [matches, setMatches] = useState(() =>
    (game.match_data || []).map((match) => ({
      ...match,
      status: normalizeMatchStatus(match.status),
    }))
  );

  const [originalMatches, setOriginalMatches] = useState(() =>
    (game.match_data || []).map((match) => ({
      ...match,
      status: normalizeMatchStatus(match.status),
    }))
  );

  const [totalOdds, setTotalOdds] = useState(game.total_odds || 0);
  const [price, setPrice] = useState(game.price || 0);
  const [gameType, setGameType] = useState(game.game_type || "free");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mainStatus, setMainStatus] = useState(game.status || "active");

  // Archive states - SEPARATE from editing
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Purchase flag
  const [isPurchased, setIsPurchased] = useState(false);

  useEffect(() => {
    setIsPurchased((game.purchases || 0) > 0);
  }, [game.purchases, game.status]);

  // Game type options
  const gameTypes = [
    { label: "Free", value: "free" },
    { label: "VIP", value: "vip" },
    { label: "Correct Score", value: "correct score" },
    { label: "Custom VIP", value: "custom vip" },
    { label: "Custom Correct Score", value: "custom correct score" },
    { label: "Recovery", value: "recovery" },
  ];

  // Sync with game prop changes
  useEffect(() => {
    if (!editing) {
      const normalizedMatches = (game.match_data || []).map((match) => ({
        ...match,
        status: normalizeMatchStatus(match.status),
      }));
      setMatches(normalizedMatches);
      setOriginalMatches(normalizedMatches);
      setTotalOdds(game.total_odds || 0);
      setPrice(game.price || 0);
      setGameType(game.game_type || "free");
      setMainStatus(game.status || "active");
    }
  }, [game, editing]);

  // Handle match status changes
  const handleMatchStatusChange = (index, newStatus) => {
    if (archivedMode) return;

    const updated = matches.map((m, i) =>
      i === index ? { ...m, status: newStatus } : m
    );
    setMatches(updated);
  };

  // Archive/Unarchive function
  const handleArchiveToggle = () => {
    setShowArchiveModal(true);
  };

  // Confirm archive/unarchive
  const confirmArchiveToggle = async () => {
    setArchiving(true);
    try {
      const newStatus = mainStatus === "archived" ? "active" : "archived";

      const res = await fetch("/api/games/archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: game.id,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMainStatus(newStatus);

      const action = newStatus === "archived" ? "archived" : "unarchived";
      showToast?.(`Game ${action} successfully!`, "success");

      // Call onStatusChange to refresh the parent component's game list
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err) {
      showToast?.(`Operation failed: ${err.message}`, "error");
    } finally {
      setArchiving(false);
      setShowArchiveModal(false);
    }
  };

  const cancelArchiveToggle = () => {
    setShowArchiveModal(false);
  };

  // Save with proper data formatting
  const saveChanges = async () => {
    if (archivedMode) return;

    setSaving(true);
    try {
      // Ensure all match statuses are properly formatted
      const formattedMatches = matches.map((match) => ({
        ...match,
        status: normalizeMatchStatus(match.status),
      }));

      const res = await fetch("/api/games/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: game.id,
          match_data: formattedMatches,
          total_odds: Number(totalOdds),
          price: Number(price),
          game_type: gameType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast?.("Game updated successfully!", "success");
      setEditing(false);

      // Update local state with the response data
      if (data.game) {
        const normalizedMatches = (data.game.match_data || []).map((match) => ({
          ...match,
          status: normalizeMatchStatus(match.status),
        }));
        setMatches(normalizedMatches);
        setOriginalMatches(normalizedMatches);
      }

      onStatusChange?.();
    } catch (err) {
      console.error("Save error:", err);
      showToast?.("Failed to update game: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Delete game
  const deleteGame = async () => {
    if (archivedMode) return;
    if (!confirm("Are you sure you want to delete this game?")) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/games/delete", {
        method: "POST",
        body: JSON.stringify({ id: game.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast?.("Game deleted successfully!", "success");
      onDelete?.();
    } catch (err) {
      showToast?.("Delete failed: " + err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const statusColor = (s) => {
    const status = normalizeMatchStatus(s);
    return status === "Won"
      ? "text-green-400"
      : status === "Lost"
      ? "text-red-400"
      : "text-white";
  };

  const statusIcon = (s) => {
    const status = normalizeMatchStatus(s);
    return status === "Won" ? "✅" : status === "Lost" ? "❌" : "⏳";
  };

  const statusCounts = matches.reduce(
    (acc, m) => {
      const status = normalizeMatchStatus(m.status);
      return { ...acc, [status]: (acc[status] || 0) + 1 };
    },
    { Won: 0, Lost: 0, Pending: 0 }
  );

  const getMatchKey = (m, i) =>
    `${m.homeTeam}-${m.awayTeam}-${i}-${m.eventId || ""}`.replace(/\s+/g, "-");

  // Don't render if the card is archived and we're not in archived mode, or vice versa
  if (mainStatus === "archived" && !archivedMode) {
    return null;
  }

  if (mainStatus !== "archived" && archivedMode) {
    return null;
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-2xl shadow-lg border overflow-hidden w-full max-w-md mx-auto"
        style={{
          backgroundColor: NAVY,
          color: "#fff",
          borderColor: `${GOLD}33`,
        }}
      >
        {/* PURCHASE TAG */}
        {isPurchased && (
          <div className="absolute top-3 right-3 bg-green-600 text-white text-xs px-2 py-1 rounded z-10">
            Purchased ({game.purchases || 0})
          </div>
        )}

        {/* ARCHIVED BANNER */}
        {mainStatus === "archived" && (
          <div className="absolute top-3 left-3 bg-purple-600 text-white text-xs px-2 py-1 rounded z-10">
            Archived
          </div>
        )}

        {/* HEADER SECTION */}
        <div className="p-4 border-b" style={{ borderColor: `${GOLD}33` }}>
          {!editing || archivedMode ? (
            // DISPLAY MODE
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="inline-block px-3 py-1 bg-[#FFD601] text-[#142B6F] rounded-full text-xs font-bold mb-2">
                  {String(gameType).toUpperCase()}
                </div>

                <div className="text-sm opacity-90 truncate">
                  Booking: {game.booking_code}
                </div>

                <div className="text-xs opacity-70 mt-1">
                  Purchases: {game.purchases || 0}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-xl font-bold" style={{ color: GOLD }}>
                  ₵{Number(price).toFixed(2)}
                </div>
                <div className="text-sm opacity-80">
                  Odds: {Number(totalOdds).toFixed(2)}
                </div>
              </div>
            </div>
          ) : (
            // EDITING MODE - HEADER
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-white/70 mb-1 block">
                    Game Type
                  </label>
                  <select
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm bg-[#1B2F7E] text-white border border-[#FFD601]/60 focus:border-[#FFD601] focus:outline-none"
                  >
                    {gameTypes.map((t) => (
                      <option
                        key={t.value}
                        value={t.value}
                        className="text-black"
                      >
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/70 mb-1 block">
                    Price (₵)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm bg-[#1B2F7E] text-white border border-[#FFD601]/60 focus:border-[#FFD601] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/70 mb-1 block">
                    Total Odds
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalOdds}
                    onChange={(e) => setTotalOdds(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm bg-[#1B2F7E] text-white border border-[#FFD601]/60 focus:border-[#FFD601] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/70 mb-1 block">
                  Booking Code
                </label>
                <input
                  readOnly
                  value={game.booking_code}
                  className="w-full rounded-lg px-3 py-2 text-sm bg-[#1A2F7A] text-[#FFD601] border border-[#FFD601]/40 opacity-80 cursor-not-allowed"
                />
              </div>
            </div>
          )}
        </div>

        {/* STATUS BAR */}
        <div
          className="px-4 py-3 flex justify-between items-center border-b"
          style={{ borderColor: `${GOLD}22`, backgroundColor: "#1A308D" }}
        >
          <div className="flex gap-4 text-sm">
            <span className="text-green-400 flex items-center gap-1">
              ✅ {statusCounts.Won}
            </span>
            <span className="text-red-400 flex items-center gap-1">
              ❌ {statusCounts.Lost}
            </span>
            <span className="text-white/80 flex items-center gap-1">
              ⏳ {statusCounts.Pending}
            </span>
          </div>

          {!archivedMode && !editing && (
            <div className="flex items-center gap-2">
              {/* ARCHIVE BUTTON - ALWAYS VISIBLE */}
              <button
                onClick={handleArchiveToggle}
                disabled={archiving}
                className="px-3 py-1 rounded text-xs font-medium border border-purple-400 text-purple-300 transition-colors hover:bg-purple-400/20 disabled:opacity-60"
              >
                {archiving ? "..." : "Archive"}
              </button>

              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1 rounded text-xs font-bold transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: GOLD, color: NAVY }}
              >
                Edit
              </button>
            </div>
          )}

          {editing && !archivedMode && (
            <div className="flex gap-2">
              <button
                onClick={saveChanges}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium disabled:opacity-60 transition-colors hover:bg-green-700"
              >
                {saving ? "Saving…" : "Save"}
              </button>

              <button
                onClick={deleteGame}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-60 transition-colors hover:bg-red-700"
              >
                {deleting ? "…" : "Delete"}
              </button>

              <button
                onClick={() => {
                  setEditing(false);
                  setMatches(originalMatches);
                }}
                className="px-4 py-2 rounded-lg text-[#FFD601] border border-[#FFD601] text-sm font-medium transition-colors hover:bg-[#FFD601]/10"
              >
                Cancel
              </button>
            </div>
          )}

          {archivedMode && !editing && (
            <button
              onClick={handleArchiveToggle}
              disabled={archiving}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium disabled:opacity-60 transition-colors hover:bg-green-700"
            >
              {archiving ? "..." : "Unarchive"}
            </button>
          )}
        </div>

        {/* MATCHES SECTION */}
        <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
          {matches.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-white/70">No match data found.</p>
            </div>
          )}

          {matches.map((m, i) => (
            <div
              key={getMatchKey(m, i)}
              className="flex justify-between items-start p-3 rounded-lg bg-[#1A308D] border transition-colors hover:bg-[#1E38A0]"
              style={{ borderColor: `${GOLD}22` }}
            >
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-sm font-medium truncate">
                  {m.homeTeam} vs {m.awayTeam}
                </p>
                {m.league && (
                  <p className="text-xs opacity-70 mt-1 truncate">{m.league}</p>
                )}
                {m.odds && (
                  <p className="text-xs text-[#FFD601] mt-1">Odds: {m.odds}</p>
                )}
              </div>

              <div className="flex-shrink-0">
                {archivedMode || !editing ? (
                  <span className={`text-lg ${statusColor(m.status)}`}>
                    {statusIcon(m.status)}
                  </span>
                ) : (
                  <select
                    value={m.status}
                    onChange={(e) => handleMatchStatusChange(i, e.target.value)}
                    className="px-3 py-1 rounded bg-[#142B6F] text-white text-sm border border-[#FFD601]/40 focus:border-[#FFD601] focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div
          className="px-4 py-3 flex justify-between items-center border-t"
          style={{ borderColor: `${GOLD}22`, backgroundColor: "#1A308D" }}
        >
          <span className="text-sm text-white/70">
            {game.created_at
              ? new Date(game.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "Unknown date"}
          </span>

          <span
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
              mainStatus === "archived"
                ? "bg-purple-500/20 text-purple-300"
                : mainStatus === "active"
                ? "bg-green-500/20 text-green-300"
                : "bg-gray-500/20 text-gray-300"
            }`}
          >
            {mainStatus}
          </span>
        </div>
      </motion.div>

      {/* ARCHIVE/UNARCHIVE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showArchiveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="bg-[#142B6F] p-6 rounded-2xl border border-[#FFD601]/40 text-white w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-[#FFD601] mb-3 text-center">
                {mainStatus === "archived"
                  ? "Unarchive Game?"
                  : "Archive Game?"}
              </h3>

              <p className="text-sm mb-6 text-center text-white/80">
                {mainStatus === "archived"
                  ? "This game will be moved back to the active games section. Are you sure you want to proceed?"
                  : "This game will be moved to the archive section. Are you sure you want to proceed?"}
              </p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={cancelArchiveToggle}
                  className="px-6 py-3 text-sm border-2 border-[#FFD601] text-[#FFD601] rounded-lg font-medium transition-colors hover:bg-[#FFD601]/10"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmArchiveToggle}
                  disabled={archiving}
                  className="px-6 py-3 text-sm bg-[#FFD601] text-[#142B6F] rounded-lg font-bold transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                >
                  {archiving
                    ? "Processing..."
                    : mainStatus === "archived"
                    ? "Confirm Unarchive"
                    : "Confirm Archive"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
