"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002583] via-[#1a3a9c] to-[#FFB800] text-white flex justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-lg p-8 mt-10"
      >
        <h1 className="text-3xl font-bold mb-4 text-[#FFD601]">
          Privacy Policy
        </h1>
        <p className="text-white/80 mb-8">
          Last updated: <strong>{new Date().toLocaleDateString()}</strong>
        </p>

        <section className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-2 text-[#FFD601]">
              1. Introduction
            </h2>
            <p className="text-white/80 leading-relaxed">
              <strong>Geniuz Prediction</strong> is committed to safeguarding
              your personal data under the{" "}
              <strong>Data Protection Act, 2012 (Act 843)</strong> of Ghana. We
              ensure transparency in how your information is collected, stored,
              and used.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2 text-[#FFD601]">
              2. Information We Collect
            </h2>
            <ul className="list-disc ml-6 text-white/80 leading-relaxed">
              <li>Basic details (name, phone, and email)</li>
              <li>Payment records processed securely via Paystack</li>
              <li>Device and usage data (browser, IP, session duration)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2 text-[#FFD601]">
              3. Data Use
            </h2>
            <ul className="list-disc ml-6 text-white/80 leading-relaxed">
              <li>To verify users and process payments</li>
              <li>To improve app functionality and user experience</li>
              <li>To comply with Ghana’s gaming and data laws</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2 text-[#FFD601]">
              4. Data Protection
            </h2>
            <p className="text-white/80 leading-relaxed">
              We use encryption, secure authentication (Supabase), and trusted
              gateways (Paystack) to ensure your data remains private and safe.
              Geniuz Prediction does not store your payment information.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2 text-[#FFD601]">
              5. Your Rights
            </h2>
            <p className="text-white/80 leading-relaxed mb-3">
              You can contact our team anytime to:
            </p>
            <ul className="list-disc ml-6 text-white/80 leading-relaxed">
              <li>Access or correct your data</li>
              <li>Delete your account</li>
              <li>Withdraw data usage consent</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2 text-[#FFD601]">
              6. Contact Us
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              For all privacy concerns or inquiries, reach us directly on
              Telegram.
            </p>

            {/* ✅ Telegram Contact Button */}
            <Link
              href="https://t.me/Benson_20"
              target="_blank"
              className="inline-flex items-center gap-2 bg-[#0088cc] hover:bg-[#229ED9] transition-all text-white font-semibold py-3 px-6 rounded-2xl shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                className="w-5 h-5"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.305 3.438 9.8 8.207 11.387.6.113.82-.26.82-.577v-2.04c-3.338.726-4.04-1.414-4.04-1.414-.546-1.387-1.333-1.756-1.333-1.756-1.09-.75.083-.735.083-.735 1.205.085 1.84 1.24 1.84 1.24 1.07 1.835 2.806 1.305 3.492.998.108-.774.418-1.306.76-1.608-2.664-.3-5.466-1.332-5.466-5.932 0-1.31.468-2.382 1.236-3.22-.124-.303-.536-1.523.117-3.176 0 0 1.008-.323 3.3 1.23a11.47 11.47 0 013.003-.404c1.02.005 2.045.138 3.003.404 2.29-1.554 3.296-1.23 3.296-1.23.655 1.653.243 2.873.12 3.176.77.838 1.234 1.91 1.234 3.22 0 4.612-2.806 5.63-5.478 5.925.43.372.813 1.104.813 2.226v3.293c0 .32.217.694.825.577C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              Chat with Mr. Benson
            </Link>
          </div>
        </section>

        <div className="text-center mt-10">
          <Link
            href="/signup"
            className="bg-[#FFD601] text-[#142B6F] font-semibold py-3 px-8 rounded-2xl hover:bg-[#f5cc00] transition-all"
          >
            Back to Sign Up
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
