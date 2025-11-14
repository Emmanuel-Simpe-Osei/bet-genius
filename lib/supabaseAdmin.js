// lib/supabaseAdmin.js
// ⚠️ Server-side Supabase client using SERVICE ROLE key.
// NEVER import this into client components.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // server env ONLY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Supabase admin client missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
