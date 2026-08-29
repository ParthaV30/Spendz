"use client";

import Link from "next/link";
import { User, LogOut, PlusCircle, Bell, Layers, Shield, Menu } from "lucide-react";
import { logoutUser } from "@/app/actions/authActions";
import { useState } from "react";

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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        {/* Left branding */}
        <div className="flex items-center space-x-3">
          <Link href={currentGroupId ? `/groups/${currentGroupId}/dashboard` : "/dashboard"} className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-lg shadow-purple-500/20 text-white font-bold">
              R
            </div>
            <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-purple-400">
              ROOMMATE
            </span>
          </Link>

          {/* Group Switcher dropdown badge */}
          {groups.length > 0 && (
            <div className="hidden sm:flex items-center space-x-2 pl-4 border-l border-border/60">
              <select
                value={currentGroupId || ""}
                onChange={(e) => {
                  if (e.target.value) {
                    window.location.href = `/groups/${e.target.value}/dashboard`;
                  }
                }}
                className="bg-secondary/60 text-sm font-medium text-foreground py-1.5 px-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.role})
                  </option>
                ))}
              </select>
            </div>
          )}
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

          {/* User Profile info */}
          <div className="flex items-center space-x-3 pl-2">
            <div className="flex items-center space-x-2">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full border border-purple-500/40" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-foreground leading-tight">{user.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{user.email}</p>
              </div>
            </div>

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
  );
}
