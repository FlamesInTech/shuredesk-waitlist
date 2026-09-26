// Cloudflare Pages Function — deployed automatically at /api/waitlist the
// moment this file exists in functions/api/, no separate server needed.
//
// Storage is Cloudflare KV, bound as WAITLIST_KV. This must be created and
// bound once in the Cloudflare dashboard before signups will actually save,
// see waitlist/README.md for the exact steps, Claude cannot provision this
// for you since it needs your own Cloudflare account.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  if (!env.WAITLIST_KV) {
    // Fails loudly rather than silently pretending the signup was saved,
    // this is the exact "not configured yet" state until the KV binding
    // is added in the Cloudflare dashboard.
    return json({ message: "Waitlist storage isn't configured yet." }, 503);
  }

  const key = `waitlist:${email}`;
  const existing = await env.WAITLIST_KV.get(key);
  if (existing) {
    // Already on the list, treat as success, not an error, a visitor
    // re-submitting shouldn't see a confusing failure message.
    return json({ ok: true, alreadyJoined: true });
  }

  await env.WAITLIST_KV.put(
    key,
    JSON.stringify({
      email,
      joinedAt: new Date().toISOString(),
      source: request.headers.get("Referer") || null,
    }),
  );

  return json({ ok: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
