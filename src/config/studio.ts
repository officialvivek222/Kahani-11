import { createContext, useContext } from "react";
// Central business configuration. Edit studio details here only.
export const studio = {
  name: "KAHANI STUDIO",
  shortName: "Kahani",
  tagline: "Every Picture Has a Story.",
  phone: "+91 86004 54430",
  whatsapp: "918600454430", // international format, digits only — used for wa.me links
  email: "sangketpatil372@gmail.com",
  address: "2nd Floor, 14 Linking Road, Bandra West, Mumbai 400050",
  hours: "Mon – Sat, 10am – 7pm",
  social: {
    instagram: "https://www.instagram.com/kahani_photography_?bqrl=Mno1OWY1eDRmMXZw",
    youtube: "https://youtube.com/@newbhagvabandbhadagaon?si=MBh8smlpTfyMOxUN",
    facebook: "",
  },
  instagramHandle: "@kahani_photography_",
  currency: "INR",
  mapEmbed: "",
} as const;
export type StudioDetails = {
  name: string;
  shortName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  social: { instagram: string; youtube: string; facebook?: string };
  instagramHandle: string;
  currency: string;
  mapEmbed?: string;
};
export const StudioDetailsContext = createContext<StudioDetails>(studio);
export const useStudio = () => useContext(StudioDetailsContext);
export function studioFromSettings(value: unknown): StudioDetails {
  const s = (value ?? {}) as Record<string, string>;
  return {
    ...studio,
    name: s["name"] ?? studio.name,
    phone: s["phone"] ?? studio.phone,
    whatsapp: s["whatsapp"] ?? studio.whatsapp,
    email: s["email"] ?? studio.email,
    address: s["address"] ?? studio.address,
    social: {
      instagram: s["instagram"] ?? studio.social.instagram,
      youtube: s["youtube"] ?? studio.social.youtube,
      facebook: s["facebook"] ?? "",
    },
    mapEmbed: s["mapEmbed"] ?? "",
  };
}

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export const normalizeWhatsAppNumber = (num: string = studio.whatsapp) => {
  const digits = num.replace(/\D/g, "");
  if (!digits) return studio.whatsapp;
  return digits.length === 10 ? `91${digits}` : digits;
};

export const formatWhatsAppDisplay = (num: string = studio.whatsapp) => {
  const clean = normalizeWhatsAppNumber(num);
  if (clean.startsWith("91") && clean.length === 12) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  return `+${clean}`;
};

export const waLink = (message?: string, number: string = studio.whatsapp) =>
  `https://wa.me/${normalizeWhatsAppNumber(number)}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
