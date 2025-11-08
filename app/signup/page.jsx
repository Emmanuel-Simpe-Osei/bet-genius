"use client";
import useLoading from "@/hooks/useLoading";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [networkSlow, setNetworkSlow] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // ⚙️ Detect slow network
    if (navigator.connection) {
      const conn = navigator.connection;
      if (
        conn.effectiveType.includes("2g") ||
        conn.effectiveType.includes("slow-2g")
      ) {
        setNetworkSlow(true);
      }
    }
  }, []);

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ✅ Validate form
  const validateForm = () => {
    if (!formData.name.trim())
      return setError("Please enter your full name"), false;
    if (!/^[0-9]{9,15}$/.test(formData.phone))
      return setError("Enter a valid phone number (digits only)"), false;
    if (formData.password !== formData.confirmPassword)
      return setError("Passwords don't match"), false;
    if (formData.password.length < 6)
      return setError("Password must be at least 6 characters"), false;
    if (!formData.agreeToTerms)
      return setError("Please accept the terms and conditions"), false;
    return true;
  };

  // ✅ Handle signup
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // ⏱ 10s timeout

      // 🟢 Step 1: Supabase signup
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
          },
        },
      });

      clearTimeout(timeout);
      if (error) throw error;
      const user = data?.user;
      if (!user) throw new Error("Account could not be created.");

      // 🟢 Step 2: Insert profile securely
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          email: formData.email,
          full_name: formData.name,
          phone: formData.phone,
        }),
      });

      const result = await res.json();
      if (!result.success)
        throw new Error(result.error || "Profile creation failed.");

      // 🟢 Step 3: Success redirect
      sessionStorage.setItem("welcomeName", formData.name);
      setSuccess(true);
      setTimeout(() => router.push("/predictions"), 2500);
    } catch (err) {
      console.error("Signup Error:", err);

      // ✅ Friendly network-aware messages
      if (err.name === "AbortError") {
        setError("Network too slow or unstable. Please try again.");
      } else if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError")
      ) {
        setError(
          "Failed to sign up. Please check your internet connection and try again."
        );
      } else if (err.message.includes("Timeout")) {
        setError(
          "Connection timed out. Please retry when your network improves."
        );
      } else {
        setError("Something went wrong. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  // ✅ Success Animation
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#002583] via-[#1a3a9c] to-[#FFB800] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>

          <h2 className="text-3xl font-bold text-white mb-3">
            Welcome, {formData.name.split(" ")[0]}! 🎉
          </h2>

          <p className="text-white/80 mb-8 text-lg">
            Redirecting you to predictions...
          </p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2 }}
            className="h-1 bg-[#FFB800] rounded-full origin-left mx-auto w-full"
          />
        </motion.div>
      </div>
    );
  }

  // ✅ Main Signup Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002583] via-[#1a3a9c] to-[#FFB800] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-[#002583] to-[#FFB800] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join Us</h1>
          <p className="text-white/70">
            Create your account and start your predictions journey
          </p>
          {networkSlow && (
            <p className="text-yellow-300 text-xs mt-2">
              ⚠️ Your connection seems slow. Please wait patiently or reload.
            </p>
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/20 border border-red-500/30 text-white px-4 py-3 rounded-xl mb-6 text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSignUp} className="space-y-5">
          {[
            {
              name: "name",
              type: "text",
              placeholder: "Full Name",
              icon: "👤",
            },
            {
              name: "phone",
              type: "tel",
              placeholder: "Phone Number",
              icon: "📞",
            },
            {
              name: "email",
              type: "email",
              placeholder: "Email Address",
              icon: "✉️",
            },
            {
              name: "password",
              type: "password",
              placeholder: "Password",
              icon: "🔒",
            },
            {
              name: "confirmPassword",
              type: "password",
              placeholder: "Confirm Password",
              icon: "🔒",
            },
          ].map((field) => (
            <div key={field.name} className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-lg">
                {field.icon}
              </div>
              <input
                {...field}
                value={formData[field.name]}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-white/50"
                required
              />
            </div>
          ))}

          {/* ✅ Terms + Ghana Legal Betting Notice */}
          <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-2xl border border-white/10">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="w-5 h-5 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-[#FFB800]"
            />
            <label className="text-white/80 text-sm leading-relaxed">
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-[#FFB800] font-semibold underline"
              >
                Terms & Conditions
              </Link>{" "}
              and confirm that I am at least 18 years old and betting
              responsibly under the laws of Ghana as regulated by the Gaming
              Commission.
            </label>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading || !formData.agreeToTerms}
            className="w-full bg-gradient-to-r from-[#002583] to-[#FFB800] text-white font-bold py-4 px-6 rounded-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? "Creating Account..." : "Get Started →"}
          </motion.button>
        </form>

        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">Already have an account?</p>
          <Link
            href="/login"
            className="text-[#FFB800] font-semibold hover:text-white"
          >
            Sign In
          </Link>
        </div>

        {/* 🇬🇭 Responsible Betting Notice */}
        <p className="text-white/60 text-xs mt-8 text-center leading-relaxed">
          ⚠️ Geniuz Prediction is a registered business operating under Ghana’s
          Gaming Commission guidelines. Betting can be addictive — please play
          responsibly. For help, contact the Gaming Commission Ghana helpline:
          0302 746 682.
        </p>
      </motion.div>
    </div>
  );
}
