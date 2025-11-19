// components/UserDashboardClient.jsx
"use client";

//--------------------------------------------------------------
// USER DASHBOARD – CLIENT LAYOUT (SIDEBAR)
// - Receives `user` and `purchases` from server component
// - Sidebar tabs: Purchases / Recovery / Profile / Support
// - Mobile responsive
//--------------------------------------------------------------

import { useState, useMemo } from "react";

const NAVY = "#0B1A4A";
const GOLD = "#FFD601";

// Small helper – safe date formatting
function formatDate(value) {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function UserDashboardClient({ user, purchases }) {
  const [activeTab, setActiveTab] = useState("purchases");

  // Split purchases into normal vs recovery based on rawType
  const { normalPurchases, recoveryPurchases } = useMemo(() => {
    const normal = [];
    const recovery = [];
    (purchases || []).forEach((p) => {
      if (p.rawType?.toLowerCase().includes("recovery")) {
        recovery.push(p);
      } else {
        normal.push(p);
      }
    });
    return { normalPurchases: normal, recoveryPurchases: recovery };
  }, [purchases]);

  const sidebarItems = [
    { key: "purchases", label: "Purchases" },
    { key: "recovery", label: "Recovery" },
    { key: "profile", label: "My Profile" },
    { key: "support", label: "Support" },
  ];

  return (
    <div
      className="flex min-h-screen text-white"
      style={{ backgroundColor: NAVY }}
    >
      {/* SIDEBAR */}
      <aside className="hidden md:flex md:flex-col w-64 bg-[#142B6F] border-r border-[#1c2b66] pt-24 pb-8 px-6">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wide text-[#AFC3FF]">
            User Dashboard
          </div>
          <div className="text-lg font-bold mt-1">Welcome,</div>
          <div className="text-sm text-[#FFD601] truncate">
            {user?.email || "User"}
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === item.key
                  ? "bg-[#FFD601] text-[#142B6F]"
                  : "text-[#E6ECFF] hover:bg-[#1B308D]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 text-[10px] text-[#AFC3FF]">
          Member since{" "}
          <span className="font-semibold">
            {formatDate(user?.createdAt).split(",")[0]}
          </span>
        </div>
      </aside>

      {/* MOBILE TOP NAV (sidebar collapsed) */}
      <div className="md:hidden w-full pt-20 px-4 pb-2">
        <div className="mb-3">
          <div className="text-xs uppercase tracking-wide text-[#AFC3FF]">
            User Dashboard
          </div>
          <div className="text-base font-bold mt-1">
            Welcome,{" "}
            <span className="text-[#FFD601]">
              {user?.email?.split("@")[0] || "User"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-semibold border ${
                activeTab === item.key
                  ? "bg-[#FFD601] text-[#142B6F] border-[#FFD601]"
                  : "border-[#32457a] text-[#d0ddff]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <section className="flex-1 pt-24 md:pt-20 pb-10 px-4 md:px-10">
        {activeTab === "purchases" && (
          <PurchasesSection purchases={normalPurchases} />
        )}
        {activeTab === "recovery" && (
          <RecoverySection purchases={recoveryPurchases} />
        )}
        {activeTab === "profile" && <ProfileSection user={user} />}
        {activeTab === "support" && <SupportSection />}
      </section>
    </div>
  );
}

//--------------------------------------------------------------
// SECTIONS
//--------------------------------------------------------------

function PurchasesSection({ purchases }) {
  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold">
          My <span style={{ color: GOLD }}>Bookings</span>
        </h1>
        <p className="text-xs md:text-sm text-[#AFC3FF] mt-1">
          Booking codes for your successful Paystack payments appear here.
        </p>
      </header>

      {(!purchases || purchases.length === 0) && (
        <div className="mt-4 rounded-2xl border border-[#1c2b66] bg-[#0F1E4D] p-6 text-center">
          <p className="text-sm text-[#AFC3FF]">
            You have no paid bookings yet.
          </p>
          <p className="text-xs text-[#AFC3FF] mt-1">
            Go to{" "}
            <span style={{ color: GOLD, fontWeight: 600 }}>Predictions</span>{" "}
            and unlock a VIP or Correct Score game to see it here.
          </p>
        </div>
      )}

      {purchases && purchases.length > 0 && (
        <div className="space-y-4">
          {purchases.map((p) => (
            <div
              key={p.id}
              className="rounded-3xl bg-[#0F1E4D] border border-[#1c2b66] p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs uppercase tracking-wide text-[#AFC3FF]">
                    {p.gameType}
                  </span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#18285c] text-[#AFC3FF]">
                    {p.status === "paid" ? "Paid" : p.status}
                  </span>
                </div>

                <h2 className="mt-1 text-sm md:text-base font-semibold text-white">
                  {p.gameName}
                </h2>

                <p className="mt-1 text-[11px] text-[#AFC3FF]">
                  Purchased:{" "}
                  <span className="font-medium">{formatDate(p.createdAt)}</span>
                  {p.gameDate && (
                    <>
                      {" • "}Game Date:{" "}
                      <span className="font-medium">
                        {formatDate(p.gameDate)}
                      </span>
                    </>
                  )}
                </p>

                {p.totalOdds && (
                  <p className="text-[11px] text-[#AFC3FF] mt-0.5">
                    Total Odds:{" "}
                    <span className="font-semibold">
                      {Number(p.totalOdds).toLocaleString()}
                    </span>
                  </p>
                )}

                <p className="mt-2 text-xs text-[#AFC3FF]">
                  Booking Code:{" "}
                  <span
                    className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-semibold"
                    style={{ backgroundColor: GOLD, color: NAVY }}
                  >
                    {p.bookingCode}
                  </span>
                </p>
              </div>

              <div className="w-full md:w-auto md:text-right">
                <div className="text-xs text-[#AFC3FF]">Amount Paid</div>
                <div
                  className="text-lg font-extrabold leading-tight"
                  style={{ color: GOLD }}
                >
                  {p.currency || "GHS"} {Number(p.amount || 0).toLocaleString()}
                </div>
                {p.paystackRef && (
                  <div className="mt-1 text-[10px] text-[#AFC3FF]">
                    Ref: <span className="font-mono">{p.paystackRef}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecoverySection({ purchases }) {
  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold">
          Recovery <span style={{ color: GOLD }}>Games</span>
        </h1>
        <p className="text-xs md:text-sm text-[#AFC3FF] mt-1">
          Any recovery packages you’ve unlocked will appear here with their
          booking codes.
        </p>
      </header>

      {(!purchases || purchases.length === 0) && (
        <div className="mt-4 rounded-2xl border border-[#1c2b66] bg-[#0F1E4D] p-6 text-center">
          <p className="text-sm text-[#AFC3FF]">
            You have no recovery bookings yet.
          </p>
        </div>
      )}

      {purchases && purchases.length > 0 && (
        <div className="space-y-4">
          {purchases.map((p) => (
            <div
              key={p.id}
              className="rounded-3xl bg-[#0F1E4D] border border-[#284c3a] p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs uppercase tracking-wide text-[#9fe3b3]">
                    Recovery
                  </span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#27553b] text-[#d6ffe5]">
                    {p.status === "paid" ? "Active" : p.status}
                  </span>
                </div>

                <h2 className="mt-1 text-sm md:text-base font-semibold text-white">
                  {p.gameName}
                </h2>

                <p className="mt-1 text-[11px] text-[#AFC3FF]">
                  Purchased:{" "}
                  <span className="font-medium">{formatDate(p.createdAt)}</span>
                </p>

                <p className="mt-2 text-xs text-[#AFC3FF]">
                  Booking Code:{" "}
                  <span
                    className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-semibold"
                    style={{ backgroundColor: GOLD, color: NAVY }}
                  >
                    {p.bookingCode}
                  </span>
                </p>
              </div>

              <div className="w-full md:w-auto md:text-right">
                <div className="text-xs text-[#AFC3FF]">Amount Paid</div>
                <div
                  className="text-lg font-extrabold leading-tight"
                  style={{ color: GOLD }}
                >
                  {p.currency || "GHS"} {Number(p.amount || 0).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileSection({ user }) {
  return (
    <div className="max-w-xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold">
          My <span style={{ color: GOLD }}>Profile</span>
        </h1>
        <p className="text-xs md:text-sm text-[#AFC3FF] mt-1">
          Basic information about your Geniuz Prediction account.
        </p>
      </header>

      <div className="rounded-3xl bg-[#0F1E4D] border border-[#1c2b66] p-6 space-y-4">
        <div>
          <div className="text-xs text-[#AFC3FF]">Email</div>
          <div className="text-sm font-semibold mt-1">
            {user?.email || "Not available"}
          </div>
        </div>

        <div>
          <div className="text-xs text-[#AFC3FF]">Member Since</div>
          <div className="text-sm font-semibold mt-1">
            {formatDate(user?.createdAt).split(",")[0]}
          </div>
        </div>

        <div className="pt-2 border-t border-[#1c2b66] text-[11px] text-[#AFC3FF]">
          For account changes (email, password, etc.), please use the{" "}
          <span style={{ color: GOLD }}>Forgot Password</span> flow or contact
          the admin.
        </div>
      </div>
    </div>
  );
}

function SupportSection() {
  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold">
          Need <span style={{ color: GOLD }}>Help?</span>
        </h1>
        <p className="text-xs md:text-sm text-[#AFC3FF] mt-1">
          If something goes wrong with a payment or booking code, use these
          channels.
        </p>
      </header>

      <div className="space-y-4">
        <div className="rounded-3xl bg-[#0F1E4D] border border-[#1c2b66] p-5">
          <h2 className="text-sm font-semibold mb-1">Common issues</h2>
          <ul className="text-xs text-[#AFC3FF] space-y-1 list-disc list-inside">
            <li>Payment completed but booking code not showing.</li>
            <li>Wrong booking code or mismatch with betting site.</li>
            <li>Login / password problems.</li>
          </ul>
        </div>

        <div className="rounded-3xl bg-[#0F1E4D] border border-[#1c2b66] p-5">
          <h2 className="text-sm font-semibold mb-1">Contact admin</h2>
          <p className="text-xs text-[#AFC3FF] mb-2">
            Send your Paystack reference, phone number and a short description
            of the problem.
          </p>
          <p className="text-sm">
            Email:{" "}
            <a
              href="mailto:support@geniuzprediction.com"
              className="underline text-[#FFD601]"
            >
              support@geniuzprediction.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
