import "server-only";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set to at least 32 characters");
  return new TextEncoder().encode(s);
}

/** Signed session token. Used as the web cookie value and as the mobile app's bearer token. */
export async function createToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function createSession(userId: string) {
  const token = await createToken(userId);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

async function bearerToken() {
  return /^Bearer (.+)$/.exec((await headers()).get("authorization") ?? "")?.[1];
}

/** The signed-in user, from the web session cookie or a mobile `Authorization: Bearer` token. */
export async function getCurrentUser() {
  return userFromToken((await bearerToken()) ?? (await cookies()).get(COOKIE)?.value);
}

/** Mobile API routes accept only bearer tokens, never cookies, so cross-origin access can't ride a browser session. */
export async function getBearerUser() {
  return userFromToken(await bearerToken());
}

async function userFromToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return await db.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function isReviewer(user: { role: string } | null) {
  return !!user && (user.role === "reviewer" || user.role === "admin");
}

/** Reviewer-only pages 404 for everyone else so the area isn't advertised. */
export async function requireReviewer() {
  const user = await requireUser();
  if (!isReviewer(user)) notFound();
  return user;
}
