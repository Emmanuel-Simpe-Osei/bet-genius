"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export default function SettingsPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProfiles(data || []);
      } catch (e) {
        console.error("⚠️ Fetch profiles error:", e);
        setMessage("❌ Failed to load profiles. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  const refreshProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setProfiles(data || []);
  };

  const handlePasswordChange = async () => {
    if (!newPassword) return alert("Please enter a new password.");

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      setMessage("✅ Password updated successfully!");
      setNewPassword("");
    } catch (err) {
      setMessage("❌ Failed to update password: " + err.message);
    }
  };

  // 👑 Promote a user to admin — now via the secured server route
  const handleAddAdmin = async () => {
    if (!newAdminEmail) return alert("Please enter a user's email address");

    try {
      const res = await fetch("/api/admin/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminEmail.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("❌ " + (data.error || "Promotion failed."));
        return;
      }

      setMessage(`✅ ${data.message || "User promoted to admin!"}`);
      setNewAdminEmail("");
      await refreshProfiles();
    } catch (err) {
      console.error("⚠️ Promote admin error:", err);
      setMessage("❌ Failed to promote user: " + err.message);
    }
  };

  // 🔴 Delete a user entirely — profile + login, via the secured server route
  const handleDeleteUser = async (id) => {
    if (!confirm("This permanently deletes the user's profile and login. Continue?"))
      return;

    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage("❌ " + (data.error || "Failed to delete user"));
        return;
      }

      setProfiles((prev) => prev.filter((u) => u.id !== id));
      setMessage("🗑 User deleted successfully!");
    } catch (err) {
      setMessage("❌ Failed to delete user: " + err.message);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#142B6F] text-white">
        <div className="animate-spin h-8 w-8 border-4 border-[#FFD601] border-t-transparent rounded-full"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#142B6F] text-white p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-[#FFD601]">⚙️ Admin Settings</h1>
        <p className="text-white/70 mt-1">
          Manage admins, users, and passwords
        </p>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`text-center py-3 px-4 rounded-xl ${
            message.includes("✅")
              ? "bg-green-500/20 border border-green-500/30 text-green-200"
              : message.includes("🗑")
              ? "bg-yellow-500/20 border border-yellow-500/30 text-yellow-200"
              : "bg-red-500/20 border border-red-500/30 text-red-200"
          }`}
        >
          {message}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1B308D] p-6 rounded-2xl border border-[#FFD601]/30 shadow-lg"
      >
        <h2 className="text-xl font-semibold text-[#FFD601] mb-4">
          🔒 Change Your Password
        </h2>
        <div className="grid sm:grid-cols-[1fr_auto] gap-3">
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="px-3 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#FFD601]/40"
          />
          <button
            onClick={handlePasswordChange}
            className="bg-[#FFD601] text-[#142B6F] font-semibold rounded-lg px-4 py-2 hover:bg-yellow-400 transition"
          >
            Update
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1B308D] p-6 rounded-2xl border border-[#FFD601]/30 shadow-lg"
      >
        <h2 className="text-xl font-semibold text-[#FFD601] mb-4">
          👑 Promote User to Admin
        </h2>
        <div className="grid sm:grid-cols-[1fr_auto] gap-3">
          <input
            type="email"
            placeholder="Enter user email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="px-3 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#FFD601]/40"
          />
          <button
            onClick={handleAddAdmin}
            className="bg-[#FFD601] text-[#142B6F] font-semibold rounded-lg px-4 py-2 hover:bg-yellow-400 transition"
          >
            Promote
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-[#1B308D] p-6 rounded-2xl border border-[#FFD601]/30 shadow-lg"
      >
        <h2 className="text-xl font-semibold text-[#FFD601] mb-4">
          🗂 Manage Users
        </h2>

        {profiles.length === 0 ? (
          <p className="text-white/70">No users available.</p>
        ) : (
          <div className="space-y-3">
            {profiles.map((u) => (
              <div
                key={u.id}
                className="flex justify-between items-center bg-[#142B6F]/60 p-3 rounded-lg border border-[#FFD601]/10"
              >
                <div>
                  <p className="font-semibold">
                    {u.full_name || "Unnamed"}{" "}
                    {u.role === "admin" && (
                      <span className="text-[#FFD601] text-sm">(Admin)</span>
                    )}
                  </p>
                  <p className="text-sm text-white/70">{u.email}</p>
                </div>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="text-red-400 hover:text-red-500 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
