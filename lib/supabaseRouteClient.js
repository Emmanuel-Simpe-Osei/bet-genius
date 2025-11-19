// lib/supabaseRouteClient.js
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseRouteClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try {
            cookieStore.set(name, value, options);
          } catch {}
        },
        remove: (name, options) => {
          try {
            cookieStore.delete(name, options);
          } catch {}
        },
      },
    }
  );
}
