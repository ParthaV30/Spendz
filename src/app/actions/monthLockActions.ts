"use server";

import { prisma } from "@/lib/prisma";
import { verifyGroupAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function lockMonthPeriod(groupId: string, year: number, month: number) {
  const { user } = await verifyGroupAdmin(groupId);

  const locked = await prisma.lockedMonth.upsert({
    where: {
      groupId_year_month: { groupId, year, month },
    },
    create: {
      groupId,
      year,
      month,
      lockedBy: user.name,
    },
    update: {
      lockedBy: user.name,
      lockedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      groupId,
      userId: user.id,
      action: "MONTH_LOCK",
      entityType: "LockedMonth",
      entityId: locked.id,
      metadata: JSON.stringify({ year, month }),
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true, locked };
}

export async function unlockMonthPeriod(groupId: string, year: number, month: number) {
  const { user } = await verifyGroupAdmin(groupId);

  await prisma.lockedMonth.delete({
    where: {
      groupId_year_month: { groupId, year, month },
    },
  });

  await prisma.auditLog.create({
    data: {
      groupId,
      userId: user.id,
      action: "MONTH_UNLOCK",
      entityType: "LockedMonth",
      entityId: `${groupId}-${year}-${month}`,
      metadata: JSON.stringify({ year, month }),
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}
