// Nagarik Drishti — site configuration.
// Paste your Google Apps Script web-app URL below (see backend/SETUP.md).
// Leave it empty ('') and the site runs in offline DEMO mode (fake data kept in the browser only).
window.ND_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbyCKFCg3KyA7q5R_5OHOGd9T5GgNJHe24K3N5O5ltmKvtajLDIpAAzy5FF_AxvjD-Zh/exec'   // e.g. 'https://script.google.com/macros/s/AKfycb.../exec'
};
if (window.ND_CONFIG.API_URL) document.documentElement.classList.add('live');
