// lib/requireAdmin.js
//
// Server-side admin check for API routes. Reads the caller's session
// (sent automatically via cookies on any same-origin request — no
// header or client-side secret needed) and confirms their profile
// role is "admin". Returns the user on success, or null if the
// caller isn't logged in or isn't an admin.

import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function requireAdmin() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;

  return user;
}
