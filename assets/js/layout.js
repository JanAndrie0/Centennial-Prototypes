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

  function alertsCount(branchView) {
    var n = CNS.store.lowStock(branchView).length;
    return '<span class="count"' + (n ? '' : ' data-zero') + '>' + n + '</span>' +
      '<span class="sr-only"> products low on stock</span>';
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
        '<a class="app-header__alerts" href="' + CNS.url('products/reorder.html') + '">' + CNS.icon('bell') +
          '<span>Alerts</span><span data-alerts>' + alertsCount(session.branchView) + '</span></a>' +
        '<button type="button" class="btn btn--secondary app-header__logout">' + CNS.icon('arrow-right-start-on-rectangle') + '<span>Log out</span></button>' +
      '</header>');

    var links = MENU.filter(function (m) { return m.roles.indexOf(user.role) >= 0; }).map(function (m) {
      return '<li><a class="nav-link" href="' + CNS.url(m.href) + '"' + (m.id === opts.active ? ' aria-current="page"' : '') + '>' +
        CNS.icon(m.icon) + '<span>' + (m.no ? '<span class="nav-link__no">' + m.no + '</span>' : '') + esc(m.label) + '</span></a></li>';
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

    var select = header.querySelector('#branch-select');
    if (select) {
      select.addEventListener('change', function () {
        CNS.auth.setBranchView(select.value);
        header.querySelector('[data-alerts]').innerHTML = alertsCount(select.value);
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
