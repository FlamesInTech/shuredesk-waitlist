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
- The hero illustration is a placeholder SVG inline in `index.html` (search for
  `hero-art`). Swap it for a real image by replacing that `<svg>...</svg>` block with
  an `<img src="your-image.png" alt="...">`, drop the image file in this folder first.

## How a signup is stored (two layers)

1. **Google Sheets — the real source of truth.** The Cloudflare Function forwards
   every signup to a Google Apps Script Web App, which appends a row and emails the
   submitter a confirmation automatically.
2. **Cloudflare KV — a backup + dedupe check.** Optional but recommended, it's what
   stops the same email getting a second welcome email if they submit twice, and
   gives you a fallback copy of the data if Google is ever slow or down.

### Setting up Google Sheets + the confirmation email

1. Open the Google Sheet you want signups to land in. Set row 1 to exactly:
   `Timestamp | Email | Source` (columns A, B, C).
2. In that sheet, go to **Extensions → Apps Script**.
3. Delete whatever's in `Code.gs` and paste in the contents of this repo's
   `google-apps-script/Code.gs`.
4. Click **Deploy → New deployment**, type **Web app**, execute as **Me**, access
   **Anyone**. Deploy, and copy the `/exec` URL it gives you.
5. That URL is already set as the default inside `functions/api/waitlist.js`. If you
   ever redeploy the script and get a new URL, either update that default directly,
   or set a `GOOGLE_SCRIPT_URL` environment variable in your Cloudflare Pages
   project settings, either way works, the env var wins if both are set.

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
