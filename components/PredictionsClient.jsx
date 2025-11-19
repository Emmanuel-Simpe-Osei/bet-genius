// components/PredictionsClient.jsx
"use client";

//--------------------------------------------------------------
// CLIENT WRAPPER
// - Renders hero ("Pick Your Predictions")
// - Handles day + type filters
// - Renders responsive 3-column grid of cards
//--------------------------------------------------------------

import { useMemo, useState } from "react";
import NewPredictionCard from "@/components/NewPredictionCard";

const GOLD = "#FFD601";

export default function PredictionsClient({ games, isLoggedIn }) {
  const [dayFilter, setDayFilter] = useState("today");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredGames = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return games.filter((g) => {
      // ---- Type filter ----
      if (typeFilter !== "all") {
        const t = (g.displayType || "").toLowerCase();
        if (typeFilter === "free" && !t.includes("free")) return false;
        if (typeFilter === "vip" && !t.includes("vip")) return false;
        if (typeFilter === "correct" && !t.includes("correct")) return false;
      }

      // ---- Day filter ----
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

  return (
    <div className="max-w-6xl mx-auto">
      {/* HERO TITLE */}
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
          Pick Your <span style={{ color: GOLD }}>Predictions</span>
        </h1>

        <p className="text-sm md:text-base text-[#AFC3FF]">
          Filter by day and type. <span style={{ color: GOLD }}>Free</span> tips
          are visible — <span style={{ color: GOLD }}>VIP</span> &{" "}
          <span style={{ color: GOLD }}>Correct Score</span> unlock after
          payment.
        </p>
      </header>

      {/* DAY FILTER ROW */}
      <div className="flex justify-center gap-3 mb-4 flex-wrap">
        {[
          { key: "yesterday", label: "Yesterday" },
          { key: "today", label: "Today" },
          { key: "tomorrow", label: "Tomorrow" },
          { key: "allDays", label: "All" },
        ].map(({ key, label }) => {
          const active = dayFilter === key;
          return (
            <button
              key={key}
              onClick={() => setDayFilter(key)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                active
                  ? "bg-white text-[#142B6F]"
                  : "border border-[#32457a] text-[#d0ddff] hover:bg-[#182550]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* TYPE FILTER ROW */}
      <div className="flex justify-center gap-3 mb-10 flex-wrap">
        {[
          { key: "all", label: "All" },
          { key: "free", label: "Free" },
          { key: "vip", label: "VIP" },
          { key: "correct", label: "Correct Score" },
        ].map(({ key, label }) => {
          const active = typeFilter === key;
          return (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                active
                  ? "bg-[#FFD601] text-[#142B6F]"
                  : "border border-[#32457a] text-[#d0ddff] hover:bg-[#182550]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* CARDS GRID */}
      {filteredGames.length === 0 ? (
        <p className="text-center text-sm text-[#AFC3FF]">
          No predictions available for the selected filters.
        </p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3 md:grid-cols-2 grid-cols-1">
          {filteredGames.map((game) => (
            <NewPredictionCard
              key={game.id}
              game={game}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}
    </div>
  );
}
