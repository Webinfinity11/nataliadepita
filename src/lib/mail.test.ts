import { describe, it, expect } from "vitest";
import { contactNotification } from "./mail";

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
