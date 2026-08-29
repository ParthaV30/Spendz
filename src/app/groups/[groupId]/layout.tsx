import { verifyGroupMembership, getSessionUser } from "@/lib/auth";
import { getUserGroups } from "@/app/actions/groupActions";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import GroupClientShell from "./GroupClientShell";
import { redirect } from "next/navigation";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { groupId: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  let membership;
  try {
    const verified = await verifyGroupMembership(params.groupId);
    membership = verified.membership;
  } catch (err) {
    redirect("/");
  }

  const groups = await getUserGroups();

  const members = await prisma.groupMember.findMany({
    where: { groupId: params.groupId, status: "ACTIVE" },
    include: { user: true },
  });

  const categories = await prisma.category.findMany({
    where: { groupId: params.groupId, isActive: true },
  });

  const formattedMembers = members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    avatar: m.user.avatar,
  }));

  const formattedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GroupClientShell
        user={user}
        groups={groups}
        currentGroupId={params.groupId}
        role={membership.role}
        members={formattedMembers}
        categories={formattedCategories}
      >
        <div className="flex flex-1">
          <Sidebar groupId={params.groupId} role={membership.role} />
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
        </div>
      </GroupClientShell>
    </div>
  );
}
