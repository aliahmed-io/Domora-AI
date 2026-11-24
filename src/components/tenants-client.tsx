"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, FileUp, X, Mail, Phone } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { DemoRole } from "@/lib/auth";

export interface TenantRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  emergencyContact: string | null;
  notes: string | null;
  leases: Array<{
    id: string;
    unitNumber: string;
    propertyName: string;
    monthlyRent: number;
    status: string;
    startDate: string;
    endDate: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paidAt: string;
    method: string;
    referenceCode: string | null;
  }>;
  maintenanceRequests: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
  }>;
  documents: Array<{
    id: string;
    title: string;
    fileName: string;
    category: string;
    uploadedAt: string;
  }>;
}

interface TenantsClientProps {
  tenants: TenantRecord[];
  role: DemoRole;
}

export function TenantsClient({ tenants, role }: TenantsClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(tenants[0]?.id ?? "");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TenantRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    emergencyContact: "",
    notes: "",
  });

  const filtered = tenants.filter(
    (t) =>
      t.fullName.toLowerCase().includes(query.toLowerCase()) ||
      t.email.toLowerCase().includes(query.toLowerCase())
  );
  const selected =
    filtered.find((t) => t.id === selectedId) ?? filtered[0] ?? null;

  function openNew() {
    setEditing(null);
    setForm({ fullName: "", email: "", phone: "", emergencyContact: "", notes: "" });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(t: TenantRecord) {
    setEditing(t);
    setForm({
      fullName: t.fullName,
      email: t.email,
      phone: t.phone,
      emergencyContact: t.emergencyContact ?? "",
      notes: t.notes ?? "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = editing ? `/api/tenants/${editing.id}` : "/api/tenants";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save tenant");
      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tenant");
    } finally {
      setSaving(false);
    }
  }

  async function handleDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", `${selected.fullName} — ${file.name}`);
      formData.append("category", "TENANT_ID");
      formData.append("tenantId", selected.id);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Document upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#C5A88A] pb-5">
        <div>
          <p className="font-mono-num text-xs uppercase tracking-[0.2em] text-[#8C4A3D]">
            Resident Dossiers · Fictional Demo Data
          </p>
          <h1 className="font-display text-4xl text-[#262824] mt-1">
            Tenant Directory
          </h1>
          <p className="text-sm text-[#5A5C56] mt-1">
            Contact profiles, lease history, payment records, maintenance tickets,
            and validated document attachments.
          </p>
        </div>

        {role === "MANAGER" && (
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-2 bg-[#262824] text-[#FAF5EE] px-4 py-2 text-sm font-medium hover:bg-[#3A3D37] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Tenant</span>
          </button>
        )}
      </div>

      {error && (
        <div className="border border-[#8C4A3D] bg-[#8C4A3D]/10 px-4 py-2 text-xs text-[#8C4A3D]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-5 border border-[#C5A88A] bg-[#FAF5EE]">
          <div className="p-3 border-b border-[#C5A88A]/60 flex items-center gap-2">
            <Search className="h-4 w-4 text-[#5A5C56]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search residents by name or email..."
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
          <ul className="divide-y divide-[#C5A88A]/50 max-h-[600px] overflow-y-auto">
            {filtered.map((t) => {
              const activeLease = t.leases.find(
                (l) => l.status === "ACTIVE" || l.status === "EXPIRING_SOON"
              );
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      "w-full text-left p-4 transition-colors cursor-pointer",
                      selected?.id === t.id
                        ? "bg-[#EDE0D0]"
                        : "hover:bg-[#F5EBDF]/60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#262824]">
                        {t.fullName}
                      </span>
                      {activeLease && (
                        <span className="font-mono-num text-xs px-2 py-0.5 bg-[#6F795E] text-[#FAF5EE]">
                          Unit {activeLease.unitNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#5A5C56] mt-1">{t.email}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right Detail Panel */}
        <div className="lg:col-span-7 border border-[#C5A88A] bg-[#FAF5EE] p-6 space-y-6">
          {selected ? (
            <>
              <div className="flex items-start justify-between border-b border-[#C5A88A]/60 pb-4">
                <div>
                  <h2 className="font-display text-3xl text-[#262824]">
                    {selected.fullName}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-xs text-[#5A5C56] mt-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {selected.email}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono-num">
                      <Phone className="h-3.5 w-3.5" />
                      {selected.phone}
                    </span>
                  </div>
                  {selected.emergencyContact && (
                    <p className="text-xs text-[#5A5C56] mt-1">
                      Emergency: {selected.emergencyContact}
                    </p>
                  )}
                </div>

                {role === "MANAGER" && (
                  <button
                    type="button"
                    onClick={() => openEdit(selected)}
                    className="inline-flex items-center gap-1.5 border border-[#C5A88A] px-3 py-1.5 text-xs hover:bg-[#F5EBDF] cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {selected.notes && (
                <div className="bg-[#F5EBDF] border border-[#C5A88A]/50 p-3 text-xs text-[#262824]">
                  <span className="font-mono-num uppercase text-[10px] text-[#5A5C56] block mb-1">
                    Manager Notes
                  </span>
                  {selected.notes}
                </div>
              )}

              {/* Lease History */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono-num uppercase tracking-wider text-[#5A5C56]">
                  Lease History ({selected.leases.length})
                </h3>
                {selected.leases.length > 0 ? (
                  <div className="border border-[#C5A88A]/60 divide-y divide-[#C5A88A]/40">
                    {selected.leases.map((l) => (
                      <div
                        key={l.id}
                        className="p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-medium">
                            {l.propertyName} — Unit {l.unitNumber}
                          </span>
                          <p className="font-mono-num text-[#5A5C56]">
                            {formatDate(l.startDate)} → {formatDate(l.endDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono-num font-medium block">
                            {formatCurrency(l.monthlyRent)}/mo
                          </span>
                          <span className="font-mono-num text-[10px] text-[#6F795E]">
                            {l.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#5A5C56]">No lease records.</p>
                )}
              </div>

              {/* Payment History */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono-num uppercase tracking-wider text-[#5A5C56]">
                  Payment History ({selected.payments.length})
                </h3>
                {selected.payments.length > 0 ? (
                  <div className="border border-[#C5A88A]/60 divide-y divide-[#C5A88A]/40">
                    {selected.payments.slice(0, 5).map((p) => (
                      <div
                        key={p.id}
                        className="p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono-num">
                            {formatDate(p.paidAt)}
                          </span>
                          <span className="text-[#5A5C56] ml-2">
                            {p.method.replace("_", " ")}
                          </span>
                        </div>
                        <span className="font-mono-num font-medium text-[#6F795E]">
                          {formatCurrency(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#5A5C56]">No recorded payments.</p>
                )}
              </div>

              {/* Documents */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono-num uppercase tracking-wider text-[#5A5C56]">
                    Documents ({selected.documents.length})
                  </h3>
                  {role === "MANAGER" && (
                    <label className="inline-flex items-center gap-1.5 border border-[#C5A88A] px-2.5 py-1 text-xs cursor-pointer hover:bg-[#F5EBDF]">
                      <FileUp className="h-3.5 w-3.5" />
                      <span>{uploading ? "Uploading..." : "Attach File"}</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={handleDocumentUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {selected.documents.length > 0 ? (
                  <ul className="border border-[#C5A88A]/60 divide-y divide-[#C5A88A]/40 text-xs">
                    {selected.documents.map((d) => (
                      <li key={d.id} className="p-3 flex items-center justify-between">
                        <span>{d.title}</span>
                        <span className="font-mono-num text-[#5A5C56]">
                          {d.category} · {formatDate(d.uploadedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#5A5C56]">No attached documents.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-[#5A5C56]">No tenant selected.</p>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#262824]/60 p-4"
        >
          <div className="w-full max-w-md border border-[#C5A88A] bg-[#FAF5EE] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#C5A88A]/60 pb-3">
              <h3 className="font-display text-2xl">
                {editing ? "Edit Tenant" : "New Tenant Profile"}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-[#5A5C56] mb-1">Full Name</label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5A5C56] mb-1">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5A5C56] mb-1">Phone</label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5A5C56] mb-1">
                  Emergency Contact
                </label>
                <input
                  value={form.emergencyContact}
                  onChange={(e) =>
                    setForm({ ...form, emergencyContact: e.target.value })
                  }
                  className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5A5C56] mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                />
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
                  {saving ? "Saving..." : "Save Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
