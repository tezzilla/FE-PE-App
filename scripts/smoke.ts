// End-to-end smoke test against a running server (CI runs it after `next build && next start`).
//
//   BASE_URL=http://localhost:3000 CRON_SECRET=... STRIPE_WEBHOOK_SECRET=whsec_... npx tsx scripts/smoke.ts
//
// Uses plain HTTP: the app's signed token works as both the mobile bearer token and the web "session"
// cookie, so no browser is needed. Creates one throwaway account on an undeliverable address.
import Stripe from "stripe";

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
let failures = 0;
const check = (ok: unknown, label: string, detail = "") => {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}${!ok && detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
};
const get = (path: string, init: RequestInit = {}) => fetch(BASE + path, { redirect: "manual", ...init });

async function main() {
  // Public pages
  for (const path of ["/", "/pricing", "/learn", "/learn/mannings-equation", "/exams/fe-civil", "/exams/pe-civil", "/exams/pe-civil/modules/water-env", "/exams/fe-civil/handbook-drill"]) {
    const r = await get(path);
    check(r.status === 200, `GET ${path} is 200`, String(r.status));
  }
  const sitemap = await (await get("/sitemap.xml")).text();
  check(sitemap.includes("/learn/"), "sitemap lists formula guides");
  const missing = await get("/no-such-page-here");
  check(missing.status === 404 && (await missing.text()).includes("find that page"), "unknown page shows the friendly 404");

  // Account via the mobile API; its token also works as the web session cookie
  const email = `smoke-${Date.now()}@example.com`;
  const auth = await get("/api/mobile/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "signup", email, password: "smoke-password-1" }) });
  const { token } = (await auth.json()) as { token?: string };
  check(auth.status === 200 && token, "sign up through the app API", String(auth.status));
  if (!token) return;
  const bearer = { Authorization: `Bearer ${token}` };
  const cookie = { Cookie: `session=${token}` };

  const me = await get("/api/mobile/me", { headers: bearer });
  check(me.status === 200 && ((await me.json()) as { exams?: unknown[] }).exams?.length === 2, "app home data loads");

  const dash = await get("/dashboard", { headers: cookie });
  check(dash.status === 200 && (await dash.text()).includes("Welcome"), "signed-in dashboard renders");

  // Practice: load a smart session and answer one question
  const smart = (await (await get("/api/mobile/smart?exam=fe-civil", { headers: bearer })).json()) as { questions?: { id: string }[] };
  check(smart.questions?.length, "smart practice returns questions");
  if (smart.questions?.length) {
    const ans = await get("/api/mobile/answer", { method: "POST", headers: { ...bearer, "Content-Type": "application/json" }, body: JSON.stringify({ questionId: smart.questions[0].id, selected: 0, timeMs: 30000 }) });
    const fb = (await ans.json()) as { correct?: boolean };
    check(ans.status === 200 && typeof fb.correct === "boolean", "answering a question is graded");
  }
  for (const path of ["/api/mobile/learn", "/api/mobile/handbook-drill?exam=pe-civil"]) {
    const r = await get(path, { headers: bearer });
    check(r.status === 200, `GET ${path} is 200`, String(r.status));
  }

  // Checkout must always redirect (to Stripe, or back to Pricing with a message), never show a raw error
  const co = await get("/api/stripe/checkout", { method: "POST", headers: cookie, body: new URLSearchParams({ plan: "fe-civil" }) });
  const loc = co.headers.get("location") ?? "";
  check(co.status === 303 && (loc.startsWith("https://checkout.stripe.com") || loc.includes("/pricing")), "checkout redirects instead of erroring", `${co.status} ${loc}`);

  const beacon = await get("/api/funnel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "pricing_view" }) });
  check(beacon.status === 200, "pricing view beacon accepted");
  const badBeacon = await get("/api/funnel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "purchase" }) });
  check(badBeacon.status === 400, "beacon refuses server-only steps");

  // Stripe webhook: unsigned is refused; a correctly signed event is accepted
  const payload = JSON.stringify({ id: "evt_smoke", object: "event", type: "customer.created", data: { object: {} } });
  const unsigned = await get("/api/stripe/webhook", { method: "POST", body: payload, headers: { "stripe-signature": "t=1,v1=bad" } });
  check(unsigned.status === 400, "webhook refuses a bad signature");
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    const header = new Stripe("sk_test_unused").webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
    const signed = await get("/api/stripe/webhook", { method: "POST", body: payload, headers: { "stripe-signature": header, "Content-Type": "application/json" } });
    check(signed.status === 200, "webhook accepts a signed event", String(signed.status));
  }

  // Daily cron: locked without the secret; runs reminders and the welcome series with it
  check((await get("/api/cron/pass-reminders")).status === 401, "cron refuses unauthenticated calls");
  if (process.env.CRON_SECRET) {
    const cron = await get("/api/cron/pass-reminders", { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
    const body = (await cron.json()) as { welcome?: unknown; skipped?: string };
    check(cron.status === 200 && (body.welcome !== undefined || body.skipped), "daily cron runs", JSON.stringify(body));
  }
}

main()
  .catch((e) => {
    console.error(e);
    failures++;
  })
  .finally(() => {
    console.log(failures ? `\n${failures} check(s) failed` : "\nAll smoke checks passed");
    process.exit(failures ? 1 : 0);
  });
