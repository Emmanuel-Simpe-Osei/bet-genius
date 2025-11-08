"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export default function ClientNavbarWrapper() {
  const [session, setSession] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // 🟡 Fetch Supabase session
  useEffect(() => {
    async function fetchSession() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    }
    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 🟣 Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.push("/login");
  };

  // 🟢 Detect clicks outside to close menu
  useEffect(() => {
    const handleOutsideClick = (e) => {
      const menu = document.querySelector("#mobile-menu");
      const button = document.querySelector("#menu-toggle-btn");
      if (
        menuOpen &&
        menu &&
        !menu.contains(e.target) &&
        !button.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen]);

  const isAdmin = session?.user?.email?.includes("admin");
  const dashboardLink = isAdmin ? "/dashboard" : "/user-dashboard";

  return (
    <nav className="bg-[#142B6F] text-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-[#FFD601]">
          Geniuz Prediction
        </Link>

        {/* Hamburger button (visible only on mobile) */}
        <button
          id="menu-toggle-btn"
          className="lg:hidden text-2xl focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-6">
          <Link href="/" className="hover:text-[#FFD601] transition-colors">
            Home
          </Link>
          <Link
            href="/predictions"
            className="hover:text-[#FFD601] transition-colors"
          >
            Predictions
          </Link>
          <Link
            href="/about"
            className="hover:text-[#FFD601] transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="hover:text-[#FFD601] transition-colors"
          >
            Contact
          </Link>

          {session ? (
            <>
              <Link
                href={dashboardLink}
                className="bg-[#FFD601] text-[#142B6F] px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="border border-[#FFD601] px-4 py-2 rounded-lg hover:bg-[#FFD601] hover:text-[#142B6F] transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="border border-[#FFD601] px-4 py-2 rounded-lg hover:bg-[#FFD601] hover:text-[#142B6F] transition"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-[#FFD601] text-[#142B6F] px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* --- MOBILE MENU --- */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Overlay background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Slide-out menu */}
            <motion.div
              id="mobile-menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
              className="fixed top-0 right-0 h-full w-3/4 sm:w-1/2 bg-[#142B6F] z-50 flex flex-col space-y-6 px-6 py-8 border-l border-white/10 shadow-2xl"
            >
              <h2 className="text-xl font-semibold text-[#FFD601] mb-2">
                Menu
              </h2>

              <Link
                href="/"
                className="hover:text-[#FFD601]"
                onClick={() => setMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/predictions"
                className="hover:text-[#FFD601]"
                onClick={() => setMenuOpen(false)}
              >
                Predictions
              </Link>
              <Link
                href="/about"
                className="hover:text-[#FFD601]"
                onClick={() => setMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="hover:text-[#FFD601]"
                onClick={() => setMenuOpen(false)}
              >
                Contact
              </Link>

              <div className="border-t border-white/10 pt-4 space-y-4">
                {session ? (
                  <>
                    <Link
                      href={dashboardLink}
                      onClick={() => setMenuOpen(false)}
                      className="block bg-[#FFD601] text-[#142B6F] px-4 py-2 rounded-lg text-center font-semibold hover:bg-yellow-400 transition"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full border border-[#FFD601] px-4 py-2 rounded-lg hover:bg-[#FFD601] hover:text-[#142B6F] transition"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block border border-[#FFD601] px-4 py-2 rounded-lg text-center hover:bg-[#FFD601] hover:text-[#142B6F] transition"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMenuOpen(false)}
                      className="block bg-[#FFD601] text-[#142B6F] px-4 py-2 rounded-lg text-center font-semibold hover:bg-yellow-400 transition"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
