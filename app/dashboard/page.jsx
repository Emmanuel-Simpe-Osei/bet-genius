"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function DashboardHome() {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0, totalGames: 0, activeGames: 0, archivedGames: 0,
    autoDeletedGames: 0, totalOrders: 0, recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError("");
        setLoading(true);
        // Session-based auth now — the route checks the admin's
        // logged-in session server-side, no client-supplied key needed.
        const response = await fetch("/api/admin/dashboard", { method: "GET" });
        if (!response.ok) throw new Error(`Failed to load dashboard: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setDashboardData({
          totalUsers: data.totalUsers ?? 0, totalGames: data.totalGames ?? 0,
          activeGames: data.activeGames ?? 0, archivedGames: data.archivedGames ?? 0,
          autoDeletedGames: data.autoDeletedGames ?? 0, totalOrders: data.totalOrders ?? 0,
          recentOrders: data.recentOrders ?? [],
        });
      } catch (err) {
        console.error("Error loading dashboard:", err);
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const stats = [
    { title: "Total Users", value: dashboardData.totalUsers },
    { title: "Total Games", value: dashboardData.totalGames,
      sub: `${dashboardData.activeGames} active · ${dashboardData.archivedGames} archived` },
    { title: "Total Orders", value: dashboardData.totalOrders },
  ];

  const formatDate = (dateString) => new Date(dateString).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid": return "bg-accent/15 text-accent";
      case "pending_review": return "bg-yellow-500/15 text-yellow-300";
      default: return "bg-ink/10 text-ink/60";
    }
  };

  return (
    <div className="space-y-8 p-6">
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold text-ink mb-1">Overview</h1>
        {error ? (
          <p className="text-red-300 text-sm">{error}</p>
        ) : (
          <p className="text-ink/50 text-sm">{loading ? "Loading..." : "Here's what's happening today."}</p>
        )}
      </motion.div>

      {/* At-a-glance strip — one wide bar, real numbers, no icon-per-card filler */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-ink/10 bg-surface rounded-2xl overflow-hidden">
        {stats.map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }} className="p-6">
            <p className="text-xs text-ink/50 uppercase tracking-wide mb-2">{stat.title}</p>
            <p className="text-4xl font-black text-accent font-mono tabular-nums">
              {loading ? "..." : stat.value.toLocaleString()}
            </p>
            {stat.sub && !loading && <p className="text-xs text-ink/40 mt-2">{stat.sub}</p>}
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-surface rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-ink/5">
          <h2 className="text-lg font-semibold text-ink">Recent Orders</h2>
          <p className="text-sm text-ink/50">Latest bookings and transactions</p>
        </div>

        <div className="p-4">
          {loading ? (
            <p className="text-center text-ink/40 py-10">Loading...</p>
          ) : dashboardData.recentOrders.length > 0 ? (
            <div className="space-y-2">
              {dashboardData.recentOrders.map((order, index) => (
                <motion.div key={order.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="bg-surface2 rounded-xl p-4 flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-ink mb-1">
                      {order.profiles?.full_name || order.profiles?.email || "Unknown User"}
                    </h3>
                    <p className="text-sm text-ink/50">
                      Ref: <span className="font-mono">{order.paystack_ref || "N/A"}</span>
                    </p>
                    <p className="text-sm text-accent font-mono tabular-nums mt-0.5">
                      {order.amount} {order.currency}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink/40 font-mono tabular-nums mb-1">{formatDate(order.created_at)}</p>
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-ink/40 py-12">No recent orders yet.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
