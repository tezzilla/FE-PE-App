import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { db } from "./db";

// Small encrypted key-value store for secrets the app creates itself. AES-256-GCM with a key derived
// from AUTH_SECRET, so a database dump alone doesn't reveal them.

function key() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return createHash("sha256").update(`civilprep-app-secrets:${s}`).digest();
}

export async function saveAppSecret(name: string, plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  const value = [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
  await db.appSecret.upsert({ where: { name }, create: { name, value }, update: { value } });
}

/** Decrypted values of every secret whose name starts with `prefix`, newest first. Unreadable ones are skipped. */
export async function appSecretsWithPrefix(prefix: string): Promise<string[]> {
  const rows = await db.appSecret.findMany({ where: { name: { startsWith: prefix } }, orderBy: { updatedAt: "desc" } });
  const out: string[] = [];
  for (const r of rows) {
    try {
      const [iv, tag, enc] = r.value.split(".").map((p) => Buffer.from(p, "base64"));
      const d = createDecipheriv("aes-256-gcm", key(), iv);
      d.setAuthTag(tag);
      out.push(Buffer.concat([d.update(enc), d.final()]).toString("utf8"));
    } catch {
      console.error(`App secret ${r.name} could not be decrypted (AUTH_SECRET changed?)`);
    }
  }
  return out;
}

export const WEBHOOK_SECRET_PREFIX = "stripe_webhook_secret:";
