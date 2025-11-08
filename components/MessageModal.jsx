"use client";
import { motion, AnimatePresence } from "framer-motion";

export default function MessageModal({ show, message, onClose }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative bg-[#0E1D59]/90 border border-[#FFD601] text-white rounded-2xl shadow-[0_0_20px_#FFD60155] p-6 max-w-sm w-[90%] text-center"
          >
            <h2 className="text-2xl font-bold text-[#FFD601] mb-2">
              Geniuz Prediction
            </h2>
            <p className="text-white/90 leading-relaxed mb-5">{message}</p>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="bg-[#FFD601] text-[#142B6F] font-semibold px-6 py-2 rounded-lg hover:brightness-110 transition-all"
            >
              OK
            </motion.button>

            {/* Glowing ring effect */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 15px #FFD60155",
                  "0 0 30px #FFD60199",
                  "0 0 15px #FFD60155",
                ],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 rounded-2xl border border-[#FFD601]/30 pointer-events-none"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
