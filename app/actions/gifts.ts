"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { clientIp } from "@/lib/ratelimit";
import { redeemGift, startGiftCheckout } from "@/lib/gifts";

export type GiftState = { error?: string } | undefined;

export async function buyGift(_: GiftState, form: FormData): Promise<GiftState> {
  const r = await startGiftCheckout({
    plan: form.get("plan"),
    recipientEmail: form.get("recipientEmail"),
    message: form.get("message"),
    ip: await clientIp(),
  });
  if ("error" in r) return { error: r.error };
  redirect(r.url);
}

export type RedeemState = { error?: string; ok?: string } | undefined;

export async function redeem(_: RedeemState, form: FormData): Promise<RedeemState> {
  const user = await requireUser();
  const r = await redeemGift(user, form.get("code"));
  if ("error" in r) return { error: r.error };
  redirect(`/dashboard?gift=${encodeURIComponent(r.plan.name)}`);
}
