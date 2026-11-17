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

1. **Database:** change `provider` in `prisma/schema.prisma` to `postgresql`, point `DATABASE_URL` at a hosted Postgres (Neon, Supabase, RDS), run `npx prisma db push`.
2. **Stripe:** create 3 recurring monthly Prices, put their IDs in `STRIPE_PRICE_*`. Add a webhook endpoint at `https://<domain>/api/stripe/webhook` for `checkout.session.completed` and `customer.subscription.created/updated/deleted`, put the signing secret in `STRIPE_WEBHOOK_SECRET`. Enable the Customer Portal in the Stripe dashboard.
3. **Hosting:** deploy to Vercel (or any Node host). Set `APP_URL` and a strong `AUTH_SECRET`.
4. **Legal:** Terms of Service, Privacy Policy, refund policy. Keep the "not affiliated with NCEES" notice.

## Adding questions

Questions live in `lib/content/fe-civil.ts` and `lib/content/pe-civil.ts`. Each has `topic`, `prompt`, `choices`, `answer` (index), `explanation`, optional `reference` and `free`. Run `npm run test:content` after editing.

**Content must be original.** NCEES practice exams and commercial course problems are copyrighted. Write new problems against the published exam specifications.

## Roadmap

- Content: grow to 500+ FE and 400+ PE questions; this is the real product and the main cost
- Figures/diagrams and LaTeX math rendering in questions
- Video or written lessons per topic
- Spaced-repetition review of missed questions
- PE depth-module filter and breadth/depth split in mock exams
- Password reset and email verification (needs an email provider, e.g. Resend or Postmark)
- Annual plan discount, free trial
- Other disciplines (Mechanical, Electrical, Environmental)
