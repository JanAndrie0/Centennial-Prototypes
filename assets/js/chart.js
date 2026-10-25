/* Simple bar charts for Reports and (later) the dashboards. Plain HTML and CSS, no library (architecture rules).
   Colors come from the tokens: grey bars, the highlighted bar (today, or the item asked about) red.

   CNS.chart.columns(el, rows, opts)  → vertical bars over time      rows: [{ label, value, hi, title }]
   CNS.chart.rows(el, rows, opts)     → horizontal bars, ranked       rows: [{ label, value, hi, display }]
   opts: { title, format: fn(value) → text, label: 'Sales per day' (screen-reader summary), empty: 'No sales' }

   The chart is decorative for screen readers when the same numbers are in a table next to it,
   so it gets a short role="img" summary instead of reading every bar. */
(function (CNS) {
  'use strict';

  var esc = CNS.escape;

  function niceMax(v) {
    if (v <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(v)));
    var n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }

  function short(n) {
    var a = Math.abs(n);
    if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (a >= 1e3) return (n / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'k';
    return String(Math.round(n * 10) / 10);
  }

  function summary(rows, opts) {
    var f = opts.format || String;
    var top = rows.slice().sort(function (a, b) { return b.value - a.value; })[0];
    return (opts.label || opts.title || 'Chart') + '. ' + rows.length + ' bars' + (top ? '; highest ' + top.label + ' at ' + f(top.value) : '') + '.';
  }

  function head(opts) {
    return opts.title ? '<h2 class="chart__title">' + esc(opts.title) + '</h2>' : '';
  }

  CNS.chart = {
    columns: function (el, rows, opts) {
      opts = opts || {};
      var f = opts.format || String;
      if (!rows.length || rows.every(function (r) { return !r.value; })) {
        el.innerHTML = head(opts) + '<p class="chart__empty">' + esc(opts.empty || 'Nothing to chart for these filters.') + '</p>';
        return;
      }
      var max = niceMax(Math.max.apply(null, rows.map(function (r) { return r.value; })));
      // Label every nth bar so the labels never overlap (about 16 labels fit)
      var every = Math.max(1, Math.ceil(rows.length / 16));
      el.innerHTML = head(opts) +
        '<div class="chart chart--cols" role="img" aria-label="' + esc(summary(rows, opts)) + '">' +
          '<div class="chart__axis" aria-hidden="true">' + [1, 0.75, 0.5, 0.25, 0].map(function (k) { return '<span>' + esc(short(max * k)) + '</span>'; }).join('') + '</div>' +
          '<div class="chart__plot" aria-hidden="true">' + rows.map(function (r) {
            return '<div class="chart__col' + (r.hi ? ' is-hi' : '') + '" title="' + esc((r.title || r.label) + ': ' + f(r.value)) + '">' +
              '<div class="chart__bar" style="height:' + Math.max(0, r.value / max * 100).toFixed(2) + '%"></div></div>';
          }).join('') + '</div>' +
          '<div class="chart__labels" aria-hidden="true">' + rows.map(function (r, i) {
            var cls = (r.hi ? 'is-hi ' : '') + (i === 0 || i === rows.length - 1 ? 'is-edge' : '');
            return '<span' + (cls ? ' class="' + cls.trim() + '"' : '') + '>' + (i % every === 0 || r.hi || i === rows.length - 1 ? esc(r.label) : '') + '</span>';
          }).join('') + '</div>' +
        '</div>';
    },

    rows: function (el, rows, opts) {
      opts = opts || {};
      var f = opts.format || String;
      rows = rows.filter(function (r) { return r.value > 0; });
      if (!rows.length) {
        el.innerHTML = head(opts) + '<p class="chart__empty">' + esc(opts.empty || 'Nothing to chart for these filters.') + '</p>';
        return;
      }
      var max = Math.max.apply(null, rows.map(function (r) { return r.value; }));
      el.innerHTML = head(opts) +
        '<div class="chart chart--rows" role="img" aria-label="' + esc(summary(rows, opts)) + '">' + rows.map(function (r) {
          return '<div class="chart__hrow' + (r.hi ? ' is-hi' : '') + '" aria-hidden="true"><span class="chart__hlabel" title="' + esc(r.label) + '">' + esc(r.label) + '</span>' +
            '<span class="chart__htrack"><span class="chart__hfill" style="display:block;width:' + (r.value / max * 100).toFixed(2) + '%"></span></span>' +
            '<span class="chart__hvalue">' + esc(r.display || f(r.value)) + '</span></div>';
        }).join('') + '</div>';
    }
  };
})(window.CNS);
