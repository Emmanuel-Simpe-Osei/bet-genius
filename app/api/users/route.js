import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  // Validate Admin Key
  const adminKey = req.headers.get("x-admin-key");

  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return Response.json(
      { error: "Unauthorized — invalid admin key" },
      { status: 401 }
    );
  }

  // Admin Supabase Client (SERVICE ROLE)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: users, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ users }, { status: 200 });
}
