/* Draft autosave for every form (foundation.md 0.6; Problem D3: the old software lost 6 days of receipts).
   Saves shortly after typing stops and when focus leaves the form, restores the draft on load,
   and drives the visible indicator: "Saving…" then "Saved 2:41 PM".

   Usage:  var draft = CNS.autosave.attach(form, { key: 'order-new', status: indicatorEl });
           draft.clear();   // after the form is sent, so the draft doesn't come back */
(function (CNS) {
  'use strict';

  var PREFIX = 'centennial-draft:';
  var DELAY_MS = 1200;

  function fields(form) {
    return Array.prototype.filter.call(form.elements, function (el) {
      // Never store passwords or files in a draft
      return el.name && el.type !== 'password' && el.type !== 'file' && el.type !== 'submit' && el.type !== 'button';
    });
  }

  CNS.autosave = {
    attach: function (form, opts) {
      var key = PREFIX + opts.key;
      var statusEl = opts.status;
      var timer = null;
      var pending = false;

      function setStatus(state, text) {
        if (!statusEl) return;
        statusEl.className = 'autosave';
        statusEl.dataset.state = state;
        statusEl.innerHTML = state === 'idle' ? '' :
          (state === 'saved' ? CNS.icon('check') : CNS.icon('arrow-path')) + '<span>' + CNS.escape(text) + '</span>';
      }

      function save() {
        clearTimeout(timer);
        pending = false;
        var data = {};
        fields(form).forEach(function (el) {
          if (el.type === 'radio' && !el.checked) return;
          data[el.name] = el.type === 'checkbox' ? el.checked : el.value;
        });
        var savedAt = new Date();
        try {
          localStorage.setItem(key, JSON.stringify({ savedAt: savedAt.toISOString(), data: data }));
          setStatus('saved', 'Saved ' + CNS.format.time(savedAt));
        } catch (e) {
          setStatus('error', 'Not saved: storage is full');
        }
      }

      // Restore an earlier draft
      try {
        var draft = JSON.parse(localStorage.getItem(key));
        if (draft && draft.data) {
          fields(form).forEach(function (el) {
            if (!(el.name in draft.data)) return;
            var value = draft.data[el.name];
            if (el.type === 'checkbox') el.checked = !!value;
            else if (el.type === 'radio') el.checked = el.value === value;
            else el.value = value;
          });
          setStatus('saved', 'Draft restored · Saved ' + CNS.format.time(draft.savedAt));
        }
      } catch (e) { /* no usable draft */ }

      form.addEventListener('input', function () {
        pending = true;
        setStatus('saving', 'Saving…');
        clearTimeout(timer);
        timer = setTimeout(save, DELAY_MS);
      });

      form.addEventListener('focusout', function (event) {
        if (pending && !form.contains(event.relatedTarget)) save();
      });

      return {
        save: save,
        clear: function () {
          clearTimeout(timer);
          pending = false;
          try { localStorage.removeItem(key); } catch (e) { /* nothing stored */ }
          setStatus('idle', '');
        }
      };
    }
  };
})(window.CNS);
