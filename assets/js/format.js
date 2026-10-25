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

    stockBadge: function (status) {
      var b = STOCK_BADGES[status] || STOCK_BADGES.ok;
      return CNS.ui.badge(b[0], b[1], b[2]);
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
