"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, TrendingUp } from "lucide-react";
import CopyButton from "@/components/CopyButton";

export default function NewPredictionCard({ game, isLoggedIn }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const [showPurchase, setShowPurchase] = useState(false);
  const [phase, setPhase] = useState("form");
  const [senderName, setSenderName] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [momoDetails, setMomoDetails] = useState(null);
  const [purchaseError, setPurchaseError] = useState("");

  const { id, title, totalOdds, price, matchData, bookingCode, gameDate, rawType } = game;

  const isFree = !price || Number(price) === 0;
  const isCustom = (rawType || "").toLowerCase().includes("custom");

  const handleUnlock = async () => {
    if (!isLoggedIn) { router.push("/login?next=/predictions"); return; }
    if (isCustom) { setShowModal(true); return; }

    setPhase("form"); setSenderName(""); setScreenshot(null); setPurchaseError("");
    setShowPurchase(true);
    try {
      const res = await fetch("/api/app-settings");
      setMomoDetails(await res.json());
    } catch (err) { console.error("Failed to load payment settings:", err); }
  };

  const closePurchaseModal = () => setShowPurchase(false);

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!senderName.trim()) { setPurchaseError("Enter the name on the MoMo account you paid from."); return; }
    if (!screenshot) { setPurchaseError("Upload a screenshot of the payment."); return; }

    setPhase("submitting"); setPurchaseError("");
    try {
      const formData = new FormData();
      formData.append("gameId", id);
      formData.append("senderName", senderName.trim());
      formData.append("screenshot", screenshot);
      const res = await fetch("/api/payment/submit", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setPurchaseError(data.error || "Failed to submit payment proof."); setPhase("form"); return; }
      setPhase("submitted");
    } catch (err) {
      console.error("Payment submit error:", err);
      setPurchaseError("Something went wrong. Please try again.");
      setPhase("form");
    }
  };

  const formattedDate = gameDate ? new Date(gameDate).toLocaleDateString() : "N/A";

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface rounded-2xl max-w-md w-full p-8 text-center">
              <h3 className="text-xl font-bold mb-3">Slot full</h3>
              <p className="text-ink/60 mb-8">Please wait for the next game drop.</p>
              <button onClick={() => setShowModal(false)} className="w-full min-h-[48px] rounded-full font-semibold text-bg bg-accent hover:brightness-110">
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPurchase && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface rounded-2xl max-w-md w-full p-8">
              {phase === "form" && (
                <form onSubmit={submitPayment}>
                  <h3 className="text-lg font-bold mb-2">Pay ₵{Number(price).toLocaleString()} via Mobile Money</h3>
                  <p className="text-ink/50 text-sm mb-6 leading-relaxed">Send payment to the number below, then upload proof here.</p>

                  <div className="bg-surface2 rounded-xl p-5 mb-6 space-y-3">
                    <p className="text-sm text-ink/60">Network: <span className="text-ink font-semibold">{momoDetails?.momo_network || "..."}</span></p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-ink/60">
                        Number: <span className="text-accent font-mono font-semibold text-base">{momoDetails?.momo_number || "..."}</span>
                      </p>
                      <CopyButton value={momoDetails?.momo_number} label="Number copied!" size={15} />
                    </div>
                    <p className="text-sm text-ink/60">Account name: <span className="text-ink font-semibold">{momoDetails?.momo_account_name || "..."}</span></p>
                  </div>

                  <label className="block text-xs text-ink/60 mb-2">Name on the MoMo account you paid from</label>
                  <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Full name"
                    className="w-full mb-5 min-h-[48px] px-4 rounded-xl bg-surface2 text-ink border border-ink/10 focus:outline-none focus:ring-2 focus:ring-accent/40" />

                  <label className="block text-xs text-ink/60 mb-2">Payment screenshot</label>
                  <input type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                    className="w-full mb-6 text-sm text-ink/70 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-bg file:font-semibold" />

                  {purchaseError && <p className="text-red-400 text-sm mb-4">{purchaseError}</p>}

                  <button type="submit" className="w-full min-h-[48px] rounded-full font-semibold text-bg bg-accent hover:brightness-110 mb-3">
                    Submit for review
                  </button>
                  <button type="button" onClick={closePurchaseModal} className="w-full min-h-[44px] text-ink/50 text-sm">
                    Cancel
                  </button>
                </form>
              )}

              {phase === "submitting" && (
                <div className="text-center py-8">
                  <div className="w-9 h-9 mx-auto border-4 border-accent border-t-transparent rounded-full animate-spin mb-5" />
                  <p className="text-ink/60">Uploading...</p>
                </div>
              )}

              {phase === "submitted" && (
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-4">Submitted for review</h3>
                  <p className="text-ink/60 text-sm mb-8 leading-relaxed">
                    We'll verify your payment shortly. Once approved, your booking code will appear automatically in your dashboard.
                  </p>
                  <button onClick={() => { closePurchaseModal(); router.push("/user-dashboard/purchases"); }}
                    className="w-full min-h-[48px] rounded-full font-semibold text-bg bg-accent hover:brightness-110">
                    View my purchases
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TICKET CARD */}
      <div className="rounded-2xl overflow-hidden shadow-lg shadow-black/20">
        <div className="bg-surface px-6 pt-6 pb-5">
          <div className="flex justify-between items-start gap-3 mb-5">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-accent/15 text-accent mb-2">
                {title || "Free"}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-ink/50">
                <Calendar size={12} />
                <span className="font-mono tabular-nums text-ink/70">{formattedDate}</span>
              </div>
            </div>
            {totalOdds && (
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end text-[10px] text-ink/40 mb-0.5">
                  <TrendingUp size={11} /> TOTAL ODDS
                </div>
                <span className="font-mono tabular-nums font-bold text-ink text-lg">
                  {Number(totalOdds).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="bg-surface2 rounded-xl px-4 py-1 max-h-52 overflow-y-auto">
            {(matchData || []).map((m, i) => (
              <div key={i} className="flex justify-between items-center border-b border-ink/5 py-3 last:border-b-0">
                <div className="text-xs flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">{m.homeTeam} vs {m.awayTeam}</p>
                  <p className="text-[10px] text-ink/40 mt-1 truncate">{m.marketDesc || ""}</p>
                </div>
                <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2.5 py-1 rounded shrink-0 ml-3">
                  {m.status || ""}
                </span>
              </div>
            ))}
            {(!matchData || matchData.length === 0) && (
              <p className="text-xs text-ink/40 text-center py-5">No match data available.</p>
            )}
          </div>
        </div>

        <div className="relative h-0 bg-surface">
          <div className="absolute left-0 right-0 top-0 border-t-2 border-dashed border-bg/40" />
          <div className="ticket-notch ticket-notch--left" />
          <div className="ticket-notch ticket-notch--right" />
        </div>

        <div className="bg-surface2 px-6 py-5 flex items-center justify-between gap-3 flex-wrap">
          {isFree ? (
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-accent tracking-wider">{bookingCode || "FREE"}</span>
              {bookingCode && <CopyButton value={bookingCode} label="Booking code copied!" />}
            </div>
          ) : (
            <div>
              <span className="text-[10px] text-ink/40 block mb-0.5">Price</span>
              <span className="font-mono tabular-nums font-black text-accent text-lg">₵{Number(price).toLocaleString()}</span>
            </div>
          )}
          {!isFree && (
            <button onClick={handleUnlock} className="min-h-[48px] px-6 rounded-full font-semibold text-sm bg-accent text-bg hover:brightness-110 transition">
              Unlock
            </button>
          )}
        </div>
      </div>
    </>
  );
}
