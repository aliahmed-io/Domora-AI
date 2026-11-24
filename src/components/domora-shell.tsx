"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DemoRole } from "@/lib/auth";

interface DomoraShellProps {
  children: React.ReactNode;
  role: DemoRole;
  displayName: string;
  unreadNotifications: number;
}

const NAV_ITEMS = [
  { href: "/portfolio", label: "Portfolio", managerOnly: false },
  { href: "/explorer", label: "Explorer", managerOnly: true },
  { href: "/tenants", label: "Tenants", managerOnly: false },
  { href: "/leases", label: "Leases", managerOnly: false },
  { href: "/payments", label: "Payments", managerOnly: false },
  { href: "/maintenance", label: "Maintenance", managerOnly: false },
  { href: "/notifications", label: "Notifications", managerOnly: false },
  { href: "/intelligence", label: "Intelligence", managerOnly: true },
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
      <header className="sticky top-0 z-40 border-b border-[#C5A88A]/70 bg-[#FAF5EE]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 sm:px-8 h-16">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="font-display text-[26px] leading-none tracking-tight text-[#262824]">
                Domora
              </span>
              <span className="font-mono-num text-[11px] text-[#8C4A3D] tracking-widest">
                AI
              </span>
            </Link>

            <nav
              aria-label="Primary navigation"
              className="hidden lg:flex items-center gap-6"
            >
              {visibleNav.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative py-5 text-[13px] transition-colors",
                      active
                        ? "text-[#262824] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#8C4A3D]"
                        : "text-[#5A5C56] hover:text-[#262824]"
                    )}
                  >
                    <span>{item.label}</span>
                    {item.href === "/notifications" && unreadNotifications > 0 && (
                      <span className="ml-1.5 font-mono-num text-[11px] text-[#8C4A3D]">
                        ({unreadNotifications})
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <span className="text-[#5A5C56] hidden xl:inline">
                {displayName}
              </span>
              <div className="flex border border-[#C5A88A] bg-[#F5EBDF]">
                <button
                  type="button"
                  disabled={switching}
                  onClick={() => handleRoleSwitch("MANAGER")}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
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
                    "px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
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
          <div className="lg:hidden border-t border-[#C5A88A]/60 bg-[#FAF5EE] px-4 py-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#C5A88A]/40">
              <span className="text-xs text-[#5A5C56]">{displayName}</span>
              <div className="flex border border-[#C5A88A]">
                <button
                  type="button"
                  onClick={() => handleRoleSwitch("MANAGER")}
                  className={cn(
                    "px-2.5 py-1 text-xs",
                    role === "MANAGER" ? "bg-[#262824] text-[#FAF5EE]" : ""
                  )}
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch("TENANT")}
                  className={cn(
                    "px-2.5 py-1 text-xs",
                    role === "TENANT" ? "bg-[#8C4A3D] text-[#FAF5EE]" : ""
                  )}
                >
                  Tenant
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {visibleNav.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "px-3 py-2 text-sm border",
                      active
                        ? "border-[#262824] bg-[#F5EBDF] font-medium"
                        : "border-[#C5A88A]/50 text-[#5A5C56]"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 sm:px-8 py-10">
        {children}
      </main>

      <footer className="border-t border-[#C5A88A]/60 bg-[#FAF5EE] py-6 px-4 sm:px-8">
        <div className="mx-auto max-w-[1440px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#5A5C56]">
          <p>
            <span className="font-display text-base text-[#262824] mr-2">Domora</span>
            Spaces managed beautifully.
          </p>
          <p>Fictional demonstration portfolio</p>
        </div>
      </footer>
    </div>
  );
}
