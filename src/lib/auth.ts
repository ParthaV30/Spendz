import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "roommate-super-secret-jwt-key-change-in-production-2026"
);

const COOKIE_NAME = "roommate_session";

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function createSessionCookie(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function destroySessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const verified = await jwtVerify(token, JWT_SECRET);
    const userId = verified.payload.userId as string;

    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Authorization Guard: Verifies that the current logged-in user belongs to the specified group.
 * Throws an error or returns membership if authorized.
 */
export async function verifyGroupMembership(groupId: string) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: User is not authenticated");
  }

  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!membership || membership.status !== "ACTIVE") {
    throw new Error("FORBIDDEN: You are not an active member of this group");
  }

  return { user, membership };
}

/**
 * Authorization Guard for Admin actions in a group
 */
export async function verifyGroupAdmin(groupId: string) {
  const { user, membership } = await verifyGroupMembership(groupId);
  if (membership.role !== "ADMIN") {
    throw new Error("FORBIDDEN: Admin privileges required for this action");
  }
  return { user, membership };
}
