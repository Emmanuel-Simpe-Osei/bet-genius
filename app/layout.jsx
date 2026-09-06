"use client";
import "../styles/globals.css";
import NavbarClient from "@/components/NavbarClient";
import Footer from "@/components/Footer";
import NetworkHandler from "@/components/NetworkHandler";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

function GlobalLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg text-ink">
      <div className="animate-spin h-10 w-10 border-4 border-accent border-t-transparent rounded-full mb-3"></div>
      <p className="text-sm font-medium tracking-wide text-ink/70">
        Loading, please wait...
      </p>
    </div>
  );
}

function NetworkIndicator() {
  const [status, setStatus] = useState("online");
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const updateStatus = () =>
      setStatus(navigator.onLine ? "online" : "offline");
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    if (navigator.connection) {
      const checkSpeed = () => {
        const conn = navigator.connection;
        setSlow(
          conn.effectiveType.includes("2g") ||
            conn.effectiveType.includes("slow-2g")
        );
      };
      checkSpeed();
      navigator.connection.addEventListener("change", checkSpeed);
    }
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
      navigator.connection?.removeEventListener("change", () => {});
    };
  }, []);

  if (status === "offline" || slow) {
    return (
      <div className="fixed top-0 left-0 w-full bg-accent text-bg text-center py-2 z-50 text-sm font-semibold shadow-md">
        {status === "offline"
          ? "You're offline"
          : "Slow network detected — performance may be limited."}
      </div>
    );
  }
  return null;
}

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Dashboard routes render their own chrome (sidebar), so the public
  // navbar and marketing footer both stay hidden there.
  const hideChrome =
    pathname.startsWith("/dashboard") || pathname.startsWith("/user-dashboard");

  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-ink flex flex-col">
        <NetworkHandler />
        <NetworkIndicator />
        {!ready ? (
          <GlobalLoader />
        ) : (
          <>
            {!hideChrome && <NavbarClient />}
            <main className="flex-1">{children}</main>
            {!hideChrome && <Footer />}
          </>
        )}
      </body>
    </html>
  );
}
