"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ShieldCheck, Zap, Trophy, Radio } from "lucide-react";

export default function HomePage() {
  const heroImages = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg"];
  const [current, setCurrent] = useState(0);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [board, setBoard] = useState({ free: 0, vip: 0 });
  const refreshRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setCurrent((prev) => (prev + 1) % heroImages.length), 6000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    fetch("/api/predictions/public")
      .then((r) => r.json())
      .then((data) => {
        const games = data.games || [];
        setBoard({
          free: games.filter((g) => g.displayType === "Free").length,
          vip: games.filter((g) => g.displayType !== "Free").length,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let abortCtrl = new AbortController();
    const fetchNews = async (forceRefresh = false) => {
      try {
        setLoading(true);
        const cached = localStorage.getItem("cachedNews");
        const cachedTime = localStorage.getItem("cachedTime");
        if (!forceRefresh && cached && cachedTime) {
          const ageMinutes = (Date.now() - parseInt(cachedTime, 10)) / (1000 * 60);
          if (ageMinutes < 30) {
            setNews(JSON.parse(cached));
            setLastUpdated(new Date(parseInt(cachedTime, 10)));
            setLoading(false);
            return;
          }
        }
        const res = await fetch("/api/news", { signal: abortCtrl.signal, headers: { "cache-control": "no-cache" } });
        const data = await res.json();
        if (data.articles) {
          const topFive = data.articles.slice(0, 5);
          setNews(topFive);
          setLastUpdated(new Date());
          localStorage.setItem("cachedNews", JSON.stringify(topFive));
          localStorage.setItem("cachedTime", Date.now().toString());
        }
      } catch (err) {
        if (err.name !== "AbortError") console.error("News fetch error:", err);
      } finally { setLoading(false); }
    };
    fetchNews();
    refreshRef.current = setInterval(() => fetchNews(true), 1800000);
    const onVisible = () => { if (document.visibilityState === "visible") fetchNews(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(refreshRef.current);
      document.removeEventListener("visibilitychange", onVisible);
      abortCtrl.abort();
    };
  }, []);

  return (
    <div className="bg-bg text-ink overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-[75vh] flex items-center overflow-hidden">
        <AnimatePresence>
          {heroImages.map((src, i) => i === current && (
            <motion.img key={src} src={src} alt="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }} className="absolute inset-0 w-full h-full object-cover" />
          ))}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 to-bg/50" />

        {/* Decorative oversized icon, low opacity — texture, not content */}
        <Trophy className="absolute -right-10 -top-10 w-64 h-64 text-accent/[0.06] rotate-12 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto w-full px-5 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-surface/70 backdrop-blur-md px-4 py-1.5 rounded-full mb-6 text-xs font-semibold text-accent">
            <Radio size={13} className="animate-pulse" />
            LIVE — UPDATED DAILY
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95]">
            TODAY'S SLATE
            <br />
            <span className="text-accent">IS LOADED</span>
          </h1>
          <p className="text-ink/70 mt-8 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            Free tips, VIP picks, and correct-score bookings — verified daily and ready in your dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center">
            <Link href="/predictions"
              className="min-h-[52px] flex items-center justify-center bg-accent text-bg px-8 rounded-full font-bold hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition-all">
              View Today's Predictions
            </Link>
            <a href="https://t.me/MortarSec" target="_blank" rel="noopener noreferrer"
              className="min-h-[52px] flex items-center justify-center border-2 border-accent/50 text-ink px-8 rounded-full font-bold hover:bg-accent/10 transition">
              Join Telegram
            </a>
          </div>
        </div>

        {/* Bold full diagonal cut — taller band, complete diagonal, not a shallow decorative sliver */}
        <div className="absolute bottom-0 left-0 w-full h-28 sm:h-44 bg-accent"
          style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }} />
      </section>

      {/* BOLD STAT BLOCK — full gold, textured, with decorative icons */}
      <section className="relative bg-accent text-bg py-24 sm:py-32 overflow-hidden">
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(#04274F 1.5px, transparent 1.5px)",
            backgroundSize: "22px 22px",
          }}
        />
        <ShieldCheck className="absolute -left-8 -bottom-8 w-56 h-56 text-bg/[0.07] -rotate-12 pointer-events-none" />
        <Zap className="absolute right-4 top-4 w-24 h-24 text-bg/[0.08] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-14 sm:gap-8 text-center">
            <div>
              <p className="text-6xl sm:text-8xl font-black font-mono tabular-nums leading-none">{board.free}</p>
              <p className="text-sm sm:text-base font-bold uppercase tracking-wide mt-4">Free tips live today</p>
            </div>
            <div>
              <p className="text-6xl sm:text-8xl font-black font-mono tabular-nums leading-none">{board.vip}</p>
              <p className="text-sm sm:text-base font-bold uppercase tracking-wide mt-4">VIP &amp; Correct Score available</p>
            </div>
          </div>

          <div className="text-center mt-16">
            <Link href="/predictions"
              className="inline-flex min-h-[52px] items-center bg-bg text-accent px-8 rounded-full font-bold hover:brightness-125 hover:-translate-y-0.5 transition-all">
              Open the board
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-28 sm:h-44 bg-bg"
          style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }} />
      </section>

      {/* FEATURE HIGHLIGHTS — real content richness via icons, not stock photos */}
      <section className="py-20 sm:py-24 w-full bg-bg">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { Icon: ShieldCheck, title: "Verified daily", desc: "Every booking code checked before it reaches your dashboard." },
            { Icon: Zap, title: "Fast payouts", desc: "Approved in minutes, not hours — pay via MoMo, unlock instantly." },
            { Icon: Trophy, title: "Real analysis", desc: "Not guesswork — odds and picks backed by real match data." },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="bg-surface rounded-2xl p-7 text-center">
              <div className="w-14 h-14 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-5">
                <Icon className="text-accent" size={26} />
              </div>
              <h3 className="font-bold text-ink mb-2">{title}</h3>
              <p className="text-sm text-ink/60 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NEWS */}
      <section className="py-20 sm:py-24 w-full bg-surface2">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="flex items-baseline justify-between mb-10">
            <h2 className="text-xl sm:text-2xl font-bold">Football news</h2>
            {lastUpdated && <p className="text-xs text-ink/40 font-mono tabular-nums">Updated {lastUpdated.toLocaleTimeString()}</p>}
          </div>

          {loading ? (
            <p className="text-ink/50">Loading news...</p>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map((article, i) => (
                <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                  className="bg-surface rounded-xl overflow-hidden hover:shadow-lg hover:shadow-black/20 transition-shadow">
                  {article.urlToImage && <img src={article.urlToImage} alt={article.title} className="w-full h-44 sm:h-48 object-cover" />}
                  <div className="p-6">
                    <h3 className="font-semibold text-sm sm:text-base mb-3 line-clamp-2">{article.title}</h3>
                    <p className="text-sm text-ink/50 line-clamp-2 mb-4 leading-relaxed">{article.description || ""}</p>
                    <span className="text-xs text-ink/35 font-mono tabular-nums">{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                </a>
              ))}
            </div>
          ) : <p className="text-ink/50">No football news found.</p>}
        </div>
      </section>

      {/* LEAGUES */}
      <section className="py-20 sm:py-24 w-full bg-bg">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-8">Leagues we cover</h2>
          <div className="flex flex-wrap gap-3">
            {["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1", "UCL"].map((league) => (
              <span key={league} className="min-h-[44px] flex items-center bg-surface px-5 rounded-full text-sm text-ink/80">
                {league}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-20 sm:py-24 w-full bg-surface2">
        <div className="max-w-2xl mx-auto px-5 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Get in touch</h2>
          <p className="text-ink/60 mb-8">Questions, or want to partner with us?</p>
          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <a href="mailto:support@geniuzprediction.com" className="min-h-[48px] flex items-center justify-center text-ink/80 hover:text-accent transition-colors">
              support@geniuzprediction.com
            </a>
            <a href="https://t.me/Ozopgh" target="_blank" rel="noopener noreferrer" className="min-h-[48px] flex items-center justify-center text-ink/80 hover:text-accent transition-colors">
              Telegram Channel
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
