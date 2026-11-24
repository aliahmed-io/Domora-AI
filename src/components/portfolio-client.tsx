"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Plus,
  Archive,
  RotateCcw,
  Pencil,
  Compass,
  MapPin,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DOMORA_MOTION } from "@/lib/tokens";

export interface PropertySummary {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  propertyType: "RESIDENTIAL" | "MIXED_USE" | "BOUTIQUE_LOFT";
  imageUrl: string;
  archivedAt: string | null;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  monthlyScheduledRent: number;
  collectedRent: number;
  overdueAmount: number;
  openMaintenance: number;
}

interface PortfolioClientProps {
  initialProperties: PropertySummary[];
}

export function PortfolioClient({ initialProperties }: PortfolioClientProps) {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertySummary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    propertyType: "RESIDENTIAL" as "RESIDENTIAL" | "MIXED_USE" | "BOUTIQUE_LOFT",
    totalFloors: 3,
    unitsPerFloor: 4,
    hasPhysicalPlan: true,
  });

  const visibleProperties = initialProperties.filter((p) =>
    showArchived ? true : !p.archivedAt
  );

  const activeProperties = initialProperties.filter((p) => !p.archivedAt);
  const totals = activeProperties.reduce(
    (acc, p) => ({
      units: acc.units + p.totalUnits,
      occupied: acc.occupied + p.occupiedUnits,
      vacant: acc.vacant + p.vacantUnits,
      scheduled: acc.scheduled + p.monthlyScheduledRent,
      collected: acc.collected + p.collectedRent,
      overdue: acc.overdue + p.overdueAmount,
      maintenance: acc.maintenance + p.openMaintenance,
    }),
    { units: 0, occupied: 0, vacant: 0, scheduled: 0, collected: 0, overdue: 0, maintenance: 0 }
  );

  const occupancyPct =
    totals.units > 0 ? Math.round((totals.occupied / totals.units) * 100) : 0;

  function openCreateModal() {
    setEditingProperty(null);
    setForm({
      name: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      propertyType: "RESIDENTIAL",
      totalFloors: 3,
      unitsPerFloor: 4,
      hasPhysicalPlan: true,
    });
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(p: PropertySummary) {
    setEditingProperty(p);
    setForm({
      name: p.name,
      address: p.address,
      city: p.city,
      state: p.state,
      postalCode: p.postalCode,
      propertyType: p.propertyType,
      totalFloors: 3,
      unitsPerFloor: 4,
      hasPhysicalPlan: true,
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingProperty
        ? `/api/properties/${editingProperty.id}`
        : "/api/properties";
      const method = editingProperty ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save property");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleArchive(p: PropertySummary) {
    await fetch(`/api/properties/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !p.archivedAt }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-12">
      {/* Editorial Hero */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DOMORA_MOTION.durationBase, ease: DOMORA_MOTION.easeEditorial }}
        className="grid grid-cols-1 lg:grid-cols-12 border border-[#C5A88A] bg-[#FAF5EE]"
      >
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#C5A88A]">
          <div className="space-y-4">
            <h1 className="font-display text-4xl sm:text-6xl leading-[1.03] text-[#262824]">
              Spaces managed with architectural precision.
            </h1>
            <p className="max-w-xl text-sm sm:text-base text-[#5A5C56] leading-relaxed">
              Monitor building occupancy, active lease obligations, manual rent
              collections, maintenance workflows, and advisory payment intelligence
              from a single editorial ledger.
            </p>
          </div>

          <div className="mt-10 pt-6 border-t border-[#C5A88A]/60 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-[#5A5C56]">Occupancy</p>
              <p className="font-mono-num text-2xl font-medium text-[#262824] mt-1">
                {occupancyPct}%
              </p>
              <p className="font-mono-num text-[11px] text-[#6F795E]">
                {totals.occupied}/{totals.units} units
              </p>
            </div>
            <div>
              <p className="text-xs text-[#5A5C56]">Scheduled Monthly</p>
              <p className="font-mono-num text-2xl font-medium text-[#262824] mt-1">
                {formatCurrency(totals.scheduled)}
              </p>
              <p className="font-mono-num text-[11px] text-[#5A5C56]">
                {activeProperties.length} properties
              </p>
            </div>
            <div>
              <p className="text-xs text-[#5A5C56]">Collected MTD</p>
              <p className="font-mono-num text-2xl font-medium text-[#6F795E] mt-1">
                {formatCurrency(totals.collected)}
              </p>
              <p className="font-mono-num text-[11px] text-[#5A5C56]">
                Manual ledger
              </p>
            </div>
            <div>
              <p className="text-xs text-[#5A5C56]">Overdue Balance</p>
              <p className="font-mono-num text-2xl font-medium text-[#8C4A3D] mt-1">
                {formatCurrency(totals.overdue)}
              </p>
              <p className="font-mono-num text-[11px] text-[#8C4A3D]">
                {totals.maintenance} open tickets
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-[280px] lg:min-h-[420px]">
          <Image
            src="/images/courtyard-residence.jpg"
            alt="The Courtyard Residence travertine facade"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute bottom-4 left-4 right-4 bg-[#262824]/85 backdrop-blur-sm text-[#FAF5EE] p-4 flex items-center justify-between">
            <div>
              <p className="font-display text-lg">Signature Building Explorer</p>
              <p className="text-xs text-[#C5A88A]">
                Inspect floors, unit states, leases &amp; balances interactively
              </p>
            </div>
            <Link
              href="/explorer"
              className="inline-flex items-center gap-1.5 bg-[#8C4A3D] hover:bg-[#753B30] px-3 py-2 text-xs font-medium text-[#FAF5EE] transition-colors"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Open Explorer</span>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Portfolio Controls */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#C5A88A] pb-4">
          <div>
            <h2 className="font-display text-3xl text-[#262824]">
              Property Portfolio
            </h2>
            <p className="text-sm text-[#5A5C56] mt-1">
              Manage residential and boutique loft assets across your portfolio.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-[#5A5C56] cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="accent-[#8C4A3D]"
              />
              Show archived
            </label>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-[#262824] hover:bg-[#3A3D37] text-[#FAF5EE] px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Property</span>
            </button>
          </div>
        </div>

        {/* Property Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleProperties.map((p) => (
            <article
              key={p.id}
              className="border border-[#C5A88A] bg-[#FAF5EE] flex flex-col justify-between"
            >
              <div>
                <div className="relative h-52 w-full border-b border-[#C5A88A]">
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    fill
                    className="object-cover"
                  />
                  {p.archivedAt && (
                    <span className="absolute top-3 right-3 bg-[#262824] text-[#FAF5EE] px-2.5 py-1 text-[11px] font-mono-num">
                      ARCHIVED
                    </span>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <p className="font-mono-num text-[11px] uppercase tracking-wider text-[#8C4A3D]">
                      {p.propertyType.replace("_", " ")}
                    </p>
                    <h3 className="font-display text-2xl text-[#262824] mt-0.5">
                      {p.name}
                    </h3>
                    <p className="flex items-center gap-1.5 text-xs text-[#5A5C56] mt-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {p.address}, {p.city}, {p.state} {p.postalCode}
                      </span>
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#C5A88A]/50 text-xs">
                    <div>
                      <span className="text-[#5A5C56] block">Units</span>
                      <span className="font-mono-num text-base font-medium">
                        {p.occupiedUnits}/{p.totalUnits}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#5A5C56] block">Vacant</span>
                      <span className="font-mono-num text-base font-medium">
                        {p.vacantUnits}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#5A5C56] block">Maintenance</span>
                      <span className="font-mono-num text-base font-medium text-[#8C4A3D]">
                        {p.openMaintenance}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#C5A88A]/40 text-xs">
                    <div>
                      <span className="text-[#5A5C56] block">Scheduled</span>
                      <span className="font-mono-num font-medium">
                        {formatCurrency(p.monthlyScheduledRent)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#5A5C56] block">Collected</span>
                      <span className="font-mono-num font-medium text-[#6F795E]">
                        {formatCurrency(p.collectedRent)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#5A5C56] block">Overdue</span>
                      <span className="font-mono-num font-medium text-[#8C4A3D]">
                        {formatCurrency(p.overdueAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 border-t border-[#C5A88A]/60 bg-[#F5EBDF]/60 flex items-center justify-between gap-2">
                <Link
                  href={`/explorer?propertyId=${p.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#262824] hover:text-[#8C4A3D]"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Inspect Building</span>
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(p)}
                    aria-label={`Edit ${p.name}`}
                    className="p-1.5 text-[#5A5C56] hover:text-[#262824] cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleArchive(p)}
                    aria-label={p.archivedAt ? `Restore ${p.name}` : `Archive ${p.name}`}
                    className="p-1.5 text-[#5A5C56] hover:text-[#8C4A3D] cursor-pointer"
                  >
                    {p.archivedAt ? (
                      <RotateCcw className="h-3.5 w-3.5" />
                    ) : (
                      <Archive className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Create / Edit Property Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingProperty ? "Edit Property" : "Add Property"}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#262824]/60 p-4"
        >
          <div className="w-full max-w-lg border border-[#C5A88A] bg-[#FAF5EE] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#C5A88A]/60 pb-3">
              <h3 className="font-display text-2xl text-[#262824]">
                {editingProperty ? "Edit Property" : "New Portfolio Property"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#5A5C56] hover:text-[#262824]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <p className="border border-[#8C4A3D] bg-[#8C4A3D]/10 px-3 py-2 text-xs text-[#8C4A3D]">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs text-[#5A5C56] mb-1">
                  Property Name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2 focus:outline-none focus:border-[#262824]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#5A5C56] mb-1">
                  Street Address
                </label>
                <input
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2 focus:outline-none focus:border-[#262824]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-[#5A5C56] mb-1">City</label>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#5A5C56] mb-1">State</label>
                  <input
                    required
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#5A5C56] mb-1">Postal</label>
                  <input
                    required
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#5A5C56] mb-1">Type</label>
                  <select
                    value={form.propertyType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        propertyType: e.target.value as
                          | "RESIDENTIAL"
                          | "MIXED_USE"
                          | "BOUTIQUE_LOFT",
                      })
                    }
                    className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                  >
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="MIXED_USE">Mixed Use</option>
                    <option value="BOUTIQUE_LOFT">Boutique Loft</option>
                  </select>
                </div>

                {!editingProperty && (
                  <div>
                    <label className="block text-xs text-[#5A5C56] mb-1">
                      Floors × Units/Floor
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={form.totalFloors}
                        onChange={(e) =>
                          setForm({ ...form, totalFloors: Number(e.target.value) })
                        }
                        className="w-1/2 border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2 font-mono-num"
                      />
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={form.unitsPerFloor}
                        onChange={(e) =>
                          setForm({ ...form, unitsPerFloor: Number(e.target.value) })
                        }
                        className="w-1/2 border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2 font-mono-num"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#C5A88A]/60">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[#C5A88A] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#262824] text-[#FAF5EE] text-xs font-medium hover:bg-[#3A3D37] disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingProperty
                      ? "Save Changes"
                      : "Create Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
