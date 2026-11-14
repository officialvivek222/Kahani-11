import { describe, expect, it } from "vitest";
import { contactInquirySchema, quoteInquirySchema, contentSchemas } from "./studio-schemas";
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
});
