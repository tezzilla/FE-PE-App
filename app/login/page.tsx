import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { login } from "../actions/auth";

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto card p-6">
      <h1 className="text-2xl font-bold mb-4">Log in</h1>
      <AuthForm action={login} mode="login" />
      <p className="muted text-sm mt-4">
        No account? <Link href="/signup" className="underline">Sign up free</Link>
      </p>
    </div>
  );
}
