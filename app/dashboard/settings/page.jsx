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
  const [paymentSettings, setPaymentSettings] = useState({
    momo_network: "", momo_number: "", momo_account_name: "", admin_notification_email: "",
  });
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setProfiles(data || []);
      } catch (e) {
        setMessage("Failed to load profiles. Please refresh.");
      } finally { setLoading(false); }
    };
    fetchProfiles();

    const fetchPaymentSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (res.ok) setPaymentSettings({
          momo_network: data.momo_network || "", momo_number: data.momo_number || "",
          momo_account_name: data.momo_account_name || "", admin_notification_email: data.admin_notification_email || "",
        });
      } catch (e) { console.error(e); }
    };
    fetchPaymentSettings();
  }, []);

  const refreshProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setProfiles(data || []);
  };

  const handlePasswordChange = async () => {
    if (!newPassword) return alert("Please enter a new password.");
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage("Password updated successfully!");
      setNewPassword("");
    } catch (err) { setMessage("Failed to update password: " + err.message); }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail) return alert("Please enter a user's email address");
    try {
      const res = await fetch("/api/admin/promote", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Promotion failed."); return; }
      setMessage(data.message || "User promoted to admin!");
      setNewAdminEmail("");
      await refreshProfiles();
    } catch (err) { setMessage("Failed to promote user: " + err.message); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("This permanently deletes the user's profile and login. Continue?")) return;
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.error || "Failed to delete user"); return; }
      setProfiles((prev) => prev.filter((u) => u.id !== id));
      setMessage("User deleted successfully!");
    } catch (err) { setMessage("Failed to delete user: " + err.message); }
  };

  const handleSavePaymentSettings = async () => {
    setSavingPayment(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(paymentSettings),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.error || "Failed to save payment settings"); return; }
      setMessage("Payment settings saved!");
    } catch (err) { setMessage("Failed to save payment settings: " + err.message); }
    finally { setSavingPayment(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg text-ink">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-bold text-ink">Admin Settings</h1>
        <p className="text-ink/50 mt-1">Manage admins, users, and passwords</p>
      </motion.div>

      {message && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`max-w-3xl mx-auto text-center py-3 px-4 rounded-xl ${
            message.toLowerCase().includes("fail") || message.toLowerCase().includes("error")
              ? "bg-red-500/10 text-red-300" : "bg-accent/10 text-accent"
          }`}>
          {message}
        </motion.div>
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface p-6 rounded-2xl">
          <h2 className="text-xl font-semibold text-ink mb-1">Payment Settings</h2>
          <p className="text-ink/50 text-sm mb-4">Shown to customers during checkout, and where new payment alerts get sent.</p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink/60 mb-1 block">Network</label>
              <select value={paymentSettings.momo_network}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, momo_network: e.target.value })}
                className="w-full min-h-[48px] px-3 rounded-lg border border-ink/10 bg-surface2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/40">
                <option value="">Select network</option><option value="MTN">MTN</option>
                <option value="Telecel">Telecel</option><option value="AT">AirtelTigo</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-ink/60 mb-1 block">MoMo Number</label>
              <input type="text" placeholder="0244123456" value={paymentSettings.momo_number}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, momo_number: e.target.value })}
                className="w-full min-h-[48px] px-3 rounded-lg border border-ink/10 bg-surface2 text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-accent/40" />
            </div>
            <div>
              <label className="text-xs text-ink/60 mb-1 block">Account Name (shown to customers)</label>
              <input type="text" placeholder="e.g. Kwame Asante" value={paymentSettings.momo_account_name}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, momo_account_name: e.target.value })}
                className="w-full min-h-[48px] px-3 rounded-lg border border-ink/10 bg-surface2 text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-accent/40" />
            </div>
            <div>
              <label className="text-xs text-ink/60 mb-1 block">Notification Email</label>
              <input type="email" placeholder="you@geniuzprediction.com" value={paymentSettings.admin_notification_email}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, admin_notification_email: e.target.value })}
                className="w-full min-h-[48px] px-3 rounded-lg border border-ink/10 bg-surface2 text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-accent/40" />
            </div>
          </div>

          <button onClick={handleSavePaymentSettings} disabled={savingPayment}
            className="mt-4 min-h-[44px] bg-accent text-bg font-semibold rounded-full px-6 disabled:opacity-50">
            {savingPayment ? "Saving..." : "Save Payment Settings"}
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="bg-surface p-6 rounded-2xl">
          <h2 className="text-xl font-semibold text-ink mb-4">Change Your Password</h2>
          <div className="grid sm:grid-cols-[1fr_auto] gap-3">
            <input type="password" placeholder="New Password" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="min-h-[48px] px-3 rounded-lg border border-ink/10 bg-surface2 text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-accent/40" />
            <button onClick={handlePasswordChange}
              className="min-h-[48px] bg-accent text-bg font-semibold rounded-full px-5">Update</button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="bg-surface p-6 rounded-2xl">
          <h2 className="text-xl font-semibold text-ink mb-4">Promote User to Admin</h2>
          <div className="grid sm:grid-cols-[1fr_auto] gap-3">
            <input type="email" placeholder="Enter user email" value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="min-h-[48px] px-3 rounded-lg border border-ink/10 bg-surface2 text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-accent/40" />
            <button onClick={handleAddAdmin}
              className="min-h-[48px] bg-accent text-bg font-semibold rounded-full px-5">Promote</button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="bg-surface p-6 rounded-2xl">
          <h2 className="text-xl font-semibold text-ink mb-4">Manage Users</h2>
          {profiles.length === 0 ? (
            <p className="text-ink/60">No users available.</p>
          ) : (
            <div className="space-y-2">
              {profiles.map((u) => (
                <div key={u.id} className="flex justify-between items-center bg-surface2 p-3 rounded-xl">
                  <div>
                    <p className="font-semibold">
                      {u.full_name || "Unnamed"}{" "}
                      {u.role === "admin" && <span className="text-accent text-sm">(Admin)</span>}
                    </p>
                    <p className="text-sm text-ink/60">{u.email}</p>
                  </div>
                  <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-300 text-sm font-medium">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
