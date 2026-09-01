"use client";

import Link from "next/link";
import { User, LogOut, PlusCircle, Bell, Layers, Shield, Menu } from "lucide-react";
import { logoutUser } from "@/app/actions/authActions";
import { useState } from "react";
import EditProfileModal from "@/components/EditProfileModal";

interface NavbarProps {
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
  currentGroupId?: string;
  unreadNotificationsCount?: number;
  onOpenAddExpense?: () => void;
}

export default function Navbar({
  user,
  groups,
  currentGroupId,
  unreadNotificationsCount = 0,
  onOpenAddExpense,
}: NavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          {/* Left branding */}
          <div className="flex items-center space-x-3">
            <Link href={currentGroupId ? `/groups/${currentGroupId}/dashboard` : "/personal"} className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-lg shadow-purple-500/20 text-white font-bold text-lg">
                S
              </div>
              <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-purple-400">
                SPENDZ
              </span>
            </Link>

            {/* Group Switcher dropdown badge & Personal Tracker toggle */}
            <div className="hidden sm:flex items-center space-x-3 pl-4 border-l border-border/60">
              {groups.length > 0 && (
                <select
                  value={currentGroupId || "PERSONAL"}
                  onChange={(e) => {
                    if (e.target.value === "PERSONAL") {
                      window.location.href = "/personal";
                    } else if (e.target.value === "FITNESS") {
                      window.location.href = "/fitness";
                    } else if (e.target.value) {
                      window.location.href = `/groups/${e.target.value}/dashboard`;
                    }
                  }}
                  className="bg-secondary/60 text-sm font-medium text-foreground py-1.5 px-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <optgroup label="Personal & Fitness">
                    <option value="PERSONAL">👤 Personal Tracker</option>
                    <option value="FITNESS">💪 Fitness & Gym</option>
                  </optgroup>
                  <optgroup label="Spendz Groups">
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        🏠 {g.name} ({g.role})
                      </option>
                    ))}
                  </optgroup>
                </select>
              )}

              <Link
                href="/personal"
                className="text-xs font-bold px-3 py-1.5 rounded-lg border text-muted-foreground hover:text-foreground border-border/40 hover:bg-secondary/60 transition-all"
              >
                Personal
              </Link>
              <Link
                href="/fitness"
                className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm transition-all"
              >
                💪 Gym Tracker
              </Link>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-3">
            {onOpenAddExpense && (
              <button
                onClick={onOpenAddExpense}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-[1.02]"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Add Expense</span>
              </button>
            )}

            {/* User Profile info & Avatar Edit button */}
            <div className="flex items-center space-x-3 pl-2">
              <button
                onClick={() => setIsProfileOpen(true)}
                title="Edit Avatar & Profile"
                className="flex items-center space-x-2 p-1 rounded-xl hover:bg-secondary/60 transition-all group border border-transparent hover:border-purple-500/30"
              >
                <div className="relative">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full border border-purple-500/40 object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-purple-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <User className="h-2.5 w-2.5" />
                  </div>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-foreground leading-tight group-hover:text-purple-400 transition-colors">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{user.email}</p>
                </div>
              </button>

              <form action={logoutUser}>
                <button
                  type="submit"
                  title="Logout"
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <EditProfileModal user={user} isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}
