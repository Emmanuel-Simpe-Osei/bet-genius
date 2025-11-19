import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export async function middleware(req) {
  const res = NextResponse.next();
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Skip system & static files
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.startsWith("/favicon") ||
    path.startsWith("/images") ||
    path.includes("supabase.co") ||
    path.includes("storage/v1")
  ) {
    return res;
  }

  try {
    // Create Supabase client for middleware
    const supabase = await createSupabaseRouteClient();

    // Get session using the new method
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    console.log("Middleware - Path:", path, "Has session:", !!session);

    // If user is on auth pages but has session, redirect to dashboard
    if (path === "/login" || path === "/signup") {
      if (session) {
        console.log("Redirecting authenticated user from auth page");

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        const role = profile?.role || "user";
        const redirectPath =
          role === "admin" ? "/dashboard" : "/user-dashboard";

        url.pathname = redirectPath;
        return NextResponse.redirect(url);
      }
      return res;
    }

    // If user tries to access protected routes without session
    if (
      (path.startsWith("/dashboard") || path.startsWith("/user-dashboard")) &&
      !session
    ) {
      console.log("No session, redirecting to login");
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }

    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    // If there's an error with Supabase, allow the request to continue
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
