// Mobile nav
(function () {
  var btn = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
})();

// Insights library: filter by kind + topic, and text search
(function () {
  var list = document.getElementById('insight-list');
  if (!list) return;
  var entries = Array.prototype.slice.call(list.querySelectorAll('.entry'));
  var search = document.getElementById('insight-search');
  var empty = document.getElementById('insight-empty');
  var state = { kind: 'all', topic: 'all', q: '' };

  function apply() {
    var shown = 0;
    entries.forEach(function (el) {
      var ok = (state.kind === 'all' || el.dataset.kind === state.kind) &&
        (state.topic === 'all' || (el.dataset.topics || '').split(' ').indexOf(state.topic) > -1) &&
        (!state.q || el.textContent.toLowerCase().indexOf(state.q) > -1);
      el.hidden = !ok;
      if (ok) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  }

  document.querySelectorAll('.filters').forEach(function (group) {
    var key = group.dataset.filter;
    group.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      group.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      state[key] = b.dataset.value;
      apply();
    });
  });
  if (search) search.addEventListener('input', function () { state.q = search.value.trim().toLowerCase(); apply(); });

  // Deep link: insights.html?kind=publication
  var k = new URLSearchParams(location.search).get('kind');
  if (k) {
    var b = document.querySelector('.filters[data-filter="kind"] button[data-value="' + k + '"]');
    if (b) b.click();
  }
})();

// Contact: preselect route from ?route=, and build a mailto (no backend yet)
(function () {
  var form = document.getElementById('inquiry');
  if (!form) return;
  var route = new URLSearchParams(location.search).get('route');
  if (route && form.route) form.route.value = route;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var subject = '[' + f.route.options[f.route.selectedIndex].text + '] ' + (f.org.value || f.name.value);
    var body = 'Name: ' + f.name.value + '\nOrganization: ' + f.org.value + '\nEmail: ' + f.email.value +
      '\nTimeline: ' + f.timeline.value + '\n\n' + f.message.value;
    location.href = 'mailto:' + form.dataset.to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
})();
