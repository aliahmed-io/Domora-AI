# Domora AI — ML Evaluation Report (Level B Intelligence)

## 1. Objective & Ethical Boundaries

The predictive analytics module estimates the **advisory probability** of a monthly rent obligation being paid late so property managers can plan cash flow and offer proactive reminders.

- **Permitted Features Only**: `lease_tenure_months`, `rent_to_deposit_ratio`, `prior_late_payments_count`, `avg_days_past_due`, `payment_due_day`, `recent_partial_payment_flag`, `open_maintenance_count`.
- **Zero Protected Attributes**: No demographic, racial, gender, age, or discriminatory attributes are collected or used.
- **Non-Punitive Policy**: Predictions are advisory only and are never used to automatically penalize, fine, or reject a tenant.
- **Synthetic Data Disclaimer**: The pipeline (`ml/train_and_evaluate.py`) trains on `n = 1,200` synthetic historical obligations (900 train / 300 test, ~24% late rate). **Synthetic-data results do not establish real-world predictive accuracy.**

## 2. Model Comparison (Logistic Regression vs. Random Forest)

| Model | Precision | Recall | F1 Score | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: |
| **Logistic Regression** (StandardScaler + L2) | 0.7143 | 0.5556 | 0.6250 | 0.8124 |
| **Random Forest** (200 trees, max_depth=6) | 0.7458 | 0.6111 | 0.6717 | 0.8419 |

Random Forest captures non-linear interactions (e.g., compounding risk when `prior_late_payments_count >= 2` coincides with `recent_partial_payment_flag == 1`), yielding higher Recall (+5.55 pts) and ROC-AUC (+2.95 pts).

## 3. Reproducing Locally

```bash
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r ml/requirements.txt
python ml/train_and_evaluate.py
```

This writes `ml/evaluation_report.json`, which `/intelligence` loads automatically.
