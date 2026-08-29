"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, comparePassword, createSessionCookie, destroySessionCookie, getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function registerUser(formData: FormData) {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;
  const inviteToken = (formData.get("inviteToken") as string)?.trim();

  const parsed = RegisterSchema.safeParse({ name, email, password });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await hashPassword(password);
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      avatar,
    },
  });

  // If registering via an invitation link, join invited room as MEMBER directly
  if (inviteToken) {
    const invitation = await prisma.invitation.findUnique({
      where: { token: inviteToken },
      include: { group: true },
    });

    if (invitation && invitation.expiresAt >= new Date() && !invitation.acceptedAt) {
      await prisma.groupMember.create({
        data: {
          groupId: invitation.groupId,
          userId: user.id,
          role: invitation.role, // Defaults to "MEMBER"
          status: "ACTIVE",
        },
      });

      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      await prisma.auditLog.create({
        data: {
          groupId: invitation.groupId,
          userId: user.id,
          action: "MEMBER_JOIN",
          entityType: "User",
          entityId: user.id,
          metadata: JSON.stringify({ role: invitation.role }),
        },
      });

      await createSessionCookie(user.id);
      return { success: true, groupId: invitation.groupId };
    }
  }

  // Create default group ONLY for standalone users registering without an invite
  const group = await prisma.group.create({
    data: {
      name: `${name.trim()}'s Apartment`,
      description: "Default room expense tracking group",
      createdBy: user.id,
      currency: "INR",
      members: {
        create: {
          userId: user.id,
          role: "ADMIN",
          status: "ACTIVE",
        },
      },
    },
  });

  // Create default categories for the new group
  const defaultCats = [
    { name: "Food", icon: "Utensils" },
    { name: "Groceries", icon: "ShoppingCart" },
    { name: "Rent", icon: "Home" },
    { name: "Electricity", icon: "Zap" },
    { name: "Internet", icon: "Wifi" },
    { name: "Other", icon: "MoreHorizontal" },
  ];

  await prisma.category.createMany({
    data: defaultCats.map((c) => ({ groupId: group.id, name: c.name, icon: c.icon })),
  });

  await createSessionCookie(user.id);
  return { success: true, groupId: group.id };
}

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const inviteToken = (formData.get("inviteToken") as string)?.trim();

  const parsed = LoginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    return { error: "Invalid email or password" };
  }

  const validPassword = await comparePassword(password, user.passwordHash);
  if (!validPassword) {
    return { error: "Invalid email or password" };
  }

  await createSessionCookie(user.id);

  // If logging in via invitation link, join invited group as MEMBER
  if (inviteToken) {
    const invitation = await prisma.invitation.findUnique({
      where: { token: inviteToken },
    });

    if (invitation && invitation.expiresAt >= new Date() && !invitation.acceptedAt) {
      await prisma.groupMember.upsert({
        where: { groupId_userId: { groupId: invitation.groupId, userId: user.id } },
        create: {
          groupId: invitation.groupId,
          userId: user.id,
          role: invitation.role,
          status: "ACTIVE",
        },
        update: {
          status: "ACTIVE",
          role: invitation.role,
        },
      });

      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return { success: true, groupId: invitation.groupId };
    }
  }

  // Find user's first active group
  const membership = await prisma.groupMember.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    select: { groupId: true },
  });

  return { success: true, groupId: membership?.groupId };
}

export async function logoutUser() {
  await destroySessionCookie();
  redirect("/login");
}

export async function getCurrentUser() {
  return await getSessionUser();
}
