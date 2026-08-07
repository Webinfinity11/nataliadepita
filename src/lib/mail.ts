import nodemailer from "nodemailer";

export type ContactNote = { name: string; email: string; message: string };

// A subject line lives in a mail header, so a newline smuggled through the
// name field would let a sender forge headers of their own. Fold any control
// character down to a space.
function headerSafe(value: string): string {
  return value.replace(/[\r\n\t\v\f -]+/g, " ").trim();
}

// Nothing a stranger types may become markup, so every value the visitor
// controls is escaped before it goes anywhere near the HTML part.
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function contactNotification(note: ContactNote): {
  subject: string;
  text: string;
  html: string;
} {
  const name = headerSafe(note.name) || "someone";
  return {
    subject: `Website enquiry from ${name}`,
    // The plain part is what reaches a phone's lock screen and any client that
    // refuses HTML, so it has to carry the whole enquiry on its own.
    text: [
      "NEW ENQUIRY — nataliadepita.com",
      "",
      `From:    ${name}`,
      `Email:   ${note.email}`,
      "",
      "Message",
      note.message,
      "",
      "—",
      `Reply straight to this email and ${name} receives it.`,
      "The enquiry is also kept under Admin → Messages.",
    ].join("\n"),
    html: contactHtml(name, note),
  };
}

// Email clients are twenty years behind browsers: tables for layout, colours
// spelled out on every element, no stylesheet, no flexbox. Kept in the site's
// own palette so the studio recognises it at a glance.
function contactHtml(name: string, note: ContactNote): string {
  const field = (label: string, value: string) => `
      <tr>
        <td style="padding:0 0 4px 0;font:500 11px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#827E76;">${label}</td>
      </tr>
      <tr>
        <td style="padding:0 0 18px 0;font:400 16px/1.5 Georgia,'Times New Roman',serif;color:#1A1815;">${value}</td>
      </tr>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Website enquiry</title></head>
<body style="margin:0;padding:0;background:#F4F3F0;">
  <!-- Shown by some clients under the subject, before the mail is opened. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(
    note.message.slice(0, 120),
  )}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F3F0;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FAFAF8;border:1px solid #E8E6E1;">
        <tr>
          <td style="padding:32px 32px 24px 32px;border-bottom:1px solid #E8E6E1;">
            <p style="margin:0 0 10px 0;font:500 11px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#827E76;">New enquiry</p>
            <p style="margin:0;font:400 26px/1.25 Georgia,'Times New Roman',serif;color:#1A1815;">nataliadepita.com</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 6px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${field("From", esc(name))}
              ${field(
                "Email",
                `<a href="mailto:${esc(note.email)}" style="color:#8C4F35;text-decoration:none;border-bottom:1px solid #E3C0A9;">${esc(note.email)}</a>`,
              )}
              ${field(
                "Message",
                `<span style="white-space:pre-wrap;">${esc(note.message)}</span>`,
              )}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 32px 32px 32px;">
            <a href="mailto:${esc(note.email)}?subject=${encodeURIComponent(
              `Re: your message to Natalia de Pita Amirejibi`,
            )}" style="display:inline-block;background:#1A1815;color:#FAFAF8;font:500 12px/1 Helvetica,Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;padding:15px 26px;text-decoration:none;">Reply to ${esc(name)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 22px 32px;border-top:1px solid #E8E6E1;font:400 13px/1.6 Helvetica,Arial,sans-serif;color:#827E76;">
            Replying to this email answers ${esc(name)} directly.<br>
            The enquiry is also kept under Admin → Messages.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
};

// Any mailbox that speaks SMTP will do — a Gmail account with an app password,
// Brevo, Mailjet, or a mailbox on the studio's own domain. Nothing here is
// tied to one provider, so moving between them is four settings, not a
// rewrite. Returns null when the site has not been given an account to send
// from, which is not an error: the enquiry is still stored either way.
type Env = Record<string, string | undefined>;

export function smtpSettings(env: Env = process.env): SmtpSettings | null {
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS;
  // A Gmail address can only be sent through Gmail's own server, so making
  // someone look up a hostname they have no choice about is two settings of
  // pure ceremony. An explicit SMTP_HOST still wins.
  const host =
    env.SMTP_HOST?.trim() ||
    (/@(?:gmail|googlemail)\.com$/i.test(user ?? "") ? "smtp.gmail.com" : "");
  if (!host || !user || !pass) return null;
  // 465 is implicit TLS; 587 and 25 open in the clear and are upgraded with
  // STARTTLS, which nodemailer does on its own when secure is false.
  const port = Number(env.SMTP_PORT) || 587;
  return { host, port, secure: port === 465, auth: { user, pass } };
}

// Who the notification appears to come from. Most providers refuse to send as
// an address the account does not own, so the authenticated mailbox is the
// safe default.
export function sender(settings: SmtpSettings, env: Env = process.env): string {
  return env.CONTACT_FROM?.trim() || settings.auth.user;
}

export function recipients(env: Env = process.env): string[] {
  // Comma-separated, so the studio address can be added alongside whoever is
  // watching the inbox today without anyone having to edit this file.
  return (env.CONTACT_NOTIFY_TO ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

// Delivers the enquiry to the studio's inbox. Returns whether it went out — the
// caller stores the message either way, so a missing password or a provider
// outage costs a notification, never the enquiry itself.
export async function notifyContact(note: ContactNote): Promise<boolean> {
  const settings = smtpSettings();
  const to = recipients();
  if (!settings || !to.length) return false;

  const { subject, text, html } = contactNotification(note);
  try {
    await nodemailer.createTransport(settings).sendMail({
      from: sender(settings),
      to,
      // So hitting reply in the inbox answers the visitor, not the robot.
      replyTo: note.email,
      subject,
      text,
      html,
    });
    return true;
  } catch (e) {
    console.error("Contact notification failed:", e);
    return false;
  }
}
