"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export default function HomePage() {
  const heroImages = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg"];
  const [current, setCurrent] = useState(0);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const refreshRef = useRef(null);

  // 🧠 Auto-switch background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  // 📰 Fetch football news once per session (cache in localStorage)
  useEffect(() => {
    let abortCtrl = new AbortController();

    const fetchNews = async (forceRefresh = false) => {
      try {
        setLoading(true);

        // ✅ 1. Try to read cache
        const cached = localStorage.getItem("cachedNews");
        const cachedTime = localStorage.getItem("cachedTime");

        // ✅ 2. Check if we can use cached data (less than 30 min old)
        if (!forceRefresh && cached && cachedTime) {
          const ageMinutes =
            (Date.now() - parseInt(cachedTime, 10)) / (1000 * 60);
          if (ageMinutes < 30) {
            const parsed = JSON.parse(cached);
            setNews(parsed);
            setLastUpdated(new Date(parseInt(cachedTime, 10)));
            setLoading(false);
            return; // 💡 skip fetch since cache is still fresh
          }
        }

        // ✅ 3. Otherwise, fetch new data
        const res = await fetch("/api/news", {
          signal: abortCtrl.signal,
          headers: { "cache-control": "no-cache" },
        });

        const data = await res.json();

        if (data.articles) {
          // ✅ Limit to only 5 news cards before saving
          const topFive = data.articles.slice(0, 5);
          setNews(topFive);
          setLastUpdated(new Date());

          // ✅ Save to cache
          localStorage.setItem("cachedNews", JSON.stringify(topFive));
          localStorage.setItem("cachedTime", Date.now().toString());
        }
      } catch (err) {
        if (err.name !== "AbortError") console.error("News fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    // First load — use cache if available
    fetchNews();

    // Optional: auto-refresh every 30 min in background
    refreshRef.current = setInterval(() => fetchNews(true), 1800000); // 30 min

    // Refetch if user comes back after a while
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchNews();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(refreshRef.current);
      document.removeEventListener("visibilitychange", onVisible);
      abortCtrl.abort();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#142B6F] text-white overflow-x-hidden">
      <section
        id="home"
        className="relative h-screen w-screen flex items-center justify-center overflow-hidden"
      >
        <AnimatePresence>
          {heroImages.map(
            (src, i) =>
              i === current && (
                <motion.img
                  key={src}
                  src={src}
                  alt={`Hero ${i}`}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )
          )}
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-[#142B6F]/80"></div>

        <div className="relative z-10 text-center px-4 sm:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)]"
          >
            Win Smarter, Bet Smarter ⚡
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white mt-4 max-w-2xl mx-auto text-lg"
          >
            Stay ahead with live football insights, expert predictions, and
            daily odds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-4 mt-8 flex-wrap justify-center"
          >
            <a
              href="https://t.me/Ozopgh"
              target="_blank"
              className="bg-[#FFD601] text-[#142B6F] px-6 py-3 rounded-xl font-semibold hover:bg-yellow-400 transition"
            >
              Join Channel
            </a>
            <Link
              href="/predictions"
              className="border border-[#FFD601] text-[#FFD601] px-6 py-3 rounded-xl font-semibold hover:bg-[#FFD601] hover:text-[#142B6F] transition"
            >
              Free games
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 📰 Football News */}
      <section id="news" className="py-20 w-full bg-[#1B308D]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-center text-[#FFD601] mb-2"
          >
            📰 Latest Football News
          </motion.h3>
          {lastUpdated && (
            <p className="text-center text-white/60 text-sm mb-8">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}

          {loading ? (
            <p className="text-center text-white/80">Loading news...</p>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map((article, i) => (
                <motion.a
                  key={i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03 }}
                  className="bg-[#142B6F]/70 border border-[#FFD601]/20 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {article.urlToImage && (
                    <img
                      src={article.urlToImage}
                      alt={article.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-5">
                    <h4 className="font-semibold text-lg text-white mb-2 line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-sm text-white/80 line-clamp-3 mb-3">
                      {article.description || "Click to read more..."}
                    </p>
                    <span className="text-xs text-white/60">
                      {new Date(article.publishedAt).toLocaleString()}
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>
          ) : (
            <p className="text-center text-white/70">No football news found.</p>
          )}
        </div>
      </section>

      {/* ⚽ Leagues Section */}
      <section id="leagues" className="py-16 w-full bg-[#142B6F] text-center">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-[#FFD601] mb-10"
        >
          ⚽ We Cover Top Leagues
        </motion.h3>

        <div className="flex flex-wrap justify-center gap-6 text-lg text-white px-4">
          {[
            "Premier League",
            "La Liga",
            "Serie A",
            "Bundesliga",
            "Ligue 1",
            "UCL",
          ].map((league) => (
            <motion.div
              key={league}
              whileHover={{ scale: 1.05 }}
              className="bg-[#1B308D] px-6 py-3 rounded-xl border border-[#FFD601]/30"
            >
              {league}
            </motion.div>
          ))}
        </div>
      </section>

      {/* 📞 Contact Section */}
      <section id="contact" className="py-16 w-full bg-[#1B308D] text-center">
        <div className="max-w-4xl mx-auto px-6">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-[#FFD601] mb-6"
          >
            📞 Contact Us
          </motion.h3>
          <p className="text-white mb-6">
            Have questions or want to partner with us? Reach us via:
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4 text-white/90">
            <a
              href="mailto:support@Geniuz Prediction.com"
              className="hover:text-[#FFD601] transition"
            >
              📧 support@Geniuz Prediction.com
            </a>
            <a
              href="https://t.me/Ozopgh"
              target="_blank"
              className="hover:text-[#FFD601] transition"
            >
              💬 Telegram Channel
            </a>
          </div>
        </div>
      </section>

      <footer className="py-6 border-t border-[#FFD601]/20 text-center text-white/70 text-sm w-full">
        © {new Date().getFullYear()} Geniuz Prediction. All rights reserved.
      </footer>
    </div>
  );
}
