import { verifyGroupMembership, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RecurringClient from "./RecurringClient";

export default async function RecurringPage({ params }: { params: { groupId: string } }) {
  const user = await getSessionUser();
  if (!user) return null;

  await verifyGroupMembership(params.groupId);

  const recurringItems = await prisma.recurringExpense.findMany({
    where: { groupId: params.groupId },
    include: {
      category: true,
      createdBy: true,
    },
    orderBy: { nextDueDate: "asc" },
  });

  const categories = await prisma.category.findMany({
    where: { groupId: params.groupId, isActive: true },
  });

  const formattedItems = recurringItems.map((r) => ({
    id: r.id,
    description: r.description,
    amount: r.amount / 100,
    frequency: r.frequency,
    nextDueDate: r.nextDueDate.toISOString(),
    active: r.active,
    categoryName: r.category.name,
    createdByName: r.createdBy.name,
  }));

  const formattedCategories = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Recurring Expenses</h1>
        <p className="text-xs text-muted-foreground">Automated daily, weekly, monthly, and yearly scheduled shared bills</p>
      </div>

      <RecurringClient
        groupId={params.groupId}
        items={formattedItems}
        categories={formattedCategories}
      />
    </div>
  );
}
