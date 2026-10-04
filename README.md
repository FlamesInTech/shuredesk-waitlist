# ShureDesk waitlist

A standalone static site + one Cloudflare Pages Function, built to deploy directly to
Cloudflare Pages with no build step and no other services.

## What's here

- `index.html` / `styles.css` / `script.js` — the page itself. Same brand system as the
  real ShureDesk product (warm cream background, flat blue accent, Fraunces + Inter,
  no gradients).
- `functions/api/waitlist.js` — a Cloudflare Pages Function. Cloudflare automatically
  serves this at `/api/waitlist` the moment it's deployed, no extra config.
- `google-apps-script/Code.gs` — the Google Apps Script that receives each signup,
  appends a row to a Google Sheet, and sends the submitter a welcome email
  automatically. Lives here for reference, the actual copy that runs is the one
  pasted into your Apps Script project (see below), this file doesn't get deployed
  by Cloudflare, Google Apps Script is its own separate host.
- `assets/founder.png` — the real founder photo used in the founder's note section.

## How a signup is stored (two layers)

1. **Google Sheets — the real source of truth.** The Cloudflare Function forwards
   every signup to a Google Apps Script Web App, which appends a row and emails the
   submitter a confirmation automatically.
2. **Cloudflare KV — a backup + dedupe check.** Optional but recommended, it's what
   stops the same email getting a second welcome email if they submit twice, and
   gives you a fallback copy of the data if Google is ever slow or down.

### Setting up Google Sheets + the confirmation email

1. Open the Google Sheet you want signups to land in (`getSheet()` in the script
   sets up the header row automatically if it's missing, but you can also set row 1
   yourself to exactly: `Timestamp | Email | Source | Emailed`, columns A–D).
2. In that sheet, go to **Extensions → Apps Script**.
3. Delete whatever's in `Code.gs` and paste in the contents of this repo's
   `google-apps-script/Code.gs`.
4. Near the top of the file, update the `WAITLIST_URL` constant to your real live
   URL (the Cloudflare Pages `*.pages.dev` link, or your own domain once you have
   one). The confirmation email's "Share the waitlist" button links there, it's a
   placeholder until you set it.
5. **Set up the automatic-email safety net (do this once):** in the Apps Script
   editor's function dropdown (top toolbar), select `setupTrigger`, then click **Run**.
   This installs a time-based trigger that sweeps every 15 minutes for any row whose
   "Emailed" column isn't "Yes" and sends it then, a backup on top of the instant send
   that already happens in `doPost`. Google will ask you to authorize the script the
   first time, that's expected.
6. Click **Deploy → New deployment**, type **Web app**, execute as **Me**, access
   **Anyone**. Deploy, and copy the `/exec` URL it gives you.
7. That URL is already set as the default inside `functions/api/waitlist.js`. If you
   ever redeploy the script and get a new URL, either update that default directly,
   or set a `GOOGLE_SCRIPT_URL` environment variable in your Cloudflare Pages
   project settings, either way works, the env var wins if both are set.

**Whenever you edit `Code.gs` after the first deploy**, pasting new code into the
editor does **not** update the live `/exec` URL by itself. You have to go to
**Deploy → Manage deployments**, click the pencil icon on the existing deployment,
set **Version** to **New version**, and click **Deploy** again. Skipping this step is
exactly what caused a real outage during development: the old, empty script kept
answering at the same URL while the real code sat unpublished, every signup looked
successful in the widget but nothing ever reached the Sheet. If a signup isn't
appearing, this is the first thing to check.

Gmail's free-account sending limit is 100 emails/day via `MailApp` (1,500/day on
Google Workspace), fine for a waitlist, worth knowing if this ever gets genuinely
popular.

### One-time Cloudflare KV setup (optional, but recommended)

1. In the Cloudflare dashboard, go to **Workers & Pages → KV**.
2. Click **Create a namespace**, name it something like `shuredesk-waitlist`.
3. Deploy this folder as a Pages project (see below) if you haven't already.
4. Go to your Pages project → **Settings → Functions → KV namespace bindings**.
5. Add a binding: variable name `WAITLIST_KV`, pointing at the namespace you just
   created.
6. Redeploy (or it may pick it up automatically, Cloudflare will prompt you).

Without this binding, signups still work, they just skip the dedupe check and the
KV backup copy, Google Sheets alone still captures everything.

## Deploying

**Option A — drag and drop (fastest):**
Go to Cloudflare dashboard → Workers & Pages → Create → Pages → Upload assets, and
drag this whole `waitlist` folder in. You'll get a free `*.pages.dev` URL immediately,
no domain needed.

**Option B — connect to Git (better for updates later):**
Push this repo to GitHub/GitLab, then in Cloudflare Pages choose "Connect to Git" and
point it at this folder. Set the **build output directory** to `waitlist` if you're
deploying from the monorepo root, or point the project root directly at this folder if
you split it into its own repo.

## Viewing who's signed up

The Google Sheet is the real list, every signup lands there as a new row. Cloudflare
KV (if bound) is a secondary copy, open **Workers & Pages → KV → shuredesk-waitlist**
in the Cloudflare dashboard, every key is `waitlist:<email>` with a JSON value
containing the email, timestamp, and referring page.

## Local preview

No build step needed, this is plain HTML/CSS/JS. Open `index.html` directly in a
browser, or serve the folder with any static server. The `/api/waitlist` call will
fail locally (there's no Functions runtime without Cloudflare's `wrangler pages dev`),
that's expected, the form itself is what to check locally, the real save only works
once deployed with the KV binding above.

## Legal pages (needed for Meta app review)

`privacy/`, `terms/` and `data-deletion/` are static pages, served by Cloudflare at `/privacy`,
`/terms` and `/data-deletion`. They are generated, so do not edit the HTML by hand.

1. Put your registered address, public contact email and public phone in `legal/contact.json`.
   Empty fields are left out of the pages. Meta expects at least an email.
2. Run `node legal/build.mjs` from this folder.
3. Commit the regenerated pages.

Have the policy text reviewed by someone qualified before submitting it to Meta.
