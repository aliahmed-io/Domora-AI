"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Receipt, X, AlertCircle } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { DemoRole } from "@/lib/auth";

export interface ObligationRow {
  id: string;
  periodYear: number;
  periodMonth: number;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  payments: Array<{
    id: string;
    amount: number;
    paidAt: string;
    method: string;
    referenceCode: string | null;
    isVerifiedBankTx: boolean;
    recordedBy: string;
  }>;
}

interface PaymentsClientProps {
  obligations: ObligationRow[];
  role: DemoRole;
}

export function PaymentsClient({ obligations, role }: PaymentsClientProps) {
  const router = useRouter();
  const [selectedOb, setSelectedOb] = useState<ObligationRow | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<{
    ob: ObligationRow;
    payment: ObligationRow["payments"][number];
  } | null>(null);

  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<
    "BANK_TRANSFER" | "CHECK" | "CASH" | "MANUAL_ACH"
  >("BANK_TRANSFER");
  const [referenceCode, setReferenceCode] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalDue = obligations.reduce((s, o) => s + o.amountDue, 0);
  const totalPaid = obligations.reduce((s, o) => s + o.amountPaid, 0);
  const totalOverdue = obligations
    .filter((o) => o.status === "OVERDUE")
    .reduce((s, o) => s + Math.max(0, o.amountDue - o.amountPaid), 0);

  function openRecordModal(ob: ObligationRow) {
    setSelectedOb(ob);
    setAmount(Math.max(0, Number((ob.amountDue - ob.amountPaid).toFixed(2))));
    setMethod("BANK_TRANSFER");
    setReferenceCode("");
    setNotes("");
    setError(null);
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOb) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          obligationId: selectedOb.id,
          amount,
          method,
          referenceCode: referenceCode || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to record payment");
      setSelectedOb(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#C5A88A] pb-5">
        <div>
          <p className="font-mono-num text-xs uppercase tracking-[0.2em] text-[#8C4A3D]">
            Manual Rent Ledger · Non-Gateway Recording
          </p>
          <h1 className="font-display text-4xl text-[#262824] mt-1">
            Rent &amp; Payments
          </h1>
          <p className="text-sm text-[#5A5C56] mt-1">
            Monthly rent obligations, partial payment tracking, outstanding
            balances, and printable manual receipts.
          </p>
        </div>

        <div className="flex items-center gap-6 border border-[#C5A88A] bg-[#FAF5EE] px-4 py-2.5 text-xs">
          <div>
            <span className="text-[#5A5C56] block">Total Billed</span>
            <span className="font-mono-num text-base font-medium">
              {formatCurrency(totalDue)}
            </span>
          </div>
          <div>
            <span className="text-[#5A5C56] block">Collected</span>
            <span className="font-mono-num text-base font-medium text-[#6F795E]">
              {formatCurrency(totalPaid)}
            </span>
          </div>
          <div>
            <span className="text-[#5A5C56] block">Overdue</span>
            <span className="font-mono-num text-base font-medium text-[#8C4A3D]">
              {formatCurrency(totalOverdue)}
            </span>
          </div>
        </div>
      </div>

      {/* Governance Notice */}
      <div className="flex items-start gap-3 border border-[#C5A88A] bg-[#FAF5EE] px-4 py-3 text-xs text-[#5A5C56]">
        <AlertCircle className="h-4 w-4 text-[#8C4A3D] shrink-0 mt-0.5" />
        <p>
          <strong className="text-[#262824]">Manual Ledger Policy:</strong>{" "}
          Payments recorded here represent manager-entered ledger acknowledgements
          (<span className="font-mono-num">isVerifiedBankTx = false</span>) and
          are never presented as bank-verified gateway settlements.
        </p>
      </div>

      {/* Obligations Table */}
      <div className="border border-[#C5A88A] bg-[#FAF5EE] overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#C5A88A] bg-[#F5EBDF] text-xs font-mono-num uppercase text-[#5A5C56]">
              <th className="py-3 px-4">Period</th>
              <th className="py-3 px-4">Unit / Resident</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Due</th>
              <th className="py-3 px-4">Paid</th>
              <th className="py-3 px-4">Balance</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#C5A88A]/50">
            {obligations.map((ob) => {
              const balance = Math.max(0, ob.amountDue - ob.amountPaid);
              const latestPayment = ob.payments[0];
              return (
                <tr key={ob.id} className="hover:bg-[#F5EBDF]/50">
                  <td className="py-3.5 px-4 font-mono-num text-xs">
                    {ob.periodYear}-{String(ob.periodMonth).padStart(2, "0")}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium block">{ob.tenantName}</span>
                    <span className="font-mono-num text-xs text-[#5A5C56]">
                      {ob.propertyName} · Unit {ob.unitNumber}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono-num text-xs">
                    {formatDate(ob.dueDate)}
                  </td>
                  <td className="py-3.5 px-4 font-mono-num">
                    {formatCurrency(ob.amountDue)}
                  </td>
                  <td className="py-3.5 px-4 font-mono-num text-[#6F795E]">
                    {formatCurrency(ob.amountPaid)}
                  </td>
                  <td className="py-3.5 px-4 font-mono-num font-medium">
                    {formatCurrency(balance)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        "font-mono-num text-[11px] px-2 py-0.5 border",
                        ob.status === "PAID" &&
                          "border-[#6F795E] bg-[#E5E9DF] text-[#262824]",
                        ob.status === "OVERDUE" &&
                          "border-[#8C4A3D] bg-[#8C4A3D] text-[#FAF5EE]",
                        ob.status === "PARTIAL" &&
                          "border-[#B57B3A] bg-[#F3E6D4] text-[#262824]",
                        ob.status === "PENDING" &&
                          "border-[#C5A88A] bg-[#F5EBDF] text-[#5A5C56]"
                      )}
                    >
                      {ob.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      {role === "MANAGER" && balance > 0 && (
                        <button
                          type="button"
                          onClick={() => openRecordModal(ob)}
                          className="inline-flex items-center gap-1 bg-[#262824] text-[#FAF5EE] px-2.5 py-1 text-xs hover:bg-[#3A3D37] cursor-pointer"
                        >
                          <CreditCard className="h-3 w-3" />
                          <span>Record</span>
                        </button>
                      )}
                      {latestPayment && (
                        <button
                          type="button"
                          onClick={() =>
                            setReceiptPayment({ ob, payment: latestPayment })
                          }
                          className="inline-flex items-center gap-1 border border-[#C5A88A] px-2.5 py-1 text-xs hover:bg-[#F5EBDF] cursor-pointer"
                        >
                          <Receipt className="h-3 w-3" />
                          <span>Receipt</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Record Manual Payment Modal */}
      {selectedOb && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#262824]/60 p-4"
        >
          <div className="w-full max-w-md border border-[#C5A88A] bg-[#FAF5EE] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#C5A88A]/60 pb-3">
              <h3 className="font-display text-2xl">Record Manual Payment</h3>
              <button type="button" onClick={() => setSelectedOb(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            {error && (
              <p className="border border-[#8C4A3D] bg-[#8C4A3D]/10 px-3 py-2 text-xs text-[#8C4A3D]">
                {error}
              </p>
            )}
            <p className="text-xs text-[#5A5C56]">
              {selectedOb.tenantName} — Unit {selectedOb.unitNumber} · Remaining:{" "}
              <span className="font-mono-num font-medium text-[#262824]">
                {formatCurrency(selectedOb.amountDue - selectedOb.amountPaid)}
              </span>
            </p>
            <form onSubmit={handleRecordPayment} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-[#5A5C56] mb-1">
                  Amount (supports partial payment)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2 font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5A5C56] mb-1">
                  Payment Method
                </label>
                <select
                  value={method}
                  onChange={(e) =>
                    setMethod(
                      e.target.value as
                        | "BANK_TRANSFER"
                        | "CHECK"
                        | "CASH"
                        | "MANUAL_ACH"
                    )
                  }
                  className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (Manual)</option>
                  <option value="MANUAL_ACH">Manual ACH</option>
                  <option value="CHECK">Check</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#5A5C56] mb-1">
                  Reference Code
                </label>
                <input
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  placeholder="Optional check # or transfer memo"
                  className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2 font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5A5C56] mb-1">Notes</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-[#C5A88A] bg-[#F5EBDF] px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#C5A88A]/60">
                <button
                  type="button"
                  onClick={() => setSelectedOb(null)}
                  className="px-4 py-2 border border-[#C5A88A] text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#262824] text-[#FAF5EE] text-xs font-medium"
                >
                  {submitting ? "Recording..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {receiptPayment && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#262824]/60 p-4"
        >
          <div className="w-full max-w-md border border-[#C5A88A] bg-[#FAF5EE] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#C5A88A]/60 pb-3">
              <div>
                <p className="font-mono-num text-[10px] uppercase tracking-widest text-[#8C4A3D]">
                  Manual Ledger Receipt
                </p>
                <h3 className="font-display text-2xl">Domora AI Receipt</h3>
              </div>
              <button type="button" onClick={() => setReceiptPayment(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs border border-[#C5A88A]/60 bg-[#F5EBDF] p-4">
              <div className="flex justify-between">
                <span className="text-[#5A5C56]">Resident</span>
                <span className="font-medium">{receiptPayment.ob.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A5C56]">Residence</span>
                <span>
                  {receiptPayment.ob.propertyName} · Unit{" "}
                  {receiptPayment.ob.unitNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A5C56]">Amount Recorded</span>
                <span className="font-mono-num font-semibold text-[#6F795E]">
                  {formatCurrency(receiptPayment.payment.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A5C56]">Method</span>
                <span className="font-mono-num">
                  {receiptPayment.payment.method}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A5C56]">Reference</span>
                <span className="font-mono-num">
                  {receiptPayment.payment.referenceCode ?? "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A5C56]">Date</span>
                <span className="font-mono-num">
                  {formatDate(receiptPayment.payment.paidAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A5C56]">Bank Verification</span>
                <span className="font-mono-num text-[#8C4A3D]">
                  Unverified Manual Entry
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
