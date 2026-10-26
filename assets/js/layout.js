/* App shell (foundation.md 0.3). Each page has its own <main id="main"> and calls one of:
     CNS.layout.desktop({ active: 'products' })   → header, sidebar for the role, footer
       options: roles (who may open the page), lockBranch (roles that see their own branch as fixed text here)
     CNS.layout.mobile({ active: 'stock' })       → Sales Agent header and bottom tab bar
   Both guard the page by role first and return the session, or null after redirecting. */
(function (CNS) {
  'use strict';

  var R = CNS.ROLES;
  var DESKTOP = [R.CEO, R.OM, R.SS, R.STAFF];
  var esc = CNS.escape;

  // Sidebar per role (CLAUDE.md §3, with the Oct 23 change: the Sales Supervisor has Reports).
  var MENU = [
    { id: 'dashboard', label: 'Dashboard', href: 'dashboard.html', icon: 'squares-2x2', roles: DESKTOP },
    { id: 'users', no: '1.0', label: 'User Accounts & History Log', href: 'users/list.html', icon: 'user-group', roles: [R.CEO, R.OM] },
    { id: 'orders', no: '2.0', label: 'Sales Orders & Deliveries', href: 'orders/list.html', icon: 'clipboard-document-list', roles: DESKTOP },
    { id: 'products', no: '3.0', label: 'Products & Inventory', href: 'products/list.html', icon: 'cube', roles: DESKTOP },
    { id: 'purchasing', no: '4.0', label: 'Purchasing & Suppliers', href: 'purchasing/list.html', icon: 'shopping-cart', roles: DESKTOP },
    { id: 'customers', no: '5.0', label: 'Customer Accounts & Payments', href: 'customers/list.html', icon: 'building-storefront', roles: DESKTOP },
    { id: 'reports', no: '6.0', label: 'Reports', href: 'reports/index.html', icon: 'chart-bar', roles: DESKTOP }
  ];

  // Sales Agent bottom tabs (five at most)
  var TABS = [
    { id: 'home', label: 'Home', href: 'm/home.html', icon: 'home' },
    { id: 'new-order', label: 'New Order', href: 'm/new-order.html', icon: 'plus-circle' },
    { id: 'stock', label: 'Stock', href: 'm/stock.html', icon: 'cube' },
    { id: 'customers', label: 'Customers', href: 'm/customers.html', icon: 'building-storefront' },
    { id: 'payments', label: 'Payments', href: 'm/payments.html', icon: 'banknotes' }
  ];

  var LOGO = '<img src="' + CNS.url('assets/img/logo.jpg') + '" width="1600" height="310" alt="Centennial N&amp;S Construction Corporation">';

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  // ---- Shared pieces ----

  function confirmReset() {
    var dialog = el(
      '<dialog class="modal" aria-labelledby="reset-title" aria-describedby="reset-body">' +
        CNS.icon('arrow-path', 'modal__icon') +
        '<h2 class="modal__title" id="reset-title">Reset demo data?</h2>' +
        '<p class="modal__body" id="reset-body">Every change made in this browser is replaced with the original sample data. You stay logged in.</p>' +
        '<form method="dialog" class="modal__actions">' +
          '<button type="submit" class="btn btn--secondary" value="cancel" autofocus>Cancel</button>' +
          '<button type="submit" class="btn btn--primary" value="reset">Reset demo data</button>' +
        '</form>' +
      '</dialog>');
    var opener = document.activeElement;
    document.body.appendChild(dialog);
    dialog.addEventListener('close', function () {
      if (dialog.returnValue === 'reset') {
        CNS.store.reset();
        location.reload();
        return;
      }
      dialog.remove();
      if (opener) opener.focus();
    });
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close('cancel');
    });
    dialog.showModal();
  }

  function footer() {
    var f = el(
      '<footer class="app-footer">' +
        '<span>© 2026 Centennial Nail and Screw Construction Corporation</span>' +
        '<button type="button" class="btn-link">' + CNS.icon('arrow-path') + 'Reset demo data</button>' +
      '</footer>');
    f.querySelector('button').addEventListener('click', confirmReset);
    return f;
  }

  // ---- Alerts (header button + dropdown) ----
  // Most urgent first, same order as the dashboard banner:
  //   Office Manager: orders (2.3), purchase requests (4.2) and field payments (5.3) waiting in their own branch
  //   CEO and Office Manager: overdue customers (5.5 overdue alerts)
  //   Every desktop role: low stock (3.4)
  var STOCK_KINDS = {
    'backordered': ['info', 'information-circle', 'is backordered', 0],
    'below-floor': ['error', 'exclamation-circle', 'is below the floor', 1],
    'low': ['warning', 'exclamation-triangle', 'is low on stock', 2]
  };
  var ALERTS_SHOWN = 4;   // rows per section; "See all" opens the full list

  function alertsData(user, branchView) {
    var S = CNS.store, sections = [];
    if (user.role === R.OM) {
      var ob = user.branch_id;
      var waiting = [
        [S.where('sales_orders', function (o) { return o.status === 'For approval' && o.branch_id === ob; }).length, 'sales order', 'orders/approvals.html', 'clipboard-document-list', 'waiting'],
        [S.where('purchase_orders', function (p) { return p.status === 'For approval' && p.branch_id === ob; }).length, 'purchase request', 'purchasing/approvals.html', 'shopping-cart', 'waiting'],
        [S.where('payments', function (p) {   // same rule as the receivables "To verify" tab
          var c = !p.verified_by && !p.bounced && S.get('clients', p.client_id);
          return c && c.branch_id === ob;
        }).length, 'field payment', 'payments/receivables.html#view=verify', 'banknotes', 'to verify']
      ].filter(function (w) { return w[0]; });
      var total = waiting.reduce(function (t, w) { return t + w[0]; }, 0);
      // Always the Office Manager's own branch, whatever the branch switcher shows
      if (total) sections.push({ title: 'Waiting for your approval', count: total, rows: waiting.map(function (w) {
        return { tone: 'warning', icon: w[3], href: w[2],
          text: '<strong>' + w[0] + ' ' + w[1] + (w[0] === 1 ? '' : 's') + '</strong> ' + w[4],
          sub: S.branchName(ob) };
      }) });
    }
    if (user.role === R.CEO || user.role === R.OM) {
      var overdue = S.where('clients', function (c) { return (branchView === 'all' || c.branch_id === branchView) && S.clientOverdue(c.id) > 0; })
        .sort(function (a, b) { return S.clientOverdueDays(b.id) - S.clientOverdueDays(a.id); });
      if (overdue.length) sections.push({ title: 'Overdue customers', count: overdue.length, all: 'payments/receivables.html#view=overdue', rows: overdue.map(function (c) {
        var days = S.clientOverdueDays(c.id);
        return { tone: 'error', icon: 'exclamation-circle', href: 'customers/detail.html?id=' + encodeURIComponent(c.id),
          text: '<strong>' + esc(c.store_name) + '</strong> is overdue',
          sub: CNS.format.money(S.clientOverdue(c.id)) + ' · ' + days + (days === 1 ? ' day' : ' days') };
      }) });
    }
    var low = S.lowStock(branchView).map(function (p) { return { p: p, st: S.stockStatus(p.id, branchView) }; })
      .sort(function (a, b) { return STOCK_KINDS[a.st][3] - STOCK_KINDS[b.st][3] || a.p.name.localeCompare(b.p.name); });
    if (low.length) sections.push({ title: 'Low stock', count: low.length, all: 'products/reorder.html', rows: low.map(function (x) {
      var k = STOCK_KINDS[x.st];
      return { tone: k[0], icon: k[1], href: 'products/detail.html?id=' + encodeURIComponent(x.p.id),
        text: '<strong>' + esc(x.p.name) + '</strong> ' + k[2],
        sub: 'Available ' + CNS.format.qty(S.available(x.p.id, branchView), x.p.unit_id) };
    }) });
    return sections;
  }

  function alertsCount(user, branchView) {
    var n = alertsData(user, branchView).reduce(function (t, s) { return t + s.count; }, 0);
    return '<span class="count"' + (n ? '' : ' data-zero') + '>' + n + '</span>' +
      '<span class="sr-only">' + (n === 1 ? ' alert' : ' alerts') + '</span>';
  }

  function alertsPanel(user, branchView) {
    var sections = alertsData(user, branchView);
    return '<div class="alerts-panel__head"><h2 class="alerts-panel__title" id="alerts-title">Alerts</h2>' +
        '<span class="alerts-panel__branch">' + esc(CNS.store.branchName(branchView)) + '</span></div>' +
      (sections.length
        ? '<div class="alerts-panel__body">' + sections.map(function (s, i) {
            return '<section class="alerts-group" aria-labelledby="alerts-g' + i + '">' +
              '<div class="alerts-group__head"><h3 class="alerts-group__title" id="alerts-g' + i + '">' + esc(s.title) + ' · ' + s.count + '</h3>' +
                (s.all && s.rows.length > ALERTS_SHOWN ? '<a class="alerts-group__all" href="' + CNS.url(s.all) + '">See all<span class="sr-only"> ' + esc(s.title.toLowerCase()) + '</span></a>' : '') + '</div>' +
              '<ul class="alerts-panel__list">' + s.rows.slice(0, ALERTS_SHOWN).map(function (r) {
                return '<li><a class="alerts-item" href="' + CNS.url(r.href) + '">' +
                  '<span class="alerts-item__icon alerts-item__icon--' + r.tone + '">' + CNS.icon(r.icon) + '</span>' +
                  '<span class="alerts-item__text"><span>' + r.text + '</span><span class="alerts-item__sub">' + esc(r.sub) + '</span></span></a></li>';
              }).join('') + '</ul></section>';
          }).join('') + '</div>'
        : '<p class="alerts-panel__empty">' + CNS.icon('check-circle') + 'No alerts right now.</p>');
  }

  // locked: the page works on the user's own branch only (e.g. the Office Manager in 1.2), so show it as fixed text
  function branchControl(session, locked) {
    var user = session.user;
    if (locked || !CNS.auth.canSwitchBranch(user)) {
      return '<div class="branch">' + CNS.icon('building-office-2') +
        '<span class="branch__label">Branch:</span><span class="branch__name">' + esc(CNS.store.branchName(user.branch_id)) + '</span></div>';
    }
    var options = CNS.store.all('branches').map(function (b) { return [b.id, b.short_name]; }).concat([['all', 'All branches']]);
    return '<div class="branch">' + CNS.icon('building-office-2') +
      '<label class="branch__label" for="branch-select">Branch</label>' +
      '<select id="branch-select" class="input input--compact">' +
        options.map(function (o) {
          return '<option value="' + o[0] + '"' + (o[0] === session.branchView ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
        }).join('') +
      '</select></div>';
  }

  // ---- Desktop ----

  function desktop(opts) {
    opts = opts || {};
    var item = MENU.filter(function (m) { return m.id === opts.active; })[0];
    var session = CNS.auth.require({ roles: opts.roles || (item ? item.roles : DESKTOP) });
    if (!session) return null;

    var user = session.user;
    var main = document.getElementById('main');
    main.classList.add('app-main');
    main.setAttribute('tabindex', '-1');
    document.body.classList.add('app');

    var header = el(
      '<header class="app-header">' +
        '<button type="button" class="btn btn--secondary app-header__menu" aria-expanded="false" aria-controls="app-sidebar">' +
          CNS.icon('bars-3') + '<span>Menu</span></button>' +
        '<a class="app-header__brand" href="' + CNS.url('dashboard.html') + '">' + LOGO + '</a>' +
        '<span class="app-header__spacer"></span>' +
        branchControl(session, (opts.lockBranch || []).indexOf(user.role) >= 0) +
        '<div class="alerts-menu">' +
          '<button type="button" class="app-header__alerts" aria-expanded="false" aria-controls="alerts-panel">' + CNS.icon('bell') +
            '<span>Alerts</span><span data-alerts>' + alertsCount(user, session.branchView) + '</span></button>' +
          '<div class="alerts-panel" id="alerts-panel" role="region" aria-labelledby="alerts-title" hidden></div>' +
        '</div>' +
        '<button type="button" class="btn btn--secondary app-header__logout">' + CNS.icon('arrow-right-start-on-rectangle') + '<span>Log out</span></button>' +
      '</header>');

    var links = MENU.filter(function (m) { return m.roles.indexOf(user.role) >= 0; }).map(function (m) {
      return '<li><a class="nav-link" href="' + CNS.url(m.href) + '"' + (m.id === opts.active ? ' aria-current="page"' : '') + '>' +
        CNS.icon(m.icon) + '<span>' + esc(m.label) + '</span></a></li>';   // no module numbers in the menu (user decision, Oct 26)
    }).join('');

    var sidebar = el(
      '<nav class="app-sidebar" id="app-sidebar" aria-label="Main">' +
        '<div class="app-sidebar__user"><span class="app-sidebar__name">' + esc(user.full_name) + '</span>' +
          '<span class="app-sidebar__role">' + esc(user.role) + '</span>' +
          // Only the CEO maintains their own account (user decision, Oct 25); others ask their Office Manager
          (user.role === R.CEO ? '<a class="app-sidebar__account" href="' + CNS.url('users/account.html') + '"' +
            (opts.active === 'account' ? ' aria-current="page"' : '') + '>' + CNS.icon('user-circle') + 'My account</a>' : '') +
        '</div>' +
        '<ul class="nav-list">' + links + '</ul>' +
        '<button type="button" class="btn-link app-sidebar__logout">' + CNS.icon('arrow-right-start-on-rectangle') + 'Log out</button>' +
      '</nav>');

    var scrim = el('<div class="app-scrim" hidden></div>');
    var body = el('<div class="app-body"></div>');
    main.parentNode.insertBefore(body, main);
    body.appendChild(sidebar);
    body.appendChild(scrim);
    body.appendChild(main);
    main.appendChild(footer());
    document.body.insertBefore(header, body);
    document.body.insertBefore(el('<a class="skip-link" href="#main">Skip to main content</a>'), header);

    // Drawer (≤1024px): Menu opens it; Escape, the scrim or a wide screen closes it
    var menuBtn = header.querySelector('.app-header__menu');
    function setDrawer(open, returnFocus) {
      sidebar.classList.toggle('is-open', open);
      scrim.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
      if (open) sidebar.querySelector('a, button').focus();
      else if (returnFocus) menuBtn.focus();
    }
    menuBtn.addEventListener('click', function () { setDrawer(!sidebar.classList.contains('is-open'), false); });
    scrim.addEventListener('click', function () { setDrawer(false, true); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('is-open')) setDrawer(false, true);
    });
    window.matchMedia('(min-width: 1025px)').addEventListener('change', function (e) {
      if (e.matches) setDrawer(false, false);
    });

    Array.prototype.forEach.call(document.querySelectorAll('.app-header__logout, .app-sidebar__logout'), function (b) {
      b.addEventListener('click', CNS.auth.logout);
    });

    // Alerts dropdown: the button opens the panel; Escape, a click outside or tabbing away closes it
    var alertsBtn = header.querySelector('.app-header__alerts');
    var alertsBox = header.querySelector('.alerts-panel');
    var alertsMenu = header.querySelector('.alerts-menu');
    function setAlerts(open, returnFocus) {
      if (open) alertsBox.innerHTML = alertsPanel(user, session.branchView);   // fresh numbers every time it opens
      alertsBox.hidden = !open;
      alertsBtn.setAttribute('aria-expanded', String(open));
      if (!open && returnFocus) alertsBtn.focus();
    }
    alertsBtn.addEventListener('click', function () { setAlerts(alertsBox.hidden, false); });
    document.addEventListener('click', function (e) {
      if (!alertsBox.hidden && !alertsMenu.contains(e.target)) setAlerts(false, false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !alertsBox.hidden) setAlerts(false, true);
    });
    alertsMenu.addEventListener('focusout', function (e) {
      if (!alertsBox.hidden && e.relatedTarget && !alertsMenu.contains(e.relatedTarget)) setAlerts(false, false);
    });

    var select = header.querySelector('#branch-select');
    if (select) {
      select.addEventListener('change', function () {
        CNS.auth.setBranchView(select.value);
        session.branchView = select.value;
        header.querySelector('[data-alerts]').innerHTML = alertsCount(user, select.value);
        if (!alertsBox.hidden) alertsBox.innerHTML = alertsPanel(user, select.value);
      });
    }

    return session;
  }

  // ---- Sales Agent mobile ----

  function mobile(opts) {
    opts = opts || {};
    var session = CNS.auth.require({ mobile: true });
    if (!session) return null;

    var main = document.getElementById('main');
    main.classList.add('m-main');
    main.setAttribute('tabindex', '-1');
    document.body.classList.add('m-app');

    var header = el(
      '<header class="m-header">' +
        '<div class="m-header__brand">' + LOGO +
          '<span class="m-header__branch">' + CNS.icon('building-office-2') +
            '<span class="sr-only">Branch: </span>' + esc(CNS.store.branchName(session.user.branch_id)) + '</span></div>' +
        '<button type="button" class="btn btn--secondary">' + CNS.icon('arrow-right-start-on-rectangle') + '<span>Log out</span></button>' +
      '</header>');
    header.querySelector('button').addEventListener('click', CNS.auth.logout);

    var tabbar = el(
      '<nav class="m-tabbar" aria-label="Main">' +
        TABS.map(function (t) {
          return '<a class="m-tab" href="' + CNS.url(t.href) + '"' + (t.id === opts.active ? ' aria-current="page"' : '') + '>' +
            CNS.icon(t.icon) + '<span>' + esc(t.label) + '</span></a>';
        }).join('') +
      '</nav>');

    document.body.insertBefore(header, main);
    document.body.insertBefore(el('<a class="skip-link" href="#main">Skip to main content</a>'), header);
    document.body.appendChild(tabbar);
    main.appendChild(footer());

    return session;
  }

  // ---- Module page tabs (sibling screens of one module) ----
  var MODULE_TABS = {
    products: [
      { id: 'list', label: 'Products', href: 'products/list.html', icon: 'cube' },
      { id: 'check', label: 'Stock check', href: 'products/stock-check.html', icon: 'magnifying-glass' },
      { id: 'transfers', label: 'Transfers', href: 'products/transfers.html', icon: 'arrow-path' },
      { id: 'counts', label: 'Stock count', href: 'products/counts.html', icon: 'clipboard-document-list' },
      { id: 'reorder', label: 'Reorder list', href: 'products/reorder.html', icon: 'bell',
        count: function (session) { return CNS.store.lowStock(session.branchView).length; } }
    ],
    orders: [
      { id: 'list', label: 'Sales orders', href: 'orders/list.html', icon: 'clipboard-document-list' },
      // 2.3: the Office Manager approves; CEO and Sales Supervisor can view; staff don't see it
      { id: 'approvals', label: 'Approvals', href: 'orders/approvals.html', icon: 'check-circle', roles: [R.CEO, R.OM, R.SS],
        count: function (session) {
          var sc = CNS.auth.canSwitchBranch(session.user) ? session.branchView : session.user.branch_id;
          return CNS.store.where('sales_orders', function (o) { return o.status === 'For approval' && (sc === 'all' || o.branch_id === sc); }).length;
        } },
      { id: 'deliveries', label: 'Deliveries', href: 'deliveries/list.html', icon: 'arrow-right-start-on-rectangle' }
    ],
    purchasing: [
      { id: 'list', label: 'Purchase orders', href: 'purchasing/list.html', icon: 'shopping-cart' },
      // 4.3: the Office Manager approves purchase requests; CEO and Sales Supervisor can view
      { id: 'approvals', label: 'Approvals', href: 'purchasing/approvals.html', icon: 'check-circle', roles: [R.CEO, R.OM, R.SS],
        count: function (session) {
          var sc = CNS.auth.canSwitchBranch(session.user) ? session.branchView : session.user.branch_id;
          return CNS.store.where('purchase_orders', function (p) { return p.status === 'For approval' && (sc === 'all' || p.branch_id === sc); }).length;
        } },
      { id: 'receive', label: 'Receive delivery', href: 'purchasing/receive.html', icon: 'arrow-down-tray' },
      { id: 'suppliers', label: 'Suppliers', href: 'purchasing/suppliers.html', icon: 'building-office-2' }
    ],
    customers: [
      { id: 'list', label: 'Customers', href: 'customers/list.html', icon: 'building-storefront' },
      // 5.2 Record Customer Payment (office payments)
      { id: 'record', label: 'Record payment', href: 'payments/record.html', icon: 'banknotes' },
      // 5.5 Monitor Receivables: management sees field payments to verify; staff see due-date reminders
      { id: 'receivables', label: 'Receivables', href: 'payments/receivables.html', icon: 'bell',
        count: function (session) {
          var sc = CNS.auth.canSwitchBranch(session.user) ? session.branchView : session.user.branch_id;
          if (!CNS.payActions) return 0;
          return session.user.role === R.STAFF ? CNS.payActions.dueSoon(7, sc).length : CNS.payActions.toVerify(sc).length;
        } }
    ]
  };

  // Renders into <nav id="module-tabs">. Call again after a branch change to refresh counts.
  function moduleTabs(module, active, session) {
    var nav = document.getElementById('module-tabs');
    if (!nav) return;
    nav.setAttribute('aria-label', 'Sections');
    nav.innerHTML = '<ul class="tabs">' + MODULE_TABS[module].filter(function (t) {
      return !t.roles || t.roles.indexOf(session.user.role) >= 0;
    }).map(function (t) {
      return '<li><a href="' + CNS.url(t.href) + '"' + (t.id === active ? ' aria-current="page"' : '') + '>' + CNS.icon(t.icon) +
        esc(t.label) + (t.count ? ' (' + t.count(session) + ')' : '') + '</a></li>';
    }).join('') + '</ul>';
  }

  CNS.layout = { desktop: desktop, mobile: mobile, moduleTabs: moduleTabs, MENU: MENU, TABS: TABS };
})(window.CNS);
