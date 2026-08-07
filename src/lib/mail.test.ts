import { describe, it, expect } from "vitest";
import {
  contactNotification,
  smtpSettings,
  sender,
  recipients,
} from "./mail";

describe("smtpSettings", () => {
  const account: Record<string, string | undefined> = {
    SMTP_HOST: "smtp.gmail.com",
    SMTP_USER: "studio@example.com",
    SMTP_PASS: "app password",
  };

  it("defaults to the submission port, upgraded with STARTTLS", () => {
    expect(smtpSettings(account)).toMatchObject({ port: 587, secure: false });
  });

  it("uses implicit TLS on 465", () => {
    expect(smtpSettings({ ...account, SMTP_PORT: "465" })).toMatchObject({
      port: 465,
      secure: true,
    });
  });

  it("stays silent rather than half-configured", () => {
    expect(smtpSettings({})).toBeNull();
    expect(smtpSettings({ ...account, SMTP_PASS: undefined })).toBeNull();
  });

  it("knows where a Gmail address has to be sent from", () => {
    expect(
      smtpSettings({ SMTP_USER: "studio@gmail.com", SMTP_PASS: "x" }),
    ).toMatchObject({ host: "smtp.gmail.com", port: 587 });
    // Any other address still has to say where it sends from.
    expect(
      smtpSettings({ SMTP_USER: "studio@example.com", SMTP_PASS: "x" }),
    ).toBeNull();
    // …and a host given explicitly is never second-guessed.
    expect(
      smtpSettings({
        SMTP_HOST: "smtp-relay.brevo.com",
        SMTP_USER: "studio@gmail.com",
        SMTP_PASS: "x",
      }),
    ).toMatchObject({ host: "smtp-relay.brevo.com" });
  });

  it("sends as the authenticated mailbox unless told otherwise", () => {
    const s = smtpSettings(account)!;
    expect(sender(s, {})).toBe("studio@example.com");
    expect(sender(s, { CONTACT_FROM: "Studio <hello@example.com>" })).toBe(
      "Studio <hello@example.com>",
    );
  });
});

describe("recipients", () => {
  it("reads a comma-separated list and ignores the gaps", () => {
    expect(recipients({ CONTACT_NOTIFY_TO: "a@x.com, ,b@x.com " })).toEqual([
      "a@x.com",
      "b@x.com",
    ]);
    expect(recipients({})).toEqual([]);
  });
});

describe("contactNotification", () => {
  it("names the sender in the subject", () => {
    const { subject } = contactNotification({
      name: "Nino Kapanadze",
      email: "nino@example.com",
      message: "Is the Batumi mosaic documented anywhere?",
    });
    expect(subject).toBe("Website enquiry from Nino Kapanadze");
  });

  it("keeps a forged header out of the subject", () => {
    const { subject } = contactNotification({
      name: "Nino\r\nBcc: everyone@example.com",
      email: "nino@example.com",
      message: "hi",
    });
    expect(subject).toBe(
      "Website enquiry from Nino Bcc: everyone@example.com",
    );
    expect(subject).not.toContain("\n");
    expect(subject).not.toContain("\r");
  });

  it("carries the message and the sender's address in the body", () => {
    const { text } = contactNotification({
      name: "Nino",
      email: "nino@example.com",
      message: "Line one.\nLine two.",
    });
    expect(text).toContain("Line one.\nLine two.");
    expect(text).toContain("nino@example.com");
  });

  it("falls back when a name is somehow blank", () => {
    const { subject } = contactNotification({
      name: "   ",
      email: "nino@example.com",
      message: "hi",
    });
    expect(subject).toBe("Website enquiry from someone");
  });
});
