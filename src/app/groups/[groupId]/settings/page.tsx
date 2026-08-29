import { verifyGroupMembership, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GroupSettingsClient from "./GroupSettingsClient";

export default async function SettingsPage({ params }: { params: { groupId: string } }) {
  const user = await getSessionUser();
  if (!user) return null;

  const { membership } = await verifyGroupMembership(params.groupId);

  const group = await prisma.group.findUnique({
    where: { id: params.groupId },
    include: {
      members: { include: { user: true } },
      categories: true,
      lockedMonths: true,
    },
  });

  if (!group) return null;

  const formattedMembers = group.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    avatar: m.user.avatar,
    role: m.role,
    status: m.status,
    joinedAt: m.joinedAt.toISOString(),
  }));

  const formattedCategories = group.categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    description: c.description,
    isActive: c.isActive,
  }));

  const formattedLockedMonths = group.lockedMonths.map((lm) => ({
    year: lm.year,
    month: lm.month,
    lockedBy: lm.lockedBy,
    lockedAt: lm.lockedAt.toISOString(),
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Group Settings & Administration</h1>
        <p className="text-xs text-muted-foreground">Manage group details, member permissions, categories, and monthly period locking</p>
      </div>

      <GroupSettingsClient
        groupId={params.groupId}
        currentUserId={user.id}
        userRole={membership.role}
        groupName={group.name}
        groupDescription={group.description || ""}
        members={formattedMembers}
        categories={formattedCategories}
        lockedMonths={formattedLockedMonths}
      />
    </div>
  );
}
