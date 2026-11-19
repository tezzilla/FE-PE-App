import Link from "next/link";
import { requireReviewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { templateReviewStatus, type ReviewStatus } from "@/lib/reviews";
import { TEMPLATES } from "@/lib/templates";
import { EXAMS } from "@/lib/content/exams";
import type { ExamId } from "@/lib/content/types";

export const dynamic = "force-dynamic";

const LABEL: Record<ReviewStatus, { text: string; color: string }> = {
  needs_review: { text: "Needs review", color: "#ca8a04" },
  approved: { text: "Approved, live", color: "#16a34a" },
  rejected: { text: "Rejected", color: "#dc2626" },
  changes_requested: { text: "Changes requested", color: "#ea580c" },
};
const ORDER: ReviewStatus[] = ["needs_review", "changes_requested", "rejected", "approved"];

export default async function ReviewQueue({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await requireReviewer();
  const { saved } = await searchParams;
  const status = await templateReviewStatus();
  const sorted = [...TEMPLATES].sort(
    (a, b) => ORDER.indexOf(status.get(a.id)!.status) - ORDER.indexOf(status.get(b.id)!.status),
  );
  const live = sorted.filter((t) => status.get(t.id)!.status === "approved").length;
  const openReports = await db.problemReport.count({ where: { status: "open" } });

  return (
    <div className="space-y-6">
      {saved && <div className="card p-3">Profile saved.</div>}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold">Review queue</h1>
          <p className="muted">{live} of {TEMPLATES.length} problem templates live for students.</p>
        </div>
        <div className="text-sm text-right">
          <p>Students see: <strong>{user.name ?? user.email}</strong>{user.reviewerCredential ? `, ${user.reviewerCredential}` : ""}</p>
          <Link href="/review/profile" className="underline">Edit how your credential appears</Link>
          <p className="mt-1">
            <Link href="/review/setup" className="underline font-semibold">Site setup</Link>
          </p>
          <p className="mt-1">
            <Link href="/review/funnel" className="underline font-semibold">Signup and purchase funnel</Link>
          </p>
          <p className="mt-1">
            <Link href="/review/reports" className="underline font-semibold">
              Problem reports{openReports ? ` (${openReports} open)` : ""}
            </Link>
          </p>
        </div>
      </div>

      <div className="card p-4 text-sm space-y-1">
        <p className="font-semibold">How review works</p>
        <p className="muted">
          Open a template and solve 3 randomly generated problems by hand, without seeing the answer choices.
          Your answers are compared to the template&apos;s answer (within 2%). You can only approve when all 3 match.
          Then check the wording, the wrong answer choices, and the solution text. Any change to a template&apos;s math sends it back here.
        </p>
      </div>

      <div className="card divide-y" style={{ borderColor: "var(--border)" }}>
        {sorted.map((t) => {
          const s = status.get(t.id)!;
          return (
            <Link key={t.id} href={`/review/${t.id}`} className="p-4 flex flex-wrap items-center gap-3 hover:opacity-80">
              <div className="flex-1 min-w-48">
                <p className="font-semibold">{t.title}</p>
                <p className="muted text-sm">
                  {Object.entries(t.topics).map(([e, topic]) => {
                    const ex = EXAMS[e as ExamId];
                    return `${ex.shortName}: ${ex.topics.find((x) => x.slug === topic)?.name}`;
                  }).join(" · ")} · v{t.version}
                </p>
              </div>
              <span className="text-sm font-semibold" style={{ color: LABEL[s.status].color }}>{LABEL[s.status].text}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
