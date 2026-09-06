"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

function StatusTag({ status }) {
  if (status === "paid") return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent">Approved</span>;
  return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-300">Rejected</span>;
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState([]);
  const [recentlyReviewed, setRecentlyReviewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/payments");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(data.orders || []);
      setRecentlyReviewed(data.recentlyReviewed || []);
    } catch (err) { toast.error("Failed to load pending payments"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const approve = async (orderId) => {
    setProcessingId(orderId);
    try {
      const res = await fetch("/api/admin/payments/approve", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Payment approved!");
      fetchOrders();
    } catch (err) { toast.error(err.message || "Failed to approve"); }
    finally { setProcessingId(null); }
  };

  const openReject = (orderId) => { setRejectingId(orderId); setRejectReason(""); };

  const confirmReject = async () => {
    if (!rejectingId) return;
    setProcessingId(rejectingId);
    try {
      const res = await fetch("/api/admin/payments/reject", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: rejectingId, reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Payment rejected");
      setRejectingId(null);
      fetchOrders();
    } catch (err) { toast.error(err.message || "Failed to reject"); }
    finally { setProcessingId(null); }
  };

  const deleteScreenshot = async (orderId) => {
    if (!confirm("Delete this screenshot to free up space? This can't be undone.")) return;
    setProcessingId(orderId);
    try {
      const res = await fetch("/api/admin/payments/delete-proof", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Screenshot deleted");
      fetchOrders();
    } catch (err) { toast.error(err.message || "Failed to delete"); }
    finally { setProcessingId(null); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink p-6 space-y-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-ink">Payment Verification</h1>
        <p className="text-ink/50 mt-1">{orders.length} payment{orders.length === 1 ? "" : "s"} awaiting review</p>
      </div>

      {orders.length === 0 ? (
        <p className="text-center text-ink/50 py-10">No pending payments</p>
      ) : (
        <div className="grid gap-6 max-w-5xl mx-auto sm:grid-cols-2">
          <AnimatePresence>
            {orders.map((o) => (
              <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }} className="bg-surface rounded-2xl overflow-hidden">
                {o.proofUrl && (
                  <a href={o.proofUrl} target="_blank" rel="noopener noreferrer">
                    <img src={o.proofUrl} alt="Payment proof" className="w-full h-56 object-contain bg-surface2" />
                  </a>
                )}
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-ink">{o.game_name}</h3>
                  <p className="text-sm text-ink/60">
                    Amount: <span className="text-accent font-mono tabular-nums">₵{Number(o.amount).toLocaleString()}</span>
                  </p>
                  <p className="text-sm text-ink/60">Sender name: <span className="text-ink font-semibold">{o.sender_name}</span></p>
                  <p className="text-sm text-ink/60">Customer: {o.profiles?.full_name || "Unknown"} ({o.profiles?.email})</p>
                  <p className="text-xs text-ink/40 font-mono tabular-nums">{new Date(o.created_at).toLocaleString()}</p>
                  <div className="flex gap-3 pt-3">
                    <button onClick={() => approve(o.id)} disabled={processingId === o.id}
                      className="flex-1 min-h-[44px] rounded-full bg-accent text-bg font-semibold hover:brightness-110 disabled:opacity-50">
                      Approve
                    </button>
                    <button onClick={() => openReject(o.id)} disabled={processingId === o.id}
                      className="flex-1 min-h-[44px] rounded-full border border-red-500/40 text-red-400 font-semibold hover:bg-red-500/10 disabled:opacity-50">
                      Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-ink">Recently Reviewed</h2>
          <p className="text-xs text-ink/40">Delete screenshots here once you no longer need them, to save storage space.</p>
        </div>
        {recentlyReviewed.length === 0 ? (
          <p className="text-center text-ink/40 text-sm py-6">No screenshots waiting to be cleared</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {recentlyReviewed.map((o) => (
              <div key={o.id} className="bg-surface rounded-xl overflow-hidden">
                {o.proofUrl && (
                  <a href={o.proofUrl} target="_blank" rel="noopener noreferrer">
                    <img src={o.proofUrl} alt="Payment proof" className="w-full h-32 object-contain bg-surface2" />
                  </a>
                )}
                <div className="p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-ink/60 truncate">{o.game_name}</span>
                    <StatusTag status={o.status} />
                  </div>
                  <p className="text-xs text-ink/40 font-mono tabular-nums">{new Date(o.reviewed_at).toLocaleString()}</p>
                  <button onClick={() => deleteScreenshot(o.id)} disabled={processingId === o.id}
                    className="w-full min-h-[36px] rounded-lg border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/10 disabled:opacity-50 flex items-center justify-center gap-1">
                    <Trash2 size={12} /> Delete Screenshot
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {rejectingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-surface rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-ink mb-3">Reject Payment</h3>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason (shown to the customer)" rows={3}
                className="w-full p-3 rounded-xl bg-surface2 border border-ink/10 text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-accent/40 mb-4" />
              <div className="flex gap-3">
                <button onClick={confirmReject} disabled={processingId === rejectingId}
                  className="flex-1 min-h-[44px] rounded-full bg-red-500 text-white font-semibold disabled:opacity-50">
                  Confirm Reject
                </button>
                <button onClick={() => setRejectingId(null)} className="flex-1 min-h-[44px] rounded-full border border-ink/15 text-ink/70">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
