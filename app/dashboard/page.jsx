"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRoleGuard } from "@/hooks/useRoleGuard";

export default function DashboardHome() {
  // ✅ Still keep role guard to block non-admins at UI level
  useRoleGuard();

  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalGames: 0,
    activeGames: 0,
    archivedGames: 0,
    autoDeletedGames: 0,
    totalOrders: 0,
    recentOrders: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError("");
        setLoading(true);

        const response = await fetch("/api/admin/dashboard", {
          method: "GET",
          headers: {
            // ⚠️ This header is only checked on the server.
            // Make sure ADMIN_KEY in .env matches NEXT_PUBLIC_ADMIN_KEY.
            "x-admin-key": process.env.NEXT_PUBLIC_ADMIN_KEY || "",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load dashboard: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setDashboardData({
          totalUsers: data.totalUsers ?? 0,
          totalGames: data.totalGames ?? 0,
          activeGames: data.activeGames ?? 0,
          archivedGames: data.archivedGames ?? 0,
          autoDeletedGames: data.autoDeletedGames ?? 0,
          totalOrders: data.totalOrders ?? 0,
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
    {
      title: "Total Users",
      value: dashboardData.totalUsers,
      bg: "bg-[#142B6F]",
      color: "text-white",
      delay: 0.1,
    },
    {
      title: "Total Predictions (All Games)",
      value: dashboardData.totalGames,
      sub: `🟢 ${dashboardData.activeGames} active | 🟡 ${dashboardData.archivedGames} archived | 🗑️ ${dashboardData.autoDeletedGames} auto-deleted`,
      bg: "bg-[#FFD601]",
      color: "text-[#142B6F]",
      delay: 0.2,
    },
    {
      title: "Total Orders",
      value: dashboardData.totalOrders,
      bg: "bg-[#142B6F]",
      color: "text-white",
      delay: 0.3,
    },
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-semibold text-[#FFD601] mb-2">
          Dashboard Overview
        </h1>

        {error ? (
          <p className="text-red-300 text-sm">{error}</p>
        ) : (
          <p className="text-gray-300 text-sm">
            {loading
              ? "Loading data..."
              : "Welcome back! Here’s what’s happening today."}
          </p>
        )}
      </motion.div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay }}
            whileHover={{ scale: 1.02 }}
            className={`${stat.bg} ${stat.color} rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300`}
          >
            <p className="text-sm opacity-90 mb-1">{stat.title}</p>
            <p className="text-3xl font-bold">
              {loading ? "..." : stat.value.toLocaleString()}
            </p>
            {stat.sub && !loading && (
              <p className="text-xs opacity-80 mt-1 leading-5">{stat.sub}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* RECENT ORDERS */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-md overflow-hidden"
      >
        <div className="bg-[#142B6F] px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-[#FFD601]">
              Recent Orders
            </h2>
            <p className="text-sm text-gray-300">
              Latest bookings and transactions
            </p>
          </div>
        </div>

        <div className="p-6 bg-white/5">
          {loading ? (
            <p className="text-center text-gray-400 py-10">Loading...</p>
          ) : dashboardData.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/10 border border-white/10 rounded-xl p-4 hover:bg-white/20 transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white mb-1">
                        {order.profiles?.full_name ||
                          order.profiles?.email ||
                          "Unknown User"}
                      </h3>
                      <p className="text-sm text-gray-300 mb-1">
                        Paystack Ref: {order.paystack_ref || "N/A"}
                      </p>
                      <p className="text-sm text-gray-400">
                        <span className="text-[#FFD601] font-medium">
                          {order.amount} {order.currency}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">
                        {formatDate(order.created_at)}
                      </p>
                      <span
                        className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-12">
              No recent orders yet.
            </p>
          )}
        </div>

        <div className="bg-[#142B6F] px-6 py-3 border-t border-white/10">
          <p className="text-sm text-gray-300">
            Showing {dashboardData.recentOrders.length} recent orders
          </p>
        </div>
      </motion.div>
    </div>
  );
}
