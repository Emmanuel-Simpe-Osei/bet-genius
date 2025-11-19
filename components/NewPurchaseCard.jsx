// components/NewPurchaseCard.jsx
"use client";

const GOLD = "#FFD601";
const NAVY = "#142B6F";

export default function NewPurchaseCard({ purchase }) {
  const {
    gameName,
    displayType,
    totalOdds,
    price,
    bookingCode,
    matchData,
    createdAt,
  } = purchase;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleString()
    : "N/A";

  return (
    <div className="rounded-3xl shadow-lg overflow-hidden bg-[#142B6F] text-white">
      {/* HEADER */}
      <div className="flex justify-between items-center px-6 pt-5 pb-1">
        <div>
          <span className="uppercase text-sm tracking-wide font-bold">
            {displayType}
          </span>
          <div className="text-xs text-[#AFC3FF]">
            Purchased: <span className="font-semibold">{formattedDate}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="uppercase text-xs text-[#AFC3FF] block">Price</span>
          <span className="font-bold text-sm" style={{ color: GOLD }}>
            ₵{Number(price).toLocaleString()}
          </span>

          {totalOdds && (
            <span className="text-[10px] text-[#AFC3FF] block mt-1">
              Total Odds: {Number(totalOdds).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* MATCHES */}
      <div className="mt-4 bg-[#0F1E4D] rounded-lg mx-6 p-4 max-h-60 overflow-y-auto">
        {matchData.map((m, i) => (
          <div
            key={i}
            className="flex justify-between border-b border-[#1b2e6a] py-2 last:border-b-0"
          >
            <div className="text-xs">
              <div className="font-medium">
                {m.homeTeam} vs {m.awayTeam}
              </div>
              <div className="text-[10px] text-[#AFC3FF]">
                {m.marketDesc} • Odds {m.odds}
              </div>
            </div>
            <div className="text-[10px] font-semibold text-[#FFD601]">
              {m.status}
            </div>
          </div>
        ))}
      </div>

      {/* BOOKING CODE */}
      <div className="px-6 pt-4 pb-6">
        <p className="text-xs text-[#AFC3FF] mb-2">
          Booking Code:{" "}
          <span className="font-bold text-white">{bookingCode}</span>
        </p>
      </div>
    </div>
  );
}
