import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import supabaseAdmin from "@/lib/supabaseAdmin";

// Single source of truth for role-based routing. The role is read with the
// service-role client (same as requireAdmin) so RLS can never make an admin
// look like a regular user.
async function getRole(userId) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role || "user";
}

function redirectTo(req, pathname, res, params = {}) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const redirect = NextResponse.redirect(url);
  // Carry over any refreshed auth cookies
  res.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

export async function middleware(req) {
  const path = req.nextUrl.pathname;
  const isAdminArea = path.startsWith("/dashboard");
  const isUserArea = path.startsWith("/user-dashboard");
  const isAuthPage = path === "/login" || path === "/signup";

  let res = NextResponse.next({ request: req });

  try {
    // Middleware-specific client: reads cookies from the request and writes
    // refreshed tokens to the response so sessions don't go stale.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
            res = NextResponse.next({ request: req });
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      if (isAdminArea || isUserArea) return redirectTo(req, "/login", res, { next: path });
      return res;
    }

    if (!isAuthPage && !isAdminArea && !isUserArea) return res;

    const role = await getRole(user.id);

    if (isAuthPage) return redirectTo(req, role === "admin" ? "/dashboard" : "/predictions", res);
    if (isAdminArea && role !== "admin") return redirectTo(req, "/user-dashboard", res);
    if (isUserArea && role === "admin") return redirectTo(req, "/dashboard", res);

    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    // Fail closed for protected areas, open for public pages
    if (isAdminArea || isUserArea) return redirectTo(req, "/login", res);
    return res;
  }
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/user-dashboard/:path*",
  ],
};
