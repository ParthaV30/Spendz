"use client";

import { useState } from "react";
import { Settings, Users, Tag, Lock, Unlock, UserPlus, Shield, Trash2, Edit2, AlertCircle } from "lucide-react";
import { updateGroup, changeMemberRole, removeGroupMember } from "@/app/actions/groupActions";
import { createCategory, updateCategory } from "@/app/actions/categoryActions";
import { lockMonthPeriod, unlockMonthPeriod } from "@/app/actions/monthLockActions";
import InviteMemberModal from "@/components/InviteMemberModal";

interface MemberItem {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: string;
  status: string;
  joinedAt: string;
}

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  description?: string | null;
  isActive: boolean;
}

interface LockedMonthItem {
  year: number;
  month: number;
  lockedBy: string;
  lockedAt: string;
}

interface GroupSettingsClientProps {
  groupId: string;
  currentUserId: string;
  userRole: string;
  groupName: string;
  groupDescription: string;
  members: MemberItem[];
  categories: CategoryItem[];
  lockedMonths: LockedMonthItem[];
}

export default function GroupSettingsClient({
  groupId,
  currentUserId,
  userRole,
  groupName: initialName,
  groupDescription: initialDesc,
  members,
  categories,
  lockedMonths,
}: GroupSettingsClientProps) {
  const isAdmin = userRole === "ADMIN";

  // Group Details Form
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDesc);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Month Locking form
  const now = new Date();
  const [lockYear, setLockYear] = useState(now.getFullYear());
  const [lockMonth, setLockMonth] = useState(now.getMonth() + 1);

  // New Category form
  const [newCatName, setNewCatName] = useState("");

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await updateGroup(groupId, name, description);
    if (res.error) setError(res.error);
    else window.location.reload();
  };

  const handleChangeRole = async (targetUserId: string, newRole: "ADMIN" | "MEMBER") => {
    await changeMemberRole(groupId, targetUserId, newRole);
    window.location.reload();
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    const res = await removeGroupMember(groupId, targetUserId);
    if (res.error) alert(res.error);
    else window.location.reload();
  };

  const handleLockPeriod = async () => {
    await lockMonthPeriod(groupId, lockYear, lockMonth);
    window.location.reload();
  };

  const handleUnlockPeriod = async (year: number, month: number) => {
    await unlockMonthPeriod(groupId, year, month);
    window.location.reload();
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await createCategory(groupId, newCatName);
    setNewCatName("");
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-destructive/20 border border-destructive/40 text-destructive text-sm font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Group General Settings */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <Settings className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-foreground text-base">General Group Info</h3>
        </div>

        <form onSubmit={handleUpdateGroup} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Group Name</label>
            <input
              type="text"
              value={name}
              disabled={!isAdmin}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Description</label>
            <input
              type="text"
              value={description}
              disabled={!isAdmin}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none disabled:opacity-60"
            />
          </div>

          {isAdmin && (
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-primary rounded-xl shadow-lg shadow-purple-500/25"
            >
              Update Details
            </button>
          )}
        </form>
      </div>

      {/* Member Management */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-base">Group Members ({members.length})</h3>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-purple-500/25"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite Roommate</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-secondary/20"
            >
              <div className="flex items-center space-x-3">
                {m.avatar ? (
                  <img src={m.avatar} alt={m.name} className="h-8 w-8 rounded-full border border-purple-500/30" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                    {m.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {m.name} {m.id === currentUserId && "(You)"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{m.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    m.role === "ADMIN" ? "bg-purple-500/20 text-purple-300" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {m.role}
                </span>

                {isAdmin && m.id !== currentUserId && (
                  <div className="flex items-center space-x-2">
                    <select
                      value={m.role}
                      onChange={(e) => handleChangeRole(m.id, e.target.value as "ADMIN" | "MEMBER")}
                      className="bg-secondary border border-border rounded-lg text-xs font-medium px-2 py-1 focus:outline-none"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>

                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="p-1 text-muted-foreground hover:text-rose-400"
                      title="Remove Member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Month Locking Control (Admin Only) */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base">Accounting Period Locking</h3>
            <p className="text-xs text-muted-foreground">Locking a monthly period prevents expense modification/deletion.</p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-3 pt-2">
            <select
              value={lockMonth}
              onChange={(e) => setLockMonth(parseInt(e.target.value))}
              className="bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  Month {m}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={lockYear}
              onChange={(e) => setLockYear(parseInt(e.target.value))}
              className="w-24 bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
            />

            <button
              onClick={handleLockPeriod}
              className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-rose-500/25"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Lock Month</span>
            </button>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Locked Accounting Periods</h4>
          {lockedMonths.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No accounting periods locked yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lockedMonths.map((lm, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-rose-400" />
                    <span className="font-bold text-foreground">
                      {lm.year} — Month {lm.month}
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleUnlockPeriod(lm.year, lm.month)}
                      className="flex items-center space-x-1 text-rose-300 hover:underline font-semibold"
                    >
                      <Unlock className="h-3.5 w-3.5" />
                      <span>Unlock</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Manager */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
            <Tag className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-foreground text-base">Expense Categories ({categories.length})</h3>
        </div>

        {isAdmin && (
          <form onSubmit={handleCreateCategory} className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="New Category Name..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground text-xs focus:outline-none"
            />
            <button type="submit" className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow">
              Add Category
            </button>
          </form>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map((c) => (
            <div key={c.id} className="p-3 rounded-xl border border-border/40 bg-secondary/30 text-xs font-semibold">
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      <InviteMemberModal groupId={groupId} isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
    </div>
  );
}
