// app/api/moolre/initiate/route.js
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { initiateMoolrePayment } from "@/lib/moolre";

export async function POST(req) {
  try {
    const { gameId, phone, channel, otpcode, externalref: existingRef } =
      await req.json();

    const supabase = await createSupabaseRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ---- OTP resubmission path ----
    if (existingRef && otpcode) {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("moolre_ref", existingRef)
        .eq("user_id", user.id)
        .single();

      if (!order) {
        return NextResponse.json(
          { error: "No matching pending order for that reference" },
          { status: 404 }
        );
      }

      if (order.status !== "pending") {
        return NextResponse.json({ status: order.status });
      }

      let result = await initiateMoolrePayment({
        channel,
        currency: "GHS",
        payer: phone,
        amount: order.amount,
        externalref: existingRef,
        otpcode,
      });

      console.log("MOOLRE OTP STEP 1 RAW:", JSON.stringify(result));

      // TP17 = phone verification just succeeded, but the actual payment
      // prompt hasn't been sent yet. Moolre's flow requires resubmitting
      // the SAME request once more (same otpcode + externalref) to
      // actually trigger the payment prompt. Handle that automatically
      // here so the frontend only ever sees the final outcome.
      if (result.status === 1 && result.code === "TP17") {
        result = await initiateMoolrePayment({
          channel,
          currency: "GHS",
          payer: phone,
          amount: order.amount,
          externalref: existingRef,
          otpcode,
        });
        console.log("MOOLRE OTP STEP 2 (post-verify) RAW:", JSON.stringify(result));
      }

      if (result.status !== 1 || result.code !== "TR099") {
        return NextResponse.json(
          { error: result.message || "OTP verification failed", raw: result },
          { status: 400 }
        );
      }

      return NextResponse.json({
        status: "prompt_sent",
        externalref: existingRef,
        moolre_transaction_id: result.data,
      });
    }

    // ---- First-time initiation path ----
    if (!gameId || !phone || !channel) {
      return NextResponse.json(
        { error: "Missing fields: gameId, phone, channel" },
        { status: 400 }
      );
    }

    const { data: game, error: gameError } = await supabaseAdmin
      .from("games")
      .select("id, price, game_name, game_type, booking_code, match_data")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: "Invalid gameId" }, { status: 400 });
    }

    const externalref = `order_${game.id}_${randomUUID()}`;

    const { data: order, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        game_id: game.id,
        amount: game.price,
        currency: "GHS",
        status: "pending",
        moolre_ref: externalref,
        payment_provider: "moolre",
        game_name: game.game_name,
        game_type: game.game_type,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    const result = await initiateMoolrePayment({
      channel,
      currency: "GHS",
      payer: phone,
      amount: game.price,
      externalref,
    });

    console.log("MOOLRE FIRST-TIME RAW:", JSON.stringify(result));

    if (result.code === "TP14") {
      return NextResponse.json({
        status: "otp_required",
        externalref,
        message: result.message,
      });
    }

    if (result.status !== 1 || result.code !== "TR099") {
      await supabaseAdmin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", order.id);

      return NextResponse.json(
        { error: result.message || "Payment initiation failed", raw: result },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: "prompt_sent",
      externalref,
      moolre_transaction_id: result.data,
    });
  } catch (err) {
    console.error("Moolre initiate error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
