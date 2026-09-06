// app/api/admin/settings/route.js
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { momo_network, momo_number, momo_account_name, admin_notification_email } =
      await req.json();

    const { error } = await supabaseAdmin
      .from("app_settings")
      .update({
        momo_network,
        momo_number,
        momo_account_name,
        admin_notification_email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update settings error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
