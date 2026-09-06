export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg text-ink pt-12 pb-16">
      <main className="max-w-3xl mx-auto px-5 sm:px-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 text-accent">
          About Geniuz Prediction
        </h1>

        <p className="text-lg leading-relaxed mb-10 text-ink/80">
          Geniuz Prediction is your trusted platform for football
          predictions, stats, and insights. We bring accurate data analysis
          and intelligent algorithms together to give you the edge you need.
        </p>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3">Our mission</h2>
          <p className="leading-relaxed text-ink/70">
            To empower every sports lover and bettor with reliable,
            data-driven insights — helping them make smarter decisions while
            enjoying the thrill of the game.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3">Our vision</h2>
          <p className="leading-relaxed text-ink/70">
            To become Africa's most reliable sports prediction and analytics
            platform — blending technology, passion, and precision.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">Contact us</h2>
          <p className="leading-relaxed text-ink/70 mb-4">
            Got questions or feedback? We'd love to hear from you.
          </p>
          <a
            href="mailto:support@geniuzprediction.com"
            className="inline-flex min-h-[48px] items-center bg-accent text-bg font-semibold px-6 rounded-xl hover:brightness-110 transition"
          >
            Email support
          </a>
        </section>
      </main>
    </div>
  );
}
