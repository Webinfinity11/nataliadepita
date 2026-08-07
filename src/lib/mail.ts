import nodemailer from "nodemailer";

export type ContactNote = { name: string; email: string; message: string };

// A subject line lives in a mail header, so a newline smuggled through the
// name field would let a sender forge headers of their own. Fold any control
// character down to a space.
function headerSafe(value: string): string {
  return value.replace(/[\r\n\t\v\f -]+/g, " ").trim();
}

export function contactNotification(note: ContactNote): {
  subject: string;
  text: string;
} {
  const name = headerSafe(note.name) || "someone";
  return {
    subject: `Website enquiry from ${name}`,
    // Plain text on purpose: nothing a stranger types can become markup.
    text: [
      `${name} wrote through nataliadepita.com:`,
      "",
      note.message,
      "",
      "—",
      `Reply to: ${note.email}`,
      "The message is also kept under Admin → Messages.",
    ].join("\n"),
  };
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

  const { subject, text } = contactNotification(note);
  try {
    await nodemailer.createTransport(settings).sendMail({
      from: sender(settings),
      to,
      // So hitting reply in the inbox answers the visitor, not the robot.
      replyTo: note.email,
      subject,
      text,
    });
    return true;
  } catch (e) {
    console.error("Contact notification failed:", e);
    return false;
  }
}
