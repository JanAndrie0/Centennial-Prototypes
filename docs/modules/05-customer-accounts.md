# 5.0 · Customer Accounts

**Chapter 3:** "Customer Accounts will record customer details, installment plans and payments, and send due-date reminders and overdue alerts."

**Child diagram 5.0** (revised Chapter 3)
- 5.1 Maintain Customer Accounts: customer details and the **credit limit** set by the Office Manager in D6, and the order's **installment plan** in D11.
- 5.2 Record Customer Payment: **office and field payments** with the **proof of payment photo** in D12; logs to D2; issues the **payment receipt**.
- 5.3 Update Customer Balance: uses the payment history, the payments **verified by the Office Manager** and the sales order amount from 2.0.
- 5.4 Provide Customer Balance: adds the installment balances from D11; gives the **customer balance** to sales agents and the **customer payment record** to 2.0 for approval.
- 5.5 Monitor Receivables: **due-date reminders** (staff), **overdue alerts and customer receivables** (Office Manager), **receivables data** (6.0).

**Proposed Solution table covers:**
- Installment payments
- Customer database and order history
- Plans and due dates
- **Partial payments**
- **Balance shown on the receipt**
- Overdue alerts
- **Credit limits**

**Solves problems:**
- F1–F9: no plans, no partial payment tracking, no history, no reminders, no credit limit, agents can't see balances, receipt lacks balance, field payments on paper, no aging
- E8: customer balance not shared across branches

## Adapted features in this module

| From | Feature | Where |
|---|---|---|
| **Unleashed** | Attach a **photo or scan of the payment proof** (for example, a cheque receipt) to the record, so each payment's history stays next to the order it settles | Record payment (office and field) |
| Turis | Credit is part of order validation | Customer card used by 2.0 |
| Ch. 2 Unleashed text | Payments processed outside the system (cheques) are now recorded with proof | Payments tab |

## Build in two parts

- **Part 1 (before 2.0):** Steps 1–2, customer records and credit limits.
- **Part 2 (after 2.0):** Steps 3–7.

## Access

| Screen | CEO / SS | Office Manager | Admin / Warehouse | Sales Agent (mobile) |
|---|---|---|---|---|
| Customer list / account | Full | Full | Full (own branch) | View own customers |
| Credit limit | View | **Sets** | View | View |
| Installment plan | Full | Full | Create | View |
| Record payment | ✔ | ✔ + **Verify** | ✔ (office payments) | ✔ (**field payments**) |
| Receivables / overdue | ✔ | ✔ (gets alerts) | Due-date reminders | Own customers |

## Screens and build steps

### Step 1 · Customer list (`customers/list.html`), 5.1

**What is displayed**
- Title "Customer Accounts", with the description "Hardware stores, their balance and credit."
- Search; filters: agent, branch, **Overdue**, **Over credit limit**.
- Table columns: Store name · Contact person · Contact no. · Area / address · Agent · **Credit limit** · **Balance** · **Overdue** (badge with days) · Last order.
- Primary button: **Add customer**.
- Balances are **shared across all branches** (one customer record company-wide).

### Step 2 · Customer account (`customers/detail.html`), 5.1 and 5.4

**Header tiles:** Credit limit · Current balance · Available credit · Overdue amount.

**Tabs**
1. **Overview**: contact details, agent, branch, **credit limit** (editable by the Office Manager only, and logged).
2. **Orders**: order history (from 2.0) with status and amount.
3. **Payments**: date, receipt no., order, amount, method, reference, **proof photo** thumbnail, channel (Office / Field), received by, **verified** badge.
4. **Installments**: plans and their schedules (Step 3).
5. **History**: audit log.

### Step 3 · Set up installment plan (modal from the order or customer), 5.1 Maintain Customer Accounts

**Fields:**
- Order
- Total amount
- Down payment (optional)
- **Number of payments**
- Frequency (weekly, every 15 days, monthly)
- First due date

**Preview table:** No. · Due date · Amount due. It is generated automatically and editable.

**Save** writes the plan and schedule, and logs it.

Plan view, per row: Due date · Amount due · Paid · **Remaining** · Status (Paid / Partially paid / Due / **Overdue**).

### Step 4 · Record payment, office (`payments/record.html`) and field (`m/payments.html`), 5.2 Record Customer Payment

**Fields:**
- Customer → the order or installment it pays (a list of open items with remaining amounts)
- Amount (**partial payments allowed**)
- Method: Cash / Cheque / Bank transfer
- Reference / cheque no., date
- **Proof of payment photo** (camera on mobile)

**Result:**
- Shows the new remaining balance.
- **Issues a payment receipt** (printable; on mobile, a "show / share receipt" screen) with the amount paid, what it was applied to, and the **remaining balance**.
- Field payments are marked **Field** and **For verification**. The Office Manager **verifies** them; verified payments update the balance (5.3 Update Customer Balance).

### Step 5 · Receivables and alerts (`payments/receivables.html`), 5.5 Monitor Receivables

- **Receivables aging table** (Problem F9): Customer · Current · 1–30 · 31–60 · 61–90 · 90+ days · Total.
- **Overdue alerts**: list plus header bell, for the Office Manager and management.
- **Due-date reminders**: installments due in the next 7 days, for staff.
- Payments **for verification** queue (Office Manager).
- Receivables data feeds 6.0.

### Step 6 · Agent mobile (`m/customers.html`, `m/payments.html`)

- **Customers:** my stores → tap → **balance, credit limit, overdue, last payments** (5.4 Provide Customer Balance; Problem F6), and a "New order" shortcut.
- **Record field payment:** big fields + proof photo → payment receipt to show the store owner. This replaces paper notes (Problem F8).

### Step 7 · Connect

- 2.0 uses the customer card (credit and balance, from 5.4) in New order and Approvals.
- Receipts in 2.0 show the payments and balance.
- 6.0 reads payments and receivables.

## Acceptance

- [ ] The credit limit shows on the customer and in the order flow; only the Office Manager edits it.
- [ ] An installment plan generates its schedule; partial payments reduce the remaining balance.
- [ ] Payment proof is attached and visible; field payments need verification.
- [ ] The aging table, overdue alerts and due-date reminders show correct demo data.
- [ ] The receipt shows the remaining balance.
