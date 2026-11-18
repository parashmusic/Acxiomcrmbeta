"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Role } from "@prisma/client";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  TrendingUp,
  CalendarCheck,
  Activity as ActivityIcon,
  ShieldCheck,
  FileBarChart,
  UserCog,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [Role.ADMIN, Role.MANAGER, Role.SALES_EXECUTIVE],
  },
  {
    label: "Customers",
    href: "/customers",
    icon: Users,
    roles: [Role.ADMIN, Role.MANAGER, Role.SALES_EXECUTIVE],
  },
  {
    label: "Leads",
    href: "/leads",
    icon: UserCheck,
    roles: [Role.ADMIN, Role.MANAGER, Role.SALES_EXECUTIVE],
  },
  {
    label: "Opportunities",
    href: "/opportunities",
    icon: TrendingUp,
    roles: [Role.ADMIN, Role.MANAGER, Role.SALES_EXECUTIVE],
  },
  {
    label: "Follow-Ups",
    href: "/follow-ups",
    icon: CalendarCheck,
    roles: [Role.ADMIN, Role.MANAGER, Role.SALES_EXECUTIVE],
  },
  {
    label: "Activities",
    href: "/activities",
    icon: ActivityIcon,
    roles: [Role.ADMIN, Role.MANAGER, Role.SALES_EXECUTIVE],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileBarChart,
    roles: [Role.ADMIN, Role.MANAGER, Role.SALES_EXECUTIVE],
  },
  {
    label: "User Management",
    href: "/users",
    icon: UserCog,
    roles: [Role.ADMIN, Role.MANAGER],
  },
  {
    label: "Audit Logs",
    href: "/audit-logs",
    icon: ShieldCheck,
    roles: [Role.ADMIN],
  },
];

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden md:flex w-64 border-r bg-card flex-col h-screen sticky top-0 shrink-0">
      <div className="h-16 flex items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center">
          <span className="font-bold text-lg tracking-tight text-primary">Acxiom Consulting</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Acxiom Consulting CRM</p>
        <p>Enterprise Sales Edition</p>
      </div>
    </aside>
  );
}

