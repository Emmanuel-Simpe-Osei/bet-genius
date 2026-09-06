"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { LayoutDashboard, Trophy, Archive, Users, Settings, Wallet, Home, LogOut, Menu, X } from "lucide-react";

export default function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => setIsMobileMenuOpen(false), [pathname]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push("/login"); return; }
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", session.user.id).maybeSingle();
      if (profile?.role !== "admin") router.push("/user-dashboard");
    };
    checkAdminAccess();
  }, [router]);

  const navItems = [
    { href: "/dashboard", label: "Overview", Icon: LayoutDashboard },
    { href: "/dashboard/games", label: "Games", Icon: Trophy },
    { href: "/dashboard/payments", label: "Payments", Icon: Wallet },
    { href: "/dashboard/archived", label: "Archived", Icon: Archive },
    { href: "/dashboard/users", label: "Users", Icon: Users },
    { href: "/dashboard/settings", label: "Settings", Icon: Settings },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        )}
      </AnimatePresence>

      <aside className={`fixed lg:sticky top-0 h-screen w-64 flex flex-col bg-surface/90 backdrop-blur-xl border-r border-ink/5 z-50 transition-transform duration-300 ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="p-6 border-b border-ink/5">
          <span className="text-lg font-bold text-ink">Geniuz<span className="text-accent">Admin</span></span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-accent text-bg" : "text-ink/70 hover:bg-ink/5 hover:text-ink"
                }`}>
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
          <Link href="/predictions"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ink/50 hover:bg-ink/5 hover:text-ink transition-colors mt-4 border-t border-ink/5 pt-4">
            <Home size={18} /> View Site
          </Link>
        </nav>

        <div className="p-3 border-t border-ink/5">
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-ink/10 text-ink/70 hover:bg-ink/5 hover:text-ink text-sm font-semibold transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-ink/5 p-4 flex items-center justify-between lg:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg bg-accent text-bg">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-semibold text-accent">
            {navItems.find((i) => i.href === pathname)?.label || "Dashboard"}
          </span>
          <div className="w-9 h-9 rounded-full bg-accent text-bg flex items-center justify-center font-bold text-sm">A</div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
