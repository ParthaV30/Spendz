import { getSessionUser } from "@/lib/auth";
import { getUserGroups } from "@/app/actions/groupActions";
import { getWorkoutOverviewData } from "@/app/actions/workoutActions";
import FitnessClientShell from "./FitnessClientShell";
import { redirect } from "next/navigation";

export default async function FitnessPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const groups = await getUserGroups();
  const overview = await getWorkoutOverviewData();

  if (!overview) {
    return null;
  }

  return (
    <FitnessClientShell
      user={user}
      groups={groups}
      streak={overview.streak}
      weeklyWorkoutsCount={overview.weeklyWorkoutsCount}
      weeklyTarget={overview.weeklyTarget}
      totalVolumeKg={overview.totalVolumeKg}
      totalHours={overview.totalHours}
      membership={overview.membership}
      sessions={overview.sessions}
      weeklyActivityChart={overview.weeklyActivityChart}
    />
  );
}
