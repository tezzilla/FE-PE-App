import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { Icon } from "@/components/Icon";
import { signup } from "../actions/auth";

const PERKS = [
  "Free sample questions in all FE and PE Civil topics",
  "A diagnostic that finds your weak spots",
  "Readiness score and topic-by-topic progress",
  "Upgrade only if you like it. No card needed now.",
];

export default function SignupPage() {
  return (
    <div className="grid md:grid-cols-2 gap-10 items-center max-w-4xl mx-auto md:pt-6">
      <div className="space-y-5 order-2 md:order-1">
        <p className="eyebrow">Free account</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Find out where you stand today</h1>
        <ul className="space-y-3">
          {PERKS.map((p) => (
            <li key={p} className="flex gap-3">
              <span className="mt-0.5 shrink-0" style={{ color: "var(--good)" }}><Icon name="check" /></span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="card elevated p-6 sm:p-8 order-1 md:order-2">
        <h2 className="text-2xl font-bold mb-1">Create your account</h2>
        <p className="muted text-sm mb-4">Takes about a minute.</p>
        <AuthForm action={signup} mode="signup" />
        <p className="muted text-xs mt-3">
          By creating an account you agree to the <Link href="/terms" className="underline">Terms of Service</Link> and{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
        <p className="muted text-sm mt-4">
          Have an account? <Link href="/login" className="underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
