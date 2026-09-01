"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface ExerciseSetInput {
  reps: number;
  weightKg: number;
  completed?: boolean;
}

export interface ExerciseInput {
  exerciseName: string;
  sets: ExerciseSetInput[];
}

export interface LogWorkoutInput {
  title: string;
  splitType: "PUSH" | "PULL" | "LEGS" | "CARDIO" | "FULL_BODY";
  durationMin: number;
  workoutDate?: string;
  notes?: string;
  exercises: ExerciseInput[];
}

export async function logWorkoutSession(input: LogWorkoutInput) {
  const user = await getSessionUser();
  if (!user) return { error: "UNAUTHORIZED" };

  if (!input.title.trim()) {
    return { error: "Workout title is required." };
  }

  const workoutDate = input.workoutDate ? new Date(input.workoutDate) : new Date();

  // Create session with sets in transaction
  const session = await prisma.$transaction(async (tx) => {
    const createdSession = await tx.workoutSession.create({
      data: {
        userId: user.id,
        title: input.title.trim(),
        splitType: input.splitType,
        durationMin: Math.max(1, input.durationMin || 45),
        workoutDate,
        notes: input.notes?.trim() || null,
      },
    });

    const setsToCreate: Array<{
      sessionId: string;
      exerciseName: string;
      setNumber: number;
      reps: number;
      weightKg: number;
      completed: boolean;
    }> = [];

    input.exercises.forEach((ex) => {
      ex.sets.forEach((set, index) => {
        setsToCreate.push({
          sessionId: createdSession.id,
          exerciseName: ex.exerciseName.trim(),
          setNumber: index + 1,
          reps: Math.max(1, set.reps || 10),
          weightKg: Math.max(0, set.weightKg || 0),
          completed: set.completed !== false,
        });
      });
    });

    if (setsToCreate.length > 0) {
      await tx.workoutSet.createMany({
        data: setsToCreate,
      });
    }

    return createdSession;
  });

  revalidatePath("/fitness");
  return { success: true, sessionId: session.id };
}

export async function deleteWorkoutSession(id: string) {
  const user = await getSessionUser();
  if (!user) return { error: "UNAUTHORIZED" };

  const existing = await prisma.workoutSession.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return { error: "Workout session not found." };
  }

  await prisma.workoutSession.delete({ where: { id } });

  revalidatePath("/fitness");
  return { success: true };
}

export async function upsertGymMembership(input: {
  planName: string;
  startDate: string;
  endDate: string;
  cost: number; // in rupees
}) {
  const user = await getSessionUser();
  if (!user) return { error: "UNAUTHORIZED" };

  const costMinor = Math.round(input.cost * 100);

  // Upsert active membership
  const existing = await prisma.gymMembership.findFirst({
    where: { userId: user.id, active: true },
  });

  if (existing) {
    await prisma.gymMembership.update({
      where: { id: existing.id },
      data: {
        planName: input.planName.trim(),
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        cost: costMinor,
      },
    });
  } else {
    await prisma.gymMembership.create({
      data: {
        userId: user.id,
        planName: input.planName.trim(),
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        cost: costMinor,
        active: true,
      },
    });
  }

  // Also auto-sync as personal expense if cost > 0
  if (costMinor > 0) {
    let personalCat = await prisma.personalCategory.findFirst({
      where: { userId: user.id, name: { contains: "Personal Care" } },
    });

    if (!personalCat) {
      personalCat = await prisma.personalCategory.findFirst({
        where: { userId: user.id },
      });
    }

    if (personalCat) {
      await prisma.personalExpense.create({
        data: {
          userId: user.id,
          categoryId: personalCat.id,
          amount: costMinor,
          description: `Gym Membership: ${input.planName}`,
          expenseDate: new Date(input.startDate),
          notes: "Auto-synced from Gym Tracker membership renewal",
        },
      });
    }
  }

  revalidatePath("/fitness");
  revalidatePath("/personal");
  return { success: true };
}

export async function getWorkoutOverviewData() {
  const user = await getSessionUser();
  if (!user) return null;

  const now = new Date();

  // Fetch all sessions sorted descending
  const sessions = await prisma.workoutSession.findMany({
    where: { userId: user.id },
    include: { sets: true },
    orderBy: { workoutDate: "desc" },
  });

  // Calculate Streak (consecutive days with at least 1 workout)
  let streak = 0;
  const uniqueDates = Array.from(
    new Set(sessions.map((s) => new Date(s.workoutDate).toISOString().split("T")[0]))
  ).sort().reverse();

  if (uniqueDates.length > 0) {
    const todayStr = now.toISOString().split("T")[0];
    const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split("T")[0];

    let currentCheck = uniqueDates[0] === todayStr ? todayStr : uniqueDates[0] === yesterdayStr ? yesterdayStr : null;

    if (currentCheck) {
      let checkDate = new Date(currentCheck);
      for (const dStr of uniqueDates) {
        const d = new Date(dStr);
        const diffDays = Math.round((checkDate.getTime() - d.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 0 || diffDays === 1) {
          streak++;
          checkDate = d;
        } else {
          break;
        }
      }
    }
  }

  // Workouts logged this week (Monday through Sunday)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const thisWeekSessions = sessions.filter((s) => new Date(s.workoutDate) >= startOfWeek);
  const weeklyWorkoutsCount = thisWeekSessions.length;
  const weeklyTarget = 5; // default 5 workouts/week

  // Calculate total volume (sum of reps * weight in kg)
  let totalVolumeKg = 0;
  let totalHours = 0;

  sessions.forEach((s) => {
    totalHours += (s.durationMin || 45) / 60;
    s.sets.forEach((set) => {
      if (set.completed) {
        totalVolumeKg += set.reps * set.weightKg;
      }
    });
  });

  // Fetch active gym membership
  const membership = await prisma.gymMembership.findFirst({
    where: { userId: user.id, active: true },
    orderBy: { endDate: "desc" },
  });

  let remainingDays = 0;
  if (membership) {
    const endMs = new Date(membership.endDate).getTime();
    const nowMs = now.getTime();
    remainingDays = Math.max(0, Math.ceil((endMs - nowMs) / (1000 * 3600 * 24)));
  }

  // Weekly Activity Bar Chart (Mon-Sun)
  const dayNames = ["M", "T", "W", "T", "F", "S", "S"];
  const weeklyActivityMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  thisWeekSessions.forEach((s) => {
    let dIdx = new Date(s.workoutDate).getDay(); // 0 = Sun, 1 = Mon ...
    dIdx = dIdx === 0 ? 6 : dIdx - 1; // convert to 0 = Mon ... 6 = Sun
    weeklyActivityMap[dIdx] = (weeklyActivityMap[dIdx] || 0) + (s.durationMin || 45) / 60;
  });

  const weeklyActivityChart = dayNames.map((dayLabel, index) => ({
    day: dayLabel,
    hours: parseFloat((weeklyActivityMap[index] || 0).toFixed(1)),
  }));

  return {
    streak,
    weeklyWorkoutsCount,
    weeklyTarget,
    totalVolumeKg,
    totalHours: parseFloat(totalHours.toFixed(1)),
    membership: membership
      ? {
          planName: membership.planName,
          endDate: membership.endDate.toISOString().split("T")[0],
          remainingDays,
          active: remainingDays > 0,
        }
      : null,
    sessions: sessions.map((s) => ({
      id: s.id,
      title: s.title,
      splitType: s.splitType,
      durationMin: s.durationMin,
      workoutDate: s.workoutDate.toISOString(),
      notes: s.notes,
      sets: s.sets.map((st) => ({
        id: st.id,
        exerciseName: st.exerciseName,
        setNumber: st.setNumber,
        reps: st.reps,
        weightKg: st.weightKg,
        completed: st.completed,
      })),
    })),
    weeklyActivityChart,
  };
}
