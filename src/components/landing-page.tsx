"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { DOMORA_MOTION } from "@/lib/tokens";
import { formatCurrency } from "@/lib/utils";

interface LandingProperty {
  id: string;
  name: string;
  city: string;
  state: string;
  imageUrl: string;
  unitCount: number;
}

interface LandingPageProps {
  stats: {
    propertyCount: number;
    unitCount: number;
    occupancyPct: number;
    monthlyScheduledRent: number;
  };
  properties: LandingProperty[];
  role: "MANAGER" | "TENANT";
}

export function LandingPage({ stats, properties, role }: LandingPageProps) {
  return (
    <div className="space-y-20">
      {/* Asymmetric Editorial Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: DOMORA_MOTION.durationSlow,
          ease: DOMORA_MOTION.easeEditorial,
        }}
        className="grid grid-cols-1 lg:grid-cols-12 border border-[#C5A88A] bg-[#FAF5EE]"
      >
        <div className="lg:col-span-6 p-8 sm:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#C5A88A]">
          <div className="space-y-6">
            <h1 className="font-display text-5xl sm:text-7xl leading-[0.96] tracking-tight text-[#262824]">
              Spaces,
              <br />
              stewarded.
            </h1>
            <p className="max-w-md text-base text-[#5A5C56] leading-relaxed">
              Domora brings spatial building intelligence, lease governance,
              manual rent accounting, and maintenance orchestration into one
              calm architectural ledger.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/portfolio"
                className="bg-[#262824] hover:bg-[#3A3D37] text-[#FAF5EE] px-6 py-3 text-sm font-medium transition-colors"
              >
                {role === "TENANT" ? "Open Resident Portal" : "Enter Portfolio"}
              </Link>
              {role === "MANAGER" && (
                <Link
                  href="/explorer"
                  className="border border-[#C5A88A] hover:border-[#262824] bg-[#F5EBDF] px-6 py-3 text-sm font-medium text-[#262824] transition-colors"
                >
                  Inspect Building Elevation
                </Link>
              )}
            </div>
          </div>

          <div className="mt-14 pt-8 border-t border-[#C5A88A]/60 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <span className="block text-xs text-[#5A5C56]">Properties</span>
              <span className="font-mono-num text-2xl font-medium text-[#262824] mt-1 block">
                {stats.propertyCount}
              </span>
            </div>
            <div>
              <span className="block text-xs text-[#5A5C56]">Total Units</span>
              <span className="font-mono-num text-2xl font-medium text-[#262824] mt-1 block">
                {stats.unitCount}
              </span>
            </div>
            <div>
              <span className="block text-xs text-[#5A5C56]">Occupancy</span>
              <span className="font-mono-num text-2xl font-medium text-[#6F795E] mt-1 block">
                {stats.occupancyPct}%
              </span>
            </div>
            <div>
              <span className="block text-xs text-[#5A5C56]">Monthly Roll</span>
              <span className="font-mono-num text-2xl font-medium text-[#262824] mt-1 block">
                {formatCurrency(stats.monthlyScheduledRent)}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 relative min-h-[360px] lg:min-h-[580px]">
          <Image
            src="/images/courtyard-residence.jpg"
            alt="The Courtyard Residence travertine facade in golden hour light"
            fill
            priority
            className="object-cover"
          />
        </div>
      </motion.section>

      {/* Architectural Portfolio Spread */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#C5A88A] pb-5">
          <h2 className="font-display text-4xl text-[#262824]">
            Managed Architecture
          </h2>
          <Link
            href="/portfolio"
            className="text-sm text-[#8C4A3D] hover:underline"
          >
            View full portfolio ledger
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {properties.slice(0, 3).map((p, idx) => (
            <Link
              key={p.id}
              href={role === "MANAGER" ? `/explorer?propertyId=${p.id}` : "/portfolio"}
              className={
                idx === 0
                  ? "md:col-span-6 border border-[#C5A88A] bg-[#FAF5EE] group block"
                  : "md:col-span-3 border border-[#C5A88A] bg-[#FAF5EE] group block"
              }
            >
              <div className="relative h-64 w-full overflow-hidden border-b border-[#C5A88A]">
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-5 flex items-baseline justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl text-[#262824]">
                    {p.name}
                  </h3>
                  <p className="text-xs text-[#5A5C56] mt-0.5">
                    {p.city}, {p.state}
                  </p>
                </div>
                <span className="font-mono-num text-xs text-[#5A5C56]">
                  {p.unitCount} units
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Operational Lifecycle Index */}
      <section className="border-t border-[#C5A88A] pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <h2 className="font-display text-4xl text-[#262824] leading-tight">
              Built for the full rental lifecycle.
            </h2>
            <p className="text-sm text-[#5A5C56] mt-3 max-w-sm leading-relaxed">
              Every module shares a single PostgreSQL ledger—from spatial unit
              elevations to transactional rent accounting and scheduled alerts.
            </p>
          </div>

          <div className="lg:col-span-8 divide-y divide-[#C5A88A] border-t border-b border-[#C5A88A]">
            <Link
              href={role === "MANAGER" ? "/explorer" : "/portfolio"}
              className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF5EE]/60 px-2 transition-colors"
            >
              <div>
                <h3 className="font-display text-2xl text-[#262824]">
                  Interactive Building Explorer
                </h3>
                <p className="text-sm text-[#5A5C56] mt-1">
                  Inspect floors and unit states on a live SVG elevation, or
                  switch to an abstract grid when CAD plans are unavailable.
                </p>
              </div>
              <span className="font-mono-num text-xs text-[#8C4A3D] shrink-0">
                /explorer
              </span>
            </Link>

            <Link
              href="/payments"
              className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF5EE]/60 px-2 transition-colors"
            >
              <div>
                <h3 className="font-display text-2xl text-[#262824]">
                  Transactional Rent Ledger
                </h3>
                <p className="text-sm text-[#5A5C56] mt-1">
                  Automated monthly obligations, partial payments, overdue
                  tracking, and clear separation of manual vs. bank entries.
                </p>
              </div>
              <span className="font-mono-num text-xs text-[#8C4A3D] shrink-0">
                /payments
              </span>
            </Link>

            <Link
              href="/maintenance"
              className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF5EE]/60 px-2 transition-colors"
            >
              <div>
                <h3 className="font-display text-2xl text-[#262824]">
                  Drag-and-Drop Maintenance Hub
                </h3>
                <p className="text-sm text-[#5A5C56] mt-1">
                  Move work orders across Open, Assigned, In Progress, Resolved,
                  and Closed with contractor dispatch and cost variance.
                </p>
              </div>
              <span className="font-mono-num text-xs text-[#8C4A3D] shrink-0">
                /maintenance
              </span>
            </Link>

            <Link
              href={role === "MANAGER" ? "/intelligence" : "/notifications"}
              className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF5EE]/60 px-2 transition-colors"
            >
              <div>
                <h3 className="font-display text-2xl text-[#262824]">
                  Dual-Layer Portfolio Intelligence
                </h3>
                <p className="text-sm text-[#5A5C56] mt-1">
                  Deterministic anomaly &amp; expiration rules paired with
                  Logistic Regression and Random Forest late-payment evaluation.
                </p>
              </div>
              <span className="font-mono-num text-xs text-[#8C4A3D] shrink-0">
                /intelligence
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
