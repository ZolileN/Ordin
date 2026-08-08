"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Shield,
  AlertTriangle,
  Database,
  Building2,
  FileText,
  Settings,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Controls",
    icon: Shield,
    children: [
      { name: "All Controls", href: "/controls" },
      { name: "Control Library", href: "/controls/library" },
      { name: "Control Runs", href: "/controls/runs" },
    ],
  },
  {
    name: "Exceptions",
    icon: AlertTriangle,
    children: [
      { name: "All", href: "/exceptions" },
      { name: "Critical", href: "/exceptions?severity=CRITICAL" },
      { name: "Assigned to Me", href: "/exceptions?assigned=me" },
      { name: "Resolved", href: "/exceptions?status=RESOLVED" },
    ],
  },
  {
    name: "Data",
    icon: Database,
    children: [
      { name: "Data Sources", href: "/data/sources" },
      { name: "Datasets", href: "/data/datasets" },
      { name: "Upload", href: "/data/upload" },
    ],
  },
  {
    name: "Business",
    icon: Building2,
    children: [
      { name: "Entities", href: "/business/entities" },
      { name: "Branches", href: "/business/branches" },
    ],
  },
  { name: "Reports", href: "/reports", icon: FileText },
  {
    name: "Settings",
    icon: Settings,
    children: [
      { name: "Organization", href: "/settings/organization" },
      { name: "Users", href: "/settings/users" },
      { name: "Subscription", href: "/settings/subscription" },
      { name: "Audit Log", href: "/settings/audit" },
    ],
  },
];

interface SidebarProps {
  organizationName: string;
  userName?: string | null;
}

export function Sidebar({ organizationName, userName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-zinc-200 bg-zinc-50">
      <div className="flex h-14 items-center border-b border-zinc-200 px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-zinc-900 text-xs font-bold text-white">
            O
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-900">Ordin</span>
        </Link>
      </div>

      <div className="border-b border-zinc-200 px-4 py-3">
        <p className="truncate text-xs font-medium text-zinc-500">Organization</p>
        <p className="truncate text-sm font-medium text-zinc-900">{organizationName}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navigation.map((item) => {
            if (item.children) {
              const isActive = item.children.some((c) => pathname.startsWith(c.href.split("?")[0]));
              return (
                <li key={item.name}>
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium",
                      isActive ? "text-zinc-900" : "text-zinc-600"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.name}
                    <ChevronDown className="ml-auto h-3 w-3 opacity-50" />
                  </div>
                  <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-zinc-200 pl-3">
                    {item.children.map((child) => {
                      const childPath = child.href.split("?")[0];
                      const active = pathname === childPath || pathname.startsWith(childPath + "/");
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              "block rounded-md px-2 py-1 text-sm transition-colors",
                              active
                                ? "bg-zinc-200/60 font-medium text-zinc-900"
                                : "text-zinc-500 hover:text-zinc-900"
                            )}
                          >
                            {child.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            }

            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.name}>
                <Link
                  href={item.href!}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-zinc-200/60 text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-zinc-200 p-3">
        <div className="flex items-center justify-between rounded-md px-2 py-1.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900">{userName ?? "User"}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
