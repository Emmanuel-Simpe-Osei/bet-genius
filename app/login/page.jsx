"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [supabase] = useState(() => createSupabaseClient());
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles").select("role").eq("id", session.user.id).single();
        const role = profile?.role || "user";
        window.location.href = role === "admin" ? "/dashboard" : "/user-dashboard";
      }
    };
    checkAuth();
  }, [supabase]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });
      if (signInError) throw new Error(signInError.message);
      if (!data?.user) throw new Error("Login failed");

      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", data.user.id).single();
      const role = profile?.role || "user";
      localStorage.setItem("userRole", role);

      setTimeout(() => {
        window.location.href = role === "admin" ? "/dashboard" : "/user-dashboard";
      }, 100);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-surface/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-black/30 border border-ink/5"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-1 text-center">Welcome Back</h1>
        <p className="text-ink/50 text-sm text-center mb-8">Sign in to your account</p>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
            <input
              type="email" placeholder="Email address" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required disabled={loading}
              className="w-full min-h-[52px] bg-surface2 border border-ink/10 text-ink placeholder-ink/40 rounded-2xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
            <input
              type="password" placeholder="Password" value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required disabled={loading}
              className="w-full min-h-[52px] bg-surface2 border border-ink/10 text-ink placeholder-ink/40 rounded-2xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
            />
          </div>
          <motion.button
            whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={loading}
            className="w-full min-h-[52px] bg-accent text-bg font-bold rounded-full hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                Signing In...
              </>
            ) : "Sign In"}
          </motion.button>
        </form>

        <div className="text-center mt-6">
          <p className="text-ink/50 text-sm">New here?</p>
          <Link href="/signup" className="text-accent font-semibold hover:brightness-110 transition">
            Create Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
