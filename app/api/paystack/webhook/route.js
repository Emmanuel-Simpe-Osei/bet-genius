import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
    const body = await req.json();

    // Paystack sends this signature header
    const paystackSignature = req.headers.get("x-paystack-signature");

    if (!paystackSignature) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract event
    const event = body?.event;
    const data = body?.data;

    if (event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const reference = data.reference;
    const amount = data.amount / 100; // convert from pesewas
    const email = data.customer.email;

    // Extract metadata added during init
    const gameId = data.metadata?.gameId;
    const bookingCode = data.metadata?.booking_code;

    if (!gameId) {
      return NextResponse.json({ error: "Missing gameId" }, { status: 400 });
    }

    // Fetch user from email
    const { data: userRow } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (!userRow) {
      return NextResponse.json(
        { error: "User not found for email " + email },
        { status: 404 }
      );
    }

    const userId = userRow.id;

    // Prevent duplicates
    const { data: existing } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("paystack_ref", reference)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: "Order already exists" });
    }

    // Insert order
    const { error: insertError } = await supabaseAdmin.from("orders").insert([
      {
        user_id: userId,
        game_id: gameId,
        amount,
        currency: "GHS",
        status: "paid",
        paystack_ref: reference,
        booking_code: bookingCode,
      },
    ]);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Do NOT cache this route
export const dynamic = "force-dynamic";
