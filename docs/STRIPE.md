# Stripe integration: plan and status

Products: **Billing** (subscriptions), **Invoicing** (receipts now, firm invoicing later), **Tax** (US sales tax).
Built against Stripe API `2026-10-28.endive` with `stripe` (Node) 23.1.0, following Stripe's
best-practices guidance in `.agents/skills/stripe-best-practices` (installed from docs.stripe.com).

## How it works

| Piece | Where | Notes |
|---|---|---|
| Plans | `lib/plans.ts` | Monthly subscriptions and one-time passes, each with a Price **lookup key**. Products are tagged `civilprep_plan`, so subscribers on an old price keep their plan after a price change. |
| Stripe client | `lib/stripe.ts` | API version pinned. fetch-based HTTP client. Price lookups and portal config cached 5 min. |
| Subscribe | `app/api/stripe/checkout/route.ts` | Checkout Session, `mode: subscription`. Stripe picks payment methods (none hard-coded). Tax ID collection on (for firms paying for staff). Automatic tax behind `STRIPE_AUTOMATIC_TAX`. Tagged with `integration_identifier`. |
| Manage billing | `app/api/stripe/portal/route.ts` | Customer Portal: cancel at period end, switch plans (prorated), update card, address and tax ID, invoice history. |
| Webhook | `app/api/stripe/webhook/route.ts` | Events in `lib/stripe-events.ts`. Re-reads the subscription from Stripe on every event (safe against out-of-order delivery) and maps the user by Customer ID and the plan by **Price**, not metadata. Returns 500 on failure so Stripe retries. |
| Setup | `scripts/stripe-setup.ts` (`npm run stripe:setup`) | Creates or updates products, prices, the webhook endpoint and the portal from the code. Safe to re-run. Refuses live mode without `--live`. Never creates tax registrations. |

### Webhook events handled
- `checkout.session.completed`, `customer.subscription.created/updated/deleted`: sync plan, status, renewal date.
- `checkout.session.completed` / `checkout.session.async_payment_succeeded` for passes: grant the pass once
  `payment_status` is `paid` (plan taken from the Price actually paid; idempotent per session).
- `invoice.paid`, `invoice.payment_failed`: renewals and failed payments (`active` / `past_due` decides access).
- `charge.refunded`: a full refund of a pass revokes it.
- `charge.refunded`, `charge.dispute.created`, `radar.early_fraud_warning.created`: resolved to the
  subscription and user through invoice payments and logged as `stripeRisk` JSON lines (see Vercel logs).
  Respond to disputes in the Stripe Dashboard. For early fraud warnings, consider refunding and canceling.

## Environment variables

| Name | Required | Value |
|---|---|---|
| `STRIPE_SECRET_KEY` | yes | Sandbox `sk_test_...` for testing. In production prefer a **restricted key** (`rk_live_...`, below). |
| `STRIPE_WEBHOOK_SECRET` | yes | `whsec_...` from Dashboard > Developers > Webhooks > your endpoint > Signing secret. |
| `STRIPE_AUTOMATIC_TAX` | after tax setup | `true` turns on Stripe Tax in Checkout. Leave unset until Tax settings are active (see below), or Checkout fails. |
| `STRIPE_PRICE_*` | no | Optional overrides. Normally prices are found by lookup key. |

Mark the Stripe values as **Sensitive** in Vercel so they are write-only.

### Restricted key for production
Create a restricted key (Dashboard > Developers > API keys > Create restricted key) with only:
Checkout Sessions **write**, Customers **write**, Customer portal **write**, Subscriptions **read**,
Prices **read**, Products **read**, Invoices **read**, Charges **read**, PaymentIntents **read**.
Test in a sandbox first; a 403 in the logs means a missing permission.

## Stripe Tax: status and remaining steps
Configured: every product uses tax code `txcd_20060058` ("Training Services - Self-study Web-based",
chosen by the owner from [Stripe's tax codes](https://docs.stripe.com/tax/tax-codes)), and prices are
**tax-exclusive** ($29 + tax where tax applies).

Not done yet, and only the owner can do these:
1. **Head office address:** Dashboard > Tax > Settings. Until set, Stripe can't calculate tax at all
   (verified: a test calculation is refused).
2. **Registrations:** add each state where you are registered to collect sales tax (Dashboard > Tax >
   Locations). Adding one in Stripe records an existing registration; it doesn't register you with the
   state. Stripe's "Register for me" can file registrations for eligible US sellers. With no
   registration, Stripe collects **no tax** and shows no error. Ask a tax advisor which states apply.
3. Set `STRIPE_AUTOMATIC_TAX=true` in Vercel and redeploy.
4. Verify: run a sandbox Tax Calculation for an address in a registered state and check
   `taxability_reason` isn't `not_collecting`.
5. Threshold monitoring (Dashboard > Tax > Locations > Needs attention) tracks where live sales may
   create new obligations. It ignores sandbox activity.

## Invoicing
**Now (individuals):** every subscription payment creates a Stripe invoice. Customers see and download
them under Manage billing > invoice history. Turn on emailed receipts in Dashboard > Settings >
Customer emails ("Successful payments"). Firms reimbursing an employee can have their business name and
tax ID printed (tax ID collection is on in Checkout).

**Later (firms buying seats):** a separate project.
- App: a Team (organization) model, an admin who invites employees by email, seat count = members.
- Stripe: one Customer per firm; a Subscription with `collection_method: send_invoice`,
  `days_until_due: 30`, `quantity` = seats, on the existing prices (or a per-seat price). Pay by ACH or
  card on the hosted invoice page. `automatic_tax` on invoices once tax is active.
- Webhooks: the same handlers; `past_due` when an invoice passes its due date.
- Sales: quotes (Stripe Quotes) for larger firms if needed.

## Mobile app
The app sells nothing and holds no Stripe keys. Users subscribe on the website and the app unlocks
content. Selling inside the iOS or Android app is subject to Apple and Google payment rules; decide on
that before adding any purchase flow to the app.

## Before taking real money
1. Repeat the setup in live mode: `STRIPE_SECRET_KEY=<live key> APP_URL=https://... npm run stripe:setup -- --live`
   (with `NODE_USE_ENV_PROXY=1` only if your network needs a proxy). Then copy the live webhook's signing
   secret into Vercel.
2. Use a restricted live key, mark env vars Sensitive, and enable passkey or authenticator-app 2FA on
   the Stripe account.
3. Complete Stripe Tax in live mode (sandbox tax settings and registrations don't carry over).
4. Review Stripe's [go-live checklist](https://docs.stripe.com/get-started/checklist/go-live).
