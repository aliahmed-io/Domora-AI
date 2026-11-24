"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  DOMORA_MOTION,
  UNIT_VISUAL_STATES,
  type UnitVisualStateKey,
} from "@/lib/tokens";
import { cn, formatCurrency } from "@/lib/utils";

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
    collectedMtd: number;
    overdueTotal: number;
    openMaintenance: number;
  };
  properties: LandingProperty[];
  role: "MANAGER" | "TENANT";
}

interface PreviewUnit {
  unit: string;
  floor: number;
  state: UnitVisualStateKey;
  resident: string;
  rent: number;
  note: string;
}

const PREVIEW_UNITS: PreviewUnit[] = [
  {
    unit: "301",
    floor: 3,
    state: "OCCUPIED",
    resident: "A. Pendelton",
    rent: 3450,
    note: "Lease active through Nov 2027",
  },
  {
    unit: "302",
    floor: 3,
    state: "EXPIRING_SOON",
    resident: "D. Brooks",
    rent: 3900,
    note: "Renewal notice queued — 28 days remaining",
  },
  {
    unit: "303",
    floor: 3,
    state: "OCCUPIED",
    resident: "S. Al-Mansoor",
    rent: 3450,
    note: "Auto-ledger paid on the 1st",
  },
  {
    unit: "201",
    floor: 2,
    state: "MAINTENANCE",
    resident: "Vacant / Work Order",
    rent: 3300,
    note: "HVAC fan-coil calibration in progress",
  },
  {
    unit: "202",
    floor: 2,
    state: "OCCUPIED",
    resident: "M. Chen",
    rent: 3750,
    note: "2-year resident history",
  },
  {
    unit: "203",
    floor: 2,
    state: "VACANT",
    resident: "Ready to lease",
    rent: 3300,
    note: "Listing active — vacancy reminder queued",
  },
  {
    unit: "101",
    floor: 1,
    state: "OCCUPIED",
    resident: "E. Vance",
    rent: 2800,
    note: "Demo resident portal account",
  },
  {
    unit: "102",
    floor: 1,
    state: "EXPIRING_SOON",
    resident: "N. Kowalski",
    rent: 3150,
    note: "Partial balance open — escalation flagged",
  },
  {
    unit: "103",
    floor: 1,
    state: "VACANT",
    resident: "Ready to lease",
    rent: 2800,
    note: "Available for immediate move-in",
  },
];

const SAMPLE_NOTIFICATIONS = [
  {
    id: "n1",
    type: "OVERDUE_RENT",
    title: "Overdue Balance — Unit 102",
    body: "N. Kowalski has an outstanding balance of $650 past the 5-day grace period.",
    age: "2h ago",
    unread: true,
  },
  {
    id: "n2",
    type: "LEASE_EXPIRING",
    title: "Lease Expiring — Unit 302",
    body: "D. Brooks' lease expires in 28 days. Renewal notice has been generated.",
    age: "6h ago",
    unread: true,
  },
  {
    id: "n3",
    type: "MAINTENANCE_UPDATE",
    title: "Work Order Assigned — Unit 201",
    body: "HVAC calibration assigned to Meridian HVAC Solutions. Estimated cost: $420.",
    age: "1d ago",
    unread: false,
  },
  {
    id: "n4",
    type: "VACANCY",
    title: "Vacant Unit Reminder — Unit 203",
    body: "Unit 203 has been vacant for 14 days. Consider activating a listing.",
    age: "1d ago",
    unread: false,
  },
];

const INTELLIGENCE_SIGNALS = [
  { label: "Anomalous Maintenance Spend", value: "1 property", accent: "#8C4A3D" },
  { label: "Leases Expiring ≤ 45 days", value: "2 units", accent: "#C5A88A" },
  { label: "Payment Lateness Probability", value: "Model active", accent: "#6F795E" },
  { label: "Portfolio Collection Rate MTD", value: "87.4%", accent: "#6F795E" },
];

export function LandingPage({ stats, properties, role }: LandingPageProps) {
  const [selectedPreview, setSelectedPreview] = useState<PreviewUnit>(
    () => PREVIEW_UNITS[0]!
  );

  return (
    <div className="space-y-24">
      {/* ─── 1. Asymmetric Editorial Hero ─────────────────────────────── */}
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
            <h1 className="font-display text-5xl sm:text-7xl lg:text-[82px] leading-[0.94] tracking-tight text-[#262824]">
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

        <div className="lg:col-span-6 relative min-h-[380px] lg:min-h-[600px]">
          <Image
            src="/images/courtyard-residence.jpg"
            alt="The Courtyard Residence travertine facade in golden hour light"
            fill
            priority
            className="object-cover"
          />
        </div>
      </motion.section>

      {/* ─── 2. Charcoal Architectural Manifesto Band ─────────────────── */}
      <section className="bg-[#262824] text-[#FAF5EE] border border-[#262824] p-8 sm:p-16 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end border-b border-[#C5A88A]/30 pb-10">
          <h2 className="lg:col-span-7 font-display text-4xl sm:text-6xl leading-[1.02]">
            A building is not a spreadsheet.
          </h2>
          <p className="lg:col-span-5 text-sm sm:text-base text-[#DFCDB8] leading-relaxed">
            Conventional property software buries physical spaces beneath
            endless generic tables. Domora starts from the elevation of the
            building itself and connects every unit directly to its legal and
            financial truth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3 border-l border-[#C5A88A]/40 pl-5">
            <span className="font-mono-num text-xs text-[#C5A88A]">01</span>
            <h3 className="font-display text-2xl">Spatial Truth</h3>
            <p className="text-sm text-[#DFCDB8]/85 leading-relaxed">
              Every floor and bay reflects real-time occupancy, maintenance
              holds, and 45-day lease expiration windows—or falls back cleanly
              to an abstract grid when CAD plans are unavailable.
            </p>
          </div>
          <div className="space-y-3 border-l border-[#C5A88A]/40 pl-5">
            <span className="font-mono-num text-xs text-[#C5A88A]">02</span>
            <h3 className="font-display text-2xl">Atomic Accounting</h3>
            <p className="text-sm text-[#DFCDB8]/85 leading-relaxed">
              Manual rent payments settle inside PostgreSQL transactions,
              updating balances atomically while explicitly distinguishing
              manager entries from verified bank settlements.
            </p>
          </div>
          <div className="space-y-3 border-l border-[#C5A88A]/40 pl-5">
            <span className="font-mono-num text-xs text-[#C5A88A]">03</span>
            <h3 className="font-display text-2xl">Non-Punitive Intelligence</h3>
            <p className="text-sm text-[#DFCDB8]/85 leading-relaxed">
              Rule-based anomaly detection and advisory Logistic Regression vs.
              Random Forest models operate strictly on non-sensitive lease
              signals—never to penalize residents.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 3. Full-Width Editorial Pull Quote ───────────────────────── */}
      <section className="border-y border-[#C5A88A] bg-[#F5EBDF] py-16 sm:py-24 px-8 sm:px-16 overflow-hidden">
        <div className="max-w-6xl">
          <blockquote
            className="font-display text-5xl sm:text-7xl lg:text-[88px] leading-[0.96] tracking-tight text-[#262824]"
            aria-label="Editorial pull quote"
          >
            <span className="text-[#C5A88A] select-none" aria-hidden="true">
              &ldquo;
            </span>
            Property management should feel like{" "}
            <em>reading a good building</em>—floor by floor, fact by fact.
            <span className="text-[#C5A88A] select-none" aria-hidden="true">
              &rdquo;
            </span>
          </blockquote>
          <div className="mt-10 flex items-center gap-4 border-t border-[#C5A88A]/60 pt-6">
            <span className="font-mono-num text-xs text-[#5A5C56]">
              Domora Design Principle · 2024
            </span>
            <span className="h-px flex-1 bg-[#C5A88A]/40" aria-hidden="true" />
            <span className="font-mono-num text-xs text-[#8C4A3D]">
              v1.0.0
            </span>
          </div>
        </div>
      </section>

      {/* ─── 4. Interactive Elevation Preview ─────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 border border-[#C5A88A] bg-[#FAF5EE]">
        <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#C5A88A]">
          <div className="space-y-4">
            <h2 className="font-display text-4xl text-[#262824]">
              Click any bay to inspect the building.
            </h2>
            <p className="text-sm text-[#5A5C56] leading-relaxed">
              Select a unit in the live elevation preview on the right to see
              how Domora surfaces resident, lease, and maintenance context
              without leaving the architectural diagram.
            </p>
          </div>

          <div className="mt-8 border border-[#C5A88A] bg-[#F5EBDF] p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#C5A88A]/50 pb-3">
              <div>
                <span className="font-mono-num text-xs text-[#5A5C56]">
                  Floor {selectedPreview.floor}
                </span>
                <h3 className="font-display text-3xl text-[#262824]">
                  Unit {selectedPreview.unit}
                </h3>
              </div>
              <span
                className="px-2.5 py-1 text-[11px] font-medium border"
                style={{
                  backgroundColor:
                    UNIT_VISUAL_STATES[selectedPreview.state].fill,
                  color: UNIT_VISUAL_STATES[selectedPreview.state].text,
                  borderColor:
                    UNIT_VISUAL_STATES[selectedPreview.state].stroke,
                }}
              >
                {UNIT_VISUAL_STATES[selectedPreview.state].label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#5A5C56] block">Resident / Status</span>
                <span className="font-medium text-[#262824]">
                  {selectedPreview.resident}
                </span>
              </div>
              <div>
                <span className="text-[#5A5C56] block">Monthly Rent</span>
                <span className="font-mono-num font-medium text-[#262824]">
                  {formatCurrency(selectedPreview.rent)}
                </span>
              </div>
            </div>
            <p className="text-xs text-[#5A5C56] pt-1">{selectedPreview.note}</p>
          </div>

          <div className="mt-6">
            <Link
              href={role === "MANAGER" ? "/explorer" : "/portfolio"}
              className="inline-block bg-[#8C4A3D] hover:bg-[#753B30] text-[#FAF5EE] px-5 py-2.5 text-xs font-medium transition-colors"
            >
              Launch Full Building Explorer
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7 p-6 sm:p-10 bg-architectural-grid flex items-center justify-center">
          <div className="w-full max-w-xl space-y-3">
            {[3, 2, 1].map((floor) => (
              <div
                key={floor}
                className="grid grid-cols-12 gap-3 items-center border border-[#C5A88A] bg-[#FAF5EE] p-3"
              >
                <div className="col-span-2 font-mono-num text-xs text-[#5A5C56]">
                  F0{floor}
                </div>
                <div className="col-span-10 grid grid-cols-3 gap-2.5">
                  {PREVIEW_UNITS.filter((u) => u.floor === floor).map((u) => {
                    const style = UNIT_VISUAL_STATES[u.state];
                    const active = selectedPreview.unit === u.unit;
                    return (
                      <button
                        key={u.unit}
                        type="button"
                        onClick={() => setSelectedPreview(u)}
                        className={cn(
                          "p-3 text-left border transition-transform cursor-pointer",
                          active &&
                            "ring-2 ring-[#262824] ring-offset-2 ring-offset-[#FAF5EE]"
                        )}
                        style={{
                          backgroundColor: style.fill,
                          borderColor: style.stroke,
                          color: style.text,
                        }}
                      >
                        <span className="font-mono-num text-xs font-semibold block">
                          {u.unit}
                        </span>
                        <span className="text-[11px] opacity-90 block truncate mt-0.5">
                          {style.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. Managed Architecture Photo Spread ─────────────────────── */}
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
              href={
                role === "MANAGER"
                  ? `/explorer?propertyId=${p.id}`
                  : "/portfolio"
              }
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

      {/* ─── 6. Dual Editorial Spread: Financial Ledger & Work Orders ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 border border-[#C5A88A]">
        <div className="bg-[#FAF5EE] p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-[#C5A88A] space-y-8">
          <div className="space-y-3">
            <h2 className="font-display text-4xl text-[#262824]">
              Honest Rent Accounting
            </h2>
            <p className="text-sm text-[#5A5C56] leading-relaxed max-w-md">
              Monthly obligations generate automatically. Managers record full
              or partial payments inside database transactions with explicit
              manual-ledger provenance.
            </p>
          </div>

          <div className="border border-[#C5A88A] bg-[#F5EBDF] divide-y divide-[#C5A88A]/60 text-xs">
            <div className="p-4 flex items-center justify-between">
              <span className="text-[#5A5C56]">Scheduled Monthly Roll</span>
              <span className="font-mono-num text-base font-medium">
                {formatCurrency(stats.monthlyScheduledRent)}
              </span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-[#5A5C56]">Collected Month-to-Date</span>
              <span className="font-mono-num text-base font-medium text-[#6F795E]">
                {formatCurrency(stats.collectedMtd)}
              </span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-[#5A5C56]">Outstanding Overdue</span>
              <span className="font-mono-num text-base font-medium text-[#8C4A3D]">
                {formatCurrency(stats.overdueTotal)}
              </span>
            </div>
          </div>

          <Link
            href="/payments"
            className="inline-block border border-[#262824] px-5 py-2.5 text-xs font-medium hover:bg-[#262824] hover:text-[#FAF5EE] transition-colors"
          >
            Open Rent Ledger
          </Link>
        </div>

        <div className="bg-[#EDE0D0] p-8 sm:p-12 space-y-8">
          <div className="space-y-3">
            <h2 className="font-display text-4xl text-[#262824]">
              Tactile Work-Order Flow
            </h2>
            <p className="text-sm text-[#5A5C56] leading-relaxed max-w-md">
              Drag maintenance requests across five structured stages, assign
              vetted contractors, and monitor estimated versus actual repair
              spend.
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2 text-center">
            {["Open", "Assigned", "In Progress", "Resolved", "Closed"].map(
              (stage, i) => (
                <div
                  key={stage}
                  className="border border-[#C5A88A] bg-[#FAF5EE] p-3 space-y-1"
                >
                  <span className="font-mono-num text-[10px] text-[#8C4A3D] block">
                    0{i + 1}
                  </span>
                  <span className="text-[11px] font-medium text-[#262824] block">
                    {stage}
                  </span>
                </div>
              )
            )}
          </div>

          <div className="flex items-center justify-between border border-[#C5A88A] bg-[#FAF5EE] p-4 text-xs">
            <span className="text-[#5A5C56]">Active Open Tickets</span>
            <span className="font-mono-num text-base font-medium text-[#8C4A3D]">
              {stats.openMaintenance}
            </span>
          </div>

          <Link
            href="/maintenance"
            className="inline-block bg-[#262824] text-[#FAF5EE] px-5 py-2.5 text-xs font-medium hover:bg-[#3A3D37] transition-colors"
          >
            Open Maintenance Board
          </Link>
        </div>
      </section>

      {/* ─── 7. Live Notification Feed Preview ────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 border border-[#C5A88A] bg-[#FAF5EE]">
        <div className="lg:col-span-4 p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-[#C5A88A] flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="font-display text-4xl text-[#262824] leading-tight">
              Events that actually find you.
            </h2>
            <p className="text-sm text-[#5A5C56] leading-relaxed">
              Domora&apos;s daily scheduler writes idempotent notification
              records for overdue rent, expiring leases, vacant units, and
              maintenance changes. No duplicate events. No missed alerts.
            </p>
          </div>
          <Link
            href="/notifications"
            className="mt-8 inline-block border border-[#262824] px-5 py-2.5 text-xs font-medium hover:bg-[#262824] hover:text-[#FAF5EE] transition-colors self-start"
          >
            Open Notification Center
          </Link>
        </div>

        <div className="lg:col-span-8 p-6 sm:p-10 space-y-3">
          <div className="border-b border-[#C5A88A]/50 pb-3 mb-4 flex items-center justify-between">
            <span className="font-mono-num text-xs text-[#5A5C56]">
              Notification Queue · Sample
            </span>
            <span className="font-mono-num text-xs text-[#8C4A3D]">
              {SAMPLE_NOTIFICATIONS.filter((n) => n.unread).length} unread
            </span>
          </div>
          {SAMPLE_NOTIFICATIONS.map((n) => (
            <div
              key={n.id}
              className={cn(
                "border p-4 flex gap-4",
                n.unread
                  ? "border-[#8C4A3D]/40 bg-[#8C4A3D]/5 border-l-4 border-l-[#8C4A3D]"
                  : "border-[#C5A88A]/60 bg-[#F5EBDF]"
              )}
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#262824] truncate">
                    {n.title}
                  </span>
                  {n.unread && (
                    <span className="shrink-0 font-mono-num text-[10px] text-[#8C4A3D] border border-[#8C4A3D]/40 px-1.5 py-0.5">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5A5C56] leading-snug">{n.body}</p>
              </div>
              <span className="shrink-0 font-mono-num text-[10px] text-[#5A5C56] mt-0.5">
                {n.age}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 8. Intelligence Signal Board ─────────────────────────────── */}
      <section className="bg-[#262824] border border-[#262824] p-8 sm:p-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-5">
            <h2 className="font-display text-4xl sm:text-5xl text-[#FAF5EE] leading-[1.04]">
              Portfolio intelligence, without the noise.
            </h2>
            <p className="text-sm text-[#DFCDB8] leading-relaxed max-w-sm">
              Rule-based anomaly detection surfaces spending outliers, vacancy
              windows, and collection dips. Advisory ML models evaluate payment
              lateness probability across lease cohorts—purely for analysis.
            </p>
            <Link
              href="/intelligence"
              className="inline-block bg-[#F5EBDF] hover:bg-[#FAF5EE] text-[#262824] px-5 py-2.5 text-xs font-medium transition-colors"
            >
              {role === "MANAGER" ? "Open Intelligence View" : "View Analytics"}
            </Link>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {INTELLIGENCE_SIGNALS.map((sig) => (
              <div
                key={sig.label}
                className="border border-[#C5A88A]/30 bg-[#2F3229] p-5 space-y-2"
              >
                <span
                  className="block font-mono-num text-xs"
                  style={{ color: sig.accent }}
                >
                  SIGNAL
                </span>
                <p className="text-sm text-[#DFCDB8] leading-snug">
                  {sig.label}
                </p>
                <span
                  className="font-mono-num text-2xl font-medium text-[#FAF5EE] block"
                >
                  {sig.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 9. Operational Lifecycle Index ───────────────────────────── */}
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
              href="/tenants"
              className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF5EE]/60 px-2 transition-colors"
            >
              <div>
                <h3 className="font-display text-2xl text-[#262824]">
                  Tenant Dossiers &amp; Document Dropzone
                </h3>
                <p className="text-sm text-[#5A5C56] mt-1">
                  Drag and drop lease PDFs and resident records with MIME and
                  file-size validation directly onto resident profiles.
                </p>
              </div>
              <span className="font-mono-num text-xs text-[#8C4A3D] shrink-0">
                /tenants
              </span>
            </Link>

            <Link
              href="/leases"
              className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF5EE]/60 px-2 transition-colors"
            >
              <div>
                <h3 className="font-display text-2xl text-[#262824]">
                  Lease Governance &amp; Conflict Guard
                </h3>
                <p className="text-sm text-[#5A5C56] mt-1">
                  Create leases with server-validated date ranges. Overlapping
                  active leases for the same unit are blocked at the domain
                  layer.
                </p>
              </div>
              <span className="font-mono-num text-xs text-[#8C4A3D] shrink-0">
                /leases
              </span>
            </Link>

            <Link
              href="/notifications"
              className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF5EE]/60 px-2 transition-colors"
            >
              <div>
                <h3 className="font-display text-2xl text-[#262824]">
                  Idempotent Notification Scheduler
                </h3>
                <p className="text-sm text-[#5A5C56] mt-1">
                  Automated daily checks for overdue rent, expiring leases, and
                  vacant units with duplicate-proof database event keys.
                </p>
              </div>
              <span className="font-mono-num text-xs text-[#8C4A3D] shrink-0">
                /notifications
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

      {/* ─── 10. Architecture Grid Footer Spread ──────────────────────── */}
      <section className="space-y-0 border border-[#C5A88A]">
        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#C5A88A]">
          <div className="relative min-h-[280px] border-b md:border-b-0 md:border-r border-[#C5A88A]">
            <Image
              src="/images/courtyard-residence.jpg"
              alt="The Courtyard Residence"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative min-h-[280px] border-b md:border-b-0 md:border-r border-[#C5A88A]">
            <Image
              src="/images/sandstone-atelier-lofts.jpg"
              alt="Sandstone Atelier Lofts"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative min-h-[280px]">
            <Image
              src="/images/olive-grove-villas.jpg"
              alt="Olive Grove Villas"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 bg-[#FAF5EE]">
          <div className="p-8 sm:p-14 border-b md:border-b-0 md:border-r border-[#C5A88A]">
            <h2 className="font-display text-5xl sm:text-6xl text-[#262824] leading-[1.0]">
              Ready to inspect<br />the portfolio?
            </h2>
            <p className="mt-4 text-sm text-[#5A5C56] max-w-sm leading-relaxed">
              Switch between Manager and Tenant roles in the top bar at any
              time to test server-enforced access boundaries across every route.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/portfolio"
                className="bg-[#262824] hover:bg-[#3A3D37] text-[#FAF5EE] px-6 py-3 text-sm font-medium transition-colors"
              >
                Open Portfolio
              </Link>
              <Link
                href="/leases"
                className="border border-[#C5A88A] hover:border-[#262824] px-6 py-3 text-sm font-medium text-[#262824] transition-colors"
              >
                Manage Leases
              </Link>
            </div>
          </div>

          <div className="p-8 sm:p-14 space-y-6 bg-[#F5EBDF]">
            <h3 className="font-display text-2xl text-[#262824]">
              Technical Stack
            </h3>
            <dl className="divide-y divide-[#C5A88A]/60 text-xs">
              {[
                ["Frontend", "Next.js 16 · App Router · TypeScript strict"],
                ["Styling", "Tailwind CSS · shadcn/ui · Motion"],
                ["Database", "PostgreSQL · Prisma ORM · Zod validation"],
                ["Analytics", "Rule-based · Logistic Regression · Random Forest"],
                ["Scheduler", "Daily job · Idempotent notifications · eventKey"],
                ["Auth", "Cookie session · Manager & Tenant roles · SSR guard"],
              ].map(([label, value]) => (
                <div key={label} className="py-3 flex gap-4">
                  <dt className="w-24 shrink-0 text-[#5A5C56]">{label}</dt>
                  <dd className="font-mono-num text-[#262824]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ─── 11. Minimal Footer Bar ───────────────────────────────────── */}
      <footer className="border-t border-[#C5A88A] py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5A5C56]">
        <span className="font-display text-lg text-[#262824]">Domora AI</span>
        <span className="font-mono-num">
          Portfolio · Explorer · Tenants · Leases · Payments · Maintenance ·
          Intelligence
        </span>
        <span className="font-mono-num">
          &copy; {new Date().getFullYear()} · Demo build
        </span>
      </footer>
    </div>
  );
}
