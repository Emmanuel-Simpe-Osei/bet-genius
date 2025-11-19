"use client";
// TOP RIGHT LOGOUT BAR
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

import { motion } from "framer-motion";

export function MotionDiv({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}
