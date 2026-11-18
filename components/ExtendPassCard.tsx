import type { User } from "@prisma/client";
import { EXAMS } from "@/lib/content/exams";
import type { ExamId } from "@/lib/content/types";
import { extensionOffer } from "@/lib/extensions";

/** "Your pass ends soon: extend 30 days" for pass holders near (or past) the end of their access. */
export async function ExtendPassCard({ user }: { user: User }) {
  const offers = (await Promise.all((["fe-civil", "pe-civil"] as ExamId[]).map((e) => extensionOffer(user, e)))).filter((o) => o !== null);
  if (!offers.length) return null;
  return (
    <div id="extend" className="space-y-3">
      {offers.map((o) => {
        const ended = o.daysLeft <= 0;
        const date = o.until.toLocaleDateString("en-US", { month: "long", day: "numeric" });
        return (
          <div key={o.exam} className="card p-4 sm:p-5 flex flex-wrap items-center gap-4" style={{ borderColor: "var(--brand)" }}>
            <div className="flex-1 min-w-56">
              <p className="font-semibold">
                {ended
                  ? `Your ${EXAMS[o.exam].name} pass ended ${date}.`
                  : `Your ${EXAMS[o.exam].name} pass ends ${date} (${o.daysLeft} day${o.daysLeft === 1 ? "" : "s"} left).`}
              </p>
              <p className="muted text-sm">
                Exam later than that? Add 30 days for ${o.plan.price}. One payment, no renewal, and your progress stays put.
              </p>
            </div>
            <form action="/api/stripe/checkout" method="POST" className="w-full sm:w-auto">
              <input type="hidden" name="plan" value={o.plan.id} />
              <button className="btn w-full">Extend 30 days for ${o.plan.price}</button>
            </form>
          </div>
        );
      })}
    </div>
  );
}
