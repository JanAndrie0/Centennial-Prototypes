/* Background audit trail (Chapter 3 constraint; 01 plan). Call it on every create, edit, delete,
   approval, stock change and login. Users never see it happen; the History Log screen reads it. */
(function (CNS) {
  'use strict';

  function text(value) {
    return value == null ? null : String(value);
  }

  CNS.history = {
    // entry: { action, module, record_type, record_id, field, old_value, new_value, [user_id], [branch_id] }
    log: function (entry) {
      var session = CNS.auth && CNS.auth.current();
      var user = session ? session.user : null;
      return CNS.store.insert('history_logs', {
        datetime: new Date().toISOString(),
        user_id: entry.user_id || (user && user.id) || null,
        branch_id: entry.branch_id || (user && user.branch_id) || null,
        action: entry.action,
        module: entry.module,
        record_type: entry.record_type,
        record_id: entry.record_id,
        field: entry.field || null,
        old_value: text(entry.old_value),
        new_value: text(entry.new_value)
      });
    },

    // foundation.md 0.6 signature. Create when there was no old value, Delete when there's no new one.
    logChange: function (module, recordType, recordId, field, oldValue, newValue) {
      return CNS.history.log({
        action: oldValue == null ? 'Create' : newValue == null ? 'Delete' : 'Edit',
        module: module,
        record_type: recordType,
        record_id: recordId,
        field: field,
        old_value: oldValue,
        new_value: newValue
      });
    }
  };
})(window.CNS);
