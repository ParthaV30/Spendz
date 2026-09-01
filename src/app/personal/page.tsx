import { getSessionUser } from "@/lib/auth";
import { getUserGroups } from "@/app/actions/groupActions";
import { getPersonalOverviewData } from "@/app/actions/personalActions";
import PersonalClientShell from "./PersonalClientShell";
import { redirect } from "next/navigation";

export default async function PersonalPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const groups = await getUserGroups();
  const overview = await getPersonalOverviewData();

  if (!overview) {
    return null;
  }

  return (
    <PersonalClientShell
      user={user}
      groups={groups}
      totalSpentRs={overview.totalSpentRs}
      totalBudgetRs={overview.totalBudgetRs}
      month={overview.month}
      year={overview.year}
      expenses={overview.expenses}
      categories={overview.categories}
      categoryBudgets={overview.categoryBudgets}
      categoryChartData={overview.categoryChartData}
      trendChartData={overview.trendChartData}
    />
  );
}
