"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  ShoppingBag,
  RefreshCw,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const NAVY = "#0B1A4A";
const GOLD = "#FFD601";

export default function UserDashboardLayout({ children }) {
  const [email, setEmail] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

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
    {
      label: "Profile",
      href: "/user-dashboard",
      icon: User,
      emoji: "👤",
    },
    {
      label: "Purchases",
      href: "/user-dashboard/purchases",
      icon: ShoppingBag,
      emoji: "🛒",
    },
    {
      label: "Recovery",
      href: "/user-dashboard/recovery",
      icon: RefreshCw,
      emoji: "🔄",
    },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div
      className="min-h-screen flex bg-gradient-to-br from-[#0B1A4A] to-[#152862]"
      style={{ backgroundColor: NAVY }}
    >
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-80 flex-col border-r border-[#1c2b66]/50 bg-gradient-to-b from-[#0B1A4A] to-[#0F1E4D] text-white">
        {/* Header */}
        <div className="px-6 py-8 border-b border-[#1c2b66]/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFD601] to-[#FFE769] flex items-center justify-center">
              <span className="text-lg">🎯</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#AFC3FF]/80 font-semibold">
                User Dashboard
              </p>
              <p className="mt-1 font-black text-2xl">
                Geniuz <span style={{ color: GOLD }}>Prediction</span>
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const IconComponent = item.icon;

            return (
              <motion.button
                key={item.href}
                onClick={() => router.push(item.href)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left px-4 py-4 rounded-2xl text-sm font-semibold transition-all duration-200 flex items-center gap-3 group relative overflow-hidden ${
                  active
                    ? "bg-gradient-to-r from-[#FFD601] to-[#FFE769] text-[#0B1A4A] shadow-lg shadow-[#FFD601]/20"
                    : "text-[#E5EBFF] hover:bg-white/5 hover:shadow-lg"
                }`}
              >
                <div
                  className={`p-2 rounded-xl ${
                    active ? "bg-[#0B1A4A]/20" : "bg-white/5"
                  }`}
                >
                  <span className="text-lg">{item.emoji}</span>
                </div>
                <span className="flex-1">{item.label}</span>
                {active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-[#0B1A4A]"
                  />
                )}
                <ChevronRight
                  size={16}
                  className={`transition-transform duration-200 ${
                    active
                      ? "text-[#0B1A4A] rotate-90"
                      : "text-[#AFC3FF] group-hover:translate-x-0.5"
                  }`}
                />
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#1c2b66]/50">
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-[#0B1A4A]/95 backdrop-blur-lg border-b border-[#1c2b66]/50 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Mobile Menu Button & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Menu size={20} className="text-white" />
              </button>

              <div>
                <h1 className="text-xl lg:text-2xl font-black text-white">
                  My <span style={{ color: GOLD }}>Account</span>
                </h1>
                <p className="text-xs text-[#AFC3FF]/80 hidden sm:block">
                  Manage your profile, purchases and recovery tickets
                </p>
              </div>
            </div>

            {/* Right - User Info & Mobile Logout */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] uppercase tracking-widest text-[#AFC3FF]/80">
                  Signed in as
                </p>
                <p className="text-sm font-semibold text-white max-w-[200px] truncate">
                  {loadingUser ? "Loading..." : email || "Unknown user"}
                </p>
              </div>

              {/* Mobile Logout Button */}
              <button
                onClick={handleLogout}
                className="lg:hidden p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Pills */}
        <div className="lg:hidden px-4 py-4 border-b border-[#1c2b66]/30 bg-[#0F1E4D]/50">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <motion.button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-[#FFD601] to-[#FFE769] text-[#0B1A4A] shadow-lg"
                      : "bg-white/5 text-[#E5EBFF] hover:bg-white/10"
                  }`}
                >
                  <span className="text-sm">{item.emoji}</span>
                  {item.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 lg:px-8 py-6 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="min-h-[60vh]"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30 }}
              className="lg:hidden fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-[#0B1A4A] to-[#0F1E4D] border-r border-[#1c2b66]/50 text-white z-50 flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-8 border-b border-[#1c2b66]/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFD601] to-[#FFE769] flex items-center justify-center">
                      <span className="text-lg">🎯</span>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[#AFC3FF]/80 font-semibold">
                        Menu
                      </p>
                      <p className="mt-1 font-black text-2xl">
                        Geniuz <span style={{ color: GOLD }}>Prediction</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeMobileMenu}
                    className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* User Info */}
              <div className="px-6 py-4 border-b border-[#1c2b66]/30">
                <p className="text-xs uppercase tracking-widest text-[#AFC3FF]/80 mb-2">
                  Signed in as
                </p>
                <p className="text-sm font-semibold text-white truncate">
                  {loadingUser ? "Loading..." : email || "Unknown user"}
                </p>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <motion.button
                      key={item.href}
                      onClick={() => {
                        router.push(item.href);
                        closeMobileMenu();
                      }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full text-left px-4 py-4 rounded-2xl text-sm font-semibold transition-all duration-200 flex items-center gap-3 ${
                        active
                          ? "bg-gradient-to-r from-[#FFD601] to-[#FFE769] text-[#0B1A4A] shadow-lg"
                          : "text-[#E5EBFF] hover:bg-white/5"
                      }`}
                    >
                      <span className="text-lg">{item.emoji}</span>
                      <span className="flex-1">{item.label}</span>
                      {active && (
                        <div className="w-2 h-2 rounded-full bg-[#0B1A4A]" />
                      )}
                    </motion.button>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="p-4 border-t border-[#1c2b66]/50">
                <button
                  onClick={handleLogout}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
