import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";
import type { Response, Request } from "express";
import * as db from "./db";

const scrypt = promisify(scryptCallback);
const COOKIE = "vedic_local_session";
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "development-only-local-auth-secret");

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

function cookieValue(req: Request, key: string) {
  const target = `${key}=`;
  return (req.headers.cookie || "").split(";").map(item => item.trim()).find(item => item.startsWith(target))?.slice(target.length);
}

export async function setLocalSession(res: Response, userId: number) {
  const token = await new SignJWT({ scope: "vedic-local" }).setProtectedHeader({ alg: "HS256" }).setSubject(String(userId)).setIssuedAt().setExpirationTime("30d").sign(secret);
  res.cookie(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60 * 1000 });
}

export function clearLocalSession(res: Response) { res.clearCookie(COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" }); }

export async function getLocalSessionUser(req: Request) {
  const token = cookieValue(req, COOKIE);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.scope !== "vedic-local" || !payload.sub) return null;
    return (await db.getUserById(Number(payload.sub))) ?? null;
  } catch { return null; }
}
