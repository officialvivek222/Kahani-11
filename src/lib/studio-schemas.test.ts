import { describe, expect, it } from "vitest";
import {
  contactInquirySchema,
  quoteInquirySchema,
  contentSchemas,
  settingsSchema,
  getMapSrc,
} from "./studio-schemas";
import { groupFor, calculateQuote } from "./quote";
describe("Saved studio inquiries", () => {
  it("validates contact details before storage", () => {
    expect(
      contactInquirySchema.safeParse({
        name: "Client",
        phone: "+91 90000 00001",
        email: "invalid",
        category: "Wedding",
        message: "Event inquiry",
      }).success,
    ).toBe(false);
  });
  it("requires full event details for quotes", () => {
    expect(
      quoteInquirySchema.safeParse({ category: "Wedding Photography", packageTier: "Premium" })
        .success,
    ).toBe(false);
  });
  it("rejects invalid package prices", () => {
    expect(
      contentSchemas.packages.safeParse({
        id: "p",
        group: "Wedding",
        tier: "Basic",
        price: -1,
        description: "",
        features: [],
        active: true,
      }).success,
    ).toBe(false);
  });
  it("accepts locations up to 120 characters matching the quote form", () => {
    const validQuote = {
      category: "Wedding Photography",
      packageTier: "Premium",
      packagePrice: 162000,
      addOns: [{ name: "Drone Photography", price: 18000 }],
      durationDays: 1,
      eventDate: "2027-02-14",
      location:
        "Grand Ballroom, The Taj Mahal Palace & Tower Hotel, Apollo Bunder, Colaba, Mumbai, Maharashtra 400001 (115 chars)",
      notes: "",
      name: "Client Name",
      mobile: "+919876543210",
      whatsapp: "+919876543210",
      email: "client@example.com",
    };
    expect(quoteInquirySchema.safeParse(validQuote).success).toBe(true);
  });
  it("rejects past event dates for quote inquiries", () => {
    const quote = {
      category: "Wedding Photography",
      packageTier: "Premium",
      packagePrice: 162000,
      addOns: [],
      durationDays: 1,
      eventDate: "2020-01-01",
      location: "Mumbai",
      notes: "",
      name: "Client Name",
      mobile: "+919876543210",
      whatsapp: "+919876543210",
      email: "client@example.com",
    };
    expect(quoteInquirySchema.safeParse(quote).success).toBe(false);
  });
  it("keeps server and client quote calculations consistent", () => {
    expect(groupFor("Wedding Photography")).toBe("Wedding");
    expect(
      calculateQuote({
        packageTier: "Premium",
        packagePrice: 162000,
        addOns: [{ name: "Drone Photography", price: 18000 }],
        durationDays: 1,
      }).total,
    ).toBe(180000);
  });

  it("validates settingsSchema with optional mapEmbed", () => {
    const valid = {
      name: "Kahani Studio",
      logoUrl: "",
      phone: "+91 86004 54430",
      whatsapp: "918600454430",
      email: "info@kahanistudio.in",
      address: "14 Linking Road, Bandra, Mumbai",
      instagram: "https://instagram.com/kahani",
      youtube: "https://youtube.com/kahani",
      mapEmbed: '<iframe src="https://www.google.com/maps/embed?pb=123"></iframe>',
    };
    expect(settingsSchema.safeParse(valid).success).toBe(true);
    // mapEmbed omitted is also valid
    const { mapEmbed: _, ...withoutMap } = valid;
    expect(settingsSchema.safeParse(withoutMap).success).toBe(true);
  });

  it("extracts and validates google map embed URLs correctly with getMapSrc", () => {
    // Full iframe HTML
    const iframe =
      '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.4" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>';
    expect(getMapSrc(iframe)).toBe("https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.4");

    // Direct embed URL
    expect(getMapSrc("https://www.google.com/maps/embed?pb=!1m18!1m12!1m3")).toBe(
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3",
    );

    // Old-style maps output=embed
    expect(getMapSrc("https://maps.google.com/maps?q=Bandra&output=embed")).toBe(
      "https://maps.google.com/maps?q=Bandra&output=embed",
    );

    // Rejects share links
    expect(getMapSrc("https://maps.app.goo.gl/abcdef123")).toBeNull();
    expect(getMapSrc("https://goo.gl/maps/xyz")).toBeNull();

    // Rejects non-embed URLs and untrusted domains
    expect(getMapSrc("https://example.com/map")).toBeNull();
    expect(getMapSrc('<script>alert("xss")</script>')).toBeNull();
    expect(getMapSrc("")).toBeNull();
    expect(getMapSrc(null)).toBeNull();
    expect(getMapSrc(undefined)).toBeNull();
  });
});
