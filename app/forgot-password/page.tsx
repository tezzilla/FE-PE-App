import Link from "next/link";
import { ForgotForm } from "@/components/ResetForms";

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-sm mx-auto card p-6 space-y-4">
      <h1 className="text-2xl font-bold">Forgot your password?</h1>
      <p className="muted text-sm">Enter your account email and we&apos;ll send you a link to choose a new one.</p>
      <ForgotForm />
      <p className="muted text-sm"><Link href="/login" className="underline">Back to log in</Link></p>
    </div>
  );
}
