/* 5.0 Customer Accounts, part 2: installment plans and customer payments in one place, each logged.
   5.1 installment plan → 5.2 record payment (office or field, with proof photo) → 5.3 verify (Office Manager)
   → 5.4 balance → 5.5 receivables (aging, overdue alerts, due-date reminders).

   Decision (Oct 25, to confirm with the team): office payments count as soon as they are recorded (the cash or
   cheque is already in the office, so verified_by = the person who received it). Field payments are "For verification"
   until the Office Manager of the customer's branch verifies them. Only counted payments reduce the balance
   (store.clientBalance) and fill installment rows (installment_schedules.amount_paid). */
(function (CNS) {
  'use strict';

  var S = CNS.store;
  var MODULE = 'Customer Accounts & Payments';
  var BILLED = ['Approved', 'For delivery', 'Shipped', 'Completed'];
  var FREQUENCIES = { 'Weekly': 7, 'Every 15 days': 15, 'Monthly': 0 };   // Monthly adds a calendar month

  function sum(rows, fn) { return rows.reduce(function (t, r) { return t + fn(r); }, 0); }
  function round2(n) { return Math.round(n * 100) / 100; }

  function counted(p) { return !!p.verified_by && !p.bounced; }
  function pending(p) { return !p.verified_by && !p.bounced; }

  function planFor(orderId) {
    return S.where('installment_plans', function (pl) { return pl.order_id === orderId; })[0] || null;
  }

  function schedules(planId) {
    return S.where('installment_schedules', function (s) { return s.plan_id === planId; })
      .sort(function (a, b) { return a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0; });
  }

  function paymentsOn(orderId, fn) {
    return S.where('payments', function (p) { return p.order_id === orderId && fn(p); });
  }

  // Remaining on an order, counted payments only (what the balance uses)
  function orderRemaining(orderId) {
    return round2(S.orderTotal(orderId) - sum(paymentsOn(orderId, counted), function (p) { return p.amount; }));
  }

  // Field payments still waiting for the Office Manager on one order or installment row
  function pendingOn(orderId, scheduleId) {
    return sum(S.where('payments', function (p) {
      return pending(p) && (scheduleId ? p.schedule_id === scheduleId : p.order_id === orderId && !p.schedule_id);
    }), function (p) { return p.amount; });
  }

  function scheduleStatus(s, today) {
    var rem = s.amount_due - s.amount_paid;
    if (rem <= 0) return 'Paid';
    if (s.due_date < (today || S.today())) return 'Overdue';
    if (s.amount_paid > 0) return 'Partially paid';
    return 'Due';
  }

  function daysBetween(from, to) {
    return Math.round((CNS.format.toDate(to) - CNS.format.toDate(from)) / 86400000);
  }

  function addDays(iso, n) {
    var d = CNS.format.toDate(iso);
    d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function addMonths(iso, n) {
    var d = CNS.format.toDate(iso);
    var day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    var last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // When a payment counts, it fills its installment row (and spills into the next rows of the same plan if larger)
  function applyToSchedule(p, session) {
    if (!p.schedule_id) return;
    var first = S.get('installment_schedules', p.schedule_id);
    if (!first) return;
    var rows = schedules(first.plan_id).filter(function (s) { return s.due_date >= first.due_date; });
    var left = p.amount;
    rows.forEach(function (s) {
      if (left <= 0) return;
      var take = Math.min(left, s.amount_due - s.amount_paid);
      if (take <= 0) return;
      var old = S.update('installment_schedules', s.id, { amount_paid: round2(s.amount_paid + take) });
      CNS.history.log({ action: 'Edit', module: MODULE, record_type: 'installment_schedules', record_id: s.id, field: 'amount_paid',
        old_value: CNS.format.money(old.amount_paid), new_value: CNS.format.money(s.amount_paid + take), user_id: session.user.id });
      left = round2(left - take);
    });
  }

  function receiptNo(p) {
    return p.receipt_no || 'PR-' + String(p.id).replace(/\D/g, '').padStart(4, '0');
  }

  function nextReceiptNo() {
    var max = 0;
    S.all('payments').forEach(function (p) {
      var m = /(\d+)$/.exec(receiptNo(p));
      if (m) max = Math.max(max, Number(m[1]));
    });
    return 'PR-' + String(max + 1).padStart(4, '0');
  }

  CNS.payActions = {
    MODULE: MODULE,
    FREQUENCIES: Object.keys(FREQUENCIES),
    counted: counted,
    pending: pending,
    planFor: planFor,
    schedules: schedules,
    scheduleStatus: scheduleStatus,
    orderRemaining: orderRemaining,
    receiptNo: receiptNo,
    daysBetween: daysBetween,
    addDays: addDays,

    // What a customer can pay (5.2): installment rows of orders with a plan, whole orders without one.
    // remaining = not yet counted; waiting = field payments still to verify (shown so nobody records them twice).
    openItems: function (clientId) {
      var today = S.today();
      var items = [];
      S.where('sales_orders', function (o) { return o.client_id === clientId && BILLED.indexOf(o.status) >= 0; })
        .sort(function (a, b) { return a.order_date < b.order_date ? -1 : 1; })
        .forEach(function (o) {
          var plan = planFor(o.id);
          if (plan) {
            var rows = schedules(plan.id);
            rows.forEach(function (s, i) {
              var rem = round2(s.amount_due - s.amount_paid);
              if (rem <= 0) return;
              items.push({
                key: 's:' + s.id, order_id: o.id, schedule_id: s.id, order_no: o.order_no,
                label: o.order_no + ' · ' + (plan.down_payment && i === 0 ? 'Down payment' : 'Payment ' + (plan.down_payment ? i : i + 1) + ' of ' + plan.no_of_payments),
                due_date: s.due_date, remaining: rem, waiting: pendingOn(o.id, s.id), overdue: s.due_date < today
              });
            });
          } else {
            var rem = orderRemaining(o.id);
            if (rem <= 0) return;
            items.push({
              key: 'o:' + o.id, order_id: o.id, schedule_id: null, order_no: o.order_no,
              label: o.order_no + ' · Whole order', due_date: null, remaining: rem, waiting: pendingOn(o.id, null), overdue: false
            });
          }
        });
      return items;
    },

    // What remains after a payment of `amount` on the item, and on the whole account (counted payments only)
    // p: { client_id, order_id, schedule_id, amount, method, reference_no, date, proof_photo, channel }
    record: function (p, session) {
      var office = p.channel === 'Office';
      var row = S.insert('payments', {
        receipt_no: nextReceiptNo(), order_id: p.order_id, client_id: p.client_id, schedule_id: p.schedule_id || null,
        amount: round2(p.amount), method: p.method, reference_no: p.reference_no || '', date: p.date,
        proof_photo: p.proof_photo || null, received_by: session.user.id, channel: p.channel,
        verified_by: office ? session.user.id : null, bounced: false, recorded_at: new Date().toISOString()
      });
      var o = S.get('sales_orders', p.order_id);
      CNS.history.log({ action: 'Create', module: MODULE, record_type: 'payments', record_id: row.id, field: null, old_value: null,
        new_value: receiptNo(row) + ' · ' + CNS.format.money(row.amount) + ' ' + row.method + ' · ' + (o ? o.order_no : '') + ' · ' + row.channel,
        user_id: session.user.id });
      if (office) applyToSchedule(row, session);
      return row;
    },

    // 5.3 Update Customer Balance: the Office Manager verifies a field payment
    verify: function (p, session) {
      S.update('payments', p.id, { verified_by: session.user.id, verified_at: new Date().toISOString() });
      CNS.history.log({ action: 'Approve', module: MODULE, record_type: 'payments', record_id: p.id, field: 'verified_by',
        old_value: null, new_value: session.user.full_name, user_id: session.user.id });
      applyToSchedule(S.get('payments', p.id), session);
      return S.get('payments', p.id);
    },

    // The money never arrived or the cheque bounced: the payment never counts
    reject: function (p, reason, session) {
      var old = S.update('payments', p.id, { bounced: true, reject_reason: reason });
      CNS.history.log({ action: 'Reject', module: MODULE, record_type: 'payments', record_id: p.id, field: 'status',
        old_value: old.verified_by ? 'Verified' : 'For verification', new_value: 'Rejected: ' + reason, user_id: session.user.id });
      // A counted payment that bounces takes its amount back off the installment rows, newest first
      if (old.verified_by && p.schedule_id) {
        var first = S.get('installment_schedules', p.schedule_id);
        var left = p.amount;
        schedules(first.plan_id).filter(function (s) { return s.due_date >= first.due_date; }).reverse().forEach(function (s) {
          if (left <= 0 || s.amount_paid <= 0) return;
          var back = Math.min(left, s.amount_paid);
          S.update('installment_schedules', s.id, { amount_paid: round2(s.amount_paid - back) });
          left = round2(left - back);
        });
      }
      return S.get('payments', p.id);
    },

    statusBadge: function (p) {
      if (p.bounced) return CNS.ui.badge('error', 'x-mark', !p.reject_reason || p.reject_reason === 'Cheque bounced' ? 'Bounced' : 'Rejected');
      if (p.verified_by) return CNS.ui.badge('success', 'check-circle', 'Verified');
      return CNS.ui.badge('warning', 'exclamation-triangle', 'For verification');
    },

    scheduleBadge: function (status) {
      var b = {
        'Paid': ['success', 'check-circle'], 'Overdue': ['error', 'exclamation-circle'],
        'Partially paid': ['info', 'information-circle'], 'Due': ['neutral', 'clipboard-document-list']
      }[status];
      return CNS.ui.badge(b[0], b[1], status);
    },

    // 5.1: preview rows for a plan. amount is split evenly; the last row takes the centavo rounding.
    previewSchedule: function (amount, down, n, frequency, firstDue) {
      var rows = [];
      if (down > 0) rows.push({ due_date: S.today(), amount_due: round2(down), down: true });
      var rest = round2(amount - (down || 0));
      var each = Math.floor((rest / n) * 100) / 100;
      for (var i = 0; i < n; i++) {
        var due = FREQUENCIES[frequency] ? addDays(firstDue, FREQUENCIES[frequency] * i) : addMonths(firstDue, i);
        rows.push({ due_date: due, amount_due: i === n - 1 ? round2(rest - each * (n - 1)) : each });
      }
      return rows;
    },

    // Orders that can get a plan: billed, money still left, no plan yet. The plan covers what is left.
    plannable: function (clientId) {
      return S.where('sales_orders', function (o) {
        return o.client_id === clientId && BILLED.indexOf(o.status) >= 0 && !planFor(o.id) && orderRemaining(o.id) > 0;
      });
    },

    // rows: [{ due_date, amount_due }] (the edited preview)
    createPlan: function (orderId, total, down, frequency, rows, session) {
      var o = S.get('sales_orders', orderId);
      var plan = S.insert('installment_plans', {
        order_id: orderId, total: round2(total), down_payment: round2(down || 0), no_of_payments: rows.length - (down > 0 ? 1 : 0),
        frequency: frequency, start_date: rows[0].due_date, created_by: session.user.id
      });
      rows.forEach(function (r) {
        S.insert('installment_schedules', { plan_id: plan.id, due_date: r.due_date, amount_due: round2(r.amount_due), amount_paid: 0 });
      });
      CNS.history.log({ action: 'Create', module: MODULE, record_type: 'installment_plans', record_id: plan.id, field: null, old_value: null,
        new_value: o.order_no + ' · ' + CNS.format.money(total) + ' · ' + plan.no_of_payments + ' payments, ' + frequency.toLowerCase(),
        user_id: session.user.id });
      return plan;
    },

    // 5.5 Monitor Receivables. One row per customer: Current · 1–30 · 31–60 · 61–90 · 90+ · Total.
    // Overdue installment rows age from their due date; everything else in the balance is Current
    // (orders without a plan have no due date in the ERD).
    aging: function (clientId) {
      var today = S.today();
      var buckets = { current: 0, d30: 0, d60: 0, d90: 0, d90p: 0 };
      var orders = S.where('sales_orders', function (o) { return o.client_id === clientId; }).map(function (o) { return o.id; });
      var plans = S.where('installment_plans', function (pl) { return orders.indexOf(pl.order_id) >= 0; }).map(function (pl) { return pl.id; });
      var overdue = 0;
      S.where('installment_schedules', function (s) { return plans.indexOf(s.plan_id) >= 0 && s.due_date < today && s.amount_paid < s.amount_due; })
        .forEach(function (s) {
          var rem = s.amount_due - s.amount_paid;
          var days = daysBetween(s.due_date, today);
          buckets[days <= 30 ? 'd30' : days <= 60 ? 'd60' : days <= 90 ? 'd90' : 'd90p'] += rem;
          overdue += rem;
        });
      var balance = S.clientBalance(clientId);
      buckets.current = Math.max(0, round2(balance - overdue));
      buckets.total = round2(buckets.current + overdue);
      return buckets;
    },

    // Installment rows due from today to `days` ahead (due-date reminders for staff)
    dueSoon: function (days, branchId) {
      var today = S.today(), until = addDays(today, days);
      return S.all('installment_schedules').filter(function (s) {
        return s.due_date >= today && s.due_date <= until && s.amount_paid < s.amount_due;
      }).map(function (s) {
        var plan = S.get('installment_plans', s.plan_id);
        var o = plan && S.get('sales_orders', plan.order_id);
        return o ? { schedule: s, plan: plan, order: o, client: S.get('clients', o.client_id) } : null;
      }).filter(function (x) {
        return x && x.client && (!branchId || branchId === 'all' || x.client.branch_id === branchId);
      }).sort(function (a, b) { return a.schedule.due_date < b.schedule.due_date ? -1 : 1; });
    },

    // Overdue installment rows (overdue alerts for the Office Manager and management)
    overdueRows: function (branchId) {
      var today = S.today();
      return S.all('installment_schedules').filter(function (s) {
        return s.due_date < today && s.amount_paid < s.amount_due;
      }).map(function (s) {
        var plan = S.get('installment_plans', s.plan_id);
        var o = plan && S.get('sales_orders', plan.order_id);
        return o ? { schedule: s, plan: plan, order: o, client: S.get('clients', o.client_id), days: daysBetween(s.due_date, today) } : null;
      }).filter(function (x) {
        return x && x.client && (!branchId || branchId === 'all' || x.client.branch_id === branchId);
      }).sort(function (a, b) { return b.days - a.days; });
    },

    // Field payments waiting for the Office Manager
    toVerify: function (branchId) {
      return S.where('payments', function (p) {
        if (!pending(p)) return false;
        var c = S.get('clients', p.client_id);
        return c && (!branchId || branchId === 'all' || c.branch_id === branchId);
      }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    },

    // Photo → small JPEG data URL (keeps localStorage small). Calls back with the data URL.
    readPhoto: function (file, done) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var scale = Math.min(1, 900 / Math.max(img.width, img.height));
          var cv = document.createElement('canvas');
          cv.width = Math.round(img.width * scale);
          cv.height = Math.round(img.height * scale);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          done(cv.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = function () { done(null); };
        img.src = reader.result;
      };
      reader.onerror = function () { done(null); };
      reader.readAsDataURL(file);
    }
  };
})(window.CNS);
