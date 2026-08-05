/**
 * Filtering for the Gutenberg pull request table.
 *
 * The table is rendered in full by Jekyll, so the page works without this
 * script. It only adds the ability to narrow the list down.
 *
 * This lives in its own file rather than inline in the page: the compress
 * layout strips newlines from the HTML, which turns any `//` comment in an
 * inline script into a comment that swallows the rest of the file.
 */
(function() {
  var root = document.querySelector('[data-prs-filters]');
  if (!root) return;

  var rows = [].slice.call(document.querySelectorAll('.prs__row'));
  var countEl = document.querySelector('[data-prs-count]');
  var emptyEl = document.querySelector('[data-prs-empty]');
  var active = { state: '', type: '', package: '' };

  /* Controls are hidden in the markup so they never appear without JS. */
  root.hidden = false;

  function matches(row) {
    for (var key in active) {
      if (!Object.prototype.hasOwnProperty.call(active, key)) continue;

      var want = active[key];
      if (!want) continue;

      var have = row.getAttribute('data-' + key) || '';

      if (key === 'state') {
        if (have !== want) return false;
      } else if (have.indexOf(want + '|') === -1) {
        /* Labels are stored pipe terminated so "Editor" cannot match
           "Edit Site" by prefix. */
        return false;
      }
    }
    return true;
  }

  function apply() {
    var shown = 0;

    rows.forEach(function(row) {
      var ok = matches(row);
      row.hidden = !ok;
      if (ok) shown++;
    });

    if (countEl) {
      countEl.textContent =
        shown === rows.length
          ? 'Showing all ' + rows.length + ' pull requests'
          : 'Showing ' + shown + ' of ' + rows.length + ' pull requests';
    }
    if (emptyEl) emptyEl.hidden = shown !== 0;
  }

  root.addEventListener('click', function(event) {
    var button = event.target.closest('[data-filter]');
    if (!button) return;

    var group = button.getAttribute('data-filter');
    active[group] = button.getAttribute('data-value');

    var siblings = root.querySelectorAll('[data-filter="' + group + '"]');
    [].forEach.call(siblings, function(sibling) {
      if (sibling === button) {
        sibling.classList.add('is-active');
      } else {
        sibling.classList.remove('is-active');
      }
    });

    apply();
  });

  apply();
})();
