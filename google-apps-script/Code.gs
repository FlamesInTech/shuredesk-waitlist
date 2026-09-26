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
  var body =
    "Hey,\n\n" +
    "Thanks for joining the ShureDesk waitlist. We'll email you the moment early access opens.\n\n" +
    "We're building this in public, so you'll see real progress along the way, not just a countdown.\n\n" +
    "Talk soon,\n" +
    "The ShureDesk team";

  try {
    MailApp.sendEmail(email, subject, body);
    return true;
  } catch (err) {
    Logger.log("sendWelcomeEmail failed for " + email + ": " + err.message);
    return false;
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
