// app/api/osem/status/route.js
//
// Used by /payment-complete to confirm an OSEM payment. Coming back from
// checkout proves nothing, so we always ask OSEM for the status of our
// own reference (the order id) and fulfil only when it is `settled`.

import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { fulfilOrder, getPaymentStatus, markOrderFailed } from "@/lib/osemPay";

export async function GET(req) {
  try {
    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const orderId = new URL(req.url).searchParams.get("order");
    if (!orderId) {
      return NextResponse.json({ error: "Missing order" }, { status: 400 });
    }

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, status, payment_provider")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!order || order.payment_provider !== "osem_pay") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "paid") return NextResponse.json({ status: "paid" });
    if (order.status !== "pending") return NextResponse.json({ status: "failed" });

    const { ok, status, data } = await getPaymentStatus(order.id);
    if (!ok) {
      console.error("OSEM status lookup failed:", status, data);
      return NextResponse.json({ status: "pending" });
    }

    if (data.status === "settled") {
      const result = await fulfilOrder(order.id, data);
      return NextResponse.json({ status: result.ok ? "paid" : "failed" });
    }

    if (data.status === "failed") {
      await markOrderFailed(order.id);
      return NextResponse.json({ status: "failed" });
    }

    return NextResponse.json({ status: "pending" });
  } catch (err) {
    console.error("OSEM status error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
