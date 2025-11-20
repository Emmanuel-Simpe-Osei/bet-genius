"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Save, User, Edit3 } from "lucide-react";

const GOLD = "#FFD601";
const NAVY = "#0B1A4D";

export default function UserDashboardProfilePage() {
  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, username, bio")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Profile load error:", error.message);
        }

        if (!ignore) {
          setProfile({
            full_name: data?.full_name || "",
            username: data?.username || "",
            bio: data?.bio || "",
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Profile load crash:", err);
        if (!ignore) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", user.id);

      if (error) {
        console.error("Profile save error:", error.message);
      } else {
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Profile save crash:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="h-8 bg-white/10 rounded-2xl w-48 mb-3 animate-pulse" />
            <div className="h-4 bg-white/5 rounded-xl w-64 animate-pulse" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0F1E4D] to-[#152862] border border-[#1c2b66]/50 rounded-3xl p-8 animate-pulse">
          <div className="space-y-6">
            <div>
              <div className="h-4 bg-white/10 rounded-lg w-24 mb-3" />
              <div className="h-12 bg-white/5 rounded-2xl" />
            </div>
            <div>
              <div className="h-4 bg-white/10 rounded-lg w-24 mb-3" />
              <div className="h-12 bg-white/5 rounded-2xl" />
            </div>
            <div>
              <div className="h-4 bg-white/10 rounded-lg w-24 mb-3" />
              <div className="h-24 bg-white/5 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-black text-white">
            Profile <span style={{ color: GOLD }}>Overview</span> 👤
          </h2>
          <p className="text-sm text-[#AFC3FF]/80 mt-2 max-w-2xl">
            Update your personal information. This will be used on receipts,
            emails, and across the platform.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsEditing(!isEditing)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold bg-white/5 text-white hover:bg-white/10 transition-all duration-200 border border-[#1c2b66]/50"
        >
          <Edit3 size={16} />
          {isEditing ? "Cancel Editing" : "Edit Profile"}
        </motion.button>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-[#0F1E4D] to-[#152862] border border-[#1c2b66]/50 rounded-3xl p-8 space-y-6 backdrop-blur-lg"
      >
        {/* Full Name */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#AFC3FF]">
            <User size={16} />
            Full Name
          </label>
          <input
            type="text"
            value={profile.full_name}
            onChange={handleChange("full_name")}
            disabled={!isEditing}
            className="w-full bg-[#081237]/80 border border-[#263777]/50 rounded-2xl px-4 py-3.5 text-white placeholder:text-[#6573aa] focus:outline-none focus:ring-2 focus:ring-[#FFD601]/50 focus:border-transparent transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="e.g. Emmanuel Simpe Osei"
          />
        </div>

        {/* Username */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#AFC3FF]">
            <span className="text-sm">👤</span>
            Username
          </label>
          <input
            type="text"
            value={profile.username}
            onChange={handleChange("username")}
            disabled={!isEditing}
            className="w-full bg-[#081237]/80 border border-[#263777]/50 rounded-2xl px-4 py-3.5 text-white placeholder:text-[#6573aa] focus:outline-none focus:ring-2 focus:ring-[#FFD601]/50 focus:border-transparent transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="e.g. SimpeGeniuz"
          />
        </div>

        {/* Bio */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#AFC3FF]">
            <span className="text-sm">📝</span>
            Short Bio
          </label>
          <textarea
            value={profile.bio}
            onChange={handleChange("bio")}
            disabled={!isEditing}
            rows={4}
            className="w-full bg-[#081237]/80 border border-[#263777]/50 rounded-2xl px-4 py-3.5 text-white placeholder:text-[#6573aa] focus:outline-none focus:ring-2 focus:ring-[#FFD601]/50 focus:border-transparent transition-all duration-200 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="Tell us a bit about yourself…"
          />
        </div>

        {/* Save Button */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-4"
          >
            <motion.button
              onClick={handleSave}
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm font-semibold bg-gradient-to-r from-[#FFD601] to-[#FFE769] text-[#0B1A4A] hover:shadow-lg hover:shadow-[#FFD601]/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {saving ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="block w-4 h-4 border-2 border-[#0B1A4A] border-t-transparent rounded-full"
                  />
                  Saving…
                </span>
              ) : (
                "Save Changes"
              )}
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-gradient-to-br from-[#0F1E4D] to-[#152862] border border-[#1c2b66]/50 rounded-2xl p-6 text-center">
          <div className="text-2xl font-black text-white">0</div>
          <div className="text-xs text-[#AFC3FF]/80 mt-1">Total Purchases</div>
        </div>
        <div className="bg-gradient-to-br from-[#0F1E4D] to-[#152862] border border-[#1c2b66]/50 rounded-2xl p-6 text-center">
          <div className="text-2xl font-black text-white">0</div>
          <div className="text-xs text-[#AFC3FF]/80 mt-1">Recovery Tickets</div>
        </div>
        <div className="bg-gradient-to-br from-[#0F1E4D] to-[#152862] border border-[#1c2b66]/50 rounded-2xl p-6 text-center">
          <div className="text-2xl font-black text-white">0</div>
          <div className="text-xs text-[#AFC3FF]/80 mt-1">VIP Games</div>
        </div>
      </motion.div>
    </div>
  );
}
