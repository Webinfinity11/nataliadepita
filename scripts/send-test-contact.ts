import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { notifyContact } from "../src/lib/mail";

// Sends one pretend enquiry, so the mail setup can be proved before it is
// trusted with a real visitor's message.
//
//   npx tsx scripts/send-test-contact.ts

async function main() {
  const missing = ["RESEND_API_KEY", "CONTACT_NOTIFY_TO"].filter(
    (k) => !process.env[k],
  );
  if (missing.length) {
    console.error(`Not set in .env.local: ${missing.join(", ")}`);
    console.error(
      "Add them, then run again. The key is read from the file — never type it here.",
    );
    process.exit(1);
  }

  console.log(`Sending a test enquiry to ${process.env.CONTACT_NOTIFY_TO} …`);
  const sent = await notifyContact({
    name: "Test message",
    email: "visitor@example.com",
    message:
      "This is a test of the contact form. If it reached the inbox, the studio " +
      "will be notified whenever someone writes through the website.",
  });

  if (sent) {
    console.log(
      "Accepted by Resend. Check the inbox — and the spam folder, in case the " +
        "first one lands there.",
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
