import Link from "next/link";
import { requireReviewer } from "@/lib/auth";
import { updateReviewerProfile } from "../actions";

export default async function ReviewerProfile() {
  const user = await requireReviewer();
  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Link href="/review" className="muted text-sm hover:underline">← Review queue</Link>
      <h1 className="text-2xl font-semibold">How students see you</h1>
      <form action={updateReviewerProfile} className="card p-5 space-y-4">
        <label className="block">
          <span className="text-sm">Display name (shown to students; your email never is)</span>
          <input name="name" defaultValue={user.name ?? ""} className="input mt-1" />
        </label>
        <label className="block">
          <span className="text-sm">Credential</span>
          <input
            name="credential"
            defaultValue={user.reviewerCredential ?? ""}
            className="input mt-1"
            placeholder="Passed the FE and PE Civil: Water Resources & Environmental"
          />
        </label>
        <p className="muted text-sm">
          Only list credentials you hold today. Do not use &quot;P.E.&quot; until your license is issued.
          Once it is, update this field and every reviewed problem shows the new credential.
        </p>
        <button className="btn">Save</button>
      </form>
    </div>
  );
}
