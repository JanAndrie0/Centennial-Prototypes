/* Formatting and small UI helpers (foundation.md 0.6, format.js):
   ₱ money, quantities always with their unit, negative available as "−19 pcs", dates like "Oct 23, 2026". */
(function (CNS) {
  'use strict';

  var UNITS = {
    pcs: ['pc', 'pcs'],
    box: ['box', 'boxes'],
    pack: ['pack', 'packs'],
    roll: ['roll', 'rolls'],
    dozen: ['dozen', 'dozens'],
    gallon: ['gallon', 'gallons'],
    can: ['can', 'cans'],
    pair: ['pair', 'pairs']
  };

  var moneyFmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
  var numberFmt = new Intl.NumberFormat('en-PH');
  var MINUS = '−';

  // 'YYYY-MM-DD' is read as a local date (not UTC) so it never shifts a day.
  function toDate(value) {
    if (value instanceof Date) return value;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(value);
  }

  function unit(unitId, n) {
    var names = UNITS[unitId] || [unitId, unitId];
    return Math.abs(n) === 1 ? names[0] : names[1];
  }

  CNS.format = {
    toDate: toDate,
    unit: unit,

    money: function (n) {
      return moneyFmt.format(n || 0);
    },

    number: function (n) {
      return (n < 0 ? MINUS : '') + numberFmt.format(Math.abs(n || 0));
    },

    qty: function (n, unitId) {
      return CNS.format.number(n) + ' ' + unit(unitId, n);
    },

    // A number with a free-text unit such as a supplier's "case" or "mother box": 1 case, 5 cases, 2 mother boxes
    count: function (n, word) {
      word = word || '';
      if (Math.abs(n) === 1 || !word || /s$/i.test(word)) return CNS.format.number(n) + ' ' + word;
      return CNS.format.number(n) + ' ' + word + (/(x|ch|sh)$/i.test(word) ? 'es' : 's');
    },

    date: function (value) {
      return toDate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    time: function (value) {
      return toDate(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    },

    dateTime: function (value) {
      return CNS.format.date(value) + ' ' + CNS.format.time(value);
    }
  };

  // Stock status → badge (03 plan: always icon plus label; Backordered is info, never an error)
  var STOCK_BADGES = {
    'ok': ['success', 'check-circle', 'OK'],
    'low': ['warning', 'exclamation-triangle', 'Low'],
    'below-floor': ['error', 'exclamation-circle', 'Below floor'],
    'backordered': ['info', 'information-circle', 'Backordered'],
    'over-ceiling': ['warning', 'arrow-up-circle', 'Over ceiling'],
    'unset': ['neutral', 'lock-closed', 'Levels not set']
  };

  CNS.ui = {
    badge: function (tone, icon, label) {
      return '<span class="badge badge--' + tone + '">' + CNS.icon(icon) + '<span>' + CNS.escape(label) + '</span></span>';
    },

    // Empty table cell: a quiet dash on screen, "None" for screen readers
    none: function () {
      return '<span class="cell-sub"><span aria-hidden="true">—</span><span class="sr-only">None</span></span>';
    },

    stockBadge: function (status) {
      var b = STOCK_BADGES[status] || STOCK_BADGES.ok;
      return CNS.ui.badge(b[0], b[1], b[2]);
    },

    // Horizontal meter: a value on a 0..max track, with tick marks labelled under it.
    // o: { value, max, tone (success|warning|error|info), say, aria, marks: [[label, value, shown?]], label?, noLabels? }
    // The fill takes the tone; the sentence above it says the same thing in words (color is never the only signal).
    meter: function (o) {
      var esc = CNS.escape;
      var max = Math.max(o.max, o.value, 1);
      function pct(n) { return Math.max(0, Math.min(100, n / max * 100)); }
      // Marks below the track; a label that would touch the previous one drops to a second row
      var last = -100, ticks = '', labels = '';
      (o.marks || []).forEach(function (m) {
        var at = pct(m[1]);
        var low = at - last < 24;
        last = low ? last : at;
        var edge = at < 8 ? ' is-start' : at > 75 ? ' is-end' : ''; // keep long captions inside the card
        ticks += '<span class="level-meter__tick" style="--at:' + at + '%"></span>';
        labels += '<span class="level-meter__label' + edge + (low ? ' is-row2' : '') + '" style="--at:' + at + '%">' + esc(m[0]) + ' <b>' + esc(m[2] || CNS.format.number(m[1])) + '</b></span>';
      });
      return '<div class="level-meter level-meter--' + (o.tone || 'success') + '">' +
        (o.label ? '<p class="level-meter__title">' + esc(o.label) + '</p>' : '') +
        (o.say ? '<p class="level-meter__say">' + esc(o.say) + '</p>' : '') +   // optional when the words sit next to it already
        '<div class="level-meter__track" role="img" aria-label="' + esc(o.aria) + '">' +
          '<span class="level-meter__fill" style="--fill:' + pct(o.value) + '%"></span>' + ticks +
        '</div>' +
        (o.noLabels ? '' : '<div class="level-meter__labels" aria-hidden="true">' + labels + '</div>') +
      '</div>';
    },

    // Available stock against the product's floor, reorder point and ceiling (3.0 stock rules).
    // o: { product, available, hand, status, label?, noLabels? }. Returns '' when levels aren't set.
    // noLabels hides the Floor / Reorder point / Ceiling captions (stacked meters label only the last one).
    levelMeter: function (o) {
      var p = o.product, n = CNS.format.number;
      if (!p.ceiling_qty) return '';
      function q(v) { return CNS.format.qty(v, p.unit_id); }
      var avail = o.available;
      return CNS.ui.meter({
        value: avail, max: p.ceiling_qty, tone: (STOCK_BADGES[o.status] || STOCK_BADGES.ok)[0], label: o.label, noLabels: o.noLabels,
        say: {
          'backordered': 'Backordered by ' + q(-avail),
          'below-floor': q(p.floor_qty - avail) + ' below the floor',
          'low': avail === p.critical_qty ? 'At the reorder point' : q(p.critical_qty - avail) + ' below the reorder point',
          'over-ceiling': 'On hand is ' + q(o.hand - p.ceiling_qty) + ' over the ceiling',
          'ok': q(avail - p.critical_qty) + ' above the reorder point'
        }[o.status] || '',
        aria: 'Available ' + q(avail) + '. Floor ' + n(p.floor_qty) + ', reorder point ' + n(p.critical_qty) + ', ceiling ' + n(p.ceiling_qty) + '.',
        marks: [['Floor', p.floor_qty], ['Reorder point', p.critical_qty], ['Ceiling', p.ceiling_qty]]
      });
    },

    // Sales order status → badge (02 plan statuses; words, never color alone; Backordered is info)
    orderBadge: function (status) {
      var b = {
        'Draft': ['neutral', 'pencil-square'], 'For approval': ['info', 'clipboard-document-list'],
        'Approved': ['success', 'check'], 'Rejected': ['error', 'x-mark'], 'For delivery': ['info', 'cube'],
        'Shipped': ['info', 'arrow-right-start-on-rectangle'], 'Completed': ['success', 'check-circle'],
        'Backordered': ['info', 'information-circle']
      }[status] || ['neutral', 'information-circle'];
      return CNS.ui.badge(b[0], b[1], status);
    },

    // Delivery status → badge (2.6: Scheduled → Shipped → Completed)
    deliveryBadge: function (status) {
      var b = {
        'Scheduled': ['neutral', 'clipboard-document-list'], 'Shipped': ['info', 'arrow-right-start-on-rectangle'],
        'Completed': ['success', 'check-circle']
      }[status] || ['neutral', 'information-circle'];
      return CNS.ui.badge(b[0], b[1], status);
    },

    // Status stepper: where a record is in its flow. steps: status words in order; current: the status it is in now.
    // o.stopped: the current step ended the flow (Rejected), shown with an x. Done steps get a check, later steps stay grey.
    steps: function (steps, current, o) {
      o = o || {};
      var at = steps.indexOf(current), last = steps.length - 1;
      return '<ol class="steps" aria-label="' + CNS.escape(o.label || 'Progress') + '">' + steps.map(function (s, i) {
        var state = i < at || (i === at && i === last && !o.stopped) ? 'done' : i === at ? (o.stopped ? 'stopped' : 'current') : 'todo';
        var mark = { done: CNS.icon('check'), stopped: CNS.icon('x-mark'), current: '<span class="steps__pulse"></span>', todo: '' }[state];
        var say = { done: 'done', stopped: 'stopped here', current: 'now', todo: 'not yet' }[state];
        return '<li class="steps__item is-' + state + '"' + (state === 'current' || state === 'stopped' ? ' aria-current="step"' : '') + '>' +
          '<span class="steps__dot" aria-hidden="true">' + mark + '</span>' +
          '<span class="steps__label">' + CNS.escape(s) + '<span class="sr-only">, ' + say + '</span></span></li>';
      }).join('') + '</ol>';
    },

    // In-page tabs (UX rule: tabs on detail pages). Markup: .tabs[role=tablist] > button[role=tab][aria-controls],
    // panels .tab-panel[role=tabpanel]. Arrow keys move between tabs; the open tab is kept in the URL hash.
    tabs: function (tablist) {
      var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
      // Hash like #view=movements: the "=" means it can never match an element id, so the browser won't jump or focus
      function hashOf(t) { return '#view=' + t.getAttribute('aria-controls').replace(/^panel-/, ''); }
      function select(tab, focus) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
          document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
        });
        if (focus) tab.focus();
        history.replaceState(null, '', location.pathname + location.search + hashOf(tab));
      }
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { select(t, false); });
        t.addEventListener('keydown', function (e) {
          var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
          if (next === undefined) return;
          e.preventDefault();
          select(tabs[(next + tabs.length) % tabs.length], true);
        });
      });
      var fromHash = tabs.filter(function (t) { return hashOf(t) === location.hash; })[0];
      select(fromHash || tabs[0], false);
    },

    // A toast for the next page (e.g. "Product saved." after Save sends you to the detail page)
    flash: function (message) {
      try { sessionStorage.setItem('centennial-flash', message); } catch (e) { /* storage blocked: skip the toast */ }
    },

    // Short confirmation after an action ("User saved."), announced politely
    toast: function (message) {
      var region = document.querySelector('.toast-region');
      if (!region) {
        region = document.createElement('div');
        region.className = 'toast-region';
        region.setAttribute('role', 'status');
        document.body.appendChild(region);
      }
      var t = document.createElement('div');
      t.className = 'toast';
      t.innerHTML = CNS.icon('check-circle') + '<span>' + CNS.escape(message) + '</span>';
      region.appendChild(t);
      // Fade out, then remove (the CSS animation is skipped under reduced motion, so remove right after)
      setTimeout(function () {
        t.classList.add('is-leaving');
        setTimeout(function () { t.remove(); }, 180);
      }, 4000);
    },

    // Confirm a destructive action in a modal (UX rule 9). Resolves true when confirmed.
    // opts: { title, body, confirm: 'Deactivate', icon: 'exclamation-triangle', alertOnly: true → just an OK button }
    confirm: function (opts) {
      return new Promise(function (resolve) {
        var dialog = document.createElement('dialog');
        dialog.className = 'modal';
        dialog.setAttribute('aria-labelledby', 'confirm-title');
        dialog.setAttribute('aria-describedby', 'confirm-body');
        dialog.innerHTML =
          CNS.icon(opts.icon || 'exclamation-triangle', 'modal__icon') +
          '<h2 class="modal__title" id="confirm-title">' + CNS.escape(opts.title) + '</h2>' +
          '<p class="modal__body" id="confirm-body">' + CNS.escape(opts.body) + '</p>' +
          '<form method="dialog" class="modal__actions">' +
            (opts.alertOnly ? '' : '<button type="submit" class="btn btn--secondary" value="cancel" autofocus>Cancel</button>') +
            '<button type="submit" class="btn btn--primary" value="ok"' + (opts.alertOnly ? ' autofocus' : '') + '>' + CNS.escape(opts.confirm) + '</button>' +
          '</form>';
        var opener = document.activeElement;
        document.body.appendChild(dialog);
        dialog.addEventListener('close', function () {
          dialog.remove();
          if (opener && document.contains(opener)) opener.focus();
          resolve(dialog.returnValue === 'ok');
        });
        dialog.addEventListener('click', function (e) {
          if (e.target === dialog) dialog.close('cancel');
        });
        dialog.showModal();
      });
    }
  };

  // Show a toast left by CNS.ui.flash() on the previous page. Scripts load at the end of <body>, so the DOM is ready.
  try {
    var flashed = sessionStorage.getItem('centennial-flash');
    if (flashed) {
      sessionStorage.removeItem('centennial-flash');
      setTimeout(function () { CNS.ui.toast(flashed); }, 0);
    }
  } catch (e) { /* storage blocked: no flash */ }
})(window.CNS);
