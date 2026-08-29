"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateUserProfile(name: string, avatar: string, newPassword?: string) {
  const user = await getSessionUser();
  if (!user) return { error: "UNAUTHORIZED" };

  if (!name || name.trim().length < 2) {
    return { error: "Name must be at least 2 characters long" };
  }

  const updateData: { name: string; avatar?: string | null; passwordHash?: string } = {
    name: name.trim(),
    avatar: avatar?.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
  };

  if (newPassword && newPassword.trim().length > 0) {
    if (newPassword.trim().length < 6) {
      return { error: "New password must be at least 6 characters long" };
    }
    updateData.passwordHash = await hashPassword(newPassword.trim());
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  revalidatePath("/", "layout");
  return { success: true, user: { id: updated.id, name: updated.name, avatar: updated.avatar } };
}
