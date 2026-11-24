"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, Ban, X, FileUp } from "lucide-react";
import { formatCurrency, formatDate, daysBetween } from "@/lib/utils";
import type { DemoRole } from "@/lib/auth";

export interface LeaseRow {
  id: string;
  unitId: string;
  unitNumber: string;
  propertyName: string;
  tenantName: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  paymentDueDay: number;
  status: string;
  renewalStatus: string;
  documentCount: number;
}

export interface LeaseOptionUnit {
  id: string;
  label: string;
  targetRent: number;
  status: string;
}

export interface LeaseOptionTenant {
  id: string;
  fullName: string;
}

interface LeasesClientProps {
  leases: LeaseRow[];
  units: LeaseOptionUnit[];
  tenants: LeaseOptionTenant[];
  role: DemoRole;
}

export function LeasesClient({ leases, units, tenants, role }: LeasesClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => {
    const start = new Date();
    const end = new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
    return {
      unitId: units.find((u) => u.status === "VACANT")?.id ?? units[0]?.id ?? "",
      tenantId: tenants[0]?.id ?? "",
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      monthlyRent: units[0]?.targetRent ?? 2400,
      securityDeposit: units[0]?.targetRent ?? 2400,
      paymentDueDay: 1,
      renewalStatus: "PENDING",
    };
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/leases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create lease");
      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lease");
    } finally {
      setSaving(false);
    }
  }

  async function handleAction(
    leaseId: string,
    payload: { action?: "RENEW" | "TERMINATE_EARLY"; renewalStatus?: string }
  ) {
    setError(null);
    const res = await fetch(`/api/leases/${leaseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Lease update failed");
      return;
    }
    router.refresh();
  }

  async function handleUploadLeaseDoc(
    leaseId: string,
    tenantId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", `Lease Agreement — ${file.name}`);
    formData.append("category", "LEASE");
    formData.append("leaseId", leaseId);
    formData.append("tenantId", tenantId);

    const res = await fetch("/api/documents", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Upload failed");
    } else {
      router.refresh();
    }
    e.target.value = "";
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#C5A88A] pb-6">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl text-[#262824]">
            Lease Management
          </h1>
          <p className="text-sm text-[#5A5C56] mt-2">
            Manage lease terms, security deposits, renewal status, early
            terminations, and expiration reminders.
          </p>
        </div>

        {role === "MANAGER" && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-[#262824] text-[#FAF5EE] px-4 py-2 text-sm font-medium hover:bg-[#3A3D37] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Lease</span>
          </button>
        )}
      </div>

      {error && (
        <div className="border border-[#8C4A3D] bg-[#8C4A3D]/10 px-4 py-2 text-xs text-[#8C4A3D]">
          {error}
        </div>
      )}

      <div className="border border-[#C5A88A] bg-[#FAF5EE] overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#C5A88A] bg-[#F5EBDF] text-xs font-mono-num uppercase text-[#5A5C56]">
              <th className="py-3 px-4">Property / Unit</th>
              <th className="py-3 px-4">Tenant</th>
              <th className="py-3 px-4">Term</th>
              <th className="py-3 px-4">Rent / Deposit</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Renewal</th>
              {role === "MANAGER" && <th className="py-3 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#C5A88A]/50">
            {leases.map((l) => {
              const remaining = daysBetween(new Date(), new Date(l.endDate));
              return (
                <tr key={l.id} className="hover:bg-[#F5EBDF]/50">
                  <td className="py-3.5 px-4">
                    <span className="font-medium block">{l.propertyName}</span>
                    <span className="font-mono-num text-xs text-[#5A5C56]">
                      Unit {l.unitNumber} · Due day {l.paymentDueDay}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">{l.tenantName}</td>
                  <td className="py-3.5 px-4 font-mono-num text-xs">
                    <div>
                      {formatDate(l.startDate)} → {formatDate(l.endDate)}
                    </div>
                    {remaining >= 0 && remaining <= 45 && l.status !== "TERMINATED" && (
                      <span className="text-[#B57B3A]">
                        Expires in {remaining}d
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono-num text-xs">
                    <div className="font-medium">{formatCurrency(l.monthlyRent)}/mo</div>
                    <div className="text-[#5A5C56]">
                      Dep: {formatCurrency(l.securityDeposit)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono-num text-[11px] px-2 py-0.5 border border-[#C5A88A] bg-[#F5EBDF]">
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {role === "MANAGER" && l.status !== "TERMINATED" ? (
                      <select
                        value={l.renewalStatus}
                        onChange={(e) =>
                          handleAction(l.id, { renewalStatus: e.target.value })
                        }
                        className="border border-[#C5A88A] bg-[#F5EBDF] px-2 py-1 text-xs"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="RENEWING">Renewing</option>
                        <option value="NOT_RENEWING">Not Renewing</option>
                      </select>
                    ) : (
                      <span className="text-xs font-mono-num">{l.renewalStatus}</span>
                    )}
                  </td>
                  {role === "MANAGER" && (
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <label
                          title="Upload lease PDF"
                          className="p-1.5 border border-[#C5A88A] hover:bg-[#F5EBDF] cursor-pointer"
                        >
                          <FileUp className="h-3.5 w-3.5" />
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              handleUploadLeaseDoc(l.id, l.tenantId, e)
                            }
                            className="hidden"
                          />
                        </label>
                        {l.status !== "TERMINATED" && (
                          <>
                            <button
                              type="button"
                              title="Renew +12 months"
                              onClick={() => handleAction(l.id, { action: "RENEW" })}
                              className="p-1.5 border border-[#C5A88A] text-[#6F795E] hover:bg-[#F5EBDF] cursor-pointer"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Early Termination"
                              onClick={() =>
                                handleAction(l.id, { action: "TERMINATE_EARLY" })
                              }
                              className="p-1.5 border border-[#C5A88A] text-[#8C4A3D] hover:bg-[#F5EBDF] cursor-pointer"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#262824]/60 p-4"
        >
          <div className="w-full max-w-lg border border-[#C5A88A] bg-[#FAF5EE] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#C5A88A]/60 pb-3">
              <h3 className="font-display text-2xl">New Lease Agreement</h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            {error && (
              <p className="border border-[#8C4A3D] bg-[#8C4A3D]/10 px-3 py-2 text-xs text-[#8C4A3D]">
                {error}
              </p>
            )}
            <form onSubmit={handleCreate} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-[#5A5C56] mb-1">Unit</label>
                <select
                  value={form.unitId}
                  onChange={(e) => {
                    const u = units.find((item) => item.id === e.target.value);
                    setForm({
                      ...form,
                      unitId: e.target.value,
                      monthlyRent: u?.targetRent ?? form.monthlyRent,
                      securityDeposit: u?.targetRent ?? form.securityDeposit,
                    });
                  }}
                  className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label} ({u.status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#5A5C56] mb-1">Tenant</label>
                <select
                  value={form.tenantId}
                  onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                  className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#5A5C56] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#5A5C56] mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2 font-mono-num"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-[#5A5C56] mb-1">
                    Monthly Rent
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={form.monthlyRent}
                    onChange={(e) =>
                      setForm({ ...form, monthlyRent: Number(e.target.value) })
                    }
                    className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#5A5C56] mb-1">
                    Deposit
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.securityDeposit}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        securityDeposit: Number(e.target.value),
                      })
                    }
                    className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#5A5C56] mb-1">
                    Due Day (1–28)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={28}
                    value={form.paymentDueDay}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        paymentDueDay: Number(e.target.value),
                      })
                    }
                    className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2 font-mono-num"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#C5A88A]/60">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[#C5A88A] text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#262824] text-[#FAF5EE] text-xs font-medium"
                >
                  {saving ? "Creating..." : "Create Lease"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
