"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Compass,
  Users,
  FileText,
  CreditCard,
  Wrench,
  Bell,
  Sparkles,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DemoRole } from "@/lib/auth";

interface DomoraShellProps {
  children: React.ReactNode;
  role: DemoRole;
  displayName: string;
  unreadNotifications: number;
}

const NAV_ITEMS = [
  { href: "/", label: "Portfolio", icon: Building2, managerOnly: false },
  { href: "/explorer", label: "Explorer", icon: Compass, managerOnly: true },
  { href: "/tenants", label: "Tenants", icon: Users, managerOnly: false },
  { href: "/leases", label: "Leases", icon: FileText, managerOnly: false },
  { href: "/payments", label: "Payments", icon: CreditCard, managerOnly: false },
  { href: "/maintenance", label: "Maintenance", icon: Wrench, managerOnly: false },
  { href: "/notifications", label: "Notifications", icon: Bell, managerOnly: false },
  { href: "/intelligence", label: "Intelligence", icon: Sparkles, managerOnly: true },
] as const;

export function DomoraShell({
  children,
  role,
  displayName,
  unreadNotifications,
}: DomoraShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleRoleSwitch(nextRole: DemoRole) {
    setSwitching(true);
    try {
      await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      router.refresh();
    } finally {
      setSwitching(false);
    }
  }

  const visibleNav = NAV_ITEMS.filter((item) =>
    role === "TENANT" ? !item.managerOnly : true
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EBDF] text-[#262824]">
      <header className="sticky top-0 z-40 border-b border-[#C5A88A]/60 bg-[#FAF5EE]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 sm:px-8 h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center border border-[#8C4A3D] bg-[#8C4A3D] text-[#FAF5EE]">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="leading-none">
                <span className="font-display text-2xl tracking-tight text-[#262824]">
                  Domora
                </span>
                <span className="ml-1.5 font-mono-num text-[11px] text-[#8C4A3D] uppercase tracking-widest">
                  AI
                </span>
              </div>
            </Link>

            <nav
              aria-label="Primary navigation"
              className="hidden lg:flex items-center gap-1"
            >
              {visibleNav.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors border border-transparent",
                      active
                        ? "border-[#C5A88A] bg-[#F5EBDF] text-[#262824]"
                        : "text-[#5A5C56] hover:text-[#262824] hover:bg-[#F5EBDF]/60"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                    {item.href === "/notifications" && unreadNotifications > 0 && (
                      <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center bg-[#8C4A3D] px-1 font-mono-num text-[10px] text-[#FAF5EE]">
                        {unreadNotifications}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 border border-[#C5A88A] bg-[#F5EBDF] px-2.5 py-1 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-[#6F795E]" />
              <span className="text-[#5A5C56] hidden md:inline">{displayName}</span>
              <div className="flex items-center border-l border-[#C5A88A] pl-2 gap-1">
                <button
                  type="button"
                  disabled={switching}
                  onClick={() => handleRoleSwitch("MANAGER")}
                  className={cn(
                    "px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
                    role === "MANAGER"
                      ? "bg-[#262824] text-[#FAF5EE]"
                      : "text-[#5A5C56] hover:text-[#262824]"
                  )}
                >
                  Manager
                </button>
                <button
                  type="button"
                  disabled={switching}
                  onClick={() => handleRoleSwitch("TENANT")}
                  className={cn(
                    "px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
                    role === "TENANT"
                      ? "bg-[#8C4A3D] text-[#FAF5EE]"
                      : "text-[#5A5C56] hover:text-[#262824]"
                  )}
                >
                  Tenant
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="lg:hidden inline-flex items-center justify-center border border-[#C5A88A] p-2 text-[#262824]"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-[#C5A88A]/60 bg-[#FAF5EE] px-4 py-3 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#C5A88A]/40">
              <span className="text-xs text-[#5A5C56]">{displayName}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleRoleSwitch("MANAGER")}
                  className={cn(
                    "px-2 py-1 text-xs border border-[#C5A88A]",
                    role === "MANAGER" ? "bg-[#262824] text-[#FAF5EE]" : ""
                  )}
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch("TENANT")}
                  className={cn(
                    "px-2 py-1 text-xs border border-[#C5A88A]",
                    role === "TENANT" ? "bg-[#8C4A3D] text-[#FAF5EE]" : ""
                  )}
                >
                  Tenant
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm border",
                      active
                        ? "border-[#262824] bg-[#F5EBDF] font-medium"
                        : "border-[#C5A88A]/50 text-[#5A5C56]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 sm:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-[#C5A88A]/60 bg-[#FAF5EE] py-5 px-4 sm:px-8">
        <div className="mx-auto max-w-[1440px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#5A5C56]">
          <p>
            <span className="font-display text-base text-[#262824] mr-2">Domora AI</span>
            Spaces managed beautifully. Fictional demonstration portfolio.
          </p>
          <p className="font-mono-num">
            Manual Ledger Mode · PostgreSQL + Prisma · Advisory ML
          </p>
        </div>
      </footer>
    </div>
  );
}
