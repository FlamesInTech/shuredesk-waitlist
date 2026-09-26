/**
 * ShureDesk waitlist — Google Apps Script Web App.
 *
 * Receives a POST from the Cloudflare Pages Function (functions/api/waitlist.js),
 * appends a row to this spreadsheet, and sends the submitter a confirmation
 * email automatically. Deploy as a Web App (Deploy > New deployment > Web app),
 * execute as "Me", access "Anyone".
 *
 * Sheet must have this header row (row 1), exactly:
 *   Timestamp | Email | Source
 */

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

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Dedupe: don't add the same email twice, don't re-send the welcome email
    // to someone who already signed up.
    var existing = sheet.getDataRange().getValues();
    for (var i = 1; i < existing.length; i++) {
      if (String(existing[i][1]).toLowerCase() === email) {
        return jsonResponse({ ok: true, alreadyJoined: true });
      }
    }

    var now = new Date();
    sheet.appendRow([now, email, source]);

    sendWelcomeEmail(email);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, message: "Server error: " + err.message });
  }
}

function doGet(e) {
  return jsonResponse({ ok: true, message: "ShureDesk waitlist endpoint is live." });
}

function sendWelcomeEmail(email) {
  var subject = "You're on the ShureDesk waitlist";
  var body =
    "Hey,\n\n" +
    "Thanks for joining the ShureDesk waitlist. We'll email you the moment early access opens.\n\n" +
    "We're building this in public, so you'll see real progress along the way, not just a countdown.\n\n" +
    "Talk soon,\n" +
    "The ShureDesk team";

  MailApp.sendEmail(email, subject, body);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
