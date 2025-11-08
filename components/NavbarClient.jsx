"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

export default function NavbarClient() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // ✅ 1. Load cached role instantly (fixes delay bug)
  useEffect(() => {
    const cachedRole = localStorage.getItem("userRole");
    if (cachedRole) {
      console.log("💾 Cached role loaded instantly:", cachedRole);
      setRole(cachedRole);
    }

    const fetchSessionAndRole = async () => {
      console.log("🔍 Navbar: Fetching session...");
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          console.log("🚫 No session — logged out.");
          setUser(null);
          setRole(null);
          localStorage.removeItem("userRole");
          setLoading(false);
          return;
        }

        setUser(session.user);
        console.log("👤 Logged in:", session.user.email);

        // ✅ 2. Always confirm role with Supabase (but async)
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) throw error;
        if (data?.role) {
          console.log("✅ Role fetched:", data.role);
          setRole(data.role);
          localStorage.setItem("userRole", data.role);
        } else {
          console.warn("⚠️ No role found in profiles table.");
        }
      } catch (err) {
        console.error("🔥 Navbar fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndRole();
  }, []);

  // ✅ Logout clears everything
  const handleLogout = async () => {
    console.log("🚪 Logging out...");
    await supabase.auth.signOut();
    localStorage.removeItem("userRole");
    setUser(null);
    setRole(null);
    router.push("/login");
  };

  // ✅ 3. Always get correct dashboard route
  const getDashboardHref = () => {
    const cachedRole = role || localStorage.getItem("userRole");
    const href =
      cachedRole === "admin"
        ? "/dashboard"
        : cachedRole === "user"
        ? "/user-dashboard"
        : "/user-dashboard";
    console.log("🧭 Dashboard target:", href, "(role =", cachedRole, ")");
    return href;
  };

  // ✅ Public navigation links
  const publicLinks = [
    { label: "Home", href: "/" },
    { label: "Predictions", href: "/predictions" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  // ✅ Navbar style based on page
  const isDashboard =
    pathname.startsWith("/dashboard") || pathname.startsWith("/user-dashboard");

  const navbarStyle = isDashboard
    ? "bg-[#142B6F]"
    : "bg-[#142B6F]/90 backdrop-blur-md shadow-md";

  // ✅ Auto close mobile menu when clicking outside
  useEffect(() => {
    const closeMenu = (e) => {
      if (menuOpen && !e.target.closest(".mobile-menu")) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [menuOpen]);

  if (loading) {
    return (
      <div className="w-full h-14 fixed top-0 bg-[#142B6F] animate-pulse z-50" />
    );
  }

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`${navbarStyle} fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4`}
    >
      {/* 🔹 Logo */}
      <Link
        href="/"
        onClick={() => setMenuOpen(false)}
        className="text-[#FFD601] font-bold text-xl"
      >
        ⚽ Geniuz Prediction
      </Link>

      {/* 🔹 Desktop Links */}
      <div className="hidden md:flex items-center gap-6 text-white">
        {publicLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`hover:text-[#FFD601] ${
              pathname === link.href ? "text-[#FFD601]" : ""
            }`}
          >
            {link.label}
          </Link>
        ))}

        {/* Dashboard */}
        {user && (
          <Link
            href={getDashboardHref()}
            className={`hover:text-[#FFD601] ${
              pathname.startsWith("/dashboard") ||
              pathname.startsWith("/user-dashboard")
                ? "text-[#FFD601]"
                : ""
            }`}
          >
            Dashboard
          </Link>
        )}

        {/* Auth buttons */}
        {!user ? (
          <>
            <Link
              href="/login"
              className="bg-[#FFD601] text-[#142B6F] px-4 py-2 rounded-xl font-semibold hover:bg-yellow-400"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="border border-[#FFD601] text-[#FFD601] px-4 py-2 rounded-xl font-semibold hover:bg-[#FFD601] hover:text-[#142B6F]"
            >
              Sign Up
            </Link>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="bg-[#FFD601] text-[#142B6F] px-4 py-2 rounded-xl font-semibold hover:bg-yellow-400"
          >
            Logout
          </button>
        )}
      </div>

      {/* 🔹 Mobile Toggle */}
      <button
        className="md:hidden text-white text-2xl mobile-menu"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* 🔹 Mobile Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="absolute top-16 right-4 bg-[#1B308D]/95 border border-[#FFD601]/30 rounded-xl p-5 flex flex-col gap-3 md:hidden z-40 mobile-menu backdrop-blur-md"
          >
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`text-white hover:text-[#FFD601] ${
                  pathname === link.href ? "text-[#FFD601]" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user && (
              <Link
                href={getDashboardHref()}
                onClick={() => setMenuOpen(false)}
                className="text-[#FFD601] font-semibold"
              >
                Dashboard
              </Link>
            )}

            {!user ? (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-[#FFD601] font-semibold"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="text-[#FFD601] font-semibold"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="bg-[#FFD601] text-[#142B6F] px-4 py-2 rounded-xl font-semibold"
              >
                Logout
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
