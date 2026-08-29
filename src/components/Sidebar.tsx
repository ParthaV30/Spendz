"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Scale,
  PieChart,
  Target,
  Repeat,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { clsx } from "clsx";

interface SidebarProps {
  groupId: string;
  role: string;
}

export default function Sidebar({ groupId, role }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
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
      name: "Balances & Settle",
      href: `/groups/${groupId}/balances`,
      icon: Scale,
    },
    {
      name: "Analytics & Reports",
      href: `/groups/${groupId}/analytics`,
      icon: PieChart,
    },
    {
      name: "Budgets",
      href: `/groups/${groupId}/budgets`,
      icon: Target,
    },
    {
      name: "Recurring",
      href: `/groups/${groupId}/recurring`,
      icon: Repeat,
    },
    {
      name: "Group Settings",
      href: `/groups/${groupId}/settings`,
      icon: Settings,
    },
    {
      name: "Audit Logs",
      href: `/groups/${groupId}/audit`,
      icon: ShieldAlert,
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-border/40 bg-card/40 hidden md:block min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Navigation ({role})
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
