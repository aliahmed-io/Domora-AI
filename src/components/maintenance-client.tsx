"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, GripVertical, LayoutGrid, Table as TableIcon } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { DemoRole } from "@/lib/auth";

export interface MaintenanceRow {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  estimatedCost: number | null;
  actualCost: number | null;
  createdAt: string;
  resolvedAt: string | null;
  unitNumber: string;
  propertyName: string;
  tenantName: string | null;
  contractorId: string | null;
  contractorName: string | null;
}

export interface MaintenanceUnitOption {
  id: string;
  label: string;
}

export interface ContractorOption {
  id: string;
  name: string;
  specialty: string;
}

interface MaintenanceClientProps {
  requests: MaintenanceRow[];
  units: MaintenanceUnitOption[];
  contractors: ContractorOption[];
  role: DemoRole;
}

const WORKFLOW_COLUMNS = [
  { key: "OPEN", label: "Open" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "CLOSED", label: "Closed" },
] as const;

export function MaintenanceClient({
  requests,
  units,
  contractors,
  role,
}: MaintenanceClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"BOARD" | "TABLE">("BOARD");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    unitId: units[0]?.id ?? "",
    title: "",
    description: "",
    category: "PLUMBING",
    priority: "MEDIUM",
    estimatedCost: 250,
  });

  const totalActualSpend = requests.reduce(
    (s, r) => s + (r.actualCost ?? 0),
    0
  );
  const totalEstimatedSpend = requests.reduce(
    (s, r) => s + (r.estimatedCost ?? 0),
    0
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create request");
      setModalOpen(false);
      setForm({ ...form, title: "", description: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create request");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(
    id: string,
    payload: {
      status?: string;
      contractorId?: string | null;
      actualCost?: number;
    }
  ) {
    setError(null);
    const res = await fetch(`/api/maintenance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#C5A88A] pb-6">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl sm:text-5xl text-[#262824]">
            Maintenance Hub
          </h1>
          <p className="text-sm text-[#5A5C56] mt-2">
            {role === "MANAGER"
              ? "Drag work orders across stages to update status, assign contractors, and record actual repair costs."
              : "Track and submit repair requests for your residence."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="border border-[#C5A88A] bg-[#FAF5EE] px-4 py-2 text-xs">
            <span className="text-[#5A5C56] block">Actual / Estimated Spend</span>
            <span className="font-mono-num text-sm font-medium">
              {formatCurrency(totalActualSpend)} /{" "}
              {formatCurrency(totalEstimatedSpend)}
            </span>
          </div>

          <div className="flex border border-[#C5A88A] bg-[#FAF5EE]">
            <button
              type="button"
              onClick={() => setViewMode("BOARD")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer",
                viewMode === "BOARD"
                  ? "bg-[#262824] text-[#FAF5EE]"
                  : "text-[#5A5C56]"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("TABLE")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer",
                viewMode === "TABLE"
                  ? "bg-[#262824] text-[#FAF5EE]"
                  : "text-[#5A5C56]"
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Ledger</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-[#262824] text-[#FAF5EE] px-4 py-2 text-sm font-medium hover:bg-[#3A3D37] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Request</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-[#8C4A3D] bg-[#8C4A3D]/10 px-4 py-2 text-xs text-[#8C4A3D]">
          {error}
        </div>
      )}

      {viewMode === "BOARD" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {WORKFLOW_COLUMNS.map((col) => {
            const items = requests.filter((r) => r.status === col.key);
            const isOver = dragOverCol === col.key;
            return (
              <div
                key={col.key}
                onDragOver={(e) => {
                  if (role !== "MANAGER") return;
                  e.preventDefault();
                  setDragOverCol(col.key);
                }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={async (e) => {
                  if (role !== "MANAGER") return;
                  e.preventDefault();
                  setDragOverCol(null);
                  const id = e.dataTransfer.getData("text/plain") || draggedId;
                  setDraggedId(null);
                  if (id) {
                    const current = requests.find((r) => r.id === id);
                    if (current && current.status !== col.key) {
                      await handleUpdate(id, { status: col.key });
                    }
                  }
                }}
                className={cn(
                  "border bg-[#FAF5EE] p-3 min-h-[340px] flex flex-col gap-3 transition-colors",
                  isOver ? "border-[#8C4A3D] bg-[#F5EBDF]" : "border-[#C5A88A]"
                )}
              >
                <div className="flex items-center justify-between border-b border-[#C5A88A]/60 pb-2">
                  <span className="text-xs font-semibold text-[#262824]">
                    {col.label}
                  </span>
                  <span className="font-mono-num text-xs text-[#5A5C56]">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {items.map((r) => (
                    <div
                      key={r.id}
                      draggable={role === "MANAGER"}
                      onDragStart={(e) => {
                        setDraggedId(r.id);
                        e.dataTransfer.setData("text/plain", r.id);
                      }}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragOverCol(null);
                      }}
                      className={cn(
                        "border border-[#C5A88A]/80 bg-[#F5EBDF] p-3 space-y-2 text-xs",
                        role === "MANAGER" && "cursor-grab active:cursor-grabbing",
                        draggedId === r.id && "opacity-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono-num text-[11px] text-[#8C4A3D]">
                          Unit {r.unitNumber}
                        </span>
                        {role === "MANAGER" && (
                          <GripVertical className="h-3.5 w-3.5 text-[#5A5C56] shrink-0" />
                        )}
                      </div>
                      <p className="font-medium text-[#262824] leading-snug">
                        {r.title}
                      </p>
                      <p className="text-[11px] text-[#5A5C56] line-clamp-2">
                        {r.propertyName}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-[#C5A88A]/40 font-mono-num text-[11px]">
                        <span>{r.priority}</span>
                        <span>
                          {r.actualCost
                            ? formatCurrency(r.actualCost)
                            : r.estimatedCost
                              ? `~${formatCurrency(r.estimatedCost)}`
                              : "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-[#C5A88A] bg-[#FAF5EE] overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#C5A88A] bg-[#F5EBDF] text-xs font-mono-num text-[#5A5C56]">
                <th className="py-3 px-4 font-medium">Unit &amp; Issue</th>
                <th className="py-3 px-4 font-medium">Category &amp; Priority</th>
                <th className="py-3 px-4 font-medium">Contractor</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Cost (Est / Act)</th>
                <th className="py-3 px-4 font-medium">Dates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C5A88A]/50">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-[#F5EBDF]/50">
                  <td className="py-3.5 px-4 max-w-xs">
                    <span className="font-mono-num text-xs text-[#8C4A3D] block">
                      {r.propertyName} — Unit {r.unitNumber}
                    </span>
                    <span className="font-medium text-[#262824] block">
                      {r.title}
                    </span>
                    <span className="text-xs text-[#5A5C56] line-clamp-1">
                      {r.description}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono-num">
                    <span className="block">{r.category}</span>
                    <span
                      className={cn(
                        "inline-block mt-1 px-1.5 py-0.5 text-[10px]",
                        r.priority === "URGENT" || r.priority === "HIGH"
                          ? "bg-[#8C4A3D] text-[#FAF5EE]"
                          : "bg-[#EDE0D0] text-[#262824]"
                      )}
                    >
                      {r.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    {role === "MANAGER" ? (
                      <select
                        value={r.contractorId ?? ""}
                        onChange={(e) =>
                          handleUpdate(r.id, {
                            contractorId: e.target.value || null,
                            status:
                              r.status === "OPEN" && e.target.value
                                ? "ASSIGNED"
                                : undefined,
                          })
                        }
                        className="border border-[#C5A88A] bg-[#F5EBDF] px-2 py-1 text-xs"
                      >
                        <option value="">Unassigned</option>
                        {contractors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{r.contractorName ?? "Pending assignment"}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {role === "MANAGER" ? (
                      <select
                        value={r.status}
                        onChange={(e) =>
                          handleUpdate(r.id, { status: e.target.value })
                        }
                        className="border border-[#C5A88A] bg-[#F5EBDF] px-2 py-1 text-xs font-mono-num"
                      >
                        {WORKFLOW_COLUMNS.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-mono-num text-xs px-2 py-0.5 border border-[#C5A88A]">
                        {r.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono-num text-xs">
                    <div>
                      Est: {r.estimatedCost ? formatCurrency(r.estimatedCost) : "—"}
                    </div>
                    {role === "MANAGER" ? (
                      <input
                        type="number"
                        placeholder="Actual $"
                        defaultValue={r.actualCost ?? ""}
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          if (!Number.isNaN(val) && val > 0 && val !== r.actualCost) {
                            handleUpdate(r.id, { actualCost: val });
                          }
                        }}
                        className="mt-1 w-24 border border-[#C5A88A] bg-[#F5EBDF] px-2 py-0.5 text-xs"
                      />
                    ) : (
                      <div className="text-[#5A5C56]">
                        Act: {r.actualCost ? formatCurrency(r.actualCost) : "—"}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono-num text-xs text-[#5A5C56]">
                    <div>Opened: {formatDate(r.createdAt)}</div>
                    {r.resolvedAt && (
                      <div className="text-[#6F795E]">
                        Done: {formatDate(r.resolvedAt)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#262824]/60 p-4"
        >
          <div className="w-full max-w-md border border-[#C5A88A] bg-[#FAF5EE] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#C5A88A]/60 pb-3">
              <h3 className="font-display text-2xl">New Maintenance Request</h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-[#5A5C56] mb-1">Unit</label>
                <select
                  value={form.unitId}
                  onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                  className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#5A5C56] mb-1">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5A5C56] mb-1">
                  Problem Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#5A5C56] mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                  >
                    <option value="PLUMBING">Plumbing</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="HVAC">HVAC</option>
                    <option value="STRUCTURAL">Structural</option>
                    <option value="APPLIANCE">Appliance</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#5A5C56] mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                    className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              {role === "MANAGER" && (
                <div>
                  <label className="block text-xs text-[#5A5C56] mb-1">
                    Estimated Cost ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.estimatedCost}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        estimatedCost: Number(e.target.value),
                      })
                    }
                    className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2 font-mono-num"
                  />
                </div>
              )}
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
                  {saving ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
