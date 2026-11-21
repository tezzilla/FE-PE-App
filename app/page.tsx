import Link from "next/link";
import { EXAMS } from "@/lib/content/exams";
import { FLASHCARDS } from "@/lib/content/flashcards";
import { SOLD_PLANS } from "@/lib/plans";
import { Icon } from "@/components/Icon";
import { FAQ } from "@/components/FAQ";
import { ProductPreview } from "@/components/ProductPreview";
import { PriceCompare } from "@/components/PriceCompare";
import { tutorEnabled } from "@/lib/tutor";
import { bankStats } from "@/lib/questions";
import Image from "next/image";
import ContourBackground from "@/components/ContourBackground";
import { FOUNDER } from "@/lib/content/about";

const FEATURES = [
  { icon: "target", title: "Smart practice", text: "Learns which topics you're weak in, weighted by how much they count on the exam, and serves those first. Spaced reviews keep old topics from slipping." },
  { icon: "infinity", title: "Problems that don't run out", text: "Calculation problems get new values every time you see them, so you learn the method instead of memorizing answers. Every answer is checked independently before it goes live." },
  { icon: "timer", title: "Full-length timed exams", text: "110-question FE and 80-question PE simulations at real pacing, with a question navigator, flags, a break, and a by-topic score report." },
  { icon: "chat", title: "AI tutor on every solution", text: "Stuck on why you missed one? Ask follow-up questions after you answer. Explanations stay tied to the verified solution." },
  { icon: "cards", title: "Formula flashcards", text: "The formulas that show up again and again, each with where to find it in the handbook, scheduled so you review right before you'd forget." },
  { icon: "doc", title: "Exam documents and standards", text: "Every official document and PE design standard in one place, marked free or paid, so you know exactly what you need." },
] as const;

const STUDY_PLAN = {
  icon: "calendar",
  title: "A study plan with a deadline",
  text: "Enter your exam date and weekly hours. You get a weekly question target, focus topics, and full practice exams scheduled for you.",
} as const;

const STEPS = [
  { icon: "compass", title: "Take the diagnostic", text: "About 2 questions per topic shows where you stand, so your first study hour goes where it counts." },
  { icon: "target", title: "Practice what moves your score", text: "Smart practice targets weak, high-weight topics. Your readiness score climbs as you improve." },
  { icon: "timer", title: "Prove it under exam conditions", text: "Set your exam date, follow the weekly plan, and take full timed exams 2 weeks and 1 week out." },
] as const;

export default async function Home({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const bank = await bankStats();
  const subs = SOLD_PLANS.filter((p) => p.kind === "subscription");
  const fePlan = subs.find((p) => p.exam === "fe-civil")!;
  const pePlan = subs.find((p) => p.exam === "pe-civil")!;
  const fePass = SOLD_PLANS.find((p) => p.kind === "pass" && p.exam === "fe-civil");
  const pePass = SOLD_PLANS.find((p) => p.kind === "pass" && p.exam === "pe-civil");
  const topicCount = EXAMS["fe-civil"].topics.length + EXAMS["pe-civil"].topics.length;
  // Only advertise the AI tutor when it's switched on.
  const tutor = tutorEnabled();
  const features = FEATURES.map((f) => (tutor || f.icon !== "chat" ? f : STUDY_PLAN));

  const faq = [
    {
      q: "Is CivilPrep enough to pass?",
      a: "Most people pass by doing a lot of exam-style problems with the official reference handbook open, then taking full timed exams. That's what CivilPrep is built around. No prep product can guarantee a pass, so use your readiness score and practice exams to judge when you're ready.",
    },
    {
      q: "Who writes the problems?",
      a: "Every problem is original, written for CivilPrep. Every calculation problem has its answer checked independently before students see it, and you can report any problem you think is wrong from the question itself.",
    },
    { q: "Do I need the NCEES handbook?", a: "Yes, and it's free. Download it from your MyNCEES account and keep it open while you practice. Every solution tells you which section to look in, so you learn to find things fast on exam day." },
    { q: "Can I cancel anytime?", a: "Yes. Cancel online from your account and you keep access until the end of the period you paid for. Passes are a single payment and never renew." },
    { q: "Does it work on my phone?", a: "Yes. Every page is built for phones as well as computers, and your progress follows you between devices." },
    { q: "Is CivilPrep affiliated with NCEES?", a: "No. CivilPrep is independent. FE and PE are exams administered by NCEES." },
  ];

  return (
    <div className="space-y-20 sm:space-y-28">
      {deleted && <div className="card p-4 text-center">Your account has been deleted.</div>}

      {/* Hero */}
      <section className="relative isolate -mx-4 px-4 pt-4 sm:pt-10 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <ContourBackground />
        <div className="space-y-6 enter">
          <p className="eyebrow">FE &amp; PE Civil exam prep</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
            Pass the FE and PE Civil without the <span style={{ color: "var(--brand-text)" }}>$1,000 course</span>
          </h1>
          <p className="muted text-lg sm:text-xl leading-relaxed max-w-xl">
            Practice that adapts to your weak spots, full-length timed exams, and worked solutions that point you to
            the right page of the handbook. From ${fePlan.price}/month.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/signup" className="btn btn-lg">
              Start free <Icon name="arrow" size={18} className="ml-2" />
            </Link>
            <Link href="/pricing" className="btn-ghost btn-lg">See pricing</Link>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm muted">
            {["No credit card to start", "Cancel anytime", "Works on your phone"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <span style={{ color: "var(--good)" }}><Icon name="check" size={16} /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:pl-6 pb-6 enter enter-3">
          <ProductPreview />
        </div>
      </section>

      {/* Proof strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 reveal">
        {[
          ["110 + 80", "question timed FE and PE exams"],
          [String(topicCount), "FE and PE topic areas covered"],
          [String(FLASHCARDS.length), "formula flashcards"],
          // The live bank size once there's a meaningful number of approved problem types.
          bank.generators >= 5
            ? [String(bank.generators), "calculation problems that never repeat"]
            : tutor
              ? ["24/7", "AI tutor on every solution"]
              : ["Free", "sample questions in every topic"],
        ].map(([n, l]) => (
          <div key={l} className="card p-5 text-center">
            <p className="text-3xl font-semibold tracking-tight">{n}</p>
            <p className="muted text-sm mt-1">{l}</p>
          </div>
        ))}
      </section>

      {/* Price comparison */}
      <section className="navy-section rounded-2xl elevated p-6 sm:p-10 reveal">
        <PriceCompare fe={fePlan.price} fePass={fePass?.price} pe={pePlan.price} pePass={pePass?.price} />
      </section>

      {/* How it works */}
      <section className="space-y-8 reveal">
        <div className="text-center space-y-2">
          <p className="eyebrow">How it works</p>
          <h2 className="text-3xl font-semibold tracking-tight">A plan that adjusts to you every day</h2>
        </div>
        <ol className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="icon-tile"><Icon name={s.icon} /></span>
                <span className="muted text-sm font-semibold">Step {i + 1}</span>
              </div>
              <h3 className="font-semibold text-lg">{s.title}</h3>
              <p className="muted text-sm leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section className="space-y-8 reveal">
        <div className="text-center space-y-2">
          <p className="eyebrow">Everything you need</p>
          <h2 className="text-3xl font-semibold tracking-tight">Built for how engineers actually study</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card p-6 space-y-3">
              <span className="icon-tile"><Icon name={f.icon} /></span>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="muted text-sm leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pick your exam */}
      <section className="space-y-8 reveal">
        <div className="text-center space-y-2">
          <p className="eyebrow">Pick your exam</p>
          <h2 className="text-3xl font-semibold tracking-tight">Try free questions in every topic</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {Object.values(EXAMS).map((e) => {
            const plan = e.id === "fe-civil" ? fePlan : pePlan;
            return (
              <Link key={e.id} href={`/exams/${e.id}`} className="card card-link p-6 sm:p-8 flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-2xl font-semibold">{e.name}</h3>
                  <span className="muted text-sm whitespace-nowrap">from ${plan.price}/mo</span>
                </div>
                <p className="muted">{e.description}</p>
                <p className="text-sm">{e.topics.length} topic areas · {e.realExam}</p>
                <span className="mt-auto pt-2 inline-flex items-center gap-1.5 font-semibold" style={{ color: "var(--brand-text)" }}>
                  Explore {e.shortName} <Icon name="arrow" size={16} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <p className="text-center muted -mt-12 sm:-mt-20">
        Prefer paper? Get free{" "}
        <Link href="/free/fe-civil" className="underline font-medium" style={{ color: "var(--brand-text)" }}>FE Civil</Link> or{" "}
        <Link href="/free/pe-civil" className="underline font-medium" style={{ color: "var(--brand-text)" }}>PE Civil</Link> practice problems as a PDF.
      </p>

      {/* Founder */}
      <section className="card p-6 sm:p-10 grid md:grid-cols-[auto_1fr] gap-6 sm:gap-10 items-start reveal">
        <div className="flex md:flex-col items-center gap-4 md:w-48 md:text-center">
          <Image
            src={FOUNDER.photo}
            alt={`Photo of ${FOUNDER.name}`}
            width={240}
            height={240}
            className="shrink-0 rounded-full object-cover w-24 h-24 md:w-36 md:h-36"
            style={{ border: "3px solid var(--brand-soft)" }}
          />
          <div>
            <p className="font-semibold">{FOUNDER.name}</p>
            <p className="muted text-sm">{FOUNDER.role}</p>
          </div>
        </div>
        <div className="space-y-4">
          <p className="eyebrow">Why I built this</p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Made by an engineer who just went through it</h2>
          {FOUNDER.paragraphs.map((t) => (
            <p key={t} className="muted leading-relaxed">{t}</p>
          ))}
          <ul className="flex flex-wrap gap-2 pt-1">
            {FOUNDER.credentials.map((c) => (
              <li key={c} className="inline-flex items-center gap-1.5 text-sm font-medium rounded-full px-3 py-1" style={{ border: "1px solid var(--border)" }}>
                <span style={{ color: "var(--good)" }}><Icon name="check" size={14} /></span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-8 max-w-3xl mx-auto reveal">
        <div className="text-center space-y-2">
          <p className="eyebrow">Questions</p>
          <h2 className="text-3xl font-semibold tracking-tight">Frequently asked</h2>
        </div>
        <FAQ items={faq} />
      </section>

      {/* Final CTA */}
      <section className="navy-section rounded-2xl p-8 sm:p-12 text-center space-y-4 reveal">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Start studying in two minutes</h2>
        <p className="text-lg opacity-90 max-w-xl mx-auto">Create a free account, take the diagnostic, and see exactly where you stand.</p>
        <Link href="/signup" className="btn btn-lg">
          Start free <Icon name="arrow" size={18} className="ml-2" />
        </Link>
      </section>
    </div>
  );
}
