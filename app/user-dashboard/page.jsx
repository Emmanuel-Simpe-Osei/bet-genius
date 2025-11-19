"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

const GOLD = "#FFD601";
const NAVY = "#0B1A4A";

export default function UserDashboardProfilePage() {
  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load profile on mount
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
      }
    } catch (err) {
      console.error("Profile save crash:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-[#0F1E4D] border border-[#1c2b66] rounded-2xl p-6">
        <div className="h-5 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-4 bg-white/8 rounded w-1/2 mb-3" />
        <div className="h-4 bg-white/8 rounded w-2/3 mb-3" />
        <div className="h-24 bg-white/5 rounded mt-4" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            Profile <span style={{ color: GOLD }}>Overview</span>
          </h2>
          <p className="text-xs md:text-sm text-[#AFC3FF] mt-1">
            Update your basic info. This will be used on receipts and emails.
          </p>
        </div>
      </div>

      <div className="bg-[#0F1E4D] border border-[#1c2b66] rounded-2xl p-6 space-y-4">
        {/* Full name */}
        <div>
          <label className="block text-xs font-semibold text-[#AFC3FF] mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={profile.full_name}
            onChange={handleChange("full_name")}
            className="w-full bg-[#081237] border border-[#263777] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[#6573aa] focus:outline-none focus:ring-2 focus:ring-[#FFD601]/70"
            placeholder="e.g. Emmanuel Simpe Osei"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-[#AFC3FF] mb-1">
            Username
          </label>
          <input
            type="text"
            value={profile.username}
            onChange={handleChange("username")}
            className="w-full bg-[#081237] border border-[#263777] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[#6573aa] focus:outline-none focus:ring-2 focus:ring-[#FFD601]/70"
            placeholder="e.g. SimpeGeniuz"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-[#AFC3FF] mb-1">
            Short Bio
          </label>
          <textarea
            value={profile.bio}
            onChange={handleChange("bio")}
            rows={3}
            className="w-full bg-[#081237] border border-[#263777] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[#6573aa] focus:outline-none focus:ring-2 focus:ring-[#FFD601]/70 resize-none"
            placeholder="Tell us a bit about yourself…"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-semibold bg-[#FFD601] text-[#0B1A4A] hover:bg-yellow-400 transition disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </motion.div>
  );
}
