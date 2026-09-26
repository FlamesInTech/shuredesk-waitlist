# ShureDesk waitlist

A standalone static site + one Cloudflare Pages Function, built to deploy directly to
Cloudflare Pages with no build step and no other services.

## What's here

- `index.html` / `styles.css` / `script.js` — the page itself. Same brand system as the
  real ShureDesk product (warm cream background, flat blue accent, Fraunces + Inter,
  no gradients).
- `functions/api/waitlist.js` — a Cloudflare Pages Function. Cloudflare automatically
  serves this at `/api/waitlist` the moment it's deployed, no extra config.
- The hero illustration is a placeholder SVG inline in `index.html` (search for
  `hero-art`). Swap it for a real image by replacing that `<svg>...</svg>` block with
  an `<img src="your-image.png" alt="...">`, drop the image file in this folder first.

## One-time Cloudflare setup (you'll need to do this, Claude can't access your account)

The signup form needs somewhere to actually store emails. That's Cloudflare KV, a free
key-value store Cloudflare gives every account.

1. In the Cloudflare dashboard, go to **Workers & Pages → KV**.
2. Click **Create a namespace**, name it something like `shuredesk-waitlist`.
3. Deploy this folder as a Pages project (see below) if you haven't already.
4. Go to your Pages project → **Settings → Functions → KV namespace bindings**.
5. Add a binding: variable name `WAITLIST_KV`, pointing at the namespace you just
   created.
6. Redeploy (or it may pick it up automatically, Cloudflare will prompt you).

Until this binding exists, the form will show "Waitlist storage isn't configured yet"
instead of silently pretending it saved something, that's intentional, not a bug.

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

For now, open **Workers & Pages → KV → shuredesk-waitlist** in the Cloudflare
dashboard, every key is `waitlist:<email>` with a JSON value containing the email,
timestamp, and referring page. Good enough for a first batch of signups; if the list
grows, ask Claude to build a simple authenticated export page.

## Local preview

No build step needed, this is plain HTML/CSS/JS. Open `index.html` directly in a
browser, or serve the folder with any static server. The `/api/waitlist` call will
fail locally (there's no Functions runtime without Cloudflare's `wrangler pages dev`),
that's expected, the form itself is what to check locally, the real save only works
once deployed with the KV binding above.
