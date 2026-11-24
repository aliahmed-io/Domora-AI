"""
Domora AI — Predictive Payment Analytics (Level B Intelligence)
Trains and evaluates Logistic Regression vs. Random Forest on synthetic
historical lease and payment behavior features.

ETHICAL & GOVERNANCE CONSTRAINTS:
1. Uses ONLY permitted non-sensitive financial and lease-behavior features.
2. Excludes all protected or demographic attributes.
3. Synthetic dataset demonstration ONLY: results do not establish real-world
   predictive accuracy.
4. Predictions are advisory for cash-flow planning and proactive support;
   never used to automatically penalize or reject a tenant.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


FEATURE_COLUMNS = [
    "lease_tenure_months",
    "rent_to_deposit_ratio",
    "prior_late_payments_count",
    "avg_days_past_due",
    "payment_due_day",
    "recent_partial_payment_flag",
    "open_maintenance_count",
]


def generate_synthetic_payment_dataset(
    n_samples: int = 1200, seed: int = 42
) -> pd.DataFrame:
    """Generate a realistic synthetic dataset of monthly rent obligations."""
    rng = np.random.default_rng(seed)

    lease_tenure_months = rng.integers(1, 48, size=n_samples)
    rent_to_deposit_ratio = np.round(rng.uniform(0.5, 1.5, size=n_samples), 2)
    prior_late_payments_count = rng.poisson(0.65, size=n_samples).clip(0, 8)
    avg_days_past_due = np.round(
        np.where(
            prior_late_payments_count > 0,
            rng.gamma(shape=2.0, scale=2.5, size=n_samples),
            rng.uniform(0.0, 1.0, size=n_samples),
        ),
        2,
    )
    payment_due_day = rng.choice([1, 5, 10, 15], size=n_samples, p=[0.6, 0.2, 0.1, 0.1])
    recent_partial_payment_flag = rng.binomial(1, p=0.14, size=n_samples)
    open_maintenance_count = rng.poisson(0.35, size=n_samples).clip(0, 4)

    # Underlying synthetic log-odds (non-linear interaction for RF vs LR comparison)
    logit = (
        -2.35
        + 0.62 * prior_late_payments_count
        + 0.18 * avg_days_past_due
        + 0.95 * recent_partial_payment_flag
        + 0.45 * (rent_to_deposit_ratio > 1.15).astype(float)
        - 0.03 * lease_tenure_months
        + 0.22 * (open_maintenance_count >= 2).astype(float)
        + 0.35 * (prior_late_payments_count >= 2) * recent_partial_payment_flag
    )
    probs = 1.0 / (1.0 + np.exp(-logit))
    is_late = rng.binomial(1, probs)

    return pd.DataFrame(
        {
            "lease_tenure_months": lease_tenure_months,
            "rent_to_deposit_ratio": rent_to_deposit_ratio,
            "prior_late_payments_count": prior_late_payments_count,
            "avg_days_past_due": avg_days_past_due,
            "payment_due_day": payment_due_day,
            "recent_partial_payment_flag": recent_partial_payment_flag,
            "open_maintenance_count": open_maintenance_count,
            "is_late": is_late,
        }
    )


def evaluate_model(
    name: str,
    model: object,
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> dict:
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()

    return {
        "model": name,
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, y_prob)), 4),
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp),
        },
    }


def main() -> None:
    df = generate_synthetic_payment_dataset(n_samples=1200, seed=42)
    X = df[FEATURE_COLUMNS]
    y = df["is_late"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    lr_pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=1000, random_state=42)),
        ]
    )
    lr_pipeline.fit(X_train, y_train)

    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=6,
        min_samples_leaf=8,
        random_state=42,
    )
    rf_model.fit(X_train, y_train)

    lr_metrics = evaluate_model("Logistic Regression", lr_pipeline, X_test, y_test)
    rf_metrics = evaluate_model("Random Forest", rf_model, X_test, y_test)

    lr_coefs = lr_pipeline.named_steps["clf"].coef_[0]
    feature_importance = [
        {
            "feature": col,
            "rf_importance": round(float(imp), 4),
            "lr_standardized_coef": round(float(coef), 4),
        }
        for col, imp, coef in zip(
            FEATURE_COLUMNS, rf_model.feature_importances_, lr_coefs
        )
    ]
    feature_importance.sort(key=lambda x: x["rf_importance"], reverse=True)

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "is_synthetic_demo": True,
        "disclaimer": (
            "Trained on synthetic historical payment data (n=1200). "
            "Synthetic-data results do not establish real-world predictive accuracy. "
            "Advisory only — never used to automatically penalize or reject tenants."
        ),
        "dataset": {
            "total_records": int(len(df)),
            "train_records": int(len(X_train)),
            "test_records": int(len(X_test)),
            "late_rate": round(float(y.mean()), 4),
            "features": FEATURE_COLUMNS,
        },
        "models": [lr_metrics, rf_metrics],
        "feature_importance": feature_importance,
    }

    output_path = Path(__file__).parent / "evaluation_report.json"
    output_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
