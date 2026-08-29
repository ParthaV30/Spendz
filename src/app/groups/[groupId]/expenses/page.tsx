import { verifyGroupMembership, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExpensesClient from "./ExpensesClient";

export default async function ExpensesPage({
  params,
  searchParams,
}: {
  params: { groupId: string };
  searchParams: { search?: string; category?: string; member?: string; sort?: string };
}) {
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

  // Build filter query
  const whereClause: any = { groupId: params.groupId };

  if (searchParams.search) {
    whereClause.OR = [
      { description: { contains: searchParams.search } },
      { notes: { contains: searchParams.search } },
    ];
  }

  if (searchParams.category && searchParams.category !== "ALL") {
    whereClause.categoryId = searchParams.category;
  }

  if (searchParams.member && searchParams.member !== "ALL") {
    whereClause.paidById = searchParams.member;
  }

  let orderBy: any = { expenseDate: "desc" };
  if (searchParams.sort === "oldest") orderBy = { expenseDate: "asc" };
  if (searchParams.sort === "highest") orderBy = { amount: "desc" };
  if (searchParams.sort === "lowest") orderBy = { amount: "asc" };

  const expenses = await prisma.expense.findMany({
    where: whereClause,
    include: {
      paidBy: true,
      category: true,
      splits: { include: { user: true } },
    },
    orderBy,
  });

  const formattedExpenses = expenses.map((e) => ({
    id: e.id,
    description: e.description,
    amount: e.amount / 100,
    expenseDate: e.expenseDate.toISOString(),
    paidBy: e.paidBy,
    category: e.category,
    splitMethod: e.splitMethod,
    receiptUrl: e.receiptUrl,
    notes: e.notes,
    splits: e.splits.map((s) => ({
      userId: s.userId,
      userName: s.user.name,
      amount: s.amount / 100,
      percentage: s.percentage,
      shares: s.shares,
    })),
  }));

  const formattedMembers = group.members.map((m) => ({ id: m.user.id, name: m.user.name }));
  const formattedCategories = group.categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Room Expenses</h1>
        <p className="text-xs text-muted-foreground">Search, filter, and inspect detailed bill splits</p>
      </div>

      <ExpensesClient
        groupId={params.groupId}
        currentUserId={user.id}
        userRole={membership.role}
        expenses={formattedExpenses}
        members={formattedMembers}
        categories={formattedCategories}
        lockedMonths={group.lockedMonths}
      />
    </div>
  );
}
