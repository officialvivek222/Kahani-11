import { describe, expect, it } from "vitest";
import { calculateQuote, buildWhatsAppMessage, CUSTOM_BASE, groupFor } from "./quote";
import { waLink, normalizeWhatsAppNumber, formatWhatsAppDisplay } from "@/config/studio";

describe("groupFor", () => {
  it("correctly groups wedding and cinematography", () => {
    expect(groupFor("Wedding Photography")).toBe("Wedding");
    expect(groupFor("Cinematography")).toBe("Wedding");
  });
  it("prioritizes pre-wedding over unanchored cinematography", () => {
    expect(groupFor("Pre-Wedding Photography")).toBe("Pre-Wedding");
    expect(groupFor("Pre-Wedding Cinematography")).toBe("Pre-Wedding");
  });
  it("correctly groups other categories", () => {
    expect(groupFor("Birthday Photography")).toBe("Birthday");
    expect(groupFor("Engagement Photography")).toBe("Engagement");
    expect(groupFor("Event Photography")).toBe("Events");
    expect(groupFor("Portrait Photography")).toBe("Other Services");
    expect(groupFor("Maternity Photography")).toBe("Other Services");
  });
});

describe("calculateQuote", () => {
  it("adds package price and add-ons for a single day", () => {
    const r = calculateQuote({
      packageTier: "Premium",
      packagePrice: 100000,
      addOns: [{ name: "Drone", price: 18000 }],
      durationDays: 1,
    });
    expect(r.total).toBe(118000);
  });
  it("charges 35% of package per extra day", () => {
    const r = calculateQuote({
      packageTier: "Basic",
      packagePrice: 100000,
      addOns: [],
      durationDays: 3,
    });
    expect(r.extraDaysCost).toBe(70000);
    expect(r.total).toBe(170000);
  });
  it("uses custom base for custom packages", () => {
    expect(
      calculateQuote({ packageTier: "Custom", packagePrice: 0, addOns: [], durationDays: 1 }).total,
    ).toBe(CUSTOM_BASE);
  });
});

describe("buildWhatsAppMessage", () => {
  it("includes customer name and estimate disclaimer", () => {
    const m = buildWhatsAppMessage({
      category: "Wedding",
      packageTier: "Basic",
      packagePrice: 85000,
      addOns: [],
      durationDays: 1,
      eventDate: "2027-01-01",
      location: "Pune",
      notes: "",
      name: "Asha",
      mobile: "1",
      whatsapp: "1",
      email: "a@b.c",
    });
    expect(m).toContain("Asha");
    expect(m).toContain("subject to studio confirmation");
  });
});

describe("waLink and WhatsApp number helpers", () => {
  it("normalizes 10-digit Indian numbers with 91 prefix", () => {
    expect(normalizeWhatsAppNumber("9820011223")).toBe("919820011223");
    expect(normalizeWhatsAppNumber("+91 98200 11223")).toBe("919820011223");
  });

  it("formats display numbers cleanly", () => {
    expect(formatWhatsAppDisplay("918600454430")).toBe("+91 86004 54430");
    expect(formatWhatsAppDisplay()).toBe("+91 86004 54430");
  });

  it("generates wa.me link with normalized country code and encoded message", () => {
    const link = waLink("Hello Studio", "9820011223");
    expect(link).toBe("https://wa.me/919820011223?text=Hello%20Studio");
  });
});
