# 1.0 · Manage User Accounts and History Log

**Chapter 3:** "User Accounts and History Log will manage user logins and accounts, which the office manager of each branch will create, and record every action as an activity record that the CEO can view in the history log report."
**Solves:**
- Problem C2: one shared username and password; nobody can be traced
- Problem C3: no history of who changed or deducted stock
- Problem C1: an office-only system, solved by individual remote logins

**Adapted from:**
- **inFlow:** individual accounts with access rights, and Team Member Tracking. **Improved:** field-level old and new values.
- Chapter 2 definitions: Role-Based Access Control, Audit Trail, History Log.

## Access

| Screen | CEO | Office Manager | Sales Supervisor | Admin / Warehouse | Sales Agent |
|---|---|---|---|---|---|
| Login | ✔ | ✔ | ✔ | ✔ | ✔ (mobile) |
| User Accounts | View (all branches) | **Full, own branch** (1.2) | — | — | — |
| History Log | **Full** (receives the History Log Report) | — | — | — | — |

## Sub-processes → screens

| Ch. 3 sub-process | Screen | File |
|---|---|---|
| 1.1 Verify User Login (checks D1; saves each login to D2) | **Login** (desktop and mobile) | `login.html`, `m/login.html` |
| 1.2 Maintain User Accounts (the Office Manager enters user account details) | **User Accounts – List** + **Add/Edit user** modal | `users/list.html` |
| 1.3 Retrieve Activity Records + 1.4 Produce History Log Report | **History Log** (filter, view, print) | `users/history-log.html` |

## Build steps

### Step 1 · Login (already designed in Figma; match it exactly)

**What is displayed**
- A light page with faint hardware doodles (nails, screws, bolts, nuts, washers) and a 6px red stripe at the top.
- Above the card: "Centennial Nail and Screw Construction Corporation" (small, red) and **"Web-Based Sales and Inventory Management System"** (bold).
- A white card with:
  - The red logo lockup
  - **Log in**, then "Use the username and password from your Office Manager."
  - **Username** and **Password** fields (with a show/hide eye)
  - "Forgot password?" on the right
  - A full-width red **Log in** button
  - "On a shared computer? Log out when you're done."
- Footer: © 2026 Centennial Nail and Screw Construction Corporation.

**States**

| State | What shows |
|---|---|
| Default | The empty form |
| Filled | "Caps Lock is on" warning |
| Error | "Wrong username or password." under the password field |
| Locked | Alert: "Too many tries. Ask your Office Manager to unlock your account." |
| Loading | Spinner in the button |

**Behavior**
- Username, not email. No SSO, no sign-up.
- Forgot password opens a modal: "Ask your Office Manager to reset it."
- Successful login → `logChange('Login', …)` → **redirect to that role's dashboard**. A Sales Agent goes to `/m/home.html`.
- The demo list under the card is for review sessions only.

### Step 2 · User Accounts – List

**What is displayed**
- Title "User Accounts" with the one-line description "People who can log in, their role and branch."
- Primary button: **Add user**.
- Filters: role, status. The Office Manager sees only their branch, so the branch is fixed; the CEO's view-only list can filter by branch.
- Table columns: Full name · Username · Role · Branch · Status (Active / Inactive badge) · Last login · ⋯ (Edit, Reset password, Deactivate).

**Add / Edit user modal**
- Fields: full name, username, temporary password (with a "show" toggle), role (5 options). Branch is set to the Office Manager's own branch.
- Save writes `logChange`; edits record the old and new values.
- **Deactivate, never delete.** A confirm modal appears first.

### Step 3 · History Log

**What is displayed**
- Filters: date range, user, module, action (Login, Create, Edit, Delete, Approve, Stock change). Branch filter for management.
- Table columns: Date and time · User · Module · Action · Record (link) · Field · **Old value → New value**.
  - For example: "Oct 23, 2026 9:14 AM · Ana Cruz · Products · Edit · Concrete nail 3" · ceiling_qty · 200 → 300"
- Buttons: **Print report** (the History Log Report) and Export.
- Empty state: "No activity for these filters."

### Step 4 · Wire the background audit trail
Make sure every later module calls `logChange`. The History Log is "hidden": users don't see logging happen; it runs in the background (Chapter 3 Methods assumption).

## Acceptance

- [ ] All 5 login states; every demo user lands on the right dashboard.
- [ ] Add, edit and deactivate users; the history shows old and new values.
- [ ] History Log filters work and the print view is clean.
