import { formatINR, studio } from "@/config/studio";

export interface QuoteInput {
  category: string;
  packageId?: string | undefined;
  packageTier: string;
  packagePrice: number; // 0 for custom
  addOns: { name: string; price: number }[];
  durationDays: number;
  eventDate: string;
  location: string;
  notes: string;
  name: string;
  mobile: string;
  whatsapp: string;
  email: string;
}

export const CUSTOM_BASE = 20000; // base consultation estimate for custom packages
export const EXTRA_DAY_RATE = 0.35; // each extra day adds 35% of package price
export const groupFor = (cat: string) => {
  if (/Pre-Wedding/.test(cat)) return "Pre-Wedding";
  if (/^(Wedding|Cinematography)/.test(cat)) return "Wedding";
  if (/Birthday/.test(cat)) return "Birthday";
  if (/Engagement/.test(cat)) return "Engagement";
  if (/Event/.test(cat)) return "Events";
  return "Other Services";
};

export function calculateQuote(
  q: Pick<QuoteInput, "packageTier" | "packagePrice" | "addOns" | "durationDays">,
) {
  const base = q.packageTier === "Custom" ? CUSTOM_BASE : q.packagePrice;
  const extraDays = Math.max(0, Math.floor(q.durationDays || 1) - 1);
  const extraDaysCost = Math.round(base * EXTRA_DAY_RATE * extraDays);
  const addOnsTotal = q.addOns.reduce((s, a) => s + a.price, 0);
  return { base, extraDays, extraDaysCost, addOnsTotal, total: base + extraDaysCost + addOnsTotal };
}

export function buildWhatsAppMessage(q: QuoteInput) {
  const c = calculateQuote(q);
  const lines = [
    `Hello ${studio.name}, I'd like a quotation.`,
    "",
    `*Category:* ${q.category}`,
    `*Package:* ${q.packageTier}${q.packageTier !== "Custom" ? ` (${formatINR(c.base)})` : ""}`,
    `*Add-ons:* ${q.addOns.length ? q.addOns.map((a) => a.name).join(", ") : "None"}`,
    `*Event date:* ${q.eventDate}`,
    `*Location:* ${q.location}`,
    `*Duration:* ${q.durationDays} day(s)`,
    q.notes ? `*Notes:* ${q.notes}` : "",
    "",
    `*Name:* ${q.name}`,
    `*Mobile:* ${q.mobile}`,
    `*WhatsApp:* ${q.whatsapp}`,
    `*Email:* ${q.email}`,
    "",
    `*Estimated total:* ${formatINR(c.total)} (estimate, subject to studio confirmation)`,
  ];
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
}
