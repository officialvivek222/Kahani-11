import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getAdminContent, saveAdminContent } from "@/lib/studio.functions";
import { decodeContent, encodeContent } from "@/lib/studio-content";
import { studio } from "@/config/studio";
import type {
  AddOn,
  Category,
  Inquiry,
  Package,
  PortfolioItem,
  Quotation,
  Testimonial,
} from "@/types";

type ListApi<T> = {
  items: T[];
  upsert: (item: T) => Promise<void>;
  remove: (id: string) => Promise<void>;
};
interface Store {
  portfolio: ListApi<PortfolioItem>;
  categories: ListApi<Category>;
  packages: ListApi<Package>;
  addOns: ListApi<AddOn>;
  inquiries: ListApi<Inquiry>;
  quotations: ListApi<Quotation>;
  testimonials: ListApi<Testimonial>;
  settings: typeof initialSettings;
  setSettings: (s: typeof initialSettings) => Promise<void>;
}
const initialSettings = {
  name: studio.name as string,
  logoUrl: "",
  phone: studio.phone as string,
  whatsapp: studio.whatsapp as string,
  email: studio.email as string,
  address: studio.address as string,
  instagram: studio.social.instagram as string,
  facebook: studio.social.facebook as string,
  youtube: studio.social.youtube as string,
};
const Ctx = createContext<Store | null>(null);
export const adminContentOptions = queryOptions({
  queryKey: ["studio-admin"],
  queryFn: () => getAdminContent(),
  staleTime: 0,
});

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const { data } = useSuspenseQuery(adminContentOptions);
  const client = useQueryClient();
  const save = useServerFn(saveAdminContent);
  const content = decodeContent(data.content);
  const [overrides, setOverrides] = useState<Record<string, Record<string, unknown>>>({});
  const queue = useRef(Promise.resolve());
  type SaveInput = {
    kind:
      | "portfolio"
      | "categories"
      | "packages"
      | "addOns"
      | "testimonials"
      | "settings"
      | "inquiries"
      | "quotations";
    id: string;
    data?: unknown;
    remove?: boolean;
  };
  const persist = (input: SaveInput) => {
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        try {
          await save({ data: input });
          await client.invalidateQueries({ queryKey: ["studio-public"] });
          await client.invalidateQueries({ queryKey: ["studio-admin"] });
          toast.success("Saved");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Could not save");
          throw e;
        }
      });
    return queue.current;
  };
  const list = <T extends { id: string }>(kind: SaveInput["kind"], items: T[]): ListApi<T> => ({
    items: items.map((item) => ({ ...item, ...(overrides[kind]?.[item.id] as object) })),
    upsert: async (item) => {
      setOverrides((o) => ({ ...o, [kind]: { ...o[kind], [item.id]: item } }));
      try {
        const payload = kind === "quotations" || kind === "inquiries" ? item : encodeContent(item);
        await persist({ kind, id: item.id, data: payload });
      } catch {
        setOverrides((o) => ({ ...o, [kind]: {} }));
      }
    },
    remove: async (id) => {
      try {
        await persist({ kind, id, remove: true });
      } catch {
        /* Error shown by persist */
      }
    },
  });
  const inquiries = data.contacts.map((row) => {
    const d = (row.data as Record<string, unknown>) || {};
    return {
      ...(d as unknown as Inquiry),
      id: row.id,
      name: (d["name"] as string) || "Guest",
      phone: (d["phone"] as string) || (d["mobile"] as string) || "",
      email: (d["email"] as string) || "",
      category: (d["category"] as string) || "General",
      message: (d["message"] as string) || "",
      status: (row.status || d["status"] || "New") as Inquiry["status"],
      createdAt: row.created_at,
      eventDate: (d["eventDate"] as string) || (d["date"] as string) || "—",
    };
  });
  const quotations = data.quotes.map((row) => {
    const q = (row.data as Record<string, unknown>) || {};
    const addOns = Array.isArray(q["addOns"])
      ? (q["addOns"] as Array<{ name: string; price?: number }>)
      : [];
    const addOnsText = addOns.map((a) => a.name).join(", ");
    const basePrice =
      typeof q["basePrice"] === "number"
        ? (q["basePrice"] as number)
        : typeof q["packagePrice"] === "number"
          ? (q["packagePrice"] as number)
          : 0;
    const additionalServicesPrice =
      typeof q["additionalServicesPrice"] === "number"
        ? (q["additionalServicesPrice"] as number)
        : addOns.reduce((acc, a) => acc + (a.price || 0), 0);
    const discount = typeof q["discount"] === "number" ? (q["discount"] as number) : 0;
    const extraCharges = typeof q["extraCharges"] === "number" ? (q["extraCharges"] as number) : 0;
    const finalQuotation =
      typeof q["finalQuotation"] === "number" ? (q["finalQuotation"] as number) : row.estimate;
    const category = (q["category"] as string) || "Custom";
    const packageTier = (q["packageTier"] as string) || "Standard";

    return {
      id: row.id,
      customer: (q["name"] as string) || "Guest",
      phone: (q["mobile"] as string) || (q["phone"] as string) || "",
      whatsapp:
        (q["whatsapp"] as string) || (q["mobile"] as string) || (q["phone"] as string) || "",
      email: (q["email"] as string) || "",
      location: (q["location"] as string) || "Studio / On-location",
      notes: (q["notes"] as string) || "",
      addOns: addOnsText,
      addOnsList: addOns.map((a) => ({ name: a.name, price: a.price || 0 })),
      durationDays: (q["durationDays"] as number) || 1,
      packageName: `${category} · ${packageTier}`,
      category,
      packageTier,
      estimate: row.estimate,
      basePrice,
      additionalServicesPrice,
      discount,
      extraCharges,
      finalQuotation,
      internalNotes: (q["internalNotes"] as string) || "",
      history: Array.isArray(q["history"]) ? (q["history"] as QuotationRevision[]) : [],
      eventDate: (q["eventDate"] as string) || "—",
      status: (row.status || "Pending") as Quotation["status"],
      createdAt: row.created_at,
    };
  });
  const settings = {
    ...initialSettings,
    ...(data.content.find((r) => r.kind === "settings")?.data as object),
  };
  const value: Store = {
    portfolio: list("portfolio", content.portfolio),
    categories: list("categories", content.categories),
    packages: list("packages", content.packages),
    addOns: list("addOns", content.addOns),
    inquiries: list("inquiries", inquiries),
    quotations: list<Quotation>("quotations", quotations),
    testimonials: list("testimonials", content.testimonials),
    settings,
    setSettings: async (s) => {
      await persist({ kind: "settings", id: "studio", data: s });
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAdmin = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("AdminStoreProvider missing");
  return c;
};
export const newId = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
