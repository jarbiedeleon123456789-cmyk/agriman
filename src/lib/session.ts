import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { farmers, users } from "@/db/mysql-schema";

const COOKIE = "agrishare_session";
const SECRET = process.env.SESSION_SECRET ?? "agrishare-baco-oriental-mindoro-dev-secret";

export type Role =
  | "admin"
  | "staff"
  | "farmer"
  | "association"
  | "barangay"
  | "operator"
  | "auditor";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "MAO Administrator",
  staff: "MAO Staff / Coordinator",
  farmer: "Farmer",
  association: "Association Officer",
  barangay: "Barangay Representative",
  operator: "Driver / Operator",
  auditor: "System Auditor",
};

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  barangayId: number | null;
  status: string;
  avatarEmoji: string;
  farmerId: number | null;
};

/* -------------------------- password hashing -------------------------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/* ------------------------------ sessions ------------------------------ */

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

export async function createSession(userId: number) {
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 14;
  const payload = `${userId}.${expires}`;
  const token = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

function parseToken(token: string | undefined): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, expires, signature] = parts;
  if (sign(`${id}.${expires}`) !== signature) return null;
  if (Number(expires) < Date.now()) return null;
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const userId = parseToken(store.get(COOKIE)?.value);
  if (!userId) return null;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      barangayId: users.barangayId,
      status: users.status,
      avatarEmoji: users.avatarEmoji,
      farmerId: farmers.id,
    })
    .from(users)
    .leftJoin(farmers, eq(farmers.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);

  const row = rows[0];
  if (!row || row.status !== "Active") return null;
  return { ...row, role: row.role as Role };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export const MAO_ROLES: Role[] = ["admin", "staff"];

export function isMao(role: Role) {
  return role === "admin" || role === "staff";
}

export function canManage(role: Role) {
  return isMao(role);
}
