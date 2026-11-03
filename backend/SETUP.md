# Nagarik Drishti — go live with Google Sheets (≈10 minutes, free)

## 1. Create the Sheet + backend
1. Go to https://sheets.new and name it **Nagarik Drishti Reports**.
2. Menu **Extensions → Apps Script**. Delete the sample code and paste the whole of `backend/Code.gs`. Save.
3. Left sidebar **Project Settings (⚙) → Script properties → Add property**:
   - `ADMIN_PASSWORD` = a long secret only you know (10+ characters). This is the key for the hidden admin panel.
4. In the editor choose the function **setup** and press **Run**. Approve the permissions
   (it creates the *Reports* and *Audit* tabs and a Drive folder for photos).
5. **Deploy → New deployment → type: Web app**
   - Execute as: **Me**   ·   Who has access: **Anyone**
   - Deploy, and copy the **Web app URL** (ends with `/exec`).
6. If you ever edit Code.gs later: **Deploy → Manage deployments → ✎ → Version: New version → Deploy** (the URL stays the same).

## 2. Connect the website
Open `js/config.js` and paste the URL:
```js
window.ND_CONFIG = { API_URL: 'https://script.google.com/macros/s/XXXX/exec' };
```
Leave it `''` to keep the offline demo mode.

## 3. Publish on GitHub Pages
1. Create a repo and upload **everything inside `nd-static/`** (so `index.html` is at the repo root).
2. Repo **Settings → Pages → Deploy from a branch → main / (root)**. Your site appears at `https://<user>.github.io/<repo>/`.

## 4. The hidden admin panel
- Not linked anywhere. Open it by **tapping the footer tagline 7 times**, by typing `ndadmin` on any public page,
  or going directly to `/control-room.html`.
- Sign in with `ADMIN_PASSWORD`. Sessions last 2 hours. 5 wrong attempts lock logins for 15 minutes.
- Change the key later from **Security** (or edit the script property).

## How your data is protected
- The password is checked **on Google's server**, never in the website code. Without a valid signed token the API
  refuses every admin action, so finding the page URL gives an attacker nothing.
- Citizens only ever receive rounded (~1 km) coordinates and no admin notes. Exact positions are admin-only.
- Cells are stored as plain text (no spreadsheet-formula injection); a hidden honeypot field and a global hourly cap slow down spam.
- Never share the Sheet publicly: it contains exact coordinates. Keep it private to your Google account.

## Limits to know
Apps Script handles thousands of reports comfortably, but is not built for very high traffic (≈20k calls/day on free accounts).
If you outgrow it, only `js/store.js` and `backend/Code.gs` need replacing.
