import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { login } from "../actions/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="max-w-sm mx-auto card p-6">
      <h1 className="text-2xl font-bold mb-4">Log in</h1>
      <AuthForm action={login} mode="login" next={next} />
      <p className="text-sm mt-3"><Link href="/forgot-password" className="underline">Forgot password?</Link></p>
      <p className="muted text-sm mt-2">
        No account? <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="underline">Sign up free</Link>
      </p>
    </div>
  );
}
