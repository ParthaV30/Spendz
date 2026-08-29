"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, verifyGroupMembership, verifyGroupAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function getUserGroups() {
  const user = await getSessionUser();
  if (!user) return [];

  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: {
      group: {
        include: {
          _count: {
            select: { members: true, expenses: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    ...m.group,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
}

export async function createGroup(name: string, description?: string, currency: string = "INR") {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");

  if (!name || name.trim().length === 0) {
    return { error: "Group name is required" };
  }

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      createdBy: user.id,
      currency: currency.toUpperCase(),
      members: {
        create: {
          userId: user.id,
          role: "ADMIN",
          status: "ACTIVE",
        },
      },
    },
  });

  // Seed default categories
  const defaultCats = [
    { name: "Food", icon: "Utensils" },
    { name: "Groceries", icon: "ShoppingCart" },
    { name: "Rent", icon: "Home" },
    { name: "Electricity", icon: "Zap" },
    { name: "Water", icon: "Droplets" },
    { name: "Internet", icon: "Wifi" },
    { name: "Travel", icon: "Car" },
    { name: "Entertainment", icon: "Film" },
    { name: "Cleaning", icon: "Sparkles" },
    { name: "Other", icon: "MoreHorizontal" },
  ];

  await prisma.category.createMany({
    data: defaultCats.map((c) => ({ groupId: group.id, name: c.name, icon: c.icon })),
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      groupId: group.id,
      userId: user.id,
      action: "GROUP_CREATE",
      entityType: "Group",
      entityId: group.id,
      metadata: JSON.stringify({ name: group.name }),
    },
  });

  revalidatePath("/groups");
  return { success: true, groupId: group.id };
}

export async function updateGroup(groupId: string, name: string, description?: string, currency?: string) {
  try {
    const { user } = await verifyGroupAdmin(groupId);

    const updated = await prisma.group.update({
      where: { id: groupId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        currency: currency ? currency.toUpperCase() : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        groupId,
        userId: user.id,
        action: "GROUP_EDIT",
        entityType: "Group",
        entityId: groupId,
        metadata: JSON.stringify({ name, description }),
      },
    });

    revalidatePath(`/groups/${groupId}`);
    return { success: true, group: updated };
  } catch (err: any) {
    return { error: err.message || "Failed to update group" };
  }
}

export async function inviteMemberByEmail(groupId: string, email: string, role: "ADMIN" | "MEMBER" = "MEMBER") {
  const { user } = await verifyGroupAdmin(groupId);
  const targetEmail = email.toLowerCase().trim();

  // Check if already an active member
  const existingUser = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (existingUser) {
    const existingMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: existingUser.id } },
    });

    if (existingMember && existingMember.status === "ACTIVE") {
      return { error: "User is already an active member of this group" };
    }

    // If inactive, re-activate directly
    if (existingMember && existingMember.status === "INACTIVE") {
      await prisma.groupMember.update({
        where: { id: existingMember.id },
        data: { status: "ACTIVE", role },
      });

      revalidatePath(`/groups/${groupId}`);
      return { success: true, message: `${existingUser.name} reactivated in the group!` };
    }
  }

  // Create Invitation token valid for 7 days
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invite = await prisma.invitation.create({
    data: {
      groupId,
      email: targetEmail,
      role,
      token,
      expiresAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      groupId,
      userId: user.id,
      action: "MEMBER_INVITE",
      entityType: "Invitation",
      entityId: invite.id,
      metadata: JSON.stringify({ email: targetEmail, role }),
    },
  });

  return { success: true, inviteLink: `/invite/${token}`, token };
}

export async function acceptInvitation(token: string) {
  const user = await getSessionUser();
  if (!user) {
    return { error: "Please log in or register to accept this invitation." };
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { group: true },
  });

  if (!invitation) {
    return { error: "Invalid invitation link." };
  }

  if (invitation.expiresAt < new Date()) {
    return { error: "This invitation link has expired." };
  }

  if (invitation.acceptedAt) {
    return { error: "This invitation has already been accepted.", groupId: invitation.groupId };
  }

  // Add user to group
  await prisma.groupMember.upsert({
    where: {
      groupId_userId: {
        groupId: invitation.groupId,
        userId: user.id,
      },
    },
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

  // Mark invitation accepted
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

  revalidatePath(`/groups/${invitation.groupId}`);
  return { success: true, groupId: invitation.groupId, groupName: invitation.group.name };
}

export async function changeMemberRole(groupId: string, targetUserId: string, newRole: "ADMIN" | "MEMBER") {
  const { user } = await verifyGroupAdmin(groupId);

  await prisma.groupMember.update({
    where: {
      groupId_userId: { groupId, userId: targetUserId },
    },
    data: { role: newRole },
  });

  await prisma.auditLog.create({
    data: {
      groupId,
      userId: user.id,
      action: "MEMBER_ROLE_CHANGE",
      entityType: "GroupMember",
      entityId: targetUserId,
      metadata: JSON.stringify({ newRole }),
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

export async function removeGroupMember(groupId: string, targetUserId: string) {
  const { user } = await verifyGroupAdmin(groupId);

  if (user.id === targetUserId) {
    return { error: "You cannot remove yourself as group admin." };
  }

  // Check if member has active financial history to preserve integrity (soft delete)
  const paidCount = await prisma.expense.count({ where: { groupId, paidById: targetUserId } });
  const splitCount = await prisma.expenseSplit.count({
    where: { userId: targetUserId, expense: { groupId } },
  });

  if (paidCount > 0 || splitCount > 0) {
    // Soft deactivation to preserve financial records
    await prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { status: "INACTIVE" },
    });
  } else {
    // Hard delete if no financial records exist
    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
  }

  await prisma.auditLog.create({
    data: {
      groupId,
      userId: user.id,
      action: "MEMBER_REMOVE",
      entityType: "GroupMember",
      entityId: targetUserId,
      metadata: JSON.stringify({ targetUserId }),
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}
