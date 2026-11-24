"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { ShieldAlert, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { MlEvaluationReport } from "@/lib/intelligence";

export interface CollectionTrendPoint {
  period: string;
  scheduled: number;
  collected: number;
}

export interface ExpiringLeaseAlert {
  id: string;
  unitNumber: string;
  propertyName: string;
  tenantName: string;
  endDate: string;
  daysRemaining: number;
  renewalStatus: string;
}

export interface SpendAnomalyItem {
  unitId: string;
  unitNumber: string;
  propertyName: string;
  totalSpend: number;
  portfolioAverage: number;
  ratio: number;
}

export interface PredictionRow {
  id: string;
  tenantName: string;
  unitNumber: string;
  propertyName: string;
  modelName: string;
  lateProbability: number;
  riskTier: string;
  explanation: string;
}

interface IntelligenceClientProps {
  occupancyRate: number;
  totalOverdue: number;
  collectionTrends: CollectionTrendPoint[];
  expiringLeases: ExpiringLeaseAlert[];
  spendAnomalies: SpendAnomalyItem[];
  predictions: PredictionRow[];
  mlReport: MlEvaluationReport;
}

export function IntelligenceClient({
  occupancyRate,
  totalOverdue,
  collectionTrends,
  expiringLeases,
  spendAnomalies,
  predictions,
  mlReport,
}: IntelligenceClientProps) {
  const modelChartData = mlReport.models.map((m) => ({
    name: m.model,
    Precision: Number((m.precision * 100).toFixed(1)),
    Recall: Number((m.recall * 100).toFixed(1)),
    F1: Number((m.f1 * 100).toFixed(1)),
    "ROC-AUC": Number((m.roc_auc * 100).toFixed(1)),
  }));

  return (
    <div className="space-y-12">
      <div className="border-b border-[#C5A88A] pb-5">
        <p className="font-mono-num text-xs uppercase tracking-[0.2em] text-[#8C4A3D]">
          Dual-Layer Analytics · Rule-Based + Scikit-Learn Advisory
        </p>
        <h1 className="font-display text-4xl text-[#262824] mt-1">
          AI Portfolio Intelligence
        </h1>
        <p className="text-sm text-[#5A5C56] mt-1 max-w-3xl">
          Deterministic portfolio rules paired with a transparent comparison of
          Logistic Regression and Random Forest models trained on non-sensitive
          financial &amp; lease behavior features.
        </p>
      </div>

      {/* Level A — Rule-Based Intelligence */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl text-[#262824] flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#6F795E]" />
            <span>Level A — Rule-Based Intelligence</span>
          </h2>
          <div className="flex items-center gap-6 text-xs font-mono-num">
            <span>
              Occupancy: <strong>{occupancyRate}%</strong>
            </span>
            <span className="text-[#8C4A3D]">
              Overdue: <strong>{formatCurrency(totalOverdue)}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Collection Trend Chart */}
          <div className="lg:col-span-7 border border-[#C5A88A] bg-[#FAF5EE] p-6 space-y-4">
            <div>
              <h3 className="font-display text-2xl">Monthly Collection Trends</h3>
              <p className="text-xs text-[#5A5C56]">
                Scheduled rent obligations vs. manually recorded collections
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={collectionTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DFCDB8" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#5A5C56" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#5A5C56" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FAF5EE",
                      borderColor: "#C5A88A",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="scheduled" name="Scheduled ($)" fill="#C5A88A" />
                  <Bar dataKey="collected" name="Collected ($)" fill="#6F795E" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming Expirations & Spend Anomalies */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border border-[#C5A88A] bg-[#FAF5EE] p-5 space-y-3">
              <h3 className="font-display text-xl">
                Upcoming Lease Expirations (≤ 45 Days)
              </h3>
              {expiringLeases.length > 0 ? (
                <ul className="divide-y divide-[#C5A88A]/40 text-xs">
                  {expiringLeases.map((l) => (
                    <li key={l.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-medium block">
                          {l.tenantName} — Unit {l.unitNumber}
                        </span>
                        <span className="text-[#5A5C56]">
                          {l.propertyName} · {l.renewalStatus}
                        </span>
                      </div>
                      <div className="text-right font-mono-num">
                        <span className="text-[#B57B3A] block">
                          {l.daysRemaining}d left
                        </span>
                        <span className="text-[#5A5C56]">
                          {formatDate(l.endDate)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#5A5C56]">
                  No leases expiring within 45 days.
                </p>
              )}
            </div>

            <div className="border border-[#C5A88A] bg-[#FAF5EE] p-5 space-y-3">
              <h3 className="font-display text-xl flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#8C4A3D]" />
                <span>Maintenance Spend Anomalies</span>
              </h3>
              {spendAnomalies.length > 0 ? (
                <ul className="divide-y divide-[#C5A88A]/40 text-xs">
                  {spendAnomalies.map((a) => (
                    <li key={a.unitId} className="py-2 flex items-center justify-between">
                      <span>
                        {a.propertyName} · Unit {a.unitNumber}
                      </span>
                      <span className="font-mono-num text-[#8C4A3D]">
                        {formatCurrency(a.totalSpend)} ({a.ratio}× avg)
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#5A5C56]">
                  All unit maintenance spend is within normal portfolio variance.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Level B — Predictive Analytics */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="font-display text-3xl text-[#262824] flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#8C4A3D]" />
            <span>Level B — Predictive Payment Risk (Advisory)</span>
          </h2>
          <span className="font-mono-num text-xs text-[#5A5C56]">
            Dataset: n={mlReport.dataset.total_records} synthetic obligations
          </span>
        </div>

        {/* Ethical & Synthetic Data Disclaimer */}
        <div className="flex items-start gap-3 border border-[#8C4A3D] bg-[#8C4A3D]/10 p-4 text-xs text-[#262824]">
          <ShieldAlert className="h-4 w-4 text-[#8C4A3D] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">
              Synthetic Demonstration &amp; Non-Discrimination Notice
            </p>
            <p className="text-[#5A5C56]">{mlReport.disclaimer}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Model Comparison Chart */}
          <div className="lg:col-span-6 border border-[#C5A88A] bg-[#FAF5EE] p-6 space-y-4">
            <h3 className="font-display text-2xl">
              Logistic Regression vs. Random Forest (%)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DFCDB8" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#5A5C56" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#5A5C56" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FAF5EE",
                      borderColor: "#C5A88A",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="Precision" fill="#6F795E" />
                  <Bar dataKey="Recall" fill="#C5A88A" />
                  <Bar dataKey="F1" fill="#8C4A3D" />
                  <Bar dataKey="ROC-AUC" fill="#262824" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feature Importance */}
          <div className="lg:col-span-6 border border-[#C5A88A] bg-[#FAF5EE] p-6 space-y-4">
            <h3 className="font-display text-2xl">
              Permitted Feature Importances
            </h3>
            <p className="text-xs text-[#5A5C56]">
              Strictly financial &amp; lease-behavior signals; zero protected
              attributes.
            </p>
            <div className="space-y-2.5">
              {mlReport.feature_importance.map((f) => (
                <div key={f.feature} className="space-y-1 text-xs">
                  <div className="flex justify-between font-mono-num">
                    <span>{f.feature}</span>
                    <span>
                      RF: {(f.rf_importance * 100).toFixed(1)}% · LR coef:{" "}
                      {f.lr_standardized_coef}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#EDE0D0]">
                    <div
                      className="h-full bg-[#8C4A3D]"
                      style={{ width: `${Math.min(100, f.rf_importance * 100 * 2.2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lease Advisory Predictions */}
        <div className="border border-[#C5A88A] bg-[#FAF5EE] overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#C5A88A] bg-[#F5EBDF] text-xs font-mono-num uppercase text-[#5A5C56]">
                <th className="py-3 px-4">Resident / Unit</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Late Probability</th>
                <th className="py-3 px-4">Advisory Tier</th>
                <th className="py-3 px-4">Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C5A88A]/50">
              {predictions.map((p) => (
                <tr key={p.id}>
                  <td className="py-3.5 px-4">
                    <span className="font-medium block">{p.tenantName}</span>
                    <span className="font-mono-num text-xs text-[#5A5C56]">
                      {p.propertyName} · Unit {p.unitNumber}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono-num text-xs">
                    {p.modelName}
                  </td>
                  <td className="py-3.5 px-4 font-mono-num font-medium">
                    {Math.round(p.lateProbability * 100)}%
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        "font-mono-num text-[11px] px-2 py-0.5 border",
                        p.riskTier === "HIGH" &&
                          "border-[#8C4A3D] bg-[#8C4A3D] text-[#FAF5EE]",
                        p.riskTier === "MEDIUM" &&
                          "border-[#B57B3A] bg-[#F3E6D4] text-[#262824]",
                        p.riskTier === "LOW" &&
                          "border-[#6F795E] bg-[#E5E9DF] text-[#262824]"
                      )}
                    >
                      {p.riskTier}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#5A5C56]">
                    {p.explanation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
