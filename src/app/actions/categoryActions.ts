"use server";

import { prisma } from "@/lib/prisma";
import { verifyGroupAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createCategory(
  groupId: string,
  name: string,
  icon: string = "Tag",
  description?: string
) {
  const { user } = await verifyGroupAdmin(groupId);

  const category = await prisma.category.create({
    data: {
      groupId,
      name: name.trim(),
      icon: icon.trim() || "Tag",
      description: description?.trim() || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      groupId,
      userId: user.id,
      action: "CATEGORY_CREATE",
      entityType: "Category",
      entityId: category.id,
      metadata: JSON.stringify({ name: category.name }),
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true, category };
}

export async function updateCategory(
  groupId: string,
  categoryId: string,
  name: string,
  icon: string,
  description?: string,
  isActive: boolean = true
) {
  const { user } = await verifyGroupAdmin(groupId);

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: name.trim(),
      icon: icon.trim(),
      description: description?.trim() || null,
      isActive,
    },
  });

  await prisma.auditLog.create({
    data: {
      groupId,
      userId: user.id,
      action: "CATEGORY_EDIT",
      entityType: "Category",
      entityId: categoryId,
      metadata: JSON.stringify({ name: updated.name, isActive }),
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true, category: updated };
}
