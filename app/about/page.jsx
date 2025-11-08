"use client";
import NavbarClient from "@/components/NavbarClient"; // keep your existing navbar import

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0D1B57] text-white pt-20">
      {/* ✅ Your navbar stays at the top */}
      <NavbarClient />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Page Title */}
        <h1 className="text-4xl font-bold mb-6 text-[#FFD700]">
          About Geniuz Prediction
        </h1>

        {/* Intro */}
        <p className="text-lg leading-relaxed mb-8 text-gray-100">
          Geniuz Prediction is your trusted platform for football predictions,
          stats, and insights. We bring accurate data analysis and intelligent
          algorithms together to give you the edge you need.
        </p>

        {/* Mission Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#FFD700] mb-3">
            Our Mission
          </h2>
          <p className="leading-relaxed text-gray-200">
            To empower every sports lover and bettor with reliable and
            data-driven insights, helping them make smarter decisions while
            enjoying the thrill of the game.
          </p>
        </section>

        {/* Vision Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-[#FFD700] mb-3">
            Our Vision
          </h2>
          <p className="leading-relaxed text-gray-200">
            To become Africa’s most reliable sports prediction and analytics
            platform — blending technology, passion, and precision.
          </p>
        </section>

        {/* Contact Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-[#FFD700] mb-3">
            Contact Us
          </h2>
          <p className="leading-relaxed text-gray-200 mb-3">
            Got questions or feedback? We’d love to hear from you.
          </p>
          <a
            href="mailto:support@Geniuz Prediction.com"
            className="inline-block mt-4 bg-[#FFD700] text-[#0D1B57] font-semibold px-6 py-3 rounded-lg hover:bg-yellow-400 transition"
          >
            Email Support
          </a>
        </section>
      </main>
    </div>
  );
}
