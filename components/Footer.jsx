import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-surface2 border-t border-accent/10">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <span className="text-lg font-bold text-ink">
            Geniuz<span className="text-accent">Prediction</span>
          </span>
          <p className="text-sm text-ink/50 mt-3 max-w-xs">
            Daily football predictions and verified booking codes, backed by
            real match analysis.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink/70 mb-3">Site</p>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/predictions" className="text-ink/50 hover:text-accent transition-colors">
              Predictions
            </Link>
            <Link href="/about" className="text-ink/50 hover:text-accent transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-ink/50 hover:text-accent transition-colors">
              Contact
            </Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink/70 mb-3">Play responsibly</p>
          <p className="text-xs text-ink/40 leading-relaxed">
            Geniuz Prediction operates under Ghana's Gaming Commission
            guidelines. Betting can be addictive — please play responsibly.
            Helpline: 0302 746 682.
          </p>
        </div>
      </div>

      <div className="border-t border-accent/10 py-5 text-center text-xs text-ink/40">
        © {new Date().getFullYear()} Geniuz Prediction. All rights reserved.
      </div>
    </footer>
  );
}
