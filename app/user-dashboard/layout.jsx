"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

const NAVY = "#0B1A4A";
const GOLD = "#FFD601";

export default function UserDashboardLayout({ children }) {
  const [email, setEmail] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  const pathname = usePathname();
  const router = useRouter();

  // Load current user for header
  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!ignore) {
          setEmail(user?.email || "");
          setLoadingUser(false);
        }
      } catch (err) {
        console.error("Dashboard layout user load error:", err);
        if (!ignore) setLoadingUser(false);
      }
    }

    loadUser();
    return () => {
      ignore = true;
    };
  }, []);

  const navItems = [
    { label: "Profile", href: "/user-dashboard" },
    { label: "Purchases", href: "/user-dashboard/purchases" },
    { label: "Recovery", href: "/user-dashboard/recovery" },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: NAVY }}>
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[#1c2b66] bg-[#0B1A4A] text-white">
        <div className="px-6 py-6 border-b border-[#1c2b66]">
          <p className="text-xs uppercase tracking-wide text-[#AFC3FF]">
            User Dashboard
          </p>
          <p className="mt-2 font-extrabold text-xl">
            Geniuz <span style={{ color: GOLD }}>Prediction</span>
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition flex items-center justify-between
                  ${
                    active
                      ? "bg-[#142B6F] text-[#FFD601]"
                      : "text-[#E5EBFF] hover:bg-[#142B6F]/70 hover:text-white"
                  }`}
              >
                <span>{item.label}</span>
                {active && (
                  <span className="text-[10px] uppercase tracking-wide">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 pb-6">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500/90 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 px-4 md:px-10 py-6 overflow-x-hidden">
        {/* Top bar with email */}
        <div className="flex items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">
              My <span style={{ color: GOLD }}>Account</span>
            </h1>
            <p className="text-xs md:text-sm text-[#AFC3FF] mt-1">
              Manage your profile, purchases and recovery tickets in one place.
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-[#AFC3FF]">
              Signed in as
            </p>
            <p className="text-xs md:text-sm font-semibold text-white max-w-[220px] truncate">
              {loadingUser ? "Loading..." : email || "Unknown user"}
            </p>
          </div>
        </div>

        {/* Mobile nav pills */}
        <div className="md:hidden flex gap-2 mb-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex-1 text-xs py-2 rounded-full border transition ${
                  active
                    ? "bg-[#FFD601] text-[#0B1A4A] border-[#FFD601]"
                    : "border-[#3952a3] text-[#E5EBFF]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Animated content wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="min-h-[60vh]"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
