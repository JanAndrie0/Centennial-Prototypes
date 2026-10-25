# Review session walkthrough

A script for the **3 review sessions** with Centennial's users (Modified Waterfall, Phase 2: System Design). Each session follows one part of a normal working day, using the demo data. Anyone on the team can run it.

## Before every session

1. Open `login.html` in Chrome or Edge (full screen, zoom 100%). For the agent screens, use a phone or the browser's phone view (390 px wide).
2. Log in as any role and click **Reset demo data** at the bottom of the page, so everyone starts from the same data.
3. Switch roles with **Log out → Demo: log in as…** on the login page. All passwords are `centennial`.
4. One person drives, one takes notes. Write down every "I would expect…" and "We do it differently" in the feedback table at the end.

Tip: say the old problem out loud before showing the screen that fixes it (the "Point out" column). That is what the client is judging.

---

## Session 1 · Logging in, products and stock (Office Manager, Admin/Warehouse Staff)

| # | Role | Do this | Point out (solves) |
|---|---|---|---|
| 1 | — | Login page: type a wrong password, then turn on Caps Lock | Individual logins with clear messages (old system: one shared account) |
| 2 | Office Manager | Dashboard: read the banner and the 4 tiles | One place for what needs attention today |
| 3 | Office Manager | 1.0 User Accounts → **Add user** (a new warehouse staff), then Edit → Deactivate | Each person has their own account; deactivate, never delete |
| 4 | Admin/Warehouse | 3.0 Products: search "epoxy" → **Pioneer Epoxy A** | Available **−19 · Backordered** is normal, not an error; On hand / Allocated / Available |
| 5 | Admin/Warehouse | Same product → **Stock by location → Adjust stock** (remove 2, Damaged) | Every stock change has a reason and a name |
| 6 | Admin/Warehouse | **Transfers → New transfer**: Common wire nail 2" to I-KU | Branch transfers; I-KU confirms when it arrives |
| 7 | Office Manager (I-KU: `om.iku`) | Transfers → **Receive** the transfer | Stock moves between branches with a record |
| 8 | Admin/Warehouse | **Stock count** → Warehouse B → type counts → Post count | Physical count corrects the system |
| 9 | Office Manager | **Reorder list** → tick 2 products → **Create purchase request** | Low-stock alerts and a reorder list (old system: walk the warehouse) |
| 10 | Office Manager | Edit a product → change the **ceiling** | Only the Office Manager sets stock levels |

**Ask the client:** Which number should trigger the low-stock alert, the critical level or the reorder point? (open question D5) Is "fast-moving = 20% of the ceiling sold in 30 days" right?

---

## Session 2 · An order from start to finish (Agent, Staff, Office Manager)

| # | Role | Do this | Point out (solves) |
|---|---|---|---|
| 1 | Sales Agent (phone) | Home → **New order** → store, **take slip photo**, add products, Send | Orders from the field without Viber photos and retyping |
| 2 | Admin/Warehouse | 2.0 → **New order** for Bagong Pag-asa → **Read slip with AI** → confirm 3 lines | AI reads the slip but staff confirm every line |
| 3 | Admin/Warehouse | Watch the warnings: over credit, overdue, backordered, below minimum | Warnings, never blocks; the Office Manager decides |
| 4 | Office Manager | **Approvals** → read the customer's payment record → **Approve** one, **Reject** one (with a reason) | Credit and payment history before approving (bad payers, bounced cheques) |
| 5 | Office Manager | Products → Pioneer Epoxy A: Allocated went up | Approved stock is reserved for that customer, so it can't be sold twice |
| 6 | Admin/Warehouse | Order → **Receipt** (print preview) | Receipt shows payments and remaining balance |
| 7 | Admin/Warehouse | **Deliveries** → Schedule (truck, driver) → **Truck load list** → **Mark as shipped** | Load list by storage area; stock deducted when it leaves |
| 8 | Sales Agent (phone) | Home → **deliveries to confirm** → **Delivered** | The agent confirms; the order is Completed |
| 9 | Office Manager | Order → **Timeline** tab | Who did what, and when, for every order |

**Ask the client:** Can orders be edited until shipped, or only until the delivery date? (D7) Is next week's same weekday the right default delivery date?

---

## Session 3 · Money, suppliers, reports and the History Log (Office Manager, CEO, Agent)

| # | Role | Do this | Point out (solves) |
|---|---|---|---|
| 1 | Office Manager | 4.0 **Approvals** → approve the purchase request from Session 1 → **Issue purchase order** | Purchases need approval; printable PO |
| 2 | Admin/Warehouse | **Receive delivery** → epoxy mother box → **Split** 125 A + 125 B → Post | Mother-box conversion done by the system (old: by hand) |
| 3 | Office Manager | Purchase orders → Payment: Unpaid → **Mark paid** | Supplier payables, paid or unpaid |
| 4 | Admin/Warehouse | 5.0 **Record payment** (cheque + proof photo) → receipt | Proof of payment kept with the record |
| 5 | Sales Agent (phone) | **Payments** → record a field payment with a photo | Field payments without paper notes |
| 6 | Office Manager | **Receivables → To verify** → verify the agent's payment; look at the aging table | Overdue alerts and aging (old: no reminders) |
| 7 | Office Manager | A customer → **Installments** → set up a plan | Installment plans and due dates |
| 8 | CEO | Dashboard with **All branches**, then I-KU | Company-wide view and per branch |
| 9 | CEO | 6.0 **Reports** → Sales, Backorders, Fast/slow → Print / Export | Reports without manual consolidation |
| 10 | CEO | **History Log** → filter by user → Print report | Every change: who, when, old and new value |
| 11 | CEO | **My account** | Only the CEO edits the CEO account |

**Ask the client:** When are orders without an installment plan due (e.g. 30 days after delivery)? Should office payments also need the Office Manager's verification, or only field payments?

---

## Feature checklist (CLAUDE.md §7) — where each one is shown

| Feature | Session · step |
|---|---|
| Individual logins and roles; History Log with old and new values | 1·1, 1·3, 3·10 |
| Branch shown everywhere, branch switcher, stock transfer between branches | 1·6–7, 3·8 |
| Order slip photo + AI reading with confirm step | 2·1–2 |
| Minimum order warning; credit limit check; payment record before approval | 2·3–4 |
| Office Manager order approval and purchase approval | 2·4, 3·1 |
| Backordered orders still go through; On hand / Reserved / Available | 1·4, 2·3, 2·5 |
| Receipt, delivery schedule, truck and driver, truck load list, Shipped, agent confirms | 2·6–8 |
| Selling units and unit conversion when receiving | 3·2 |
| Reorder point, floor, ceiling, critical; low-stock alerts; reorder list; stock order request | 1·9–10 (stock order request: log in as Sales Supervisor) |
| Over-ceiling alert; fast/slow-moving report | Reorder list "Over ceiling"; 3·9 |
| Supplier deliveries paid/unpaid; payables verification | 3·3 |
| Installment plans, payments with proof photo, balances, overdue alerts, due-date reminders | 3·4–7; staff dashboard "Due-date reminders" |
| Role dashboards | Each session starts on the dashboard |
| Reports | 3·9 |
| Mobile agent screens | 2·1, 2·8, 3·5; Stock and Customers tabs |

## Feedback table (copy for each session)

| # | Screen | Who said it | What they expected / what they do today | Change needed? (Yes / No / Ask adviser) |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |

After the session, add the agreed changes to `docs/PROGRESS.md` (Decisions or Open questions) so both teammates' Claudes see them.
