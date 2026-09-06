import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";

async function withSignedUrls(orders) {
  return Promise.all(
    (orders || []).map(async (o) => {
      let proofUrl = null;
      if (o.payment_proof_url) {
        const { data } = await supabaseAdmin.storage
          .from("payment-proofs")
          .createSignedUrl(o.payment_proof_url, 300);
        proofUrl = data?.signedUrl || null;
      }
      return { ...o, proofUrl };
    })
  );
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const selectCols =
    "id, user_id, game_id, amount, currency, status, sender_name, payment_proof_url, created_at, reviewed_at, rejection_reason, game_name, game_type, profiles ( full_name, email )";

  const { data: pending, error: pendingError } = await supabaseAdmin
    .from("orders")
    .select(selectCols)
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  if (pendingError) {
    return NextResponse.json({ error: pendingError.message }, { status: 500 });
  }

  // Reviewed orders that still have a screenshot on file — no time
  // limit, just "not yet manually cleared" by the admin.
  const { data: recent, error: recentError } = await supabaseAdmin
    .from("orders")
    .select(selectCols)
    .in("status", ["paid", "rejected"])
    .not("payment_proof_url", "is", null)
    .order("reviewed_at", { ascending: false })
    .limit(30);

  if (recentError) {
    return NextResponse.json({ error: recentError.message }, { status: 500 });
  }

  return NextResponse.json({
    orders: await withSignedUrls(pending),
    recentlyReviewed: await withSignedUrls(recent),
  });
}
