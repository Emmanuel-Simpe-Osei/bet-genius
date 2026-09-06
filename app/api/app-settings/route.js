// app/api/app-settings/route.js
//
// Public read of the MoMo payment details customers need to see
// during checkout. No admin_notification_email here — that stays
// internal, never sent to the browser.

import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("momo_network, momo_number, momo_account_name")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
