"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function NavbarClient() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // ---------------------------------------------
  // TRUE SESSION LISTENER (No localStorage hacks)
  // ---------------------------------------------
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);

      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        setRole(data?.role || "user");
      }
    };

    load();

    // Live session updates
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);

        if (newSession?.user) {
          supabase
            .from("profiles")
            .select("role")
            .eq("id", newSession.user.id)
            .maybeSingle()
            .then((res) => setRole(res.data?.role || "user"));
        } else {
          setRole(null);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // ---------------------------------------------
  // Logout
  // ---------------------------------------------
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ---------------------------------------------
  // Routes
  // ---------------------------------------------
  const dashboardRoute = role === "admin" ? "/dashboard" : "/user-dashboard";

  const links = [
    { href: "/", label: "Home" },
    { href: "/predictions", label: "Predictions" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="bg-[#142B6F]/95 backdrop-blur-md fixed top-0 w-full z-50 px-6 py-4 shadow-lg flex justify-between items-center"
    >
      {/* Logo */}
      <Link href="/" className="text-[#FFD601] text-xl font-bold">
        ⚽ Geniuz Prediction
      </Link>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-6 text-white font-medium">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}

        {session && (
          <Link href={dashboardRoute} className="">
            Dashboard
          </Link>
        )}

        {!session ? (
          <>
            <Link
              href="/login"
              className="bg-[#FFD601] text-[#142B6F] px-4 py-2 rounded-xl font-semibold"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="border border-[#FFD601] text-[#FFD601] px-4 py-2 rounded-xl font-semibold"
            >
              Sign Up
            </Link>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="bg-[#FFD601] text-[#142B6F] px-4 py-2 rounded-xl font-semibold"
          >
            Logout
          </button>
        )}
      </div>

      {/* Mobile: Hamburger */}
      <button
        className="md:hidden text-white text-3xl"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 bg-[#1B308D]/95 p-5 rounded-xl 
            border border-[#FFD601]/30 flex flex-col gap-3 md:hidden"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-white"
              >
                {link.label}
              </Link>
            ))}

            {session && (
              <Link
                href={dashboardRoute}
                className="text-[#FFD601]"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}

            {!session ? (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-[#FFD601]"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="text-[#FFD601]"
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
                className="bg-[#FFD601] text-[#142B6F] px-3 py-1 rounded-lg"
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
