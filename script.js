document.getElementById("year").textContent = new Date().getFullYear();

// --- Nav "Join waitlist" + final CTA button ---
// Both are plain href="#signup" anchors, real, reliable scrolling (works
// even without JS, works on iOS Safari where a bare .focus() call often
// won't trigger a scroll on its own). This just adds the cursor-ready-to-type
// convenience on top, once the scroll has had a moment to land.
document.querySelectorAll('a[href="#signup"]').forEach((link) => {
  link.addEventListener("click", () => {
    setTimeout(() => {
      const email = document.getElementById("email");
      if (email) email.focus({ preventScroll: true });
    }, 400);
  });
});

// --- Waitlist signup ---
const form = document.getElementById("waitlist-form");
const status = document.getElementById("form-status");
const card = document.getElementById("success-card");
const button = document.getElementById("submit-btn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const honeypot = form.querySelector('input[name="company"]').value;

  status.classList.remove("visible", "success", "error");

  if (honeypot) return; // silently drop bot submissions

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    status.textContent = "Enter a valid email address.";
    status.classList.add("visible", "error");
    return;
  }

  button.disabled = true;
  button.textContent = "Joining…";

  try {
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      status.textContent = data.message || "Something went wrong, please try again.";
      status.classList.add("visible", "error");
      button.disabled = false;
      button.textContent = "Get early access";
      return;
    }

    form.hidden = true;
    status.classList.remove("visible");
    card.classList.add("visible");
  } catch {
    status.textContent = "Couldn't reach the server, check your connection and try again.";
    status.classList.add("visible", "error");
    button.disabled = false;
    button.textContent = "Get early access";
  }
});
