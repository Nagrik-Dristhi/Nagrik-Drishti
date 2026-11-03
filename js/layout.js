// Nagarik Drishti — shared layout (header/footer) + English/Nepali switch.
// Vanilla JS, no build step. Text lives in js/translations.js.
(function () {
  var STORAGE_KEY = 'nd-lang';
  var DEFAULT_LANG = 'en';
  var LANGS = ['en', 'ne'];

  var NAV = [
    { href: 'index.html', key: 'nav.home', page: 'home' },
    { href: 'report.html', key: 'nav.report', page: 'report' },
    { href: 'map.html', key: 'nav.map', page: 'map' },
    { href: 'statistics.html', key: 'nav.stats', page: 'stats' },
    { href: 'track.html', key: 'nav.track', page: 'track' },
    { href: 'about.html', key: 'nav.about', page: 'about' }
  ];

  var EYE = '<img src="assets/brand/mark.png" class="brand-mark" alt="" width="54" height="26" />';

  function storedLang() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return LANGS.indexOf(v) !== -1 ? v : null;
    } catch (e) { return null; }
  }
  function saveLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage blocked: fine */ }
  }
  function initialLang() {
    var fromUrl = new URLSearchParams(location.search).get('lang');
    if (LANGS.indexOf(fromUrl) !== -1) return fromUrl;
    return storedLang() || DEFAULT_LANG;
  }

  function buildHeader(page) {
    var links = NAV.map(function (n) {
      var cur = n.page === page ? ' aria-current="page"' : '';
      return '<li><a href="' + n.href + '"' + cur + ' data-i18n="' + n.key + '"></a></li>';
    });
    var mobileLinks = NAV.map(function (n) {
      var cur = n.page === page ? ' aria-current="page"' : '';
      return '<li><a href="' + n.href + '"' + cur + ' data-i18n="' + n.key + '"></a></li>';
    });
    return '' +
      '<a href="#main-content" class="skip-link" data-i18n="skip"></a>' +
      '<div class="demo-banner" role="note"><span class="demo-tag" data-i18n="f.demo"></span><span data-i18n="demo.banner"></span></div>' +
      '<header class="site-header">' +
        '<nav class="container nav" data-i18n-aria-label="nav.primary">' +
          '<a href="index.html" class="brand">' + EYE + '<span data-i18n="brand"></span></a>' +
          '<ul class="nav-links">' + links.join('') + '</ul>' +
          '<div class="nav-right">' +
            '<div class="lang-switch" role="group" data-i18n-aria-label="lang.label">' +
              '<button type="button" data-set-lang="en" lang="en" aria-pressed="false">EN</button>' +
              '<button type="button" data-set-lang="ne" lang="ne" aria-pressed="false">नेपाली</button>' +
            '</div>' +
            '<button type="button" class="theme-toggle" data-theme-toggle>' +
              '<svg data-icon-moon width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>' +
              '<svg data-icon-sun width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="display:none"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
            '</button>' +
            '<div class="nav-actions"><a href="login.html" class="btn btn-primary" data-i18n="nav.signin"></a></div>' +
            '<button type="button" class="nav-toggle" data-nav-toggle aria-expanded="false" aria-controls="mobile-menu" data-i18n-aria-label="nav.toggle">' +
              '<svg data-icon-open width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>' +
              '<svg data-icon-close width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="display:none"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
            '</button>' +
          '</div>' +
        '</nav>' +
        '<div class="mobile-menu" id="mobile-menu" data-mobile-menu>' +
          '<ul class="container">' + mobileLinks.join('') +
            '<li style="padding:.4rem 1.25rem"><a href="login.html" class="btn btn-primary btn-block" data-i18n="nav.signin"></a></li>' +
          '</ul>' +
        '</div>' +
      '</header>';
  }

  function buildFooter() {
    return '<footer class="site-footer"><div class="container footer-grid">' +
      '<div class="footer-about"><p data-i18n="footer.tagline"></p><p data-i18n="footer.emergency"></p></div>' +
      '<nav class="footer-links" data-i18n-aria-label="footer.links">' +
        '<a href="how-it-works.html" data-i18n="nav.how"></a>' +
        '<a href="safety-privacy.html" data-i18n="nav.safety"></a>' +
        '<a href="contact.html" data-i18n="nav.contact"></a>' +
      '</nav>' +
      '<div id="demo-tools" class="demo-tools"><strong data-i18n="demo.tools.h"></strong>' +
        '<p data-i18n="demo.tools.p"></p>' +
        '<div class="demo-tools-buttons">' +
          '<button type="button" class="btn btn-outline" data-demo-clear data-i18n="demo.clearMine"></button>' +
          '<button type="button" class="btn btn-outline" data-demo-restore data-i18n="demo.restore"></button>' +
        '</div></div>' +
      '</div></footer>';
  }

  function updateThemeButton() {
    var btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    var dark = window.NDTheme && window.NDTheme.get() === 'dark';
    var label = window.NDLang.t(dark ? 'theme.toLight' : 'theme.toDark');
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.querySelector('[data-icon-moon]').style.display = dark ? 'none' : 'block';
    btn.querySelector('[data-icon-sun]').style.display = dark ? 'block' : 'none';
  }

  function applyLang(lang) {
    var dict = window.ND_TEXT[lang] || window.ND_TEXT[DEFAULT_LANG];
    var fallback = window.ND_TEXT[DEFAULT_LANG];
    var live = (window.ND_CONFIG && window.ND_CONFIG.API_URL && window.ND_LIVE_TEXT && window.ND_LIVE_TEXT[lang]) || {};
    function t(key) { return live[key] !== undefined ? live[key] : (dict[key] !== undefined ? dict[key] : fallback[key]); }

    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-html'));
      if (v !== undefined) el.innerHTML = v; // dictionary is our own trusted text
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-aria-label'));
      if (v !== undefined) el.setAttribute('aria-label', v);
    });

    var page = document.body.getAttribute('data-page');
    var title = t('title.' + page);
    if (title) document.title = title;

    document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-set-lang') === lang));
    });

    updateThemeButton();
    document.dispatchEvent(new CustomEvent('nd:langchange', { detail: { lang: lang } }));
  }

  function wireMenu() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');
    var iconOpen = document.querySelector('[data-icon-open]');
    var iconClose = document.querySelector('[data-icon-close]');
    if (!toggle || !menu) return;
    function setOpen(open) {
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      iconOpen.style.display = open ? 'none' : 'block';
      iconClose.style.display = open ? 'block' : 'none';
    }
    toggle.addEventListener('click', function () { setOpen(!menu.classList.contains('open')); });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var page = document.body.getAttribute('data-page');
    var headerSlot = document.getElementById('site-header');
    var footerSlot = document.getElementById('site-footer');
    if (headerSlot) headerSlot.innerHTML = buildHeader(page);
    if (footerSlot) footerSlot.innerHTML = buildFooter();

    wireMenu();

    document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lang = btn.getAttribute('data-set-lang');
        saveLang(lang);
        applyLang(lang);
      });
    });

    var clearBtn = document.querySelector('[data-demo-clear]');
    var restoreBtn = document.querySelector('[data-demo-restore]');
    if (clearBtn && window.NDStore) clearBtn.addEventListener('click', function () {
      if (window.confirm(window.NDLang.t('demo.confirmClear'))) { window.NDStore.clearMine(); location.reload(); }
    });
    if (restoreBtn && window.NDStore) restoreBtn.addEventListener('click', function () {
      if (window.confirm(window.NDLang.t('demo.confirmRestore'))) { window.NDStore.reset(); location.reload(); }
    });

    var themeBtn = document.querySelector('[data-theme-toggle]');
    if (themeBtn) themeBtn.addEventListener('click', function () { window.NDTheme.toggle(); });
    document.addEventListener('nd:themechange', updateThemeButton);

    applyLang(initialLang());
    renderNotice();
    document.addEventListener('nd:datachange', renderNotice);
    document.addEventListener('nd:langchange', renderNotice);
    wireSecret();
  });

  // Site-wide notice: admin announcement, or a connection warning (live mode only).
  function renderNotice() {
    var S = window.NDStore, slot = document.getElementById('nd-notice');
    if (!S || S.demo) return;
    if (!slot) {
      slot = document.createElement('div'); slot.id = 'nd-notice'; slot.setAttribute('role', 'status');
      var hdr = document.querySelector('.site-header'); if (hdr && hdr.parentNode) hdr.parentNode.insertBefore(slot, hdr.nextSibling); else return;
    }
    var a = S.config().announcement, lang = window.NDLang.get(), msg = a ? (lang === 'ne' ? (a.ne || a.en) : (a.en || a.ne)) : '';
    if (msg) { slot.className = 'nd-notice lvl-' + (a.level || 'info'); slot.textContent = msg; slot.hidden = false; }
    else if (S.error()) { slot.className = 'nd-notice lvl-warn'; slot.textContent = window.NDLang.t('live.error'); slot.hidden = false; }
    else { slot.hidden = true; }
  }

  // Hidden door to the admin panel: tap the footer tagline 7 times, or type "ndadmin" (outside form fields).
  function wireSecret() {
    var n = 0, timer = null, tag = document.querySelector('.footer-about p');
    function go() { location.href = 'control-room.html'; }
    if (tag) tag.addEventListener('click', function () { n++; clearTimeout(timer); timer = setTimeout(function () { n = 0; }, 2500); if (n >= 7) go(); });
    var buf = '';
    document.addEventListener('keydown', function (e) {
      var el = e.target, tn = el && el.tagName; if (tn === 'INPUT' || tn === 'TEXTAREA' || tn === 'SELECT' || (el && el.isContentEditable)) return;
      if (e.key.length !== 1) return; buf = (buf + e.key.toLowerCase()).slice(-7); if (buf === 'ndadmin') go();
    });
  }

  // Small public helper so later scripts (e.g. the map) can read the language.
  window.NDLang = {
    get: function () { return document.documentElement.getAttribute('lang') || DEFAULT_LANG; },
    t: function (key) {
      var l = window.NDLang.get();
      var lv = window.ND_CONFIG && window.ND_CONFIG.API_URL && window.ND_LIVE_TEXT && window.ND_LIVE_TEXT[l];
      if (lv && lv[key] !== undefined) return lv[key];
      var d = window.ND_TEXT[l] || {};
      return d[key] !== undefined ? d[key] : (window.ND_TEXT[DEFAULT_LANG][key] || key);
    }
  };
})();
