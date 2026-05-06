import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-in-production-please";
const COOKIE_NAME = "rfu_session";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionUser {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user";
  displayName: string | null;
}

export function signToken(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, user: SessionUser) {
  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME);
}

export function getUserFromRequest(req: Request): SessionUser | null {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  return verifyToken(token);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerUser(opts: {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  role?: "admin" | "user";
}): Promise<SessionUser> {
  const passwordHash = await hashPassword(opts.password);
  const [user] = await db
    .insert(users)
    .values({
      username: opts.username.toLowerCase().trim(),
      email: opts.email.toLowerCase().trim(),
      passwordHash,
      displayName: opts.displayName ?? opts.username,
      role: opts.role ?? "user",
    })
    .returning();
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role as "admin" | "user",
    displayName: user.displayName,
  };
}

export async function loginUser(
  usernameOrEmail: string,
  password: string
): Promise<SessionUser | null> {
  const lower = usernameOrEmail.toLowerCase().trim();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, lower))
    .limit(1);

  const found =
    user ??
    (await db
      .select()
      .from(users)
      .where(eq(users.email, lower))
      .limit(1)
      .then((r) => r[0]));

  if (!found) return null;
  const ok = await verifyPassword(password, found.passwordHash);
  if (!ok) return null;

  // Update last signed in
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, found.id));

  return {
    id: found.id,
    username: found.username,
    email: found.email,
    role: found.role as "admin" | "user",
    displayName: found.displayName,
  };
}
