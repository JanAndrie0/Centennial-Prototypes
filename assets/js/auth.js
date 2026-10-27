/* Demo login, session and role guard (foundation.md 0.6, 01 plan step 1).
   Mock only: every seeded user's password is DEMO_PASSWORD. The real system checks passwords in PHP.
   login() resolves with the user or rejects with an error whose .code is INVALID, LOCKED or NETWORK. */
(function (CNS) {
  'use strict';

  var R = CNS.ROLES;
  var SESSION_KEY = 'centennial-session';
  var DEMO_PASSWORD = 'centennial';

  // Lockout policy belongs to the backend; these values only exist to demonstrate the locked state.
  var MAX_ATTEMPTS = 5;
  var LOCK_MS = 60 * 1000;
  var failedAttempts = {}; // username -> { count, lockedUntil }

  function authError(code) {
    var err = new Error(code);
    err.code = code;
    return err;
  }

  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch (e) {
      return null;
    }
  }

  function writeSession(session) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Could not save the session.', e);
    }
  }

  function canSwitchBranch(user) {
    return user.role === R.CEO;
  }

  function current() {
    var s = readSession();
    var user = s && CNS.store.get('users', s.user_id);
    if (!user || !user.is_active) return null;
    return { user: user, branchView: canSwitchBranch(user) ? (s.branch_view || user.branch_id) : user.branch_id };
  }

  // Accounts made or reset in 1.2 (or changed in My account) carry their own password; seeded ones use the demo password
  function checkPassword(user, password) {
    return password === (user.password || DEMO_PASSWORD);
  }

  function home(user) {
    return CNS.url(user.role === R.AGENT ? 'm/home.html' : 'dashboard.html');
  }

  CNS.auth = {
    DEMO_PASSWORD: DEMO_PASSWORD,
    current: current,
    home: home,
    canSwitchBranch: canSwitchBranch,
    checkPassword: checkPassword,

    login: function (username, password) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          if (username === 'offline') return reject(authError('NETWORK'));
          if (username === 'locked') return reject(authError('LOCKED'));

          var user = CNS.store.where('users', function (u) { return u.username === username; })[0];
          // Unknown names aren't tracked, so made-up names can't fill the lockout table.
          if (!user) return reject(authError('INVALID'));
          if (!user.is_active) return reject(authError('LOCKED'));

          var record = failedAttempts[username] || { count: 0, lockedUntil: 0 };
          if (record.lockedUntil > Date.now()) return reject(authError('LOCKED'));

          if (!checkPassword(user, password)) {
            record.count += 1;
            if (record.count >= MAX_ATTEMPTS) record = { count: 0, lockedUntil: Date.now() + LOCK_MS };
            failedAttempts[username] = record;
            return reject(authError(record.lockedUntil > Date.now() ? 'LOCKED' : 'INVALID'));
          }

          delete failedAttempts[username];
          writeSession({ user_id: user.id, branch_view: user.role === R.CEO ? 'all' : user.branch_id });
          CNS.store.update('users', user.id, { last_login: new Date().toISOString() });
          CNS.history.log({ action: 'Login', module: 'User Accounts & History Log', record_type: 'users', record_id: user.id, user_id: user.id, branch_id: user.branch_id });
          resolve(user);
        }, 900);
      });
    },

    logout: function () {
      try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* already gone */ }
      location.assign(CNS.url('login.html'));
    },

    // Page guard. Returns the session, or null after redirecting:
    // no session → login; a Sales Agent on a desktop page (or anyone else on an m/ page) → their home;
    // a role the page doesn't allow → their home.
    require: function (opts) {
      opts = opts || {};
      var session = current();
      if (!session) {
        location.replace(CNS.url('login.html'));
        return null;
      }
      var role = session.user.role;
      var wrongDevice = opts.mobile ? role !== R.AGENT : role === R.AGENT;
      if (wrongDevice || (opts.roles && opts.roles.indexOf(role) < 0)) {
        location.replace(home(session.user));
        return null;
      }
      return session;
    },

    // CEO and Office Manager only: Centennial, I-KU, ECK 888 or 'all'
    setBranchView: function (branchView) {
      var s = readSession();
      if (!s) return;
      s.branch_view = branchView;
      writeSession(s);
      document.dispatchEvent(new CustomEvent('cns:branchchange', { detail: { branchView: branchView } }));
    }
  };
})(window.CNS);
