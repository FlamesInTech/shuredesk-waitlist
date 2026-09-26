document.getElementById("year").textContent = new Date().getFullYear();

// --- FAQ accordion ---
document.querySelectorAll(".faq-item").forEach((item) => {
  const btn = item.querySelector(".faq-q");
  btn.addEventListener("click", () => {
    const isOpen = item.getAttribute("data-open") === "true";
    // Close any other open item, one open at a time reads cleaner than a stack.
    document.querySelectorAll(".faq-item").forEach((other) => {
      other.setAttribute("data-open", "false");
      other.querySelector(".faq-q").setAttribute("aria-expanded", "false");
    });
    if (!isOpen) {
      item.setAttribute("data-open", "true");
      btn.setAttribute("aria-expanded", "true");
    }
  });
});

// --- Waitlist signup ---
// Two forms on the page (hero + bottom CTA) share this one handler.
function wireForm(formId, statusId, cardId, buttonId, emailFieldId) {
  const form = document.getElementById(formId);
  if (!form) return;
  const status = document.getElementById(statusId);
  const card = document.getElementById(cardId);
  const button = document.getElementById(buttonId);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById(emailFieldId).value.trim();
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
        button.textContent = button === document.getElementById("submit-btn") ? "Get early access" : "Join the waitlist";
        return;
      }

      form.hidden = true;
      status.classList.remove("visible");
      card.classList.add("visible");
    } catch {
      status.textContent = "Couldn't reach the server, check your connection and try again.";
      status.classList.add("visible", "error");
      button.disabled = false;
      button.textContent = button === document.getElementById("submit-btn") ? "Get early access" : "Join the waitlist";
    }
  });
}

wireForm("waitlist-form", "form-status", "success-card", "submit-btn", "email");
wireForm("waitlist-form-2", "form-status-2", "success-card-2", "submit-btn-2", "email-2");
