# Dashboards (each role's home screen; not one of the 6 modules)

Decision of October 18: the dashboard is each role's home screen but not a module. Build it **last**, because it summarises the other modules.

**Adapted from:**
- **Unleashed:** the KPI dashboard for sales and stock.
- **Cin7 Core:** remote visibility of warehouse operations.

## Management dashboard (CEO, Office Manager, Sales Supervisor), `dashboard.html`

**Layout, top to bottom:**
1. **One alert banner**, showing the most urgent item. For example: "3 orders waiting for your approval", "12 products low on stock" or "2 customers overdue". It links to the list.
2. **4 KPI cards:**
   - Sales today (₱, with a vs-yesterday arrow)
   - Orders today
   - **Low-stock items** (links to the 3.0 reorder list)
   - **Overdue balances** (₱ and count; links to 5.0 receivables)
3. **Sales each day** (bar chart, last 14 days, today's bar red).
4. **Sales by category** (horizontal bars).

**Office Manager extra:** a "Waiting for your approval" card listing orders (2.3), purchase requests (4.2 → 4.3), supplier payables (4.5) and field payments to verify (5.3), each with Approve / Open.

The branch switcher in the header changes all numbers; **All branches** gives the company-wide view.

All other charts live in Reports.

## Admin / Warehouse Staff dashboard

1. Alert banner: low stock or deliveries today.
2. Cards:
   - **Orders to pack / for delivery** today and this week (with links)
   - **Deliveries today** (truck load list button)
   - **Low stock** in their branch
   - **Supplier deliveries to receive** (Ordered POs)
   - **Due-date reminders** (installments due this week)

## Sales Agent dashboard (mobile, `m/home.html`)

1. A big **New order** button.
2. **My orders** by status (For approval, Approved, For delivery, Shipped → Confirm delivery).
3. **My customers with balances or overdue** (tap → balance).
4. Quick **Stock check** search.

## Acceptance

- [ ] Each role lands on its own dashboard after login.
- [ ] Numbers match the module data; every card links to its list.
- [ ] Branch switching works for management.
