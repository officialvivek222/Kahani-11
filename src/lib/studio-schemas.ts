import { z } from "zod";
const text = z.string().trim().max(1000);
const name = z.string().trim().min(1).max(100);
const phone = z
  .string()
  .trim()
  .regex(/^[+\d\s-]{8,16}$/, "Enter a valid phone number");
const features = z.array(text).max(50);
const price = z.number().int().min(0).max(100000000);
const image = z
  .string()
  .max(2048)
  .refine(
    (v) =>
      v.startsWith("image:") ||
      /^https:\/\//.test(v) ||
      v.startsWith("/assets/") ||
      v.startsWith("/src/assets/"),
    "Choose a valid image",
  );
export const contentSchemas = {
  categories: z.object({
    id: name,
    slug: name,
    name,
    short: name,
    description: text,
    image,
    active: z.boolean(),
    features,
  }),
  portfolio: z.object({
    id: name,
    title: name,
    location: text,
    category: z.enum(["Wedding", "Pre-Wedding", "Engagement", "Events", "Portraits"]),
    image,
    ratio: z.enum(["portrait", "landscape", "square"]),
    featured: z.boolean(),
  }),
  packages: z.object({
    id: name,
    group: z.enum(["Wedding", "Pre-Wedding", "Birthday", "Engagement", "Events", "Other Services"]),
    tier: z.enum(["Basic", "Premium", "Luxury"]),
    price,
    description: text,
    features,
    active: z.boolean(),
  }),
  addOns: z.object({ id: name, name, price, description: text, active: z.boolean() }),
  testimonials: z.object({
    id: name,
    name,
    event: text,
    rating: z.number().int().min(1).max(5),
    review: text.min(1),
    published: z.boolean(),
  }),
};
export const settingsSchema = z.object({
  name,
  logoUrl: z.string().max(2048),
  phone,
  whatsapp: z.string().regex(/^\d{8,16}$/),
  email: z.string().email().max(255),
  address: text,
  instagram: z.string().url().max(2048),
  facebook: z.string().url().max(2048),
  youtube: z.string().url().max(2048),
});
export const contactInquirySchema = z.object({
  name: name.min(2),
  phone,
  email: z.string().trim().email().max(255),
  category: name,
  message: text.min(5),
});
export const quoteInquirySchema = z.object({
  category: name,
  packageTier: z.enum(["Basic", "Premium", "Luxury", "Custom"]),
  packagePrice: price,
  addOns: z.array(z.object({ name, price })).max(20),
  durationDays: z.number().int().min(1).max(10),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  location: z.string().trim().min(2).max(120),
  notes: text,
  name: name.min(2),
  mobile: phone,
  whatsapp: phone,
  email: z.string().trim().email().max(255),
});
export const inquiryStatuses = z.enum([
  "New",
  "Contacted",
  "Follow-up",
  "Quotation Sent",
  "Converted",
  "Cancelled",
]);
export const quotationStatuses = z.enum(["Pending", "Sent", "Accepted", "Declined"]);
