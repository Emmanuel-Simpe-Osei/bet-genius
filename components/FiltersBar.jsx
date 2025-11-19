"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function FiltersBar({
  activeType,
  setActiveType,
  activeDay,
  setActiveDay,
  selectedDate,
  setSelectedDate,
  hideCustom = true,
}) {
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  const typeTabs = hideCustom
    ? ["Free", "VIP", "Correct Score"]
    : ["Free", "VIP", "Correct Score", "Custom"];

  const dayTabs = ["Yesterday", "Today", "Tomorrow"];

  const selectDay = (day) => {
    setActiveDay(day);
    setSelectedDate(null);
  };

  const selectType = (type) => {
    if (type === "VIP") return setActiveType("VIP");
    if (type === "Correct Score") return setActiveType("Correct Score");
    return setActiveType(type);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setActiveDay("Custom"); // override day tabs
  };

  if (!mounted) {
    return (
      <div className="text-center text-white/50 py-4 animate-pulse">
        Loading filters...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* DAY FILTERS */}
      <div className="flex flex-wrap items-center gap-2 justify-center">
        {dayTabs.map((tab) => (
          <motion.button
            key={tab}
            whileTap={{ scale: 0.95 }}
            onClick={() => selectDay(tab)}
            className={`px-4 py-2 rounded-xl border transition-all duration-200 ${
              activeDay === tab
                ? "bg-[#FFD601] text-[#142B6F] border-[#FFD601] shadow-lg"
                : "bg-white/5 text-white/90 border-white/10 hover:bg-white/10"
            }`}
          >
            {tab}
          </motion.button>
        ))}

        {/* DATE PICKER (custom date mode) */}
        <motion.div
          whileTap={{ scale: 0.97 }}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-[6px] text-white cursor-pointer hover:bg-white/10"
        >
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="MM/dd/yyyy"
            placeholderText="Pick date"
            className="bg-transparent text-white outline-none w-full cursor-pointer"
            popperClassName="react-datepicker-popper"
            calendarClassName="!bg-white !text-black rounded-lg p-2 shadow-lg"
          />
        </motion.div>
      </div>

      {/* TYPE FILTERS */}
      <div className="flex flex-wrap items-center gap-2 justify-center">
        {typeTabs.map((tab) => (
          <motion.button
            key={tab}
            whileTap={{ scale: 0.95 }}
            onClick={() => selectType(tab)}
            className={`px-4 py-2 rounded-xl border transition-all duration-200 ${
              activeType === tab
                ? "bg-[#FFD601] text-[#142B6F] border-[#FFD601] shadow-lg"
                : "bg-white/5 text-white/90 border-white/10 hover:bg-white/10"
            }`}
          >
            {tab}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
