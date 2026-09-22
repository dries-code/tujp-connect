# TUJP Connect

One app, one deploy — replaces the old "one static Netlify site per person" setup.

- **`/`** — overview page listing everyone in the team directory
- **`/[slug]`** — a person's connect card (e.g. `/dries-grasveld`, `/thomas-bunte`)
- **`/api/vcard/[slug]`** — generates that person's `.vcf` on the fly (no static files to keep in sync)

## How adding a person works now

You don't touch code or Drive folders anymore. Everything comes from **one Google Sheet**:

https://docs.google.com/spreadsheets/d/1eyaRibW9rafqcPaRJi4f6yK0oWusAz2g-PP7yquFN_g/edit

Columns: `Slug | Naam | Functie | Email | Telefoon | Organisatie | Foto bestand | Actief`

- **Add someone:** add a row. Their page appears automatically (see caching note below) at `/<slug>`.
- **Remove someone (without deleting their history):** set `Actief` to `FALSE` — their page and vCard both 404, but the row stays.
- **Add/change a photo:** put the photo in Drive, right-click → **Share → Copy link** (must be "Anyone with the link" → Viewer), paste that link into the `Foto bestand` cell. No specific filename or folder needed.
- **No photo yet:** leave `Foto bestand` empty — the card shows an initials avatar instead, same as it did before.

**No API key, no service account, nothing to configure in Google Cloud.** The app reads the sheet via its public CSV export, which only works because the sheet is shared as "Anyone with the link can view." Don't lock that sharing down, or the app stops working.

**Caching:** pages are cached for 5 minutes (`revalidate = 300` in the code) so the whole team isn't hammering Google's servers on every visit. A sheet edit shows up within 5 minutes, automatically — no redeploy needed. If you need a change live *immediately*, redeploy on Vercel (Deployments tab → "Redeploy") to force a fresh fetch.

## Deploying this (one-time setup)

### 1. Push this folder to GitHub

1. Go to [github.com/new](https://github.com/new), create a repo (e.g. `tujp-connect`)
2. On the empty repo, use **"uploading an existing file"** and drag in the contents of this folder (not the folder itself — the files: `app/`, `lib/`, `public/`, `package.json`, etc.)
3. Commit to `main`

(If you're comfortable with git locally, `git init && git add . && git commit -m "TUJP Connect" && git remote add origin <repo-url> && git push -u origin main` works too and is easier for future updates.)

### 2. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in (GitHub login is easiest)
2. **Import** the `tujp-connect` repo
3. Framework preset: Vercel auto-detects **Next.js** — leave build settings as default
4. Under **Environment Variables**, add:
   - `TEAM_SHEET_ID` = `1eyaRibW9rafqcPaRJi4f6yK0oWusAz2g-PP7yquFN_g`
5. Click **Deploy**

After a minute you'll get a URL like `https://tujp-connect.vercel.app`. That's it — every push to `main` auto-redeploys, same as the Netlify setup, but now it's **one** site instead of one per person.

### 3. Custom domain (optional)

In the Vercel project → **Settings → Domains** → add `connect.theurbanjungleproject.com`. Vercel gives you a CNAME (or A record) target; add that at your DNS provider. SSL is automatic once DNS resolves.

## Local development

```
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## What's shared vs. per-person

Everything except the contact block, title, and vCard is **identical for everyone** and lives once in the code (`app/[slug]/page.tsx`) — the impact stats, the Jungle Blocks® photo and description, the video, the HubSpot form, the footer. If that shared content needs to change (new stats, new product photo, different quote), it's a single edit that updates every person's card at once — no more editing four separate files.

## NFC cards

Write each person's final URL to their NTAG213 chip, e.g. `https://connect.theurbanjungleproject.com/thomas-bunte`. Add `?event=provada26` (or similar) to track which event/channel a lead came from — it's passed through to a hidden `event_source` field on the HubSpot form automatically, the same mechanism as before.
