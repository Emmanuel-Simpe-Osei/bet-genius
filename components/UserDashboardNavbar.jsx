"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function UserDashboardNavbar() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full flex items-center justify-between px-6 py-4 border-b sticky top-0 z-40 backdrop-blur-md"
      style={{
        background: "rgba(20, 43, 111, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Left: Logo */}
      <Link href="/" className="text-lg font-bold text-[#FFD601]">
        Geniuz Prediction
      </Link>

      {/* Right: Buttons */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#FFD601] text-[#142B6F] hover:bg-yellow-400 transition"
        >
          Home
        </Link>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 text-white transition"
        >
          Logout
        </button>
      </div>
    </motion.header>
  );
}
