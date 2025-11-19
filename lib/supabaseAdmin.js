// lib/supabaseAdmin.js
// -------------------------------------------------------------
// This is the Supabase SERVER-ONLY client.
// It uses the SERVICE ROLE key, so it bypasses RLS.
// You use it when:
//
// ✅ You need to read/write any row (no auth restrictions)
// ❌ NEVER on the client (browser)
//
// Required for:
// - Paystack webhook (because user is not logged in)
// - Creating orders
// - Giving user access to booking_code
// - Fetching full games list for public predictions
//--------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";

// Create a server client using the SERVICE ROLE secret
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Must exist in .env.local
);

export default supabaseAdmin;
