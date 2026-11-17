import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { signup } from "../actions/auth";

export default function SignupPage() {
  return (
    <div className="max-w-sm mx-auto card p-6">
      <h1 className="text-2xl font-bold mb-1">Create your account</h1>
      <p className="muted text-sm mb-4">Free sample questions in every topic. No card required.</p>
      <AuthForm action={signup} mode="signup" />
      <p className="muted text-sm mt-4">
        Have an account? <Link href="/login" className="underline">Log in</Link>
      </p>
    </div>
  );
}
