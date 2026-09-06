"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setError("");
        const response = await fetch("/api/users", { method: "GET" });
        if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setUsers(data.users || []);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err.message || "Failed to load users");
      } finally { setLoading(false); }
    };
    fetchUsers();
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  if (loading) {
    return (
      <div className="min-h-screen bg-bg p-6 text-ink flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg p-6 text-ink flex items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold text-ink mb-2">Error Loading Users</h2>
          <p className="text-ink/60 mb-4">{error}</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-accent text-bg rounded-full font-semibold">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-6 text-ink">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-ink">Registered Users</h1>
        <p className="text-ink/50 mt-2">View all user accounts on the platform</p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="px-4 py-1.5 bg-accent text-bg rounded-full text-sm font-bold">ADMIN VIEW</span>
          <span className="text-ink/50 text-sm">{users.length} total users</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {users.map((user, i) => (
          <motion.div key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }} className="rounded-2xl p-5 bg-surface relative">
            {user.role === "admin" && (
              <div className="absolute -top-2 -right-2 bg-accent text-bg rounded-full p-1.5 text-xs font-bold">★</div>
            )}
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-accent text-bg font-bold text-lg">
                {(user.full_name || user.email || "U")[0].toUpperCase()}
              </div>
              <span className="text-xs text-ink/40 font-mono">{user.id.slice(0, 8)}...</span>
            </div>
            <h3 className="text-lg font-semibold text-ink mb-1 truncate">{user.full_name || "Unnamed User"}</h3>
            <p className="text-sm text-ink/60 mb-2 truncate">{user.email}</p>
            <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
              user.role === "admin" ? "bg-accent text-bg" : "bg-ink/10 text-ink/70"
            }`}>
              {user.role?.toUpperCase() || "USER"}
            </span>
            <div className="pt-3 border-t border-ink/10 mt-3 text-xs text-ink/40 font-mono tabular-nums">
              Joined: {formatDate(user.created_at)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
