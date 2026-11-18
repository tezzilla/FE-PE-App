// Webhook events the site acts on. The endpoint in Stripe must be subscribed to exactly these
// (scripts/stripe-setup.ts configures it from this list).
export const HANDLED_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "charge.refunded",
  "charge.dispute.created",
  "radar.early_fraud_warning.created",
] as const;
