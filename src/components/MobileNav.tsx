"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Scale,
  PlusCircle,
  Menu,
  X,
  PieChart,
  Target,
  Repeat,
  Settings,
  ShieldAlert,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { logoutUser } from "@/app/actions/authActions";
import { clsx } from "clsx";

interface MobileNavProps {
  groupId: string;
  role: string;
  user: {
    name: string;
    email: string;
    avatar?: string | null;
  };
  groups: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  onOpenAddExpense: () => void;
}

export default function MobileNav({
  groupId,
  role,
  user,
  groups,
  onOpenAddExpense,
}: MobileNavProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mainTabs = [
    {
      name: "Dashboard",
      href: `/groups/${groupId}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      name: "Expenses",
      href: `/groups/${groupId}/expenses`,
      icon: Receipt,
    },
    {
      name: "Balances",
      href: `/groups/${groupId}/balances`,
      icon: Scale,
    },
    {
      name: "Analytics",
      href: `/groups/${groupId}/analytics`,
      icon: PieChart,
    },
  ];

  const drawerLinks = [
    { name: "Dashboard", href: `/groups/${groupId}/dashboard`, icon: LayoutDashboard },
    { name: "Expenses", href: `/groups/${groupId}/expenses`, icon: Receipt },
    { name: "Balances & Settle", href: `/groups/${groupId}/balances`, icon: Scale },
    { name: "Analytics & Reports", href: `/groups/${groupId}/analytics`, icon: PieChart },
    { name: "Category Budgets", href: `/groups/${groupId}/budgets`, icon: Target },
    { name: "Recurring Expenses", href: `/groups/${groupId}/recurring`, icon: Repeat },
    { name: "Group Settings", href: `/groups/${groupId}/settings`, icon: Settings },
    { name: "Audit Logs", href: `/groups/${groupId}/audit`, icon: ShieldAlert },
  ];

  return (
    <>
      {/* Bottom Sticky Navigation Bar for Mobile (< 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border/60 px-2 py-2 flex items-center justify-around">
        {mainTabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "flex flex-col items-center justify-center space-y-1 text-[10px] font-medium transition-colors py-1 px-2 rounded-xl",
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </Link>
          );
        })}

        {/* Floating Action Button (Add Expense) */}
        <button
          onClick={onOpenAddExpense}
          className="flex flex-col items-center justify-center -mt-5 bg-gradient-to-tr from-purple-600 to-indigo-500 text-white p-3 rounded-full shadow-lg shadow-purple-500/40 active:scale-95 transition-transform"
          title="Add Expense"
        >
          <PlusCircle className="h-6 w-6" />
        </button>

        {mainTabs.slice(2, 4).map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "flex flex-col items-center justify-center space-y-1 text-[10px] font-medium transition-colors py-1 px-2 rounded-xl",
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </Link>
          );
        })}

        {/* Menu drawer trigger button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center space-y-1 text-[10px] font-medium text-muted-foreground hover:text-foreground py-1 px-2 rounded-xl"
        >
          <Menu className="h-5 w-5" />
          <span>More</span>
        </button>
      </div>

      {/* Full Mobile Slide-Over Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm">
          <div className="w-4/5 max-w-xs bg-card border-r border-border/60 h-full p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-black text-sm">
                    S
                  </div>
                  <span className="font-black text-foreground tracking-tight">SPENDZ</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Group / Mode Switcher */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Mode / Room Switcher
                </label>
                <select
                  value={groupId || "PERSONAL"}
                  onChange={(e) => {
                    if (e.target.value === "PERSONAL") {
                      window.location.href = "/personal";
                    } else if (e.target.value) {
                      window.location.href = `/groups/${e.target.value}/dashboard`;
                    }
                  }}
                  className="w-full bg-secondary/60 text-xs font-semibold text-foreground py-2 px-3 rounded-xl border border-border focus:outline-none"
                >
                  <optgroup label="Personal Mode">
                    <option value="PERSONAL">👤 Personal Tracker</option>
                  </optgroup>
                  <optgroup label="Spendz Groups">
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        🏠 {g.name} ({g.role})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1 pt-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Menu Links
                </p>
                {drawerLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={clsx(
                        "flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground font-bold shadow"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom Profile & Logout */}
            <div className="pt-4 border-t border-border/40 space-y-3">
              <div className="flex items-center space-x-3">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full border border-purple-500/40" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-foreground">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <form action={logoutUser}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 py-2 bg-destructive/10 text-destructive text-xs font-bold rounded-xl hover:bg-destructive/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
