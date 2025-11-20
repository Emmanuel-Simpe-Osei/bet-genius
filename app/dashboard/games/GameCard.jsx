// components/games/GameCard.jsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAVY = "#142B6F";
const GOLD = "#FFD601";

export default function GameCard({
  game,
  onStatusChange,
  onDelete,
  showToast,
  archivedMode = false,
}) {
  const [editing, setEditing] = useState(false);
  const [matches, setMatches] = useState(game.match_data || []);
  const [originalMatches, setOriginalMatches] = useState(game.match_data || []);
  const [totalOdds, setTotalOdds] = useState(game.total_odds || 0);
  const [price, setPrice] = useState(game.price || 0);
  const [gameType, setGameType] = useState(game.game_type || "free");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mainStatus, setMainStatus] = useState(game.status || "active");

  const [isPurchased, setIsPurchased] = useState(false);

  const [showArchiveModal, setShowArchiveModal] = useState(false);

  // ------------------------------------------------------------
  // NEW PURCHASE CHECK — Using purchase_count from API
  // ------------------------------------------------------------
  useEffect(() => {
    setIsPurchased((game.purchase_count || 0) > 0);
  }, [game.purchase_count]);

  const gameTypes = [
    { label: "Free", value: "free" },
    { label: "VIP", value: "vip" },
    { label: "Correct Score", value: "correct score" },
    { label: "Custom VIP", value: "custom vip" },
    { label: "Custom Correct Score", value: "custom correct score" },
    { label: "Recovery", value: "recovery" },
  ];

  // Save original matches so we can restore when cancelled
  useEffect(() => {
    if (editing && !archivedMode) {
      setOriginalMatches(JSON.parse(JSON.stringify(matches)));
    }
  }, [editing, archivedMode, matches]);

  const handleMatchStatusChange = (index, newStatus) => {
    if (archivedMode) return;

    const updated = matches.map((m, i) =>
      i === index ? { ...m, status: newStatus } : m
    );

    setMatches(updated);

    const allResolved =
      updated.length > 0 &&
      updated.every((m) => ["won", "lost"].includes(m.status?.toLowerCase?.()));

    const hasPending = updated.some(
      (m) => m.status?.toLowerCase?.() === "pending"
    );

    if (allResolved && !hasPending) {
      setShowArchiveModal(true);
    }
  };

  const confirmArchive = async () => {
    try {
      const res = await fetch("/api/games/archive", {
        method: "POST",
        body: JSON.stringify({ id: game.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMainStatus("archived");
      showToast?.("Game archived successfully!", "success");
      onStatusChange?.();
    } catch (err) {
      showToast?.("Archive failed: " + err.message, "error");
    } finally {
      setShowArchiveModal(false);
    }
  };

  const cancelArchive = () => {
    setMatches(originalMatches);
    showToast?.("Archive cancelled. Changes reverted.", "info");
    setShowArchiveModal(false);
  };

  const saveChanges = async () => {
    if (archivedMode) return;
    setSaving(true);
    try {
      const res = await fetch("/api/games/update", {
        method: "POST",
        body: JSON.stringify({
          id: game.id,
          match_data: matches,
          total_odds: Number(totalOdds),
          price: Number(price),
          game_type: gameType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast?.("Game updated", "success");
      setEditing(false);
      onStatusChange?.();
    } catch (err) {
      showToast?.("Failed: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteGame = async () => {
    if (archivedMode) return;
    if (!confirm("Delete this game?")) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/games/delete", {
        method: "POST",
        body: JSON.stringify({ id: game.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast?.("Game deleted", "success");
      onDelete?.();
    } catch (err) {
      showToast?.("Delete failed: " + err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const statusColor = (s) =>
    s === "Won"
      ? "text-green-400"
      : s === "Lost"
      ? "text-red-400"
      : "text-white";

  const statusIcon = (s) => (s === "Won" ? "✅" : s === "Lost" ? "❌" : "⏳");

  const statusCounts = matches.reduce(
    (acc, m) => ({ ...acc, [m.status]: (acc[m.status] || 0) + 1 }),
    { Won: 0, Lost: 0, Pending: 0 }
  );

  const getMatchKey = (m, i) =>
    `${m.homeTeam}-${m.awayTeam}-${i}`.replace(/\s+/g, "-");

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-2xl shadow-lg border"
        style={{
          backgroundColor: NAVY,
          color: "#fff",
          borderColor: `${GOLD}33`,
        }}
      >
        {/* PURCHASE TAG */}
        {isPurchased && (
          <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
            Purchased ({game.purchase_count || 0})
          </div>
        )}

        {/* HEADER */}
        <div className="p-4 border-b" style={{ borderColor: `${GOLD}33` }}>
          {!editing || archivedMode ? (
            <div className="flex justify-between items-start">
              <div>
                <div className="inline-block px-2 py-1 bg-[#FFD601] text-[#142B6F] rounded text-xs font-bold">
                  {String(gameType).toUpperCase()}
                </div>

                <div className="text-xs opacity-70 mt-1">
                  Booking: {game.booking_code}
                </div>

                <div className="text-[10px] opacity-60 mt-1">
                  Purchases: {game.purchase_count || 0}
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold" style={{ color: GOLD }}>
                  ₵{price}
                </div>
                <div className="text-xs opacity-70">Odds: {totalOdds}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <select
                value={gameType}
                onChange={(e) => setGameType(e.target.value)}
                className="rounded-lg px-3 py-2 text-xs bg-[#1B2F7E] text-white border border-[#FFD601]/60"
              >
                {gameTypes.map((t) => (
                  <option key={t.value} value={t.value} className="text-black">
                    {t.label}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="rounded-lg px-3 py-2 text-xs bg-[#1B2F7E] text-white border border-[#FFD601]/60"
              />

              <input
                type="number"
                value={totalOdds}
                onChange={(e) => setTotalOdds(e.target.value)}
                className="rounded-lg px-3 py-2 text-xs bg-[#1B2F7E] text-white border border-[#FFD601]/60"
              />

              <input
                readOnly
                value={game.booking_code}
                className="rounded-lg px-3 py-2 text-xs bg-[#1A2F7A] text-[#FFD601] border border-[#FFD601]/40 opacity-80"
              />
            </div>
          )}
        </div>

        {/* STATUS BAR */}
        <div
          className="px-4 py-2 flex justify-between text-xs border-b"
          style={{ borderColor: `${GOLD}22`, backgroundColor: "#1A308D" }}
        >
          <div className="flex gap-4">
            <span className="text-green-400">✅ {statusCounts.Won}</span>
            <span className="text-red-400">❌ {statusCounts.Lost}</span>
            <span>⏳ {statusCounts.Pending}</span>
          </div>

          {!archivedMode && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1 rounded text-xs font-bold"
              style={{ backgroundColor: GOLD, color: NAVY }}
            >
              Edit
            </button>
          )}

          {editing && !archivedMode && (
            <div className="flex gap-2">
              <button
                onClick={saveChanges}
                disabled={saving}
                className="px-3 py-1 rounded bg-green-600 text-white text-xs disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>

              <button
                onClick={deleteGame}
                disabled={deleting}
                className="px-3 py-1 rounded bg-red-600 text-white text-xs disabled:opacity-60"
              >
                {deleting ? "…" : "Delete"}
              </button>

              <button
                onClick={() => {
                  setEditing(false);
                  setMatches(originalMatches);
                }}
                className="px-3 py-1 rounded text-[#FFD601] border border-[#FFD601] text-xs"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* MATCHES LIST */}
        <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
          {matches.length === 0 && (
            <p className="text-xs text-white/70 text-center">
              No match data found.
            </p>
          )}

          {matches.map((m, i) => (
            <div
              key={getMatchKey(m, i)}
              className="flex justify-between items-center p-2 rounded bg-[#1A308D] border"
              style={{ borderColor: `${GOLD}22` }}
            >
              <div>
                <p className="text-sm font-medium">
                  {m.homeTeam} vs {m.awayTeam}
                </p>
                {m.league && <p className="text-xs opacity-70">{m.league}</p>}
              </div>

              {archivedMode || !editing ? (
                <span className={`text-lg ${statusColor(m.status)}`}>
                  {statusIcon(m.status)}
                </span>
              ) : (
                <select
                  value={m.status}
                  onChange={(e) => handleMatchStatusChange(i, e.target.value)}
                  className="px-2 py-1 rounded bg-[#142B6F] text-white text-xs border border-[#FFD601]/40"
                >
                  <option>Pending</option>
                  <option>Won</option>
                  <option>Lost</option>
                </select>
              )}
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div
          className="p-3 flex justify-between text-xs border-t"
          style={{ borderColor: `${GOLD}22` }}
        >
          <span>
            {game.created_at
              ? new Date(game.created_at).toLocaleDateString()
              : "Unknown date"}
          </span>
          <span className="px-2 py-1 rounded capitalize bg-white/10">
            {mainStatus ||
              game.status ||
              (archivedMode ? "archived" : "active")}
          </span>
        </div>
      </motion.div>

      {/* ARCHIVE MODAL */}
      {!archivedMode && (
        <AnimatePresence>
          {showArchiveModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.7 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.7 }}
                className="bg-[#142B6F] p-6 rounded-xl border border-[#FFD601]/40 text-white max-w-sm w-full"
              >
                <h3 className="text-lg font-bold text-[#FFD601] mb-3">
                  Archive Game?
                </h3>
                <p className="text-sm mb-6">
                  All matches are resolved. Do you want to move this game to the
                  archive?
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={cancelArchive}
                    className="px-4 py-2 text-sm border border-[#FFD601] text-[#FFD601] rounded"
                  >
                    No, cancel
                  </button>

                  <button
                    onClick={confirmArchive}
                    className="px-4 py-2 text-sm bg-[#FFD601] text-[#142B6F] rounded font-bold"
                  >
                    Yes, archive
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
