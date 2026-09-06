"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const normalizeMatchStatus = (status) => {
  if (!status) return "Pending";
  const s = String(status).toLowerCase();
  if (s === "won") return "Won";
  if (s === "lost") return "Lost";
  return "Pending";
};

export default function GameCard({ game, onStatusChange, onDelete, showToast, archivedMode = false }) {
  const [editing, setEditing] = useState(false);
  const [matches, setMatches] = useState(() =>
    (game.match_data || []).map((m) => ({ ...m, status: normalizeMatchStatus(m.status) })));
  const [originalMatches, setOriginalMatches] = useState(() =>
    (game.match_data || []).map((m) => ({ ...m, status: normalizeMatchStatus(m.status) })));
  const [totalOdds, setTotalOdds] = useState(game.total_odds || 0);
  const [price, setPrice] = useState(game.price || 0);
  const [gameType, setGameType] = useState(game.game_type || "free");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mainStatus, setMainStatus] = useState(game.status || "active");
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);

  useEffect(() => { setIsPurchased((game.purchases || 0) > 0); }, [game.purchases, game.status]);

  const gameTypes = [
    { label: "Free", value: "free" }, { label: "VIP", value: "vip" },
    { label: "Correct Score", value: "correct score" }, { label: "Custom VIP", value: "custom vip" },
    { label: "Custom Correct Score", value: "custom correct score" }, { label: "Recovery", value: "recovery" },
  ];

  useEffect(() => {
    if (!editing) {
      const normalized = (game.match_data || []).map((m) => ({ ...m, status: normalizeMatchStatus(m.status) }));
      setMatches(normalized); setOriginalMatches(normalized);
      setTotalOdds(game.total_odds || 0); setPrice(game.price || 0);
      setGameType(game.game_type || "free"); setMainStatus(game.status || "active");
    }
  }, [game, editing]);

  const handleMatchStatusChange = (index, newStatus) => {
    if (archivedMode) return;
    setMatches(matches.map((m, i) => (i === index ? { ...m, status: newStatus } : m)));
  };

  const confirmArchiveToggle = async () => {
    setArchiving(true);
    try {
      const newStatus = mainStatus === "archived" ? "active" : "archived";
      const res = await fetch("/api/games/archive", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: game.id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMainStatus(newStatus);
      showToast?.(`Game ${newStatus === "archived" ? "archived" : "unarchived"} successfully!`, "success");
      onStatusChange?.();
    } catch (err) {
      showToast?.(`Operation failed: ${err.message}`, "error");
    } finally {
      setArchiving(false); setShowArchiveModal(false);
    }
  };

  const saveChanges = async () => {
    if (archivedMode) return;
    setSaving(true);
    try {
      const formatted = matches.map((m) => ({ ...m, status: normalizeMatchStatus(m.status) }));
      const res = await fetch("/api/games/update", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: game.id, match_data: formatted, total_odds: Number(totalOdds), price: Number(price), game_type: gameType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast?.("Game updated successfully!", "success");
      setEditing(false);
      if (data.game) {
        const normalized = (data.game.match_data || []).map((m) => ({ ...m, status: normalizeMatchStatus(m.status) }));
        setMatches(normalized); setOriginalMatches(normalized);
      }
      onStatusChange?.();
    } catch (err) {
      console.error("Save error:", err);
      showToast?.("Failed to update game: " + err.message, "error");
    } finally { setSaving(false); }
  };

  const deleteGame = async () => {
    if (archivedMode) return;
    if (!confirm("Are you sure you want to delete this game?")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/games/delete", { method: "POST", body: JSON.stringify({ id: game.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast?.("Game deleted successfully!", "success");
      onDelete?.();
    } catch (err) {
      showToast?.("Delete failed: " + err.message, "error");
    } finally { setDeleting(false); }
  };

  const statusColor = (s) => {
    const st = normalizeMatchStatus(s);
    return st === "Won" ? "text-accent" : st === "Lost" ? "text-red-400" : "text-ink";
  };
  const statusIcon = (s) => {
    const st = normalizeMatchStatus(s);
    return st === "Won" ? "✓" : st === "Lost" ? "✕" : "…";
  };
  const statusCounts = matches.reduce((acc, m) => {
    const s = normalizeMatchStatus(m.status);
    return { ...acc, [s]: (acc[s] || 0) + 1 };
  }, { Won: 0, Lost: 0, Pending: 0 });
  const getMatchKey = (m, i) => `${m.homeTeam}-${m.awayTeam}-${i}-${m.eventId || ""}`.replace(/\s+/g, "-");

  if (mainStatus === "archived" && !archivedMode) return null;
  if (mainStatus !== "archived" && archivedMode) return null;

  return (
    <>
      <motion.div layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-2xl overflow-hidden w-full max-w-md mx-auto bg-surface text-ink">
        {isPurchased && (
          <div className="absolute top-3 right-3 bg-accent text-bg text-xs px-2 py-1 rounded-full z-10 font-semibold">
            Purchased ({game.purchases || 0})
          </div>
        )}
        {mainStatus === "archived" && (
          <div className="absolute top-3 left-3 bg-ink/20 text-ink text-xs px-2 py-1 rounded-full z-10">Archived</div>
        )}

        <div className="p-4 border-b border-ink/5">
          {!editing || archivedMode ? (
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="inline-block px-3 py-1 bg-accent text-bg rounded-full text-xs font-bold mb-2">
                  {String(gameType).toUpperCase()}
                </div>
                <div className="text-sm opacity-90 truncate">Booking: {game.booking_code}</div>
                <div className="text-xs opacity-60 mt-1">Purchases: {game.purchases || 0}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-bold text-accent font-mono tabular-nums">₵{Number(price).toFixed(2)}</div>
                <div className="text-sm opacity-70 font-mono tabular-nums">Odds: {Number(totalOdds).toFixed(2)}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-ink/60 mb-1 block">Game Type</label>
                  <select value={gameType} onChange={(e) => setGameType(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm bg-surface2 text-ink border border-ink/10">
                    {gameTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-ink/60 mb-1 block">Price (₵)</label>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm bg-surface2 text-ink border border-ink/10" />
                </div>
                <div>
                  <label className="text-xs text-ink/60 mb-1 block">Total Odds</label>
                  <input type="number" step="0.01" value={totalOdds} onChange={(e) => setTotalOdds(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm bg-surface2 text-ink border border-ink/10" />
                </div>
              </div>
              <div>
                <label className="text-xs text-ink/60 mb-1 block">Booking Code</label>
                <input readOnly value={game.booking_code}
                  className="w-full rounded-lg px-3 py-2 text-sm bg-surface2 text-accent opacity-80 cursor-not-allowed" />
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 flex justify-between items-center border-b border-ink/5 bg-surface2">
          <div className="flex gap-4 text-sm font-mono tabular-nums">
            <span className="text-accent">✓ {statusCounts.Won}</span>
            <span className="text-red-400">✕ {statusCounts.Lost}</span>
            <span className="text-ink/60">… {statusCounts.Pending}</span>
          </div>

          {!archivedMode && !editing && (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowArchiveModal(true)} disabled={archiving}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-ink/15 text-ink/70 hover:bg-ink/5 disabled:opacity-60">
                {archiving ? "..." : "Archive"}
              </button>
              <button onClick={() => setEditing(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-accent text-bg">
                Edit
              </button>
            </div>
          )}
          {editing && !archivedMode && (
            <div className="flex gap-2">
              <button onClick={saveChanges} disabled={saving}
                className="px-4 py-2 rounded-lg bg-accent text-bg text-sm font-semibold disabled:opacity-60">
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={deleteGame} disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm font-medium disabled:opacity-60">
                {deleting ? "…" : "Delete"}
              </button>
              <button onClick={() => { setEditing(false); setMatches(originalMatches); }}
                className="px-4 py-2 rounded-lg text-ink/70 border border-ink/15 text-sm font-medium">
                Cancel
              </button>
            </div>
          )}
          {archivedMode && !editing && (
            <button onClick={() => setShowArchiveModal(true)} disabled={archiving}
              className="px-4 py-2 rounded-lg bg-accent text-bg text-sm font-semibold disabled:opacity-60">
              {archiving ? "..." : "Unarchive"}
            </button>
          )}
        </div>

        <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
          {matches.length === 0 && <p className="text-sm text-ink/50 text-center py-6">No match data found.</p>}
          {matches.map((m, i) => (
            <div key={getMatchKey(m, i)} className="flex justify-between items-start p-3 rounded-lg bg-surface2">
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-sm font-medium truncate">{m.homeTeam} vs {m.awayTeam}</p>
                {m.league && <p className="text-xs opacity-60 mt-1 truncate">{m.league}</p>}
                {m.odds && <p className="text-xs text-accent mt-1 font-mono tabular-nums">Odds: {m.odds}</p>}
              </div>
              <div className="flex-shrink-0">
                {archivedMode || !editing ? (
                  <span className={`text-lg ${statusColor(m.status)}`}>{statusIcon(m.status)}</span>
                ) : (
                  <select value={m.status} onChange={(e) => handleMatchStatusChange(i, e.target.value)}
                    className="px-3 py-1 rounded bg-bg text-ink text-sm border border-ink/10">
                    <option value="Pending">Pending</option><option value="Won">Won</option><option value="Lost">Lost</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 flex justify-between items-center border-t border-ink/5 bg-surface2">
          <span className="text-sm text-ink/50 font-mono tabular-nums">
            {game.created_at ? new Date(game.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Unknown date"}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
            mainStatus === "archived" ? "bg-ink/10 text-ink/60" : "bg-accent/15 text-accent"
          }`}>
            {mainStatus}
          </span>
        </div>
      </motion.div>

      <AnimatePresence>
        {showArchiveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-surface p-6 rounded-2xl text-ink w-full max-w-md">
              <h3 className="text-xl font-bold text-accent mb-3 text-center">
                {mainStatus === "archived" ? "Unarchive Game?" : "Archive Game?"}
              </h3>
              <p className="text-sm mb-6 text-center text-ink/70">
                {mainStatus === "archived"
                  ? "This game will be moved back to the active games section."
                  : "This game will be moved to the archive section."}
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setShowArchiveModal(false)}
                  className="px-6 py-3 text-sm border border-ink/15 text-ink rounded-xl font-medium">
                  Cancel
                </button>
                <button onClick={confirmArchiveToggle} disabled={archiving}
                  className="px-6 py-3 text-sm bg-accent text-bg rounded-xl font-bold disabled:opacity-60">
                  {archiving ? "Processing..." : mainStatus === "archived" ? "Confirm Unarchive" : "Confirm Archive"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
