"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { User, Phone, Mail, Lock, Check } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", password: "", confirmPassword: "", agreeToTerms: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [networkSlow, setNetworkSlow] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (navigator.connection) {
      const conn = navigator.connection;
      if (conn.effectiveType.includes("2g") || conn.effectiveType.includes("slow-2g")) setNetworkSlow(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return setError("Please enter your full name"), false;
    if (!/^[0-9]{9,15}$/.test(formData.phone)) return setError("Enter a valid phone number (digits only)"), false;
    if (formData.password !== formData.confirmPassword) return setError("Passwords don't match"), false;
    if (formData.password.length < 6) return setError("Password must be at least 6 characters"), false;
    if (!formData.agreeToTerms) return setError("Please accept the terms and conditions"), false;
    return true;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const { data, error } = await supabase.auth.signUp({
        email: formData.email, password: formData.password,
        options: { data: { full_name: formData.name, phone: formData.phone } },
      });
      clearTimeout(timeout);
      if (error) throw error;
      const user = data?.user;
      if (!user) throw new Error("Account could not be created.");

      const res = await fetch("/api/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, email: formData.email, full_name: formData.name, phone: formData.phone }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Profile creation failed.");

      sessionStorage.setItem("welcomeName", formData.name);
      setSuccess(true);
      setTimeout(() => router.push("/predictions"), 2500);
    } catch (err) {
      console.error("Signup Error:", err);
      if (err.name === "AbortError") setError("Network too slow or unstable. Please try again.");
      else if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError"))
        setError("Failed to sign up. Please check your internet connection and try again.");
      else if (err.message.includes("Timeout")) setError("Connection timed out. Please retry when your network improves.");
      else setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-surface/80 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md text-center shadow-2xl shadow-black/30 border border-ink/5"
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.6 }}
            className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-8 h-8 text-bg" strokeWidth={3} />
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-2">Welcome, {formData.name.split(" ")[0]}!</h2>
          <p className="text-ink/60 mb-8">Redirecting you to predictions...</p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 2 }}
            className="h-1 bg-accent rounded-full origin-left mx-auto w-full" />
        </motion.div>
      </div>
    );
  }

  const fields = [
    { name: "name", type: "text", placeholder: "Full Name", Icon: User },
    { name: "phone", type: "tel", placeholder: "Phone Number", Icon: Phone },
    { name: "email", type: "email", placeholder: "Email Address", Icon: Mail },
    { name: "password", type: "password", placeholder: "Password", Icon: Lock },
    { name: "confirmPassword", type: "password", placeholder: "Confirm Password", Icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-surface/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-black/30 border border-ink/5"
      >
        <div className="text-center mb-7">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-1">Join Us</h1>
          <p className="text-ink/50 text-sm">Create your account and start your predictions journey</p>
          {networkSlow && <p className="text-accent text-xs mt-2">Your connection seems slow. Please wait patiently or reload.</p>}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm text-center">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSignUp} className="space-y-4">
          {fields.map(({ name, type, placeholder, Icon }) => (
            <div key={name} className="relative">
              <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
              <input
                name={name} type={type} placeholder={placeholder} value={formData[name]} onChange={handleChange}
                className="w-full min-h-[52px] bg-surface2 border border-ink/10 text-ink placeholder-ink/40 rounded-2xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-accent/50"
                required
              />
            </div>
          ))}

          <label className="flex items-start gap-3 p-4 bg-surface2 rounded-2xl border border-ink/5 cursor-pointer">
            <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange}
              className="mt-0.5 w-5 h-5 accent-accent rounded" />
            <span className="text-ink/70 text-sm leading-relaxed">
              I agree to the <Link href="/terms" className="text-accent underline">Terms &amp; Conditions</Link> and confirm
              that I am at least 18 years old and betting responsibly under the laws of Ghana as regulated by the Gaming Commission.
            </span>
          </label>

          <motion.button
            whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={loading || !formData.agreeToTerms}
            className="w-full min-h-[52px] bg-accent text-bg font-bold rounded-full hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-40 flex justify-center items-center gap-2"
          >
            {loading ? "Creating Account..." : "Get Started"}
          </motion.button>
        </form>

        <div className="text-center mt-6">
          <p className="text-ink/50 text-sm">Already have an account?</p>
          <Link href="/login" className="text-accent font-semibold hover:brightness-110">Sign In</Link>
        </div>

        <p className="text-ink/40 text-xs mt-8 text-center leading-relaxed">
          Geniuz Prediction is a registered business operating under Ghana's Gaming Commission guidelines.
          Betting can be addictive — please play responsibly. Helpline: 0302 746 682.
        </p>
      </motion.div>
    </div>
  );
}
