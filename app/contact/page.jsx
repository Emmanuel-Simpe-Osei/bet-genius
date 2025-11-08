"use client";
import NavbarClient from "@/components/NavbarClient"; // your existing navbar

export default function ContactPage() {
  // Replace this with your actual Telegram username (no '@')
  const telegramUsername = "Geniuz PredictionAdmin";

  return (
    <div className="min-h-screen bg-[#0D1B57] text-white pt-20">
      <NavbarClient />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Title */}
        <h1 className="text-4xl font-bold mb-6 text-[#FFD700]">Contact Us</h1>
        <p className="text-lg text-gray-100 mb-10 leading-relaxed">
          Need support or have a question? You can reach us directly through
          Telegram. We’re quick to respond!
        </p>

        {/* Telegram Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-[#FFD700] mb-3">
            Chat with Us on Telegram
          </h2>
          <p className="text-gray-200 mb-4">
            Click the button below to start a chat with our support team.
          </p>

          <a
            href="https://t.me/Benson_20"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#0088CC] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#009be3] transition"
          >
            {/* Telegram Icon (emoji for simplicity, replace with SVG if you want) */}
            <span>💬</span> Message on Telegram
          </a>
        </section>

        {/* Address */}
        <section>
          <h2 className="text-2xl font-semibold text-[#FFD700] mb-3">
            Office Address
          </h2>
          <p className="text-gray-200 leading-relaxed">
            Geniuz Prediction HQ, 12 Innovation Street, Accra, Ghana
          </p>
        </section>
      </main>
    </div>
  );
}
