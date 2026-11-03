// Nagarik Drishti — light/dark theme. Loaded in <head> so there is no flash.
(function () {
  var KEY = 'nd-theme';
  function stored() {
    try { var v = localStorage.getItem(KEY); return v === 'dark' || v === 'light' ? v : null; } catch (e) { return null; }
  }
  function system() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', theme === 'dark' ? '#0f1724' : '#ffffff');
  }
  function set(theme, persist) {
    apply(theme);
    if (persist) { try { localStorage.setItem(KEY, theme); } catch (e) { /* ignore */ } }
    document.dispatchEvent(new CustomEvent('nd:themechange', { detail: { theme: theme } }));
  }
  apply(stored() || system());
  window.NDTheme = {
    get: function () { return document.documentElement.getAttribute('data-theme') || 'light'; },
    toggle: function () { set(window.NDTheme.get() === 'dark' ? 'light' : 'dark', true); }
  };
  // Follow the device setting until the visitor picks a theme themselves.
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (e) { if (!stored()) set(e.matches ? 'dark' : 'light', false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
  }
})();
