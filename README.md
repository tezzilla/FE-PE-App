# CivilPrep: FE & PE Civil exam prep

Subscription web app that replaces $1,000+ prep courses with a monthly plan. Starts with FE Civil and PE Civil.

## What works now

- Email/password accounts (bcrypt + signed httpOnly session cookie)
- Topic-based practice following the NCEES exam specs, with worked solutions and handbook references
- Timed mock exams paced like the real CBT (FE: 320 min / 110 q, PE: 6 min / q), flagging, review mode
- Progress dashboard: accuracy per topic, mock exam history
- Free tier: one sample question per topic. Paid plans unlock the full bank and mock exams
- Stripe Checkout subscriptions, Customer Portal, and webhook sync
- Answers and explanations never reach the browser until the server grades them, so the paywall can't be bypassed from the client

## Mobile app

`mobile/` is an Expo (React Native) app for iOS and Android that shares this backend through `/api/mobile/*`. Those routes accept only `Authorization: Bearer` tokens (never cookies), so CORS is open on them only. See `mobile/README.md`.

The website also works on phones: bottom tab bar under 640px wide, and a web app manifest for Add to Home Screen.

## Run locally

```bash
npm install
cp .env.example .env        # set AUTH_SECRET to 32+ random chars
npx prisma db push          # creates prisma/dev.db (SQLite)
npm run dev                 # http://localhost:3000
npm run test:content        # validates the question bank
```

With `STRIPE_SECRET_KEY` empty and in dev mode, the Subscribe button activates a plan instantly (fake billing) so you can test paid features. This is disabled in production.

## Plans (edit `lib/plans.ts`)

| Plan | Price | Includes |
|---|---|---|
| FE Civil | $29/mo | FE Civil bank + mocks |
| PE Civil | $49/mo | PE Civil bank, all 5 depth modules + mocks |
| All Access | $59/mo | Both, plus future disciplines |

Displayed prices are in code; the charged price lives in Stripe.

## Going live checklist

Step-by-step hosting instructions (Vercel + Neon Postgres) are in **DEPLOY.md**. Summary:

1. **Hosting and database:** Vercel project with build command `npm run vercel-build`, Neon Postgres attached, and `AUTH_SECRET`, `APP_URL`, `REVIEWER_EMAILS` set. Production uses Postgres automatically; local development stays on SQLite.
2. **Stripe:** see **docs/STRIPE.md**. `npm run stripe:setup` creates products, prices (found by lookup key), the webhook and the Customer Portal; then set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Stripe Tax needs a head office address and registrations before `STRIPE_AUTOMATIC_TAX=true`.
3. **Legal:** draft Terms of Service and Privacy Policy are at `/terms` and `/privacy` (`app/terms`, `app/privacy`). Have a lawyer review them, set `CONTACT_EMAIL`, and keep the "not affiliated with NCEES" notice.
4. **Security:** login and signup are rate-limited (`lib/ratelimit.ts`: 8 failed logins per account per 15 min, 100 attempts per IP per 15 min, 20 signups per IP per hour). Plan the Next.js 16 / Prisma 7 upgrades (current `npm audit` findings are in build-time tooling only).

## Adaptive engine (Smart practice)

`lib/adaptive/model.ts` is pure logic; `lib/adaptive/server.ts` connects it to the database. All state is computed from the answer history, so there is nothing extra to keep in sync.

- **Topic mastery:** recency-weighted accuracy (21-day half-life) with a pessimistic prior (40%), so unpracticed topics count as weak.
- **Spaced repetition per problem type:** all variants of a template are one skill. A miss comes back in 15 min with new numbers; streaks push reviews out to 1, 3, 7, 21, 60 days. A missed fixed question waits a day, because repeating it sooner tests memory of the answer, not the method.
- **Session planner (10 questions):** up to 30% due reviews, then topics sampled by exam weight × (1 − mastery), preferring problem types you recently missed, then unseen ones. Topics are interleaved. Each question shows "Why this question".
- **Readiness:** exam-weighted mastery plus coverage, with the 3 topics where improvement is worth the most. Shown on the dashboard and exam pages. It is not a pass prediction.
- **PE depth module:** choosing one weights it at 60% of PE readiness (50% depth + its share of breadth), other areas 10% each.

`npm run test:adaptive` runs unit checks and a simulated student who is weak in half the topics. With templates in every topic, the engine gives weak topics about 3.6× the practice of strong ones (per unit of exam weight), brings back about 84% of missed problem types within 2 days, and estimates readiness within about 5 points (slightly conservative).

**Content limits adaptivity.** On today's content (templates only in water resources and fluids), weak topics run out of fresh material and the targeting mostly disappears. Every topic needs templates.

## Problem generators (templates)

A template is code that generates unlimited numeric variants of one problem type. The answer is computed, so every variant is correct if the template is. Wrong choices come from specific common mistakes, documented in a comment next to each one.

- Templates live in `lib/templates/`. Water Resources & Environmental is first (12 templates).
- `npm run test:templates` generates 2,000 variants per template and checks they are well-formed.
- **Nothing reaches students until a reviewer approves it.** Unapproved templates can't be served or graded.

### Review workflow

1. Sign up on the site, then make yourself a reviewer:
   `npm run make-reviewer -- you@example.com "Passed the FE and PE Civil: Water Resources & Environmental"`
2. Go to **Review** in the nav. Open a template and solve 3 random variants by hand, with the answer choices hidden.
3. Your answers are compared to the template's (2% tolerance). Approval is only possible if all 3 match.
4. Check wording, wrong choices, and the solution, then approve, request changes, or reject (notes required).
5. Approved templates immediately appear in practice and mock exams for subscribers, with "Problem type reviewed by <name>, <credential>".

Bumping a template's `version` after changing its math or wording sends it back to the queue.

Credential wording: until your license is issued, don't use "P.E." Update it at **Review → Edit how your credential appears** once licensed; every reviewed problem picks up the change.

## Adding questions

Questions live in `lib/content/fe-civil.ts` and `lib/content/pe-civil.ts`. Each has `topic`, `prompt`, `choices`, `answer` (index), `explanation`, optional `reference` and `free`. Run `npm run test:content` after editing.

**Content must be original.** NCEES practice exams and commercial course problems are copyrighted. Write new problems against the published exam specifications.

## Roadmap

- Templates for the other topics (statics, mechanics, geotech, structural, transportation, construction), each reviewed by someone qualified in that area
- AI tutor grounded in the verified solution
- Review the 44 hand-written questions through the same workflow
- Report-an-error button for students
- Figures/diagrams and LaTeX math rendering in questions
- Video or written lessons per topic
- Spaced-repetition review of missed questions
- PE depth-module filter and breadth/depth split in mock exams
- Password reset and email verification (needs an email provider, e.g. Resend or Postmark)
- Annual plan discount, free trial
- Other disciplines (Mechanical, Electrical, Environmental)
