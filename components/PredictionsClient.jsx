"use client";

import { useMemo, useState } from "react";
import NewPredictionCard from "@/components/NewPredictionCard";

export default function PredictionsClient({ games, isLoggedIn }) {
  const [dayFilter, setDayFilter] = useState("today");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredGames = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return games.filter((g) => {
      if (typeFilter !== "all") {
        const t = (g.displayType || "").toLowerCase();
        if (typeFilter === "free" && !t.includes("free")) return false;
        if (typeFilter === "vip" && !t.includes("vip")) return false;
        if (typeFilter === "correct" && !t.includes("correct")) return false;
      }
      if (!g.gameDate || dayFilter === "allDays") return true;
      const d = new Date(g.gameDate);
      d.setHours(0, 0, 0, 0);
      const diffDays = (d - today) / (1000 * 60 * 60 * 24);
      if (dayFilter === "today" && diffDays !== 0) return false;
      if (dayFilter === "yesterday" && diffDays !== -1) return false;
      if (dayFilter === "tomorrow" && diffDays !== 1) return false;
      return true;
    });
  }, [games, dayFilter, typeFilter]);

  const dayTabs = [
    { key: "yesterday", label: "Yesterday" }, { key: "today", label: "Today" },
    { key: "tomorrow", label: "Tomorrow" }, { key: "allDays", label: "All" },
  ];
  const typeTabs = [
    { key: "all", label: "All" }, { key: "free", label: "Free" },
    { key: "vip", label: "VIP" }, { key: "correct", label: "Correct Score" },
  ];

  const pillClass = (active) =>
    `min-h-[40px] px-4 rounded-full text-sm font-semibold transition-colors ${
      active ? "bg-accent text-bg" : "bg-surface2 text-ink/60 hover:text-ink"
    }`;

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 pt-4 sm:pt-6 pb-16">
      {/* Whole composition centered — header, filters, and cards all
          share one alignment, instead of left-aligned text next to a
          separately-centered card grid. */}
      <header className="mb-5 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Predictions</h1>
        <p className="text-sm text-ink/50 mt-1.5">
          Free tips are open to everyone. VIP and Correct Score unlock after payment.
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-2 mb-3">
        {dayTabs.map(({ key, label }) => (
          <button key={key} onClick={() => setDayFilter(key)} className={pillClass(dayFilter === key)}>{label}</button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {typeTabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTypeFilter(key)} className={pillClass(typeFilter === key)}>{label}</button>
        ))}
      </div>

      {filteredGames.length === 0 ? (
        <p className="text-center text-sm text-ink/50 py-20">No predictions available for the selected filters.</p>
      ) : (
        <div className="grid gap-8 justify-center" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 380px))" }}>
          {filteredGames.map((game) => (
            <NewPredictionCard key={game.id} game={game} isLoggedIn={isLoggedIn} />
          ))}
        </div>
      )}
    </div>
  );
}
