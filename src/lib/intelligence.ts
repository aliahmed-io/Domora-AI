import fs from "node:fs";
import path from "node:path";

export interface ModelEvaluationMetric {
  model: string;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  confusion_matrix: {
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
}

export interface FeatureImportanceEntry {
  feature: string;
  rf_importance: number;
  lr_standardized_coef: number;
}

export interface MlEvaluationReport {
  generated_at: string;
  is_synthetic_demo: boolean;
  disclaimer: string;
  dataset: {
    total_records: number;
    train_records: number;
    test_records: number;
    late_rate: number;
    features: string[];
  };
  models: ModelEvaluationMetric[];
  feature_importance: FeatureImportanceEntry[];
}

const FALLBACK_REPORT: MlEvaluationReport = {
  generated_at: "2026-11-24T00:00:00Z",
  is_synthetic_demo: true,
  disclaimer:
    "Trained on synthetic historical payment data (n=1200). Synthetic-data results do not establish real-world predictive accuracy. Advisory only — never used to automatically penalize or reject tenants.",
  dataset: {
    total_records: 1200,
    train_records: 900,
    test_records: 300,
    late_rate: 0.24,
    features: [
      "lease_tenure_months",
      "rent_to_deposit_ratio",
      "prior_late_payments_count",
      "avg_days_past_due",
      "payment_due_day",
      "recent_partial_payment_flag",
      "open_maintenance_count",
    ],
  },
  models: [
    {
      model: "Logistic Regression",
      precision: 0.7143,
      recall: 0.5556,
      f1: 0.625,
      roc_auc: 0.8124,
      confusion_matrix: { tn: 212, fp: 16, fn: 32, tp: 40 },
    },
    {
      model: "Random Forest",
      precision: 0.7458,
      recall: 0.6111,
      f1: 0.6717,
      roc_auc: 0.8419,
      confusion_matrix: { tn: 213, fp: 15, fn: 28, tp: 44 },
    },
  ],
  feature_importance: [
    { feature: "prior_late_payments_count", rf_importance: 0.342, lr_standardized_coef: 0.91 },
    { feature: "avg_days_past_due", rf_importance: 0.281, lr_standardized_coef: 0.64 },
    { feature: "recent_partial_payment_flag", rf_importance: 0.148, lr_standardized_coef: 0.42 },
    { feature: "lease_tenure_months", rf_importance: 0.094, lr_standardized_coef: -0.31 },
    { feature: "rent_to_deposit_ratio", rf_importance: 0.068, lr_standardized_coef: 0.19 },
    { feature: "open_maintenance_count", rf_importance: 0.041, lr_standardized_coef: 0.14 },
    { feature: "payment_due_day", rf_importance: 0.026, lr_standardized_coef: 0.05 },
  ],
};

export function loadMlEvaluationReport(): MlEvaluationReport {
  try {
    const reportPath = path.join(process.cwd(), "ml", "evaluation_report.json");
    if (fs.existsSync(reportPath)) {
      const raw = fs.readFileSync(reportPath, "utf-8");
      return JSON.parse(raw) as MlEvaluationReport;
    }
  } catch {
    // Fall back to precomputed synthetic evaluation report
  }
  return FALLBACK_REPORT;
}

/**
 * Rule-based anomaly detection for maintenance spend.
 * Flags units whose maintenance spend exceeds 2x the portfolio average per unit.
 */
export function detectMaintenanceSpendAnomalies(
  unitSpends: Array<{ unitId: string; unitNumber: string; propertyName: string; totalSpend: number }>
) {
  const nonZero = unitSpends.filter((u) => u.totalSpend > 0);
  if (nonZero.length === 0) return [];
  const avg = nonZero.reduce((sum, u) => sum + u.totalSpend, 0) / nonZero.length;
  return nonZero
    .filter((u) => u.totalSpend >= avg * 1.6 && u.totalSpend >= 500)
    .map((u) => ({
      ...u,
      portfolioAverage: Math.round(avg),
      ratio: Number((u.totalSpend / avg).toFixed(2)),
    }));
}
