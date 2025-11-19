"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

export default function PaystackSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();

  const reference = params.get("reference");
  const game_id = params.get("game_id");
  const amount = params.get("amount");

  useEffect(() => {
    async function verifyPayment() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      // 1. VERIFY WITH YOUR BACKEND
      const res = await fetch("/api/paystack/verify", {
        method: "POST",
        body: JSON.stringify({ reference }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Payment verification failed");
        return;
      }

      // 2. SAVE ORDER
      await fetch("/api/orders/create", {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          game_id,
          amount,
          paystack_ref: reference,
        }),
      });

      toast.success("Payment successful!");
      router.push("/user-dashboard/purchases");
    }

    if (reference) verifyPayment();
  }, [reference]);

  return <div className="p-10 text-center">Verifying payment…</div>;
}
