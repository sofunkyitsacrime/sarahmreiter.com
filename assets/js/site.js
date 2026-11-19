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

// Analytics helper: GoatCounter custom event (no cookies). Safe if the script is blocked.
function track(name) {
  try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: name, event: true }); } catch (e) {}
}

// Contact: preselect route from ?route=, submit to Formspree, confirm on the page
(function () {
  var form = document.getElementById('inquiry');
  if (!form) return;
  var status = document.getElementById('inquiry-status');
  var button = form.querySelector('button[type="submit"]');
  var route = new URLSearchParams(location.search).get('route');
  if (route && form.route && form.route.querySelector('option[value="' + route + '"]')) form.route.value = route;

  function show(msg, ok) {
    status.hidden = false;
    status.textContent = msg;
    status.className = 'form-status ' + (ok ? 'ok' : 'err');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var f = form.elements;
    f._subject.value = 'Inquiry (' + f.route.options[f.route.selectedIndex].text + '): ' + (f.org.value || f.name.value);
    button.disabled = true;
    button.textContent = 'Sending…';
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('status ' + r.status);
        track('inquiry-sent-' + f.route.value);
        form.reset();
        show('Thank you. Your message has been sent, and you will hear back by email.', true);
        button.textContent = 'Sent';
      })
      .catch(function () {
        show('Your message could not be sent. Please try again in a moment, or email hello@sarahmreiter.com.', false);
        button.disabled = false;
        button.textContent = 'Send';
      });
  });
})();

// Track which contact route visitors choose, and article reads
(function () {
  document.querySelectorAll('a[href*="route="]').forEach(function (a) {
    a.addEventListener('click', function () {
      var m = a.getAttribute('href').match(/route=([a-z]+)/);
      if (m) track('cta-route-' + m[1]);
    });
  });
  if (document.querySelector('.article') && location.pathname.indexOf('/insights/') > -1) {
    var sent = false;
    window.addEventListener('scroll', function () {
      if (sent) return;
      var end = document.querySelector('.article').getBoundingClientRect().bottom;
      if (end < window.innerHeight * 1.2) { sent = true; track('article-read-' + location.pathname.split('/').pop().replace('.html', '')); }
    }, { passive: true });
  }
})();
