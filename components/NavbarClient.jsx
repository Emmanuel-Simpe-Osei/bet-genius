"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";

function TicketMark() {
  return (
    <svg width="30" height="24" viewBox="0 0 30 24" fill="none">
      <rect x="0.5" y="0.5" width="29" height="23" rx="5" className="fill-accent" />
      <circle cx="15" cy="0" r="4" className="fill-surface" />
      <circle cx="15" cy="24" r="4" className="fill-surface" />
      <line x1="15" y1="6" x2="15" y2="18" stroke="#04274F" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
  );
}

export default function NavbarClient() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
        setRole(data?.role || "user");
      }
    };
    load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        supabase.from("profiles").select("role").eq("id", newSession.user.id).maybeSingle()
          .then((res) => setRole(res.data?.role || "user"));
      } else setRole(null);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  // Close the account dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (accountOpen && accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [accountOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const dashboardRoute = role === "admin" ? "/dashboard" : "/user-dashboard";
  const initial = (session?.user?.email || "U")[0].toUpperCase();

  const links = [
    { href: "/", label: "Home" },
    { href: "/predictions", label: "Predictions" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35 }}
      className="sticky top-0 w-full z-50 bg-surface/85 backdrop-blur-xl border-b border-ink/5 shadow-lg shadow-black/20">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 sm:h-[68px] flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <TicketMark />
          <span className="text-ink text-base sm:text-lg font-bold tracking-tight">
            Geniuz<span className="text-accent">Prediction</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}
                className={`relative px-3.5 py-2 text-sm font-medium transition-colors ${active ? "text-ink" : "text-ink/60 hover:text-ink"}`}>
                {link.label}
                {active && (
                  <motion.div layoutId="nav-underline" className="absolute left-3.5 right-3.5 -bottom-[21px] h-[2px] bg-accent rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                )}
              </Link>
            );
          })}

          <div className="w-px h-6 bg-ink/10 mx-3" />

          {!session ? (
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-sm font-semibold text-ink/70 hover:text-ink transition-colors">Log in</Link>
              <Link href="/signup"
                className="min-h-[40px] flex items-center bg-accent text-bg px-5 rounded-full text-sm font-bold hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition-all">
                Sign up
              </Link>
            </div>
          ) : (
            <div className="relative" ref={accountRef}>
              <button onClick={() => setAccountOpen((v) => !v)}
                className="w-10 h-10 rounded-full bg-accent text-bg flex items-center justify-center font-bold text-sm hover:brightness-110 transition">
                {initial}
              </button>

              <AnimatePresence>
                {accountOpen && (
                  <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-surface rounded-xl shadow-xl shadow-black/30 border border-ink/10 overflow-hidden">
                    <Link href={dashboardRoute} onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-ink hover:bg-ink/5 transition-colors">
                      <LayoutDashboard size={16} /> Dashboard
                    </Link>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-300 hover:bg-red-500/10 transition-colors">
                      <LogOut size={16} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <button className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-ink"
          onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-surface/95 backdrop-blur-xl border-t border-ink/5 flex flex-col p-4 gap-1 shadow-xl shadow-black/30">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                className="min-h-[48px] flex items-center px-4 rounded-xl text-ink hover:bg-ink/5 transition-colors">
                {link.label}
              </Link>
            ))}
            {session && (
              <Link href={dashboardRoute} onClick={() => setMenuOpen(false)}
                className="min-h-[48px] flex items-center gap-2 px-4 rounded-xl text-accent hover:bg-ink/5 transition-colors">
                <LayoutDashboard size={18} /> Dashboard
              </Link>
            )}
            <div className="border-t border-ink/10 my-2" />
            {!session ? (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="min-h-[48px] flex items-center px-4 rounded-xl text-ink hover:bg-ink/5 transition-colors">
                  Log in
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="min-h-[48px] flex items-center justify-center bg-accent text-bg rounded-full font-bold">
                  Sign up
                </Link>
              </>
            ) : (
              <button onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="min-h-[48px] flex items-center justify-center gap-2 border border-ink/15 rounded-xl text-ink">
                <LogOut size={18} /> Logout
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
