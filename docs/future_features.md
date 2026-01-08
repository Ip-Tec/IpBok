# Future Feature: Loan Functionality

## Overview
The Loan functionality will be tailored based on the business type, ranging from simple IOU tracking for personal use to complex amortization schedules for corporate entities.

## Business Type Segmentation

### 1. Personal Finance (Type: `PERSONAL`)
**Goal:** Track personal debts and receivables.
*   **Simple Debt Tracker**: Log who owes you and who you owe.
*   **Repayment Reminders**: Notifications for pending payments.
*   **Goal Linking**: Visualize how clearing debts impacts savings goals.
*   **Simplified Model**: Flat amounts, no complex interest calculations.

### 2. Micro & Small Business (Type: `POS`, `SME`, `RETAIL`)
**Goal:** Manage operational cash flow and customer credit.
*   **Customer Credit ("The Book")**:
    *   Sell items on credit directly from POS.
    *   Maintain customer credit limits (e.g., max ₦50k debt).
*   **Operational Capital**:
    *   Track supplier payments pending.
    *   Manage micro-loans for business float.

### 3. Medium & Large Enterprises (Type: `CORPORATE`, `MME`, `LME`)
**Goal:** Formal financial instrument management.
*   **Amortization Schedules**: Automated principal + interest splits.
*   **Accounting Integration**: Auto-provisioning of interest expenses.
*   **Collateral Management**: Tracking assets tied to loans.
*   **Multi-Lender Support**: Managing complex credit lines.
*   **Employee Loans**: Payroll deduction integration.
