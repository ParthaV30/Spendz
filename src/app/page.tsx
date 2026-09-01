import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  // Find user's primary active group
  const membership = await prisma.groupMember.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    select: { groupId: true },
    orderBy: { joinedAt: "asc" },
  });

  if (membership) {
    redirect(`/groups/${membership.groupId}/dashboard`);
  }

  redirect("/personal");
}
