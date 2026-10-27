# CLAUDE.md: Centennial Sales and Inventory System (web prototype)

> **Start every session with `docs/PROGRESS.md`.** Two teammates build this together, each with their own Claude. That file is the shared memory: what's built, the decisions made since this file was written (they win over the text below), the open questions, and how the code is organized. Run `git pull` before working, update PROGRESS.md when a step or decision changes, and commit and push when the user asks.

> **Module plans live in `docs/modules/`.** Before building any module, read in this order:
> 1. `docs/modules/00-overview-and-feature-map.md`: the module list, where each Chapter 2 related-system feature goes, the **build order (§4)** and the open decisions (§5)
> 2. `docs/modules/foundation.md`: shared layout, tokens, mock data store, helpers
> 3. The module's own file (`01`–`06`, `dashboards.md`): the step-by-step build and what each screen displays, plus its acceptance checklist
>
> If this file and a module file disagree, the module file wins. The build order in `00` §4 replaces the order in §4 below; dashboards are built **last**.

Context for building the clickable prototype screens, **one page at a time** (start with Login). Everything here was planned and agreed in the thesis design work: the DFD, the framework, the interview and the Figma design system. Follow it unless the user says otherwise.

---

## 1. What we're building

- **System:** *Web-Based Sales and Inventory Management System for Wholesale Hardware Operations*. It's a UE BSIT capstone by a team of 5; the adviser is Prof. Marc Rodin C. Ligas.
- **Client:** Centennial Nail and Screw Construction Corporation, a **wholesale** hardware supplier in Quezon City (founded 1998). It supplies hardware stores and contractors with PVC pipes, nails, screws, fasteners and similar products, and carries **more than 10,000 products**.
- **Three affiliated branches, one system, one shared database:**
  - Centennial Nail & Screw Construction Corporation (main)
  - I-KU Construction Corporation
  - ECK 888 Construction Corporation
  - Every user belongs to one branch. Each branch has its own storage areas, and stock can be moved between storage areas and between branches.
- **Prototype purpose:** Centennial's users test it in **3 review sessions** (Modified Waterfall, Phase 2: System Design), and the team revises it until the company approves.
- **Real system later:** HTML, CSS and JS front end, PHP back end, MySQL, built locally on XAMPP. **For the prototype, use plain HTML, CSS and JS with fake data, unless the user picks something else.** Keep one shared stylesheet with the tokens, and a shared layout (header and sidebar) so pages stay consistent.
- **Who will use it:** long-time office staff and field agents, **roughly 30–50 years old**. Some are not tech-savvy, and some agents only use phone calls and texts. They are used to a 2010 system where **important functions are one or two clicks away**.

### Why the old systems failed (design against these)

| Old problem | What the prototype must show |
|---|---|
| **The 2010 system:** one shared username and password for everyone | Individual logins, plus a History Log with who, when, what, and old and new value |
| **2010 system:** no low-stock alerts; staff walk the warehouse to check | Low-stock alerts and a reorder list |
| **2010 system:** you have to be at the office to check stock (agents call on Sundays) | Remote, mobile stock check for agents |
| **2010 system:** freezes | Fast, light pages |
| **2010 system:** stock meant for one customer gets sold to another | Reserved (allocated) stock vs available stock |
| **The newer package (dropped):** too many buttons, screens and departments | Few screens, one or two clicks, one main button per screen |
| **Newer package:** didn't autosave, and about 6 days of receipts were lost | **Autosave drafts**, with a visible "Saved" status |
| **Orders today:** agents photograph handwritten slips and send them through Viber or Messenger | Agents upload the slip photo in the system, and AI reads the lines |

---

## 2. Users and roles (only these log in)

There are 5 roles. **Customers, suppliers and drivers never log in.**

| Role | Device | Main jobs |
|---|---|---|
| **CEO** | Desktop | Sees everything in all 3 branches. Views the user accounts, the **History Log Report** and the reports. Does not create accounts. |
| **Office Manager** | Desktop | **Approves orders** after seeing the customer's **payment record**, and rejects bad payers (past bounced cheques or late installments). Sets stock levels (reorder point, floor, ceiling, critical). **Approves purchase requests**, verifies supplier payables, sets **credit limits**, and verifies customer payments. Gets low-stock and overdue alerts. Requests reports. **Creates and manages the user accounts of their own branch** (1.2). ECK and I-KU each have their own Office Manager. |
| **Sales Supervisor** | Desktop | Sends orders for approval. Gets low-stock alerts. Sends **stock order requests** (orders from suppliers as soon as something runs short). At Centennial this is the same person as the Office Manager, but it's a separate role in the system. **Gets Reports (own branch).** No User Accounts. |
| **Administrative / Warehouse Staff** | Desktop | Encode orders, schedule deliveries, and print the **truck load list** and receipts. Maintain products and stock, record **stock adjustments**, counts and transfers between storage areas and branches. Maintain suppliers, prepare purchase requests, and receive supplier deliveries. Record office payments with **proof-of-payment photos**. Get due-date reminders. **Can request and view reports.** Own branch only. Always write the name with the slash. |
| **Sales Agent** | **Mobile** | Field agents who visit hardware stores weekly. Create orders and **send the order slip photo**, check **stock availability (view only)**, see their orders' status, **confirm delivery**, record **field payments with proof photos**, and see **customer balances**. Own branch only. No Purchasing, no Reports, no User Accounts. |

**Management** (the CEO, Office Manager and Sales Supervisor) has wide access, backed by the interview quote "okay lang na nagagalaw namin lahat", with two limits from the revised DFD: only the Office Manager manages user accounts, and only the CEO receives the History Log Report. The Sales Supervisor does get Reports for their own branch (user decision, Oct 23).

### Branch rules in the UI
- **Every desktop screen shows the branch in the top bar.**
- Only the **CEO** gets a **branch switcher**: Centennial, I-KU, ECK 888, or **All branches**. The Office Manager sees their own branch only (Oct 27).
- Other roles see their own branch only, as fixed text in the top bar.
- Mobile should show the branch too (in the header).

---

## 3. Navigation per role

**Same login page for everyone.** After login, the user lands on **their own dashboard**, and the menu shows only the modules their role can open.

The dashboard is each role's home screen; **it is not one of the 6 modules.**

| Module (sidebar label) | CEO | Office Manager | Sales Supervisor | Admin / Warehouse Staff | Sales Agent (mobile) |
|---|---|---|---|---|---|
| Dashboard | Full | Full | Full | Limited | Limited |
| 1.0 User Accounts & History Log | View accounts; History Log Report | Manage own branch's accounts | — | — | — |
| 2.0 Sales Orders & Deliveries | Full | Full (approves) | Full | Full | Limited (own orders, confirm delivery) |
| 3.0 Products & Inventory | Full | Full (stock levels) | Full | Full | View only (stock check) |
| 4.0 Purchasing & Suppliers | Full | Full (approves) | Full (stock order requests) | Full | — |
| 5.0 Customer Accounts & Payments | Full | Full (credit limit, verify) | Full | Limited (office payments) | Limited (field payments, balances) |
| 6.0 Reports | Full | Full | Full (own branch) | View / request | — |

How the access levels show up in the UI:
- **No access ("—")** means the module is hidden from the menu.
- **View only** means no create or edit buttons.
- **Limited** means only the user's own records or some actions.

**Sales Agent mobile bottom tabs:** Home, New Order, Stock, Customers, Payments. Keep it to 5 tabs at most.

---

## 4. Screen inventory (build in this order unless told otherwise)

Name frames and pages as "Module – Screen" or "Screen – State". Pop-ups are separate modal states.

### Login (desktop and mobile)

**Already designed in Figma.** Match it:
- Light page (#f8fafc) with faint line doodles of nails, screws, bolts, nuts and washers, and a thin red stripe at the very top.
- Above the card: "Centennial Nail and Screw Construction Corporation" in small red letters, and "Web-Based Sales and Inventory Management System" as a bold title.
- A white card with:
  - The red Centennial N&S logo lockup
  - **"Log in"**, then "Use the username and password from your Office Manager."
  - **Username** and **Password** fields (with a show/hide eye)
  - A "Forgot password?" link on the right
  - A full-width red **Log in** button
  - "On a shared computer? Log out when you're done." (on mobile: "On a shared phone? …")
- Footer: "© 2026 Centennial Nail and Screw Construction Corporation".
- **States:** Default, Filled (with a "Caps Lock is on" warning), Error (wrong username or password message under the field), Locked (alert box: too many tries, ask your Office Manager), Loading (button spinner).
- **Username, not email. No SSO, no "sign up".** Accounts come from the branch's Office Manager.
- Forgot password tells the user to contact their Office Manager, since there's no email reset.
- In the prototype, a demo role picker (or demo usernames) can route to each role's dashboard.

### Dashboards (one per role)

**CEO / Office Manager / Sales Supervisor dashboard**
- One alert banner at the top, for example "12 products are low on stock" or "3 orders waiting for approval".
- **4 KPI cards:** for example Sales today, Orders today, Low-stock items, Overdue balances.
- **Sales each day** chart, with today's bar in red.
- **Sales by category** chart.
- Office Manager extra: a "Waiting for your approval" list for orders (2.3), purchase requests (4.2), supplier payables (4.5) and field payments (5.3).
- All other charts live in Reports, not here.

**Admin / Warehouse Staff dashboard**
- Orders to pack, today's and this week's deliveries, low stock, supplier deliveries to receive, and due-date reminders.

**Sales Agent (mobile) dashboard**
- My orders and their status, customer balances, and a quick "New order" button.

### 1.0 User Accounts & History Log (Office Manager manages accounts; CEO views and gets the History Log Report)
- **User Accounts – List**:
  - Table columns: name, username, role, branch, status (Active / Inactive).
  - Add user and edit buttons.
- **Add or Edit user** modal:
  - Fields: full name, username, temporary password, role, branch.
  - Deactivate, not delete.
- **History Log – View**:
  - Table columns: date and time, user, action, record, field, old value, new value.
  - Filters: user, date range, module.
  - Export or print as the History Log Report.

### 2.0 Sales Orders & Deliveries (the core flow; build after Login and Dashboard)

The order goes through these steps:

`2.1 Staff-encoded order or agent order + slip photo → 2.2 Review and validate (Sales Supervisor orders enter here) → 2.3 Office Manager approval → 2.4 Record sale (stock deducted) → 2.5 Receipt → 2.6 Schedule delivery + truck load list → Shipped → Agent confirms → Completed`

**Screens**

- **Sales Orders – List**
  - Tabs or filters by status: Draft, For approval, Approved, Rejected, Shipped, Completed, Backordered.
  - Columns: order no., customer (hardware store), agent, date, items, total, status badge.
- **Sales Orders – Create order** (staff encoding or agent order)
  1. Pick a customer (search). The customer's **credit limit and current balance** show right away.
  2. Attach the **order slip photo**.
  3. Optional **"Read slip with AI"**: upload a photo, PDF or Excel. The AI lists the lines it read, the system matches them to products, and staff **check and confirm each line**. Nothing is added until they confirm. The AI never saves, prices or deducts stock.
  4. Add products by searching. Each line shows the selling unit, quantity, unit price, available stock and line total.
  5. Show warnings, not blocks:
     - **Below minimum order quantity.** Small quantities are allowed when they're part of a bigger combined order.
     - **Over credit limit.**
     - **Backordered**: available stock goes negative. This is a normal "Backordered" badge, **never an error**, and the order still goes through.
  6. One primary button: "Send for approval". Drafts autosave.
  - Known fix from the Figma version: **product names must not wrap badly in the order table.**
- **Order approval** (Office Manager)
  - A queue of orders waiting.
  - The detail shows the order **and the customer's payment record**: balance, overdue amounts, installment status, and bounced or late payment history.
  - Approve, or reject with a reason.
- **Sales Orders – Order detail**
  - Items, status timeline, slip photo, payments, and delivery.
- **Sales Orders – Receipt**
  - A printable sales receipt.
  - Staff check quantities against the receipt before loading the truck.
- **Deliveries – List**: scheduled date, order, customer, truck, driver, status (Scheduled, Shipped, Completed).
- **Deliveries – Delivery detail**
  - Schedule date, assign truck and driver (recorded, but drivers don't log in).
  - Stock locations to pick from, and a **Truck load list** (printable).
  - "Mark as shipped" when it leaves the warehouse.
- **Agent (mobile):**
  - **New sales order**: customer, products, quantities, slip photo, send.
  - **My orders**: status list.
  - **Confirm delivery**: one big button, plus an optional note or photo.
  - **Order and delivery status**.

**Order and delivery business rules**
- Orders arrive mostly Monday and Tuesday and can have about **100 product lines**. Make the line table fast to fill with the keyboard, using search-as-you-type.
- **Delivery is usually the following week.**
- **Stock is deducted when the order is recorded** (the same as the old system).
- **Reserved stock:** once an order is approved, its quantity is allocated to that customer and can't be sold to another. Show **On hand / Reserved / Available**.

### 3.0 Products & Inventory

- **Products & Inventory – List**
  - Search across more than 10,000 products.
  - Columns: code, name, category, selling unit, on hand, reserved, **available** (negative shown as a "Backordered" badge with the number, for example −19), storage location, and stock status (OK, Low, Critical, Over ceiling).
  - Filters: category, stock status, branch.
- **Products & Inventory – Product form**
  - Fields: code, name, category, supplier, **selling unit**, selling price, **minimum order quantity**, **reorder point, floor, ceiling and critical quantity** (set by the Office Manager), and storage location.
  - **Selling units:** pieces, boxes, packs, rolls, dozens, gallons, cans, pairs. **Each product has one selling unit.** The supplier's unit can differ: a "mother box" arrives, and the item is sold by the piece.
- **Stock adjustment / Stock transfer** modal: move stock between storage areas or **to another branch**, giving from, to, quantity and reason. It writes a stock movement record.
- **Stock movement history** for each product.
- **Low-stock alerts and Reorder list**
  - Products at or below the reorder point, or negative.
  - Buttons: "Create purchase request" and "Stock order request" (Sales Supervisor).
- **Fast- and slow-moving products** (planned): shown in Reports and as a filter.
- **Over-ceiling (overstock) alert** (planned).
- **Agent (mobile) Stock check:** search by product name, then see available quantity, unit and branch. View only.

### 4.0 Purchasing & Suppliers

- **Suppliers – List and form**: company name, contact person, contact number and address.
- **Purchasing – List**
  - Columns: PO number, supplier, date, status (Requested, Approved, Ordered, Partially received, Received), **payment status (Paid / Unpaid)**.
- **Purchase request** (from the reorder list or a Sales Supervisor stock order request): goes to the **Office Manager for approval**.
- **Purchasing – Create purchase order** (4.3 Issue Purchase Order, after approval)
  - Supplier, items, quantity in the **supplier's unit**, and the unit cost.
- **Receive supplier delivery**
  - Received quantity **converted into the selling unit**. For example, 10 boxes of 6 pairs adds 60 pairs; a 250-piece mother box can be split as 125 Pioneer A and 125 Pioneer B.
  - Partial receipts allowed. Received items add to stock.
  - Major brands often deliver the next day.
- **Supplier payables**: unpaid purchase orders that the Office Manager verifies, then marks as Paid.

### 5.0 Customer Accounts & Payments

- **Customer Accounts – List**: hardware store name, contact person, number, address, **credit limit**, current balance, overdue badge.
- **Customer Accounts – Account & payments** (tabs: Overview, Orders, Payments, Installments)
  - Credit limit (set by the Office Manager).
  - **Installment plan** and its schedule.
  - Payment history, balance, and overdue items.
- **Record payment** (office staff)
  - Amount, method (cash, cheque, bank transfer), reference number, date, **proof-of-payment photo**.
  - Issues a payment receipt.
- **Verify payment** (Office Manager).
- **Overdue alerts / receivables** (Office Manager) and **due-date reminders** (staff).
- **Agent (mobile):**
  - **Record field payment**: customer, amount, method, reference, **proof photo**.
  - **Customer balance**: balance, credit limit, overdue amount, last payments.

### 6.0 Reports (desktop)

- **Reports – List** of report types:
  - Sales (daily, by category)
  - Backorders
  - Stock levels
  - Low stock
  - **Fast- and slow-moving products**
  - Stock movement
  - Deliveries
  - Purchase orders and supplier payables
  - Payments and receivables
- **Reports – Report view**: filters (date range, branch, category), a chart and table, plus Print and Export.

---

## 5. Sample data to use (realistic, Filipino wholesale hardware)

- **Customers:** hardware stores in Metro Manila and nearby provinces. Use invented names like "Golden Star Hardware", "RJ Construction Supply" or "Bagong Pag-asa Hardware".
- **Products:**
  - PVC pipe ½" × 10 ft (pcs)
  - Common wire nail 2" (box)
  - Concrete nail 3" (box)
  - Gypsum screw 1" (box of 1,000)
  - Tox (plastic wall anchors) (pack)
  - Teflon tape (roll)
  - Pioneer Epoxy A and Pioneer Epoxy B (pcs)
  - Primer paint (gallon)
  - Contact cement (can)
  - Hinges (pair)
  - Cable ties (pack)
  - Electrical tape (dozen)
- **Users:**
  - CEO, Office Manager and Sales Supervisor per branch
  - About 4 office/warehouse staff at the main branch
  - Several sales agents
- Use **₱** for prices in the prototype. The "no peso amounts" rule from the adviser applies only to the thesis chapters.
- Show at least one **Backordered** product (for example available −19) and one **over credit limit** customer, so the warnings can be demoed.

---

## 6. Look and feel (from the team's Figma file)

Figma file: `https://www.figma.com/design/wqK6E9ID6UjqTnF3fFV6pZ`. It holds the login screens and the design system.

- **Font:** **Archivo** (Google Fonts).
  - Page title: 28 bold
  - Card title: 16 bold
  - KPI number: 26 bold
  - Body: 14 on desktop, **16 on mobile**
  - Button label: 14 semibold
  - Since users are 30–50, **lean to 15–16px body text on desktop** if it fits.
- **Colors:**

| Token | Value |
|---|---|
| Page background | #f8fafc |
| Cards | #ffffff |
| Text | #111827 |
| Secondary text | #64748b |
| Muted text | #94a3b8 |
| Borders | #e5e7eb / #f1f5f9 |
| **Primary / brand red** | **#b91c1c** (hover #991b1b, active #7f1d1d) |
| Links and focus | red |
| Focus ring | 3px red at 35% opacity |
| Success | #15803d on #f0fdf4 |
| Warning | #b45309 on #fffbeb |
| Error | #b91c1c on #fef2f2 |
| Info | #1d4ed8 on #eff6ff |
| **Sidebar** | dark #111827; text #e5e7eb, muted #9ca3af, hover #1f2937, dividers #374151 |
| **Active menu item** | red #b91c1c with white text |
| Charts | grey bars #64748b, **today's bar red**, grid #e5e7eb |

- **Spacing:** 4, 8, 12, 16, 24, 32, 48. **Radius:** 6, 8 (inputs and buttons), 12 (cards), full (badges).
- **Shadows:** small `0 1px 2px rgba(17,24,39,.05)`; medium `0 4px 12px rgba(17,24,39,.08)`; large `0 12px 32px rgba(17,24,39,.12)`.
- **Desktop layout:** 1440×900 frame, **header 64px**, **sidebar 248px**, content padding 32px. Each page starts with a breadcrumb ("Home / Sales Orders") above the page title.
- **Mobile layout:** 390×844, header 60px, and a bottom tab bar 72px.
- **Logo:** the red Centennial N&S lockup. **It stays red.** On dark backgrounds it sits on a light rounded plate; never use a white logo.
- **Components already in Figma:**
  - Button, Badge, Input, Sidebar (role variants), Tab, Bottom tab bar, Segmented control
  - Header (desktop and mobile), KPI card, Card, Table header and cell, Modal, Empty state, Alert
  - Hardware doodle icons
  - Recreate these in CSS.

### UX rules (apply to every page)
1. **Senior-friendly**:
   - Body text at least 16px on mobile.
   - **Buttons and tap targets at least 44–48px.**
   - **Icons always with text labels.**
   - Plain wording and good contrast.
2. **Show less at once**:
   - One-line page descriptions and no hint text under fields.
   - **Tabs on detail pages.**
   - No duplicate info or duplicate buttons.
3. **One primary (red) button per screen.** Other actions are secondary or text buttons.
4. **Few clicks.** Follow the staff's current encoding order, and support keyboard entry in the order table.
5. **Autosave drafts**, with a visible "Saved" or "Saving…" indicator.
6. **Badges always have an icon and a label.** Color is never the only signal.
7. **"Backordered" is info or warning, never an error.**
8. Statuses are written as words, for example "For approval", "Shipped", "Completed", "Unpaid", "Overdue".
9. Destructive actions (reject, deactivate) ask for confirmation in a modal.
10. Empty states use a short message and one action.

---

## 7. Planned features checklist (make sure each one appears somewhere)

- [ ] Individual logins and roles; **History Log** with old and new values
- [ ] Branch shown everywhere, branch switcher for management, **stock transfer between branches**
- [ ] Order slip photo plus **AI order reading with confirm step**
- [ ] **Minimum order quantity** warning
- [ ] **Credit limit check** and **payment record shown before approval**
- [ ] **Office Manager order approval** and **purchase approval**
- [ ] **Backordered** orders still go through
- [ ] **On hand / Reserved / Available** stock
- [ ] Stock deducted when the order is recorded
- [ ] Receipt, delivery schedule, truck and driver, **truck load list**, Shipped, **agent confirms** to complete
- [ ] Selling units and **unit conversion when receiving**
- [ ] **Reorder point, floor, ceiling, critical**; **low-stock alerts**; reorder list; **stock order request**
- [ ] Over-ceiling alert and **fast- and slow-moving** report (planned)
- [ ] Supplier deliveries **paid/unpaid**, supplier payables verification
- [ ] **Installment plans**, payments with **proof photo** (office and field), balances, **overdue alerts**, due-date reminders
- [ ] Role dashboards (management dashboard: alert, 4 KPIs, sales each day, sales by category)
- [ ] Reports: sales, backorders, stock, movement, deliveries, purchases, payables, payments and receivables
- [ ] Mobile agent screens: new order, stock check, my orders, confirm delivery, field payment, customer balance

**Out of scope (skip these):**
- Customer or supplier login
- Driver app
- Payroll
- Accounting integration
- Product cost or stock-date features
- Online payments

---

## 8. Working style with this user

- Build **one page at a time**. After each page, take a screenshot or open it in the browser to check the layout, then show the user. Don't move on until they're happy.
- Keep replies short and plain. The user often sends a screenshot with a one-line request.
- Make the change, check it, then report briefly. There's no need to ask permission for small layout fixes.

### UI build workflow (every screen)
1. **Before designing:** use `taste` and `ecc:frontend-design-direction` (keep the Figma direction: one red accent, hardware doodles), and the `ui-ux-pro-max` rules (accessibility → touch → layout → type → motion → forms).
2. **While building:** use `ecc:design-system` (shared tokens and components only, nothing page-specific that should be shared), `ecc:frontend-a11y` and `ecc:accessibility` (semantic HTML, labels, focus order, live regions), and `ecc:motion-foundations` (shared motion tokens, `transform` and `opacity` only, ≤350ms, reduced-motion fallback).
3. **After building:** do a polish pass with `ecc:make-interfaces-feel-better` (spacing, alignment, states, small details), then run an `accessibility-review` (contrast, keyboard, focus order, screen-reader names, 390px and 320px widths), fix the findings, and check in the browser.
- **Icons:** Heroicons v2.2.0, **outline 24px** only, saved in `assets/icons/outline/` and inlined with `aria-hidden="true"`. Always next to a text label.
- **Logo:** the real logo at `assets/img/logo.jpg`. It stays red; on dark backgrounds it sits on a light rounded plate.

<!-- planfirst:start -->
## Architecture Reference
Full spec: `./docs/architecture.md` — read before adding any infrastructure.

### Stack (moment: validate)
- Pages: plain HTML + CSS + vanilla JS (no build step)
- Data: `localStorage` mock DB via `assets/js/store.js` (`CNS.store`), seeded from `assets/js/data.js`, ERD table names + `branches`
- Styling: shared tokens from the team Figma (Archivo, #b91c1c accent, #111827 sidebar)
- Motion and polish: CSS only, following the installed Emil Kowalski skills (ADR-006); no animation libraries
- Collaboration: private GitHub repo + `docs/PROGRESS.md` as shared memory (ADR-007)
- AI slip reading: mocked (canned results, confirm each line)
- Approvals (Office Manager): always on, per revised Chapter 3 (ADR-005)
- Later (after approval): PHP + MySQL on XAMPP

### Agent Rules
- DO NOT add frameworks, bundlers, npm packages or CDN UI libraries; write plain HTML/CSS/JS.
- DO NOT add a backend, database server or auth service; all data goes through `assets/js/store.js` (`CNS.store`) and `localStorage`.
- ALWAYS read `docs/PROGRESS.md` at the start of a session and update it when a step or decision changes.
- DO NOT add animation libraries (Motion, Framer Motion, GSAP, Sonner, Vaul); write motion as CSS transitions, keyframes or `@starting-style`.
- ALWAYS put motion and visual changes in the shared tokens and components first; DO NOT restyle a component on one page only.
- ALWAYS animate only `transform` and `opacity` (plus `filter`/`clip-path` when needed); DO NOT use `transition: all`.
- ALWAYS use ease-out curves for UI motion (`cubic-bezier(0.23, 1, 0.32, 1)`); DO NOT use `ease-in` on interface elements.
- ALWAYS keep UI animations under 300ms (press 100–160ms, popovers 125–200ms, dropdowns 150–250ms; modals up to 350ms).
- DO NOT animate from `scale(0)`; DO NOT animate actions repeated all day (typing order lines, keyboard navigation, switching filters or status tabs).
- ALWAYS give every motion a `prefers-reduced-motion: reduce` fallback that removes movement.
- ALWAYS report design review findings in a Before | After | Why markdown table.
- ALWAYS read `docs/modules/00-overview-and-feature-map.md`, `foundation.md`, and the module file before building that module's screens.
- ALWAYS follow the build order in `00-overview-and-feature-map.md` §4, and finish each module's acceptance checklist before starting the next.
- ALWAYS label screens and steps with the revised Chapter 3 process numbers (see `docs/revision-plan.md`); DO NOT use the old 2.1–2.5 / 4.1–4.3 / 5.1–5.4 / 6.1–6.3 numbering.
- DO NOT give the Sales Supervisor User Accounts; only the Office Manager manages user accounts (own branch). The Sales Supervisor DOES get the Reports menu (own branch).
- ALWAYS use ERD table and column names in mock data; `branches` is the only extra table.
- ALWAYS derive on hand, allocated and available from stock movements; never store a separate stock number.
- ALWAYS log every create, update or delete with `history.logChange()` (user, time, module, record, field, old → new).
- ALWAYS use the shared tokens and components; never hard-code colors or fonts on a page.
- ALWAYS keep one primary button per screen, important actions one or two clicks away, and visible autosave on forms.
- DO NOT call a real AI API; "Read slip with AI" uses canned results and requires staff to confirm each line.
- DO NOT give Sales Agents desktop modules; agents use only the `m/` pages.
- DO NOT invent features that aren't in Chapter 3, the Chapter 2 adapted features or the Proposed Solution table; ask the user first.
<!-- planfirst:end -->
