import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

// 🟢 Use service role key — must be in .env
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { full_name, phone } = await req.json();

    const supabase = await createSupabaseRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const id = user.id;
    const email = user.email;

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existingProfile) {
      console.log("ℹ️ Profile already exists:", existingProfile.id);
      return NextResponse.json({ success: true });
    }

    // Insert new profile securely
    const { error } = await supabaseAdmin.from("profiles").insert([
      {
        id,
        email,
        full_name,
        phone,
        role: "user",
      },
    ]);

    if (error) {
      console.error("❌ Admin insert error:", error.message);
      return NextResponse.json({ success: false, error: error.message });
    }

    console.log("✅ Profile inserted via admin route for:", full_name);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("🔥 API signup error:", err.message);
    return NextResponse.json({ success: false, error: err.message });
  }
}
