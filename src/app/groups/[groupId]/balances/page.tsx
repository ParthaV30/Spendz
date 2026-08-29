import { verifyGroupMembership, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateGroupBalances, simplifyDebts } from "@/lib/calculations/balanceEngine";
import SmartSettlementsCard from "@/components/SmartSettlementsCard";
import BalancesClient from "./BalancesClient";

export default async function BalancesPage({ params }: { params: { groupId: string } }) {
  const user = await getSessionUser();
  if (!user) return null;

  const { membership } = await verifyGroupMembership(params.groupId);

  const group = await prisma.group.findUnique({
    where: { id: params.groupId },
    include: {
      members: { include: { user: true } },
    },
  });

  if (!group) return null;

  const expenses = await prisma.expense.findMany({
    where: { groupId: params.groupId },
    include: { splits: true },
  });

  const settlements = await prisma.settlement.findMany({
    where: { groupId: params.groupId },
    include: {
      fromUser: true,
      toUser: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const memberIds = group.members.map((m) => m.userId);

  const balances = calculateGroupBalances(memberIds, expenses, settlements);

  const netBalancesMap: Record<string, number> = {};
  Object.values(balances).forEach((b) => {
    netBalancesMap[b.userId] = b.netBalance;
  });

  const simplifiedTxs = simplifyDebts(netBalancesMap);

  const formattedMembers = group.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    avatar: m.user.avatar,
    totalPaid: (balances[m.userId]?.totalPaid || 0) / 100,
    totalShare: (balances[m.userId]?.totalShare || 0) / 100,
    netBalance: (balances[m.userId]?.netBalance || 0) / 100,
  }));

  const formattedSettlements = settlements.map((s) => ({
    id: s.id,
    fromUserId: s.fromUserId,
    fromUserName: s.fromUser.name,
    toUserId: s.toUserId,
    toUserName: s.toUser.name,
    amount: s.amount / 100,
    paymentMethod: s.paymentMethod,
    status: s.status,
    note: s.note,
    settledAt: s.settledAt.toISOString(),
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-foreground">Room Balances & Settlements</h1>
        <p className="text-xs text-muted-foreground">Automated net balance calculations and payment settlement engine</p>
      </div>

      {/* Smart Debt Simplification Solver */}
      <SmartSettlementsCard
        groupId={params.groupId}
        members={formattedMembers}
        transactions={simplifiedTxs}
        currentUserId={user.id}
      />

      <BalancesClient
        groupId={params.groupId}
        currentUserId={user.id}
        members={formattedMembers}
        settlements={formattedSettlements}
      />
    </div>
  );
}
