"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import RestTimerWidget from "@/components/RestTimerWidget";
import {
  Dumbbell,
  Flame,
  Target,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
  Clock,
  Zap,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  logWorkoutSession,
  deleteWorkoutSession,
  upsertGymMembership,
} from "@/app/actions/workoutActions";

interface FitnessClientShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  groups: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  streak: number;
  weeklyWorkoutsCount: number;
  weeklyTarget: number;
  totalVolumeKg: number;
  totalHours: number;
  membership: {
    planName: string;
    endDate: string;
    remainingDays: number;
    active: boolean;
  } | null;
  sessions: Array<{
    id: string;
    title: string;
    splitType: string;
    durationMin: number;
    workoutDate: string;
    notes?: string | null;
    sets: Array<{
      id: string;
      exerciseName: string;
      setNumber: number;
      reps: number;
      weightKg: number;
      completed: boolean;
    }>;
  }>;
  weeklyActivityChart: Array<{ day: string; hours: number }>;
}

export default function FitnessClientShell({
  user,
  groups,
  streak,
  weeklyWorkoutsCount,
  weeklyTarget,
  totalVolumeKg,
  totalHours,
  membership,
  sessions,
  weeklyActivityChart,
}: FitnessClientShellProps) {
  const [activeSplitTab, setActiveSplitTab] = useState<"PUSH" | "PULL" | "LEGS" | "CARDIO" | "FULL_BODY">("PUSH");
  const [workoutTitle, setWorkoutTitle] = useState("Push Day - Chest & Triceps");
  const [durationMin, setDurationMin] = useState("45");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<
    Array<{ exerciseName: string; sets: Array<{ reps: number; weightKg: number; completed: boolean }> }>
  >([
    {
      exerciseName: "Barbell Bench Press",
      sets: [
        { reps: 10, weightKg: 80, completed: true },
        { reps: 10, weightKg: 80, completed: true },
        { reps: 8, weightKg: 80, completed: true },
      ],
    },
    {
      exerciseName: "Incline Dumbbell Press",
      sets: [
        { reps: 12, weightKg: 26, completed: true },
        { reps: 10, weightKg: 28, completed: true },
      ],
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Membership modal state
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [planName, setPlanName] = useState("Premium Gym Pass");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [membershipCost, setMembershipCost] = useState("2000");

  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      {
        exerciseName: "New Exercise",
        sets: [{ reps: 10, weightKg: 20, completed: true }],
      },
    ]);
  };

  const handleAddSet = (exIndex: number) => {
    const updated = [...exercises];
    const lastSet = updated[exIndex].sets[updated[exIndex].sets.length - 1] || { reps: 10, weightKg: 20, completed: true };
    updated[exIndex].sets.push({ ...lastSet, completed: true });
    setExercises(updated);
  };

  const handleUpdateSet = (exIndex: number, setIndex: number, field: "reps" | "weightKg", value: number) => {
    const updated = [...exercises];
    updated[exIndex].sets[setIndex][field] = value;
    setExercises(updated);
  };

  const handleToggleSetCompleted = (exIndex: number, setIndex: number) => {
    const updated = [...exercises];
    updated[exIndex].sets[setIndex].completed = !updated[exIndex].sets[setIndex].completed;
    setExercises(updated);
  };

  const handleRemoveExercise = (exIndex: number) => {
    setExercises(exercises.filter((_, idx) => idx !== exIndex));
  };

  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (exercises.length === 0) {
      setError("Please add at least one exercise to your workout.");
      return;
    }

    setLoading(true);
    const res = await logWorkoutSession({
      title: workoutTitle,
      splitType: activeSplitTab,
      durationMin: parseInt(durationMin, 10) || 45,
      notes,
      exercises,
    });

    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      window.location.reload();
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workout log?")) return;
    await deleteWorkoutSession(id);
    window.location.reload();
  };

  const handleSaveMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await upsertGymMembership({
      planName,
      startDate,
      endDate,
      cost: parseFloat(membershipCost) || 0,
    });
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setIsMembershipModalOpen(false);
      window.location.reload();
    }
  };

  const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar user={user} groups={groups} />

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto space-y-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                Spendz Gym Tracker
              </span>
              <span>•</span>
              <span>Progressive Overload & Streaks</span>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              Gym & Fitness Dashboard
              <Sparkles className="h-6 w-6 text-emerald-400" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track sets, reps, muscle split days, workout streaks, and gym membership renewals
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMembershipModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-foreground bg-secondary hover:bg-secondary/80 border border-border/60 rounded-xl transition-all flex items-center space-x-1.5"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Membership Status</span>
            </button>
          </div>
        </div>

        {/* Top 3 Stat Cards (Matching UI Mockup Design) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Active Workout Streak */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-card to-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Workout Streak</span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Flame className="h-5 w-5 fill-current" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-4xl font-black tracking-tight text-foreground">{streak} DAYS</h3>
                <span className="text-xl">🔥</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {streak > 0 ? "Keep it up! Consecutive workout days" : "Log a workout today to start your streak!"}
              </p>
            </div>

            <div className="w-full bg-secondary/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${Math.min(100, (streak / 14) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Weekly Target Progress */}
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 via-card to-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Weekly Target Progress</span>
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Target className="h-5 w-5" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-3xl font-black tracking-tight text-foreground">
                  {weeklyWorkoutsCount} / {weeklyTarget}
                </h3>
                <span className="text-xs text-muted-foreground uppercase font-bold">Workouts</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {weeklyWorkoutsCount >= weeklyTarget
                  ? "🎉 Goal Achieved for this week!"
                  : `${weeklyTarget - weeklyWorkoutsCount} more workout(s) to hit goal this week`}
              </p>
            </div>

            {/* Days Indicator Dots */}
            <div className="flex justify-between items-center pt-1">
              {daysOfWeek.map((d, i) => (
                <div
                  key={i}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    i < weeklyWorkoutsCount
                      ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                      : "bg-secondary text-muted-foreground border border-border/40"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Membership Status */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/30 via-card to-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Membership Status</span>
              <span
                className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                  membership?.active
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {membership?.active ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>

            <div>
              <span className="text-xs text-muted-foreground block">Expires:</span>
              <h3 className="text-2xl font-black tracking-tight text-foreground mt-0.5">
                {membership ? `${membership.remainingDays} DAYS LEFT` : "No Active Membership"}
              </h3>
              <p className="text-xs text-purple-300 mt-1 font-semibold">
                {membership ? membership.planName : "Click 'Renew Now' to activate your pass"}
              </p>
            </div>

            <button
              onClick={() => setIsMembershipModalOpen(true)}
              className="w-full py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold rounded-xl transition-all"
            >
              Renew Membership Pass
            </button>
          </div>
        </div>

        {/* Main Grid: Workout Logger & Activity Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Workout Logger */}
          <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-emerald-400" />
                <span>Daily Workout Logger</span>
              </h3>

              {/* Split Tabs */}
              <div className="flex items-center space-x-1 p-1 bg-secondary/80 rounded-xl border border-border/60 overflow-x-auto">
                {(["PUSH", "PULL", "LEGS", "CARDIO", "FULL_BODY"] as const).map((split) => (
                  <button
                    key={split}
                    onClick={() => {
                      setActiveSplitTab(split);
                      if (split === "PUSH") setWorkoutTitle("Push Day - Chest & Triceps");
                      if (split === "PULL") setWorkoutTitle("Pull Day - Back & Biceps");
                      if (split === "LEGS") setWorkoutTitle("Leg Day - Quads & Hamstrings");
                      if (split === "CARDIO") setWorkoutTitle("Cardio & Core Session");
                      if (split === "FULL_BODY") setWorkoutTitle("Full Body Conditioning");
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      activeSplitTab === split
                        ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {split.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/20 border border-destructive/40 text-destructive text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveWorkout} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Session Title</label>
                  <input
                    type="text"
                    value={workoutTitle}
                    onChange={(e) => setWorkoutTitle(e.target.value)}
                    className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Exercises & Sets Card */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    Exercises & Sets
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddExercise}
                    className="text-xs font-bold text-emerald-400 hover:underline flex items-center space-x-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Exercise</span>
                  </button>
                </div>

                {exercises.map((ex, exIdx) => (
                  <div
                    key={exIdx}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                      <div className="flex items-center space-x-2">
                        <Dumbbell className="h-4 w-4 text-emerald-400" />
                        <input
                          type="text"
                          value={ex.exerciseName}
                          onChange={(e) => {
                            const updated = [...exercises];
                            updated[exIdx].exerciseName = e.target.value;
                            setExercises(updated);
                          }}
                          className="bg-transparent font-bold text-sm text-foreground focus:outline-none border-b border-transparent focus:border-emerald-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(exIdx)}
                        className="p-1 text-muted-foreground hover:text-rose-400"
                        title="Remove exercise"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {ex.sets.map((set, setIdx) => (
                        <div key={setIdx} className="flex items-center justify-between text-xs bg-secondary/30 p-2 rounded-lg">
                          <span className="font-bold text-muted-foreground">Set {setIdx + 1}:</span>

                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                value={set.reps}
                                onChange={(e) =>
                                  handleUpdateSet(exIdx, setIdx, "reps", parseInt(e.target.value, 10) || 0)
                                }
                                className="w-12 bg-background border border-border rounded px-1.5 py-0.5 text-center font-bold text-xs"
                              />
                              <span className="text-[10px] text-muted-foreground font-semibold">Reps</span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                step="0.5"
                                value={set.weightKg}
                                onChange={(e) =>
                                  handleUpdateSet(exIdx, setIdx, "weightKg", parseFloat(e.target.value) || 0)
                                }
                                className="w-14 bg-background border border-border rounded px-1.5 py-0.5 text-center font-bold text-xs"
                              />
                              <span className="text-[10px] text-muted-foreground font-semibold">kg</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleSetCompleted(exIdx, setIdx)}
                              className={`p-1 rounded-md transition-all ${
                                set.completed ? "bg-emerald-500 text-black" : "bg-secondary text-muted-foreground"
                              }`}
                              title={set.completed ? "Mark Incomplete" : "Mark Complete"}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleAddSet(exIdx)}
                        className="text-[11px] font-bold text-emerald-400 hover:underline pt-1 block"
                      >
                        + Add Set
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Workout Notes</label>
                <textarea
                  rows={2}
                  placeholder="Felt strong on bench press, increased weight by 2.5kg..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/25 disabled:opacity-50"
              >
                {loading ? "Saving Session..." : "Log Completed Workout Session 💪"}
              </button>
            </form>
          </div>

          {/* Right 1 Col: Rest Timer & Weekly Activity Bar Chart */}
          <div className="space-y-6">
            {/* Rest Timer Widget */}
            <RestTimerWidget />

            {/* Weekly Activity Bar Chart */}
            <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-base">Weekly Activity</h3>
                <span className="text-xs text-emerald-400 font-bold">{totalHours}h Total</span>
              </div>

              {/* Bar Chart Visual */}
              <div className="h-44 flex items-end justify-between gap-2 pt-4">
                {weeklyActivityChart.map((item, idx) => {
                  const maxH = 2.5; // Max 2.5 hours baseline
                  const pct = Math.min(100, Math.max(10, (item.hours / maxH) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full bg-secondary/40 rounded-t-lg h-32 flex items-end overflow-hidden">
                        <div
                          className="w-full bg-emerald-500 rounded-t-lg transition-all duration-300"
                          style={{ height: item.hours > 0 ? `${pct}%` : "0%" }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">{item.day}</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-border/40 flex justify-between text-xs text-muted-foreground font-semibold">
                <span>Volume Lifted:</span>
                <span className="font-bold text-foreground">{totalVolumeKg.toLocaleString("en-IN")} kg</span>
              </div>
            </div>

            {/* Recent Workouts Log */}
            <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-foreground text-base">Recent Workouts</h3>
              {sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No workouts logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 4).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-secondary/30"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-foreground">{s.title}</h4>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(s.workoutDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          • {s.durationMin} mins • {s.sets.length} sets
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        className="p-1 text-muted-foreground hover:text-rose-400"
                        title="Delete log"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Gym Membership Modal */}
      {isMembershipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-foreground text-lg">Update Gym Membership</h3>
            <form onSubmit={handleSaveMembership} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Plan Name</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Cost (₹)</label>
                <input
                  type="number"
                  value={membershipCost}
                  onChange={(e) => setMembershipCost(e.target.value)}
                  className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Auto-syncs as a personal expense in Spendz!
                </span>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMembershipModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl"
                >
                  Save Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
