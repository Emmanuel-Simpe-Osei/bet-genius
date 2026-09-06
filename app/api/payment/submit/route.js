// app/api/payment/submit/route.js
//
// Customer submits proof of a manual MoMo payment: sender name +
// screenshot. Creates a `pending_review` order and notifies the admin
// by email. No money is confirmed here — an admin approves manually.

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { sendEmail } from "@/lib/resend";

export async function POST(req) {
  try {
    const supabase = await createSupabaseRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const gameId = formData.get("gameId");
    const senderName = formData.get("senderName");
    const file = formData.get("screenshot");

    if (!gameId || !senderName || !file) {
      return NextResponse.json(
        { error: "Missing fields: gameId, senderName, screenshot" },
        { status: 400 }
      );
    }

    const { data: game, error: gameError } = await supabaseAdmin
      .from("games")
      .select("id, price, game_name, game_type")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Invalid gameId" }, { status: 400 });
    }

    const orderId = randomUUID();
    const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
    const storagePath = `${user.id}/${orderId}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("payment-proofs")
      .upload(storagePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to upload screenshot: " + uploadError.message },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabaseAdmin.from("orders").insert({
      id: orderId,
      user_id: user.id,
      game_id: game.id,
      amount: game.price,
      currency: "GHS",
      status: "pending_review",
      payment_provider: "momo_manual",
      sender_name: senderName,
      payment_proof_url: storagePath,
      game_name: game.game_name,
      game_type: game.game_type,
    });

    if (insertError) throw insertError;

    const { data: settings } = await supabaseAdmin
      .from("app_settings")
      .select("admin_notification_email")
      .eq("id", 1)
      .single();

    if (settings?.admin_notification_email) {
      await sendEmail({
        to: settings.admin_notification_email,
        subject: `New payment submitted — ${game.game_name}`,
        html: `
          <h2>New payment proof submitted</h2>
          <p><strong>Game:</strong> ${game.game_name}</p>
          <p><strong>Amount:</strong> GHS ${game.price}</p>
          <p><strong>Sender name on MoMo:</strong> ${senderName}</p>
          <p><strong>Customer email:</strong> ${user.email}</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments">Review in admin dashboard</a></p>
        `,
      });
    }

    return NextResponse.json({ success: true, orderId });
  } catch (err) {
    console.error("Payment submit error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
