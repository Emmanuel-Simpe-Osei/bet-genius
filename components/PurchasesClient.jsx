// components/PurchasesClient.jsx
"use client";

import NewPurchaseCard from "@/components/NewPurchaseCard";

export default function PurchasesClient({ purchases }) {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-20 pb-16">
      <header className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">
          Your <span className="text-[#FFD601]">Purchased Games</span>
        </h1>
        <p className="text-[#AFC3FF] mt-1">
          All VIP & Correct Score games you have unlocked.
        </p>
      </header>

      {purchases.length === 0 ? (
        <p className="text-center text-[#AFC3FF] text-sm mt-20">
          You haven't purchased any predictions yet.
        </p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3 md:grid-cols-2 grid-cols-1">
          {purchases.map((p) => (
            <NewPurchaseCard key={p.id} purchase={p} />
          ))}
        </div>
      )}
    </div>
  );
}
