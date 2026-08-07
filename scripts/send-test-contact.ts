import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { notifyContact, smtpSettings, sender, recipients } from "../src/lib/mail";

// Sends one pretend enquiry, so the mail setup can be proved before it is
// trusted with a real visitor's message.
//
//   npx tsx scripts/send-test-contact.ts

async function main() {
  // SMTP_HOST is not listed: a Gmail address supplies its own.
  const missing = ["SMTP_USER", "SMTP_PASS", "CONTACT_NOTIFY_TO"].filter(
    (k) => !process.env[k],
  );
  if (missing.length) {
    console.error(`Not set in .env.local: ${missing.join(", ")}`);
    console.error(
      "Add them, then run again. The password is read from the file — never type it here.",
    );
    process.exit(1);
  }

  const settings = smtpSettings();
  if (!settings) {
    console.error(
      "SMTP_USER is not a Gmail address, so SMTP_HOST has to be set too.",
    );
    process.exit(1);
  }
  console.log(
    `Sending through ${settings.host}:${settings.port} as ${sender(settings)}\n` +
      `           to ${recipients().join(", ")} …`,
  );
  const sent = await notifyContact({
    name: "Test message",
    email: "visitor@example.com",
    message:
      "This is a test of the contact form. If it reached the inbox, the studio " +
      "will be notified whenever someone writes through the website.",
  });

  if (sent) {
    console.log(
      "Accepted by the mail server. Check the inbox — and the spam folder, in " +
        "case the first one lands there.",
    );
  } else {
    console.error("Not sent. The reason is printed above.");
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
