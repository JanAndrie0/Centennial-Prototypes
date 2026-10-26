/* Simple bar charts for Reports and (later) the dashboards. Plain HTML and CSS, no library (architecture rules).
   Colors come from the tokens: grey bars, the highlighted bar (today, or the item asked about) red.

   CNS.chart.columns(el, rows, opts)  → vertical bars over time      rows: [{ label, value, hi, title }]
   CNS.chart.rows(el, rows, opts)     → horizontal bars, ranked       rows: [{ label, value, hi, display }]
   CNS.chart.line(el, opts)           → smooth lines, this period vs the one before (dashboard)
   CNS.chart.donut(el, rows, opts)    → shares of a whole, top few + "Other" (dashboard)
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

  // Monotone cubic through the points: smooth like the reference, but never dips below zero between days
  function smooth(pts) {
    var n = pts.length, i;
    if (n < 2) return n ? 'M' + pts[0][0] + ',' + pts[0][1] : '';
    var dx = [], m = [], t = [];
    for (i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]; }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
      var a = t[i] / m[i], b = t[i + 1] / m[i], h = a * a + b * b;
      if (h > 9) { var k = 3 / Math.sqrt(h); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    var d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
    for (i = 0; i < n - 1; i++) {
      var h3 = dx[i] / 3;
      d += ' C' + (pts[i][0] + h3).toFixed(1) + ',' + (pts[i][1] + t[i] * h3).toFixed(1) + ' ' +
        (pts[i + 1][0] - h3).toFixed(1) + ',' + (pts[i + 1][1] - t[i + 1] * h3).toFixed(1) + ' ' + pts[i + 1][0].toFixed(1) + ',' + pts[i + 1][1].toFixed(1);
    }
    return d;
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
            var forced = function (j) { return rows[j] && (rows[j].hi || j === rows.length - 1); };
            var crowded = false;   // a regular label gives way to a forced one (today, the last bar) right after it
            for (var j = i + 1; j < i + every; j++) if (forced(j)) crowded = true;
            var shown = forced(i) || (i % every === 0 && !crowded);
            // A shown label may spill into its empty neighbours instead of being clipped ("Oct 1" for Oct 13)
            var cls = (r.hi ? 'is-hi ' : '') + (i === 0 || i === rows.length - 1 ? 'is-edge ' : '') + (shown && every > 1 ? 'is-shown' : '');
            return '<span' + (cls.trim() ? ' class="' + cls.trim() + '"' : '') + '>' + (shown ? esc(r.label) : '') + '</span>';
          }).join('') + '</div>' +
        '</div>';
    },

    // Smooth line chart, one or two series over the same days (e.g. last 7 days vs the 7 days before).
    // opts: { title, labels: ['Tue', …], titles: ['Tue, Oct 20', …], hi: index to highlight (today),
    //         series: [{ label, values, total, muted: true for the comparison line, tipLabel }], format, label, empty, note }
    // Redrawn at the card's real width (ResizeObserver) so strokes stay 2px; hover shows a crosshair and a tooltip.
    line: function (el, opts) {
      var f = opts.format || String, series = opts.series, n = opts.labels.length;
      var all = [].concat.apply([], series.map(function (s) { return s.values; }));
      if (!all.some(function (v) { return v; })) {
        el.innerHTML = head(opts) + '<p class="chart__empty">' + esc(opts.empty || 'Nothing to chart for these filters.') + '</p>';
        return;
      }
      var max = niceMax(Math.max.apply(null, all));
      var main = series[0];
      // Legend: always present for 2 series (identity is never color alone: solid vs dashed, plus the words)
      var legend = '<ul class="chart-legend">' + series.map(function (s) {
        return '<li><span class="chart-legend__key chart-legend__key--' + (s.muted ? 'muted' : 'main') + '" aria-hidden="true"></span>' +
          '<span class="chart-legend__label">' + esc(s.label) + '</span>' + (s.total != null ? ' <strong>' + esc(f(s.total)) + '</strong>' : '') + '</li>';
      }).join('') + (opts.note ? '<li class="chart-legend__note">' + opts.note + '</li>' : '') + '</ul>';
      // The same numbers as a table for screen readers (the plot itself is decorative)
      // (wrapped in a div: a table ignores the 1px sr-only width and could widen the page)
      var table = '<div class="sr-only"><table><caption>' + esc(opts.label || opts.title || '') + '</caption><thead><tr><th scope="col">Day</th>' +
        series.map(function (s) { return '<th scope="col">' + esc(s.label) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        opts.labels.map(function (l, i) {
          return '<tr><th scope="row">' + esc((opts.titles || opts.labels)[i]) + '</th>' + series.map(function (s) { return '<td>' + esc(f(s.values[i])) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
      el.innerHTML = head(opts) + legend + '<div class="chart-line" aria-hidden="true"><svg></svg><div class="chart-tip" hidden></div></div>' + table;

      var box = el.querySelector('.chart-line'), svg = box.querySelector('svg'), tip = box.querySelector('.chart-tip');
      var H = 220, L = 44, R = 20, T = 14, B = 30;
      var geo;
      function draw() {
        var W = box.clientWidth;
        if (!W) return;
        var pw = W - L - R, ph = H - T - B;
        var x = function (i) { return L + (n === 1 ? pw / 2 : i * pw / (n - 1)); };
        var y = function (v) { return T + ph - Math.max(0, v) / max * ph; };
        geo = { x: x, y: y, top: T, bottom: T + ph, left: L, right: L + pw };
        var out = '';
        [0, 0.25, 0.5, 0.75, 1].forEach(function (k) {   // recessive grid + axis labels
          var gy = y(max * k);
          out += '<line class="chart-line__grid" x1="' + L + '" x2="' + (L + pw) + '" y1="' + gy + '" y2="' + gy + '"/>' +
            '<text class="chart-line__axis" x="' + (L - 8) + '" y="' + (gy + 4) + '" text-anchor="end">' + esc(short(max * k)) + '</text>';
        });
        opts.labels.forEach(function (l, i) {
          out += '<text class="chart-line__day' + (i === opts.hi ? ' is-hi' : '') + '" x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(l) + '</text>';
        });
        // Comparison lines first so the main line sits on top
        series.slice().reverse().forEach(function (s) {
          var pts = s.values.map(function (v, i) { return [x(i), y(v)]; });
          out += '<path class="chart-line__path' + (s.muted ? ' is-muted' : '') + '" d="' + smooth(pts) + '"/>';
        });
        if (opts.hi != null) {   // today's point: red marker with a surface ring
          out += '<circle class="chart-line__dot" cx="' + x(opts.hi) + '" cy="' + y(main.values[opts.hi]) + '" r="5"/>';
        }
        out += '<line class="chart-line__cross" x1="0" x2="0" y1="' + T + '" y2="' + (T + ph) + '" visibility="hidden"/>' +
          '<circle class="chart-line__hover" r="5" visibility="hidden"/>';
        svg.setAttribute('width', W);
        svg.setAttribute('height', H);
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        svg.innerHTML = out;
      }
      function hide() {
        tip.hidden = true;
        svg.querySelector('.chart-line__cross').setAttribute('visibility', 'hidden');
        svg.querySelector('.chart-line__hover').setAttribute('visibility', 'hidden');
      }
      box.addEventListener('mousemove', function (e) {
        if (!geo) return;
        var r = box.getBoundingClientRect(), mx = e.clientX - r.left;
        if (mx < geo.left - 12 || mx > geo.right + 12) { hide(); return; }
        var i = n === 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round((mx - geo.left) / (geo.right - geo.left) * (n - 1))));
        var cx = geo.x(i);
        var cross = svg.querySelector('.chart-line__cross'), dot = svg.querySelector('.chart-line__hover');
        cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('visibility', 'visible');
        dot.setAttribute('cx', cx); dot.setAttribute('cy', geo.y(main.values[i])); dot.setAttribute('visibility', 'visible');
        tip.innerHTML = '<p class="chart-tip__title">' + esc((opts.titles || opts.labels)[i]) + '</p>' + series.map(function (s) {
          return '<p class="chart-tip__row"><span class="chart-legend__key chart-legend__key--' + (s.muted ? 'muted' : 'main') + '"></span>' +
            esc(s.tipLabel || s.label) + '<strong>' + esc(f(s.values[i])) + '</strong></p>';
        }).join('');
        tip.hidden = false;
        // Beside the crosshair, flipped to the left near the right edge
        var tw = tip.offsetWidth, left = cx + 12 + tw > r.width ? cx - 12 - tw : cx + 12;
        tip.style.transform = 'translate(' + Math.round(left) + 'px, ' + Math.round(geo.top) + 'px)';
      });
      box.addEventListener('mouseleave', hide);
      draw();
      if (window.ResizeObserver) new ResizeObserver(draw).observe(box);
    },

    // Donut for shares of a whole (sales by category). rows: [{ label, value }], largest first; the last may be "Other".
    // opts: { title, format, centerLabel: 'Total, 30 days', label, empty, link: { href, text } }
    // Colors come from the categorical chart tokens in fixed order; "Other" is always the neutral grey.
    // The legend shows every name, amount and share, so nothing depends on hovering or on color alone.
    donut: function (el, rows, opts) {
      opts = opts || {};
      var f = opts.format || String;
      rows = rows.filter(function (r) { return r.value > 0; });
      if (!rows.length) {
        el.innerHTML = head(opts) + '<p class="chart__empty">' + esc(opts.empty || 'Nothing to chart for these filters.') + '</p>';
        return;
      }
      var total = rows.reduce(function (t, r) { return t + r.value; }, 0);
      var R = 48, C = 2 * Math.PI * R, GAP = 1.6, at = 0;
      function color(r, i) { return r.other ? 'var(--chart-other)' : 'var(--chart-' + (i + 1) + ')'; }
      function pct(v) { return Math.round(v / total * 100) + '%'; }
      var segs = rows.map(function (r, i) {
        var len = r.value / total * C, dash = Math.max(0.01, len - (rows.length > 1 ? GAP : 0));
        var s = '<circle class="donut__seg" data-i="' + i + '" r="' + R + '" cx="60" cy="60" stroke="' + color(r, i) + '"' +
          ' stroke-dasharray="' + dash.toFixed(2) + ' ' + (C - dash).toFixed(2) + '" stroke-dashoffset="' + (-at).toFixed(2) + '"/>';
        at += len;
        return s;
      }).join('');
      el.innerHTML = head(opts) +
        '<div class="donut" role="img" aria-label="' + esc(summary(rows, opts)) + '">' +
          '<div class="donut__ring" aria-hidden="true"><svg viewBox="0 0 120 120"><g transform="rotate(-90 60 60)">' + segs + '</g></svg>' +
            '<div class="donut__center"><strong data-v>' + esc(f(total)) + '</strong><span data-l>' + esc(opts.centerLabel || 'Total') + '</span></div></div>' +
        '</div>' +
        '<ul class="donut__legend">' + rows.map(function (r, i) {
          return '<li data-i="' + i + '"><span class="donut__key" style="background:' + color(r, i) + '" aria-hidden="true"></span>' +
            '<span class="donut__name">' + esc(r.label) + '</span><span class="donut__val">' + esc(f(r.value)) + '</span><span class="donut__pct">' + pct(r.value) + '</span></li>';
        }).join('') + '</ul>' +
        (opts.link ? '<a class="chart-link" href="' + esc(opts.link.href) + '">' + esc(opts.link.text) + '</a>' : '');

      // Hovering a slice or its legend row shows that category in the centre
      var v = el.querySelector('[data-v]'), l = el.querySelector('[data-l]');
      function show(i) {
        Array.prototype.forEach.call(el.querySelectorAll('[data-i]'), function (n) { n.classList.toggle('is-dim', i != null && n.getAttribute('data-i') !== String(i)); });
        v.textContent = i == null ? f(total) : f(rows[i].value);
        l.textContent = i == null ? (opts.centerLabel || 'Total') : rows[i].label + ' · ' + pct(rows[i].value);
      }
      Array.prototype.forEach.call(el.querySelectorAll('[data-i]'), function (n) {
        n.addEventListener('mouseenter', function () { show(+n.getAttribute('data-i')); });
        n.addEventListener('mouseleave', function () { show(null); });
      });
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
