/**
 * ShureDesk waitlist — Google Apps Script Web App.
 *
 * Receives a POST from the Cloudflare Pages Function (functions/api/waitlist.js),
 * appends a row to this spreadsheet, and sends the submitter a confirmation
 * email immediately. `setupTrigger()` additionally installs a time-based
 * trigger that sweeps for any row that somehow never got emailed (a failed
 * MailApp call, a row added by some other means) and sends it then, a
 * belt-and-suspenders safety net on top of the immediate send.
 *
 * IMPORTANT — after pasting/editing this file, pasting code alone does NOT
 * update the live Web App URL. You must create a new deployment:
 *   Deploy > Manage deployments > (pencil icon on the existing deployment)
 *   > Version: "New version" > Deploy.
 * Skipping this step is exactly what caused signups to silently stop
 * saving, the old empty script kept answering at the same URL.
 *
 * Sheet must have this header row (row 1), exactly:
 *   Timestamp | Email | Source | Emailed
 */

var SHEET_HEADERS = ["Timestamp", "Email", "Source", "Emailed"];

// Update this once you have the real live URL (Cloudflare Pages *.pages.dev,
// or your own domain once you have one). Used in the confirmation email's
// share section, sharing "join the waitlist" only works if this points
// somewhere real.
var WAITLIST_URL = "https://shuredesk.pages.dev";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, message: "No data received." });
    }

    var data = JSON.parse(e.postData.contents);
    var email = (data.email || "").toString().trim().toLowerCase();
    var source = (data.source || "").toString();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ ok: false, message: "Invalid email." });
    }

    var sheet = getSheet();
    var existing = sheet.getDataRange().getValues();
    for (var i = 1; i < existing.length; i++) {
      if (String(existing[i][1]).toLowerCase() === email) {
        return jsonResponse({ ok: true, alreadyJoined: true });
      }
    }

    var now = new Date();
    // "Emailed" starts blank, sendWelcomeEmail marks it "Yes" right after a
    // successful send, so the safety-net sweep below never double-sends.
    sheet.appendRow([now, email, source, ""]);
    var rowIndex = sheet.getLastRow();

    var sent = sendWelcomeEmail(email);
    if (sent) {
      sheet.getRange(rowIndex, 4).setValue("Yes");
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, message: "Server error: " + err.message });
  }
}

function doGet(e) {
  return jsonResponse({ ok: true, message: "ShureDesk waitlist endpoint is live." });
}

/**
 * Safety net, not the primary path. Run once via setupTrigger() below to
 * install this on a schedule, it catches any row whose "Emailed" column
 * never got marked "Yes" (e.g. MailApp hit a transient error during doPost)
 * and sends the welcome email then instead of never.
 */
function sendPendingWelcomeEmails() {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var email = data[i][1];
    var emailed = data[i][3];
    if (email && emailed !== "Yes") {
      var sent = sendWelcomeEmail(email);
      if (sent) {
        sheet.getRange(i + 1, 4).setValue("Yes");
      }
    }
  }
}

/**
 * Run this ONCE manually from the Apps Script editor (select setupTrigger
 * in the function dropdown, click Run) to install the time-based trigger
 * for sendPendingWelcomeEmails. Safe to re-run, it clears any trigger this
 * function previously created before adding a fresh one, so it never stacks
 * up duplicate triggers sending duplicate emails.
 */
function setupTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "sendPendingWelcomeEmails") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger("sendPendingWelcomeEmails").timeBased().everyMinutes(15).create();
  Logger.log("Trigger installed: sendPendingWelcomeEmails runs every 15 minutes.");
}

function getSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var firstRow = sheet.getRange(1, 1, 1, SHEET_HEADERS.length).getValues()[0];
  var hasHeaders = firstRow.join("|") === SHEET_HEADERS.join("|");
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setValues([SHEET_HEADERS]);
  }
  return sheet;
}

function sendWelcomeEmail(email) {
  var subject = "You're on the ShureDesk waitlist";

  // Plain-text fallback, some inboxes and screen readers show this instead
  // of the HTML version, so it carries the same real content, not just a
  // one-line stub.
  var plainBody =
    "You're on the ShureDesk waitlist.\n\n" +
    "ShureDesk is one AI that answers your customers on live chat, WhatsApp, Instagram, " +
    "Facebook, and the phone, so you're never the one stuck replying at midnight.\n\n" +
    "What happens next:\n" +
    "- You're first in line when early access opens, before public pricing.\n" +
    "- You'll see real progress as it's built, in public, failures included.\n" +
    "- You get a real say in what ships next.\n\n" +
    "Know a business losing customers to slow replies? Send them the waitlist:\n" +
    WAITLIST_URL +
    "\n\n" +
    "Building this in public, one real feature at a time.\n" +
    "Shalom Adoyi, Founder, ShureDesk";

  var htmlBody =
    '<div style="background:#f5f7fc;padding:32px 16px;font-family:Georgia,\'Times New Roman\',serif;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">' +
    "<tr><td>" +
    // Wordmark
    '<div style="font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#0b0b10;margin-bottom:24px;">ShureDesk</div>' +
    // Card
    '<div style="background:#ffffff;border:1px solid #e1e6f2;border-radius:16px;padding:32px;">' +
    '<span style="display:inline-block;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:#2954eb;background:#eef2ff;border-radius:999px;padding:5px 12px;margin-bottom:20px;">Coming soon</span>' +
    '<h1 style="font-family:Georgia,serif;font-size:24px;line-height:1.3;color:#0b0b10;margin:0 0 16px;">You\'re on the list.</h1>' +
    '<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#3f3f46;margin:0 0 24px;">' +
    "ShureDesk is one AI that answers your customers on live chat, WhatsApp, Instagram, Facebook, " +
    "and the phone, so you're never the one stuck replying at midnight." +
    "</p>" +
    '<p style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:0.04em;text-transform:uppercase;color:#6b6b76;margin:0 0 12px;">What happens next</p>' +
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">' +
    emailListItem("You're first in line when early access opens, before public pricing.") +
    emailListItem("You'll see real progress as it's built, in public, failures included.") +
    emailListItem("You get a real say in what ships next.") +
    "</table>" +
    // Share callout
    '<div style="background:#eef2ff;border-radius:12px;padding:20px 22px;margin:0 0 28px;">' +
    '<p style="font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#0b0b10;margin:0 0 6px;">Know a business losing customers to slow replies?</p>' +
    '<p style="font-family:Arial,sans-serif;font-size:13.5px;line-height:1.55;color:#3f3f46;margin:0 0 16px;">Forward this, or send them straight to the waitlist. The more real businesses shape this, the better it gets for everyone on the list.</p>' +
    '<a href="' +
    WAITLIST_URL +
    '" style="display:inline-block;background:#2954eb;color:#ffffff;font-family:Arial,sans-serif;font-size:13.5px;font-weight:bold;text-decoration:none;border-radius:999px;padding:10px 20px;">Share the waitlist</a>' +
    "</div>" +
    '<p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#3f3f46;margin:0;">Building this in public, one real feature at a time.</p>' +
    '<p style="font-family:Georgia,serif;font-size:14px;color:#0b0b10;margin:16px 0 0;"><b>Shalom Adoyi</b><br><span style="font-family:Arial,sans-serif;font-size:12.5px;color:#a3a3ad;">Founder, ShureDesk</span></p>' +
    "</div>" +
    // Footer
    '<p style="font-family:Arial,sans-serif;font-size:12px;color:#a3a3ad;text-align:center;margin:20px 0 0;">You\'re receiving this because you joined the ShureDesk waitlist.</p>' +
    "</td></tr></table></div>";

  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody,
      name: "ShureDesk",
    });
    return true;
  } catch (err) {
    Logger.log("sendWelcomeEmail failed for " + email + ": " + err.message);
    return false;
  }
}

function emailListItem(text) {
  return (
    '<tr><td style="padding:0 0 10px;vertical-align:top;width:20px;">' +
    '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#2954eb;margin-top:7px;"></span>' +
    '</td><td style="padding:0 0 10px;font-family:Arial,sans-serif;font-size:14px;line-height:1.55;color:#3f3f46;">' +
    text +
    "</td></tr>"
  );
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
