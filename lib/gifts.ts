import "server-only";
import { randomInt } from "node:crypto";
import type Stripe from "stripe";
import type { User } from "@prisma/client";
import { db } from "./db";
import { GIFTABLE_PLANS, getPlan } from "./plans";
import { grantPass } from "./passes";
import { automaticTaxEnabled, fakeBillingAllowed, planPriceIds, stripe } from "./stripe";
import { giftPurchasedEmail, giftReceivedEmail, sendEmail } from "./email";
import { LIMITS, blockedFor, hit, tooMany } from "./ratelimit";

const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// No 0/O, 1/I/L: codes get read aloud and typed from emails.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newGiftCode() {
  const part = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `CP-${part()}-${part()}-${part()}`;
}

/** Normalize what someone typed: "cp-abcd efgh ijkl" -> "CP-ABCD-EFGH-IJKL". */
export function normalizeCode(raw: string) {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^CP/, "");
  return s.length === 12 ? `CP-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}` : null;
}

/** Start a Stripe Checkout for a gift pass. No account needed; Stripe collects the buyer's email. */
export async function startGiftCheckout(input: { plan: unknown; recipientEmail: unknown; message: unknown; ip: string }) {
  const plan = GIFTABLE_PLANS.find((p) => p.id === String(input.plan ?? ""));
  const recipientEmail = String(input.recipientEmail ?? "").trim().toLowerCase();
  const message = String(input.message ?? "").trim().slice(0, 300) || null;
  if (!plan) return { error: "Choose a gift." } as const;
  if (!EMAIL_RE.test(recipientEmail)) return { error: "Enter the recipient's email address." } as const;

  const key = `gift:${input.ip}`;
  const wait = await blockedFor(key, LIMITS.giftIp);
  if (wait) return { error: tooMany(wait) } as const;
  await hit(key, LIMITS.giftIp);

  if (fakeBillingAllowed()) {
    // Local development only: fulfil instantly without Stripe.
    const id = `fake_gift_${Date.now()}`;
    await createGift({ sessionId: id, paymentIntentId: null, planId: plan.id, purchaserEmail: "buyer@example.com", recipientEmail, message, amountTotal: plan.price * 100 });
    return { url: `/gift/thanks` } as const;
  }

  const price = (await planPriceIds()).get(plan.id);
  if (!price) return { error: "Gifts aren't available right now. Please try again later." } as const;
  const tax = automaticTaxEnabled();
  const metadata = { gift: "1", plan: plan.id, recipientEmail, ...(message ? { message } : {}) };
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: [{ price, quantity: 1 }],
    customer_creation: "always",
    metadata,
    payment_intent_data: { metadata: { gift: "1", plan: plan.id } },
    invoice_creation: { enabled: true, invoice_data: { description: `Gift: ${plan.name} (${plan.days} days of access)` } },
    tax_id_collection: { enabled: true },
    ...(tax ? { automatic_tax: { enabled: true }, billing_address_collection: "required" as const } : {}),
    success_url: `${appUrl()}/gift/thanks`,
    cancel_url: `${appUrl()}/gift`,
  };
  const session = await stripe().checkout.sessions.create(params);
  return { url: session.url! } as const;
}

async function createGift(g: {
  sessionId: string;
  paymentIntentId: string | null;
  planId: string;
  purchaserEmail: string;
  recipientEmail: string;
  message: string | null;
  amountTotal: number;
}) {
  if (await db.giftCode.findUnique({ where: { checkoutSessionId: g.sessionId } })) return null; // repeat webhook
  const plan = getPlan(g.planId);
  if (!plan) throw new Error(`Unknown gift plan ${g.planId}`);
  let gift;
  try {
    gift = await db.giftCode.create({
      data: {
        code: newGiftCode(),
        plan: plan.id,
        purchaserEmail: g.purchaserEmail,
        recipientEmail: g.recipientEmail,
        message: g.message,
        checkoutSessionId: g.sessionId,
        paymentIntentId: g.paymentIntentId,
        amountTotal: g.amountTotal,
      },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return null; // concurrent delivery created it
    throw e;
  }
  const from = g.purchaserEmail || "Someone";
  await sendEmail(giftReceivedEmail(g.recipientEmail, plan.name, gift.code, from, g.message));
  if (g.purchaserEmail) await sendEmail(giftPurchasedEmail(g.purchaserEmail, plan.name, gift.code, g.recipientEmail));
  return gift;
}

/** Called from the webhook for a paid gift Checkout Session. Idempotent per session. */
export async function fulfillGift(s: Stripe.Checkout.Session, planId: string) {
  const recipientEmail = s.metadata?.recipientEmail;
  if (!recipientEmail) throw new Error(`Gift session ${s.id} has no recipient`);
  return createGift({
    sessionId: s.id,
    paymentIntentId: typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent?.id ?? null),
    planId,
    purchaserEmail: s.customer_details?.email ?? "",
    recipientEmail,
    message: s.metadata?.message ?? null,
    amountTotal: s.amount_total ?? 0,
  });
}

/** Full refund of a gift: an unredeemed code stops working (a redeemed one is revoked with its pass). */
export async function voidGiftByPaymentIntent(paymentIntentId: string) {
  return db.giftCode.updateMany({ where: { paymentIntentId, redeemedAt: null, voidedAt: null }, data: { voidedAt: new Date() } });
}

export async function redeemGift(user: User, raw: unknown) {
  const key = `redeem:${user.id}`;
  const wait = await blockedFor(key, LIMITS.redeemUser);
  if (wait) return { error: tooMany(wait) } as const;
  await hit(key, LIMITS.redeemUser);

  const code = normalizeCode(String(raw ?? ""));
  const gift = code ? await db.giftCode.findUnique({ where: { code } }) : null;
  if (!gift || gift.voidedAt) return { error: "That code isn't valid. Check it against your gift email." } as const;
  if (gift.redeemedAt) return { error: gift.redeemedById === user.id ? "You've already redeemed this gift." : "That code has already been redeemed." } as const;

  // Claim atomically so the same code can't be redeemed twice at once.
  const claimed = await db.giftCode.updateMany({ where: { id: gift.id, redeemedAt: null, voidedAt: null }, data: { redeemedAt: new Date(), redeemedById: user.id } });
  if (!claimed.count) return { error: "That code has already been redeemed." } as const;
  // The pass carries the gift's PaymentIntent, so a later refund revokes it like any other pass.
  await grantPass({ userId: user.id, planId: gift.plan, checkoutSessionId: `gift:${gift.code}`, paymentIntentId: gift.paymentIntentId, amountTotal: gift.amountTotal });
  return { ok: true, plan: getPlan(gift.plan)! } as const;
}
