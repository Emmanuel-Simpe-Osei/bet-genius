"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY;

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setError("");

        const response = await fetch("/api/users", {
          method: "GET",
          headers: {
            "x-admin-key": ADMIN_KEY,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setUsers(data.users || []);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#142B6F] p-6 text-white flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="animate-spin h-12 w-12 border-4 border-[#FFD601] border-t-transparent rounded-full mb-4"></div>
          <p className="text-white/60">Loading users...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#142B6F] p-6 text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-[#FFD601] mb-2">
            Error Loading Users
          </h2>
          <p className="text-white/70 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#FFD601] text-[#142B6F] rounded-lg hover:bg-yellow-400"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#142B6F] p-6 text-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold text-[#FFD601]">Registered Users</h1>
        <p className="text-white/70 mt-2">
          View all user accounts on the platform
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-4 mt-4"
        >
          <span className="px-4 py-1 bg-[#FFD601] text-[#142B6F] rounded-full text-sm font-medium">
            ADMIN VIEW
          </span>
          <span className="text-white/60 text-sm">
            {users.length} total users
          </span>
        </motion.div>
      </motion.div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ scale: 1.03 }}
            className="rounded-2xl shadow-lg p-5 border border-[#FFD601]/30 bg-[#1B308D] relative"
          >
            {user.role === "admin" && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-[#142B6F] rounded-full p-1">
                <span className="text-xs font-bold">👑</span>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FFD601] text-[#142B6F] font-bold text-lg">
                {(user.full_name || user.email || "U")[0].toUpperCase()}
              </div>
              <span className="text-xs text-white/60 font-mono">
                {user.id.slice(0, 8)}...
              </span>
            </div>

            <h3 className="text-lg font-semibold text-[#FFD601] mb-1 truncate">
              {user.full_name || "Unnamed User"}
            </h3>

            <p className="text-sm text-white/80 mb-2 truncate">{user.email}</p>

            <span
              className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                user.role === "admin"
                  ? "bg-yellow-300 text-[#142B6F]"
                  : "bg-white/20 text-white"
              }`}
            >
              {user.role?.toUpperCase() || "USER"}
            </span>

            <div className="pt-3 border-t border-white/10 mt-3 text-xs text-white/60">
              <p>Joined: {formatDate(user.created_at)}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-8 text-center text-white/40 text-sm"
      >
        Administrator View • {users.length} users in system
      </motion.div>
    </div>
  );
}
