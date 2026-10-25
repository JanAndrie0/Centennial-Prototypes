/* Shared namespace for every prototype page. Load this first; the other assets/js files extend CNS.
   Plain scripts (no modules) so pages also work when opened straight from the folder. */
(function () {
  'use strict';

  var script = document.currentScript;
  var src = script ? script.getAttribute('src') : '';

  var CNS = window.CNS = {
    // Path from the current page to the project root: '' for root pages, '../' for pages in folders.
    root: src.replace(/assets\/js\/core\.js.*$/, ''),

    // The five roles that log in (CLAUDE.md §2). Use these constants, never retyped strings.
    ROLES: {
      CEO: 'CEO',
      OM: 'Office Manager',
      SS: 'Sales Supervisor',
      STAFF: 'Administrative / Warehouse Staff',
      AGENT: 'Sales Agent'
    }
  };

  CNS.url = function (path) {
    return CNS.root + path;
  };

  CNS.escape = function (value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
})();
