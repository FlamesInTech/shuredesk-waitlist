import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Builds privacy/, terms/ and data-deletion/ from the text below and contact.json.
// Run: node legal/build.mjs   (from the waitlist folder). Empty contact fields are left out.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const c = JSON.parse(fs.readFileSync(path.join(HERE, "contact.json"), "utf8"));
for (const k of ["address", "email", "website", "phone"]) c[k] = (c[k] || "").trim();
if (!c.email) console.warn("WARNING: contact.json has no email. The pages will not show a contact email, and Meta needs one.");

const mail = (subject) =>
  c.email
    ? `<a href="mailto:${c.email}${subject ? "?subject=" + encodeURIComponent(subject) : ""}">${c.email}</a>`
    : "our contact email";
const site = () => (c.website ? `<a href="https://${c.website}">${c.website}</a>` : "");
const footerContact = () => {
  const parts = [c.address, c.email ? mail() : "", site(), c.phone].filter(Boolean);
  return parts.length ? `<p>${parts.join(" &middot; ")}</p>` : "";
};
const contactBlock = () => ["TEQSHURE LIMITED", c.address, c.email ? mail() : "", site(), c.phone].filter(Boolean).join("<br />");
const UPDATED = "4 October 2026";

const shell = ({ title, desc, slug, body }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} | ShureDesk</title>
    <meta name="description" content="${desc}" />
    <meta property="og:image" content="https://shuredesk.pages.dev/assets/og-image.png" />
    <link rel="canonical" href="https://shuredesk.pages.dev/${slug}" />
    <link rel="icon" href="/favicon.ico" sizes="32x32" />
    <link rel="icon" type="image/png" href="/assets/favicon-32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="/assets/icon-192.png" sizes="192x192" />
    <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
    />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="stylesheet" href="/legal.css" />
  </head>
  <body>
    <nav class="nav">
      <div class="wrap nav-inner">
        <a href="/" class="wordmark-link" aria-label="ShureDesk home"><img src="/assets/logo-light.png" alt="ShureDesk" class="logo" width="94" height="36" /></a>
        <a href="/#signup" class="nav-cta">Join waitlist</a>
      </div>
    </nav>

    <main class="wrap legal">
      <h1 class="font-display">${title}</h1>
      <p class="meta">Last updated ${UPDATED}</p>
${body}
    </main>

    <footer class="footer-dark legal-footer">
      <div class="wrap">
        <img src="/assets/logo-dark.png" alt="ShureDesk" class="footer-logo" width="104" height="40" />
        <p>
          &copy; <span id="year"></span> TEQSHURE LIMITED. ShureDesk is a product of TEQSHURE LIMITED.
        </p>
        ${footerContact()}
        <p>
          <a href="/privacy">Privacy Policy</a> &middot; <a href="/terms">Terms of Service</a> &middot;
          <a href="/data-deletion">Data deletion</a>
        </p>
      </div>
    </footer>
    <script>document.getElementById("year").textContent = new Date().getFullYear();</script>
  </body>
</html>
`;

const privacy = `
      <p>
        This policy explains how TEQSHURE LIMITED ("we", "us"), the company behind ShureDesk, collects, uses and
        protects personal data. It covers our waitlist, our website, and the ShureDesk service, an AI customer desk that
        answers messages and calls for businesses.
      </p>

      <h2>1. Who is responsible</h2>
      <p>
        TEQSHURE LIMITED${c.address ? `, ${c.address},` : ""} is responsible for personal data collected on the ShureDesk waitlist, website and
        account area. When a business uses ShureDesk to talk to its own customers, that business decides why and how its
        customers' messages are used, and we process those messages on the business's behalf.
      </p>
      ${c.email ? `<p>Contact: ${mail()}.</p>` : ""}

      <h2>2. What we collect</h2>
      <h3>If you join the waitlist</h3>
      <ul>
        <li>Your email address.</li>
        <li>The time you signed up and the page you signed up from.</li>
      </ul>
      <h3>If you create a ShureDesk account</h3>
      <ul>
        <li>Business name, your email address and a password. Passwords are stored only as a salted hash.</li>
        <li>Team member details you add, and your business profile, hours and settings.</li>
        <li>
          Content you give the AI to answer from: website pages we scrape at your request, PDFs you upload, and question
          and answer pairs you write.
        </li>
        <li>
          Billing details. Payments are handled by our payment providers, Paddle and Paystack. We do not store full
          card numbers.
        </li>
      </ul>
      <h3>When people message or call a business that uses ShureDesk</h3>
      <ul>
        <li>
          Messages sent through the website chat widget, WhatsApp, Instagram and Facebook Messenger, the replies the AI
          or the business's team sends, and any internal notes the team adds.
        </li>
        <li>
          Identifiers that come with the message, such as a chat visitor ID, a WhatsApp phone number, or a platform
          scoped user ID, plus any name or contact details the person chooses to give.
        </li>
        <li>
          For calls: the caller's phone number, call time and length, the call status, whether recording consent was
          given, and a transcript of the conversation.
        </li>
        <li>Leads and appointments created from conversations, such as a name, contact details and a booking time.</li>
      </ul>
      <h3>From connected accounts</h3>
      <ul>
        <li>
          Google Calendar access, only to read when a business is free and to create appointments the customer agreed
          to. Access tokens are encrypted at rest.
        </li>
        <li>
          Access tokens for Meta accounts a business connects (WhatsApp, Instagram, Facebook). They are encrypted at rest.
        </li>
      </ul>
      <h3>Technical data</h3>
      <p>
        Standard server logs, and a cookie that remembers your chosen currency on our marketing site. Signing in to the
        ShureDesk dashboard stores a session token in your browser.
      </p>

      <h2>3. How we use it</h2>
      <ul>
        <li>To run ShureDesk: answer customer questions, book appointments, capture leads, and hand chats to a person.</li>
        <li>To keep the service secure, prevent abuse, and investigate problems.</li>
        <li>To bill for paid plans and provide support.</li>
        <li>To email waitlist members about ShureDesk, including a confirmation when you join.</li>
      </ul>
      <p>
        We do not sell personal data. We do not use messages from Meta platforms for advertising. A business's content
        is used only to answer that business's own customers.
      </p>

      <h2>4. Data from Meta platforms</h2>
      <p>
        When a business connects WhatsApp, Instagram or Facebook to ShureDesk, we receive the messages sent to that
        business through Meta's APIs. We use them only to deliver the service to that business: showing them in its
        inbox, generating replies, and sending replies back. We keep this data separate per business, and a business
        can disconnect its accounts at any time.
      </p>

      <h2>5. Who we share data with</h2>
      <p>We use service providers to run ShureDesk. They process data only to provide their service to us:</p>
      <ul>
        <li>AI model providers selected for the service (for example OpenAI, Anthropic, Google, Groq), to generate answers and embeddings.</li>
        <li>Deepgram (speech to text) and Cartesia (text to speech) for phone calls, and Telnyx for telephony.</li>
        <li>Meta, for WhatsApp, Instagram and Facebook messaging.</li>
        <li>Google, for Calendar, and for Google Sheets and email used by the waitlist.</li>
        <li>Cloudflare, for website hosting and waitlist storage.</li>
        <li>Paddle and Paystack, for payments.</li>
        <li>Our hosting and database providers.</li>
      </ul>
      <p>We may also disclose data when the law requires it or to protect our rights and users.</p>

      <h2>6. Security</h2>
      <p>
        Each business's data is isolated from other businesses at the database level. Connected account credentials and
        API keys are encrypted at rest, passwords are hashed, and actions our staff take on an account are logged. No
        system is perfectly secure, and we cannot guarantee absolute security.
      </p>

      <h2>7. How long we keep data</h2>
      <p>
        Waitlist emails are kept until you ask us to remove them or the waitlist closes. Account data is kept while the
        account is active. When an account is deleted, its business content, conversations and phone number are removed.
        Backups and logs may keep copies for a short additional period before they are overwritten.
      </p>

      <h2>8. Your rights</h2>
      <p>
        You can ask to access, correct or delete your personal data, to object to or restrict how we use it, and to
        withdraw consent for waitlist emails at any time. These rights apply under applicable law, including the Nigeria
        Data Protection Act 2023. To make a request, email ${mail()}, or follow the
        steps on our <a href="/data-deletion">data deletion page</a>. You may also complain to the Nigeria Data
        Protection Commission.
      </p>
      <p>
        If you are a customer of a business that uses ShureDesk, contact that business first for requests about your
        conversations. We will help the business respond.
      </p>

      <h2>9. International processing</h2>
      <p>
        Our providers may process data in countries other than Nigeria. When data is transferred, we rely on appropriate
        safeguards required by applicable law.
      </p>

      <h2>10. Children</h2>
      <p>ShureDesk is for businesses and is not directed at children under 18. We do not knowingly collect data from them.</p>

      <h2>11. Changes</h2>
      <p>We may update this policy. We will change the date at the top, and tell account holders about material changes.</p>

      <h2>12. Contact</h2>
      <p>
        ${contactBlock()}
      </p>`;

const terms = `
      <p>
        These terms govern your use of ShureDesk, an AI customer desk provided by TEQSHURE LIMITED ("we", "us"). By
        joining the waitlist, creating an account or using the service, you agree to them.
      </p>

      <h2>1. The service</h2>
      <p>
        ShureDesk answers messages and calls for a business using that business's own content, books appointments,
        captures leads and hands conversations to a person. ShureDesk is in early access. Features, plans and prices may
        change.
      </p>
      <h2>2. The waitlist</h2>
      <p>
        Joining the waitlist is free and creates no obligation for you or us. It does not guarantee access, a launch
        date or any price.
      </p>
      <h2>3. Who can use it</h2>
      <p>
        ShureDesk is for businesses. You must be at least 18 and able to enter a contract for your business. You are
        responsible for everything done through your account and for keeping your login secure.
      </p>
      <h2>4. Your content and your customers</h2>
      <ul>
        <li>You own the content you give us. You allow us to process it to provide the service.</li>
        <li>
          You are responsible for the accuracy of what you give the AI to answer from. Keep it correct and up to date.
        </li>
        <li>
          You are responsible for having the right to message your customers, for obtaining any consent needed to
          contact or record them, and for following the laws that apply to you.
        </li>
        <li>Our <a href="/privacy">Privacy Policy</a> explains how we handle personal data.</li>
      </ul>
      <h2>5. Acceptable use</h2>
      <p>You agree not to use ShureDesk to:</p>
      <ul>
        <li>send spam or unsolicited bulk messages, or break the rules of WhatsApp, Instagram, Facebook (Meta) or Google;</li>
        <li>break the law, infringe others' rights, or deceive or harm people;</li>
        <li>upload malware, probe or attack our systems, or access another business's data;</li>
        <li>use the service to make or collect anything unlawful, or in ways that put emergency or safety decisions on the AI.</li>
      </ul>
      <p>We may suspend an account that breaks these rules or puts others at risk.</p>
      <h2>6. AI answers</h2>
      <p>
        ShureDesk uses AI models. Answers are generated from your content and may sometimes be incomplete or wrong.
        When the AI is unsure it is designed to say so and pass the conversation to your team, but you should review
        conversations and are responsible for how you rely on the service.
      </p>
      <h2>7. Third-party services</h2>
      <p>
        ShureDesk works with services such as Meta, Google, Telnyx, Paddle and Paystack. Your use of them is also
        subject to their terms. We are not responsible for their outages, changes or decisions, including a platform
        limiting or removing access to an account.
      </p>
      <h2>8. Plans, billing and cancellation</h2>
      <p>
        Paid plans, trial offers and limits are described on our pricing page when available. Payments are processed by
        Paddle or Paystack. You can cancel at any time, and cancellation takes effect at the end of your current billing
        period unless we state otherwise. Fees already paid are non-refundable except where the law requires.
      </p>
      <h2>9. Availability</h2>
      <p>
        We work to keep ShureDesk running but do not promise uninterrupted or error-free service, especially during
        early access.
      </p>
      <h2>10. Ending your account</h2>
      <p>
        You can delete your account from Settings in the dashboard. We may suspend or end access for breach of these
        terms. When an account is deleted, its content and conversation history are removed as described in our Privacy
        Policy.
      </p>
      <h2>11. Disclaimers and liability</h2>
      <p>
        The service is provided "as is" and "as available". To the extent the law allows, we are not liable for indirect
        or consequential loss, lost profits, or lost business, and our total liability for any claim is limited to the
        amount you paid us in the three months before the claim. Nothing here limits liability that cannot be limited by
        law.
      </p>
      <h2>12. Changes</h2>
      <p>
        We may update these terms. We will change the date at the top and tell account holders about material
        changes. Continuing to use ShureDesk after a change means you accept it.
      </p>
      <h2>13. Governing law</h2>
      <p>These terms are governed by the laws of the Federal Republic of Nigeria, and its courts have jurisdiction.</p>
      <h2>14. Contact</h2>
      <p>
        ${contactBlock()}
      </p>`;

const deletion = `
      <p>
        You can ask TEQSHURE LIMITED to delete the personal data we hold about you. Choose the case that fits you. We
        confirm each request by email and complete it within 30 days.
      </p>

      <h2>If you joined the waitlist</h2>
      <ol>
        <li>Email ${mail("Delete my data")} from the address you signed up with.</li>
        <li>Use the subject "Delete my data".</li>
        <li>We remove your email from our waitlist records and confirm when it is done.</li>
      </ol>

      <h2>If you have a ShureDesk account</h2>
      <ol>
        <li>Sign in to the ShureDesk dashboard.</li>
        <li>Open <strong>Settings</strong>, then <strong>Security</strong>.</li>
        <li>Choose <strong>Delete account</strong> and confirm.</li>
      </ol>
      <p>
        This permanently deletes your business, its knowledge base and all conversation history. If you can no longer
        sign in, email us from your account email and we will do it for you.
      </p>

      <h2>If you messaged a business through WhatsApp, Instagram or Facebook</h2>
      <p>
        Your messages belong to the business you contacted, and ShureDesk processes them for that business. You can ask
        either of us to delete them:
      </p>
      <ol>
        <li>
          Contact the business directly and ask it to delete your conversation, or
        </li>
        <li>
          Email ${mail("Delete my messages")} with the name of the business, the
          platform (WhatsApp, Instagram or Facebook), and your phone number or profile name on that platform, so we can
          find your conversation. We may ask you to confirm it is yours.
        </li>
      </ol>

      <h2>Removing ShureDesk's access through Meta</h2>
      <p>
        You can also remove ShureDesk from your Facebook or Instagram settings under Apps and Websites. After you do,
        we stop receiving new data from that connection. To delete data we already hold, follow the steps above.
      </p>

      <h2>What we delete</h2>
      <p>
        Conversations, contact and lead details, appointment records, account details and connected account tokens
        linked to the request. We may keep a small amount of information where the law requires it, for example billing
        records, and short-lived backups are overwritten on their normal schedule.
      </p>
      <p>Questions: ${mail()}. See also our <a href="/privacy">Privacy Policy</a>.</p>`;

const pages = [
  { slug: "privacy", title: "Privacy Policy", desc: "How TEQSHURE LIMITED collects, uses and protects personal data for ShureDesk.", body: privacy },
  { slug: "terms", title: "Terms of Service", desc: "The terms for using ShureDesk, an AI customer desk by TEQSHURE LIMITED.", body: terms },
  { slug: "data-deletion", title: "Data deletion", desc: "How to ask TEQSHURE LIMITED to delete your data from ShureDesk.", body: deletion },
];

for (const p of pages) {
  const dir = path.join(ROOT, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), shell(p));
}
console.log("wrote", pages.map((p) => p.slug).join(", "));
