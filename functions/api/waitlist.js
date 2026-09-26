// Cloudflare Pages Function — deployed automatically at /api/waitlist the
// moment this file exists in functions/api/, no separate server needed.
//
// Two storage layers:
//  1. Google Sheets (via a Google Apps Script Web App) — the source of truth,
//     also sends the submitter a welcome email automatically. Called
//     server-to-server from here rather than directly from the browser,
//     Apps Script's /exec endpoint doesn't send CORS headers a browser
//     fetch() can read, so calling it client-side either fails outright or
//     only works blind (no-cors, can't read success/failure).
//  2. Cloudflare KV, bound as WAITLIST_KV — a backup + dedupe check that
//     works even if Google is slow or down. See waitlist/README.md for the
//     one-time KV setup.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Default points at the Apps Script Web App already deployed for this
// project. Override with a GOOGLE_SCRIPT_URL environment variable in the
// Cloudflare Pages project settings if the script is ever redeployed to a
// new URL, no code change needed then.
const DEFAULT_GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwjHd-zt2CG06F0TLgS1nmJGKOikhHIzgSc9AqaT7vQQazJSgcnLhuPujp2G8TRSrhn1w/exec";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: "Invalid request." }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return json({ message: "Enter a valid email address." }, 400);
  }

  const source = request.headers.get("Referer") || null;
  const joinedAt = new Date().toISOString();

  // KV dedupe check first, cheap and fast, avoids re-emailing someone who
  // already joined even if the Sheet call below is slow.
  let alreadyJoined = false;
  if (env.WAITLIST_KV) {
    const existing = await env.WAITLIST_KV.get(`waitlist:${email}`);
    alreadyJoined = Boolean(existing);
  }

  if (!alreadyJoined) {
    // Best-effort, KV is a backup, not the source of truth, a failure here
    // shouldn't block the real save to the Sheet below.
    if (env.WAITLIST_KV) {
      await env.WAITLIST_KV
        .put(`waitlist:${email}`, JSON.stringify({ email, joinedAt, source }))
        .catch(() => undefined);
    }

    const scriptUrl = env.GOOGLE_SCRIPT_URL || DEFAULT_GOOGLE_SCRIPT_URL;
    try {
      const res = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, joinedAt, source }),
      });
      // Apps Script's error pages (e.g. "Script function not found") still
      // return HTTP 200 with an HTML body, checking res.ok alone missed this
      // exact failure mode for real once, silently telling every visitor
      // "success" while nothing was actually saved to the Sheet. Parse the
      // body and check its own {ok} field instead of trusting the status.
      const text = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        console.error(
          `Google Apps Script for ${email} did not return JSON, likely means the deployed ` +
            `script is stale or misconfigured (a redeploy is needed in the Apps Script editor). ` +
            `First 200 chars: ${text.slice(0, 200)}`,
        );
        parsed = null;
      }
      if (parsed && parsed.ok === false) {
        console.error(`Google Apps Script rejected the signup for ${email}: ${parsed.message}`);
      }
    } catch (err) {
      console.error(`Google Apps Script call failed for ${email}: ${err.message}`);
    }
  }

  return json({ ok: true, alreadyJoined });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
