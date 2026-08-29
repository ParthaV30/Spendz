"use server";

import { prisma } from "@/lib/prisma";
import { verifyGroupMembership } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createSettlement(
  groupId: string,
  toUserId: string,
  amount: number, // In main currency (₹)
  paymentMethod: "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER" = "UPI",
  note?: string
) {
  const { user } = await verifyGroupMembership(groupId);

  const amountMinor = Math.round(amount * 100);
  if (amountMinor <= 0) {
    return { error: "Settlement amount must be greater than zero." };
  }

  if (user.id === toUserId) {
    return { error: "You cannot settle with yourself." };
  }

  const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
  if (!toUser) return { error: "Recipient user not found." };

  const settlement = await prisma.$transaction(async (tx) => {
    const created = await tx.settlement.create({
      data: {
        groupId,
        fromUserId: user.id,
        toUserId,
        amount: amountMinor,
        paymentMethod,
        status: "CONFIRMED", // Auto-confirm when recorded or pending approval
        note: note?.trim() || null,
        settledAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        groupId,
        userId: user.id,
        action: "SETTLEMENT_CREATE",
        entityType: "Settlement",
        entityId: created.id,
        metadata: JSON.stringify({
          from: user.name,
          to: toUser.name,
          amount: amountMinor / 100,
          paymentMethod,
        }),
      },
    });

    await tx.notification.create({
      data: {
        userId: toUserId,
        groupId,
        title: "Payment Settlement Received",
        message: `${user.name} recorded a settlement of ₹${(amountMinor / 100).toFixed(2)} via ${paymentMethod}.`,
        type: "SETTLEMENT_REQUEST",
      },
    });

    return created;
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true, settlementId: settlement.id };
}

export async function updateSettlementStatus(
  groupId: string,
  settlementId: string,
  status: "CONFIRMED" | "REJECTED" | "CANCELLED"
) {
  const { user } = await verifyGroupMembership(groupId);

  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
  });

  if (!settlement || settlement.groupId !== groupId) {
    return { error: "Settlement not found" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.settlement.update({
      where: { id: settlementId },
      data: { status },
    });

    await tx.auditLog.create({
      data: {
        groupId,
        userId: user.id,
        action: "SETTLEMENT_STATUS_CHANGE",
        entityType: "Settlement",
        entityId: settlementId,
        metadata: JSON.stringify({ status }),
      },
    });
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}
