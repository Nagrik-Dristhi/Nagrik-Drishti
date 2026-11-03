// Nagarik Drishti — Track Reports (DEMO). User text is rendered with textContent only.
(function () {
  var C = window.NDCatalog, S = window.NDStore;
  var $ = function (id) { return document.getElementById(id); };
  function lang() { return window.NDLang.get(); }
  function t(k) { return window.NDLang.t(k); }
  function el(tag, text, cls) { var e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }
  function fmt(iso) { try { return new Date(iso).toLocaleString(lang() === 'ne' ? 'ne-NP' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso; } }
  function fmtDate(d) { try { return new Date(d + 'T00:00:00').toLocaleDateString(lang() === 'ne' ? 'ne-NP' : 'en-GB', { dateStyle: 'medium' }); } catch (e) { return d; } }

  var currentRef = null;

  function badge(status) { return el('span', t('status.' + status), 'badge badge-' + status); }
  function row(dl, label, value) { var d = document.createElement('div'); d.appendChild(el('dt', label)); d.appendChild(el('dd', value)); dl.appendChild(d); }

  function evLabel(e) {
    var s = t('ev.' + e.type);
    return e.dept ? s + ' — ' + C.deptName(e.dept) : s;
  }

  function render() {
    var out = $('track-result'); out.innerHTML = '';
    var msg = $('track-message'); msg.hidden = true;
    if (!currentRef) return;
    var r = S.get(currentRef);
    if (!r) { msg.hidden = false; return; }

    var card = el('article', null, 'card stack');
    var head = el('div', null, 'track-head');
    var left = el('div');
    left.appendChild(el('h2', S.text(r.title)));
    left.appendChild(el('div', S.demo ? r.ref + ' · ' + t('f.demo') : r.ref, 'track-ref'));
    head.appendChild(left); head.appendChild(badge(r.status)); card.appendChild(head);

    var dl = el('dl', null, 'summary-list');
    row(dl, t('f.category'), C.categoryName(r.cat) + ' — ' + C.subName(r.cat, r.sub));
    row(dl, t('f.location'), S.locationText(r));
    row(dl, t('f.observed'), fmtDate(r.observed));
    row(dl, t('f.submitted'), fmt(r.created));
    row(dl, t('f.dept'), r.dept ? C.deptName(r.dept) : t('f.none'));
    var last = S.latestEvent(r);
    row(dl, t('trk.latest'), evLabel(last) + ' · ' + fmt(last.at));
    card.appendChild(dl);

    var desc = S.text(r.desc);
    if (desc) { var p = el('p', desc); p.style.whiteSpace = 'pre-wrap'; card.appendChild(p); }
    if (r.image) {
      var fig = el('div'); fig.appendChild(el('div', t('trk.evidence'), 'hint'));
      var img = document.createElement('img'); img.src = r.image; img.alt = t('trk.evidence'); img.className = 'track-photo'; fig.appendChild(img); card.appendChild(fig);
    }
    card.appendChild(el('p', t('trk.approx'), 'hint'));

    var tl = el('div'); tl.appendChild(el('h3', t('trk.timeline'), null)); tl.firstChild.style.cssText = 'font-size:1rem;margin:0';
    var ol = el('ol', null, 'timeline');
    r.events.forEach(function (e) {
      var li = document.createElement('li'); li.style.setProperty('--dot', C.statusColors[e.type] || '#64748b');
      li.appendChild(el('div', evLabel(e), 'ev-title')); li.appendChild(el('div', fmt(e.at), 'ev-meta')); if (e.note) li.appendChild(el('div', e.note, 'ev-meta')); ol.appendChild(li);
    });
    tl.appendChild(ol); card.appendChild(tl);

    if (r.mine && S.demo) {
      var box = el('div');
      if (S.canAdvance(r)) {
        var b = el('button', t('trk.advance'), 'btn btn-outline'); b.type = 'button';
        b.addEventListener('click', function () { S.advance(r.ref); render(); });
        box.appendChild(b); box.appendChild(el('p', t('trk.advance.note'), 'hint'));
      } else box.appendChild(el('p', t('trk.done'), 'hint'));
      card.appendChild(box);
    }
    card.appendChild(el('div', t('trk.notice'), 'notice'));
    out.appendChild(card);
  }

  function listInto(id, reports) {
    var ul = $(id); ul.innerHTML = '';
    reports.forEach(function (r) {
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = 'track.html?ref=' + encodeURIComponent(r.ref);
      var l = el('span', r.ref + ' — ' + S.text(r.title)); a.appendChild(l); a.appendChild(badge(r.status));
      a.addEventListener('click', function (ev) { ev.preventDefault(); show(r.ref); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      li.appendChild(a); ul.appendChild(li);
    });
  }
  function lists() {
    var mine = S.mine(); listInto('mine-list', mine); $('mine-empty').hidden = mine.length > 0;
    var recent = S.all().filter(function (r) { return !r.mine; }).sort(function (a, b) { return a.created < b.created ? 1 : -1; }).slice(0, 6);
    listInto('recent-list', recent);
  }
  function show(ref) {
    currentRef = String(ref || '').trim().toUpperCase(); $('track-ref').value = currentRef;
    try { history.replaceState(null, '', '?ref=' + encodeURIComponent(currentRef)); } catch (e) { /* file:// */ }
    render(); lists();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!$('track-form')) return;
    $('track-form').addEventListener('submit', function (ev) { ev.preventDefault(); if ($('track-ref').value.trim()) show($('track-ref').value); });
    document.addEventListener('nd:langchange', function () { render(); lists(); });
    document.addEventListener('nd:datachange', function () { render(); lists(); });
    var q = new URLSearchParams(location.search).get('ref');
    if (q) show(q); else lists();
  });
})();
