import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  contentSchemas,
  settingsSchema,
  contactInquirySchema,
  quoteInquirySchema,
  inquiryStatuses,
  quotationStatuses,
} from "./studio-schemas";
import { calculateQuote, groupFor } from "./quote";
import type { Database, Json } from "@/integrations/supabase/types";

export const getPublicContent = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Studio content unavailable");
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await client
    .from("studio_content")
    .select("kind,id,data")
    .order("created_at");
  if (error) throw new Error("Studio content unavailable");
  return data;
});
export const getAdminContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: allowed } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!allowed) throw new Error("Studio administrator access required");
    const [content, contacts, quotes, profile] = await Promise.all([
      context.supabase.from("studio_content").select("kind,id,data").order("created_at"),
      context.supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("quote_submissions")
        .select("*")
        .order("created_at", { ascending: false }),
      context.supabase.from("profiles").select("*").eq("id", context.userId).single(),
    ]);
    if (content.error || contacts.error || quotes.error || profile.error)
      throw new Error("Could not load studio data");
    return {
      content: content.data,
      contacts: contacts.data,
      quotes: quotes.data,
      profile: profile.data,
    };
  });
function getClientIp(): string {
  const cf = getRequestHeader("cf-connecting-ip");
  if (cf) return cf;
  const forwarded = getRequestHeader("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  const real = getRequestHeader("x-real-ip");
  if (real) return real;
  return "unknown";
}

export const saveAdminContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        kind: z.enum([
          "portfolio",
          "categories",
          "packages",
          "addOns",
          "testimonials",
          "settings",
          "inquiries",
          "quotations",
        ]),
        id: z.string().min(1).max(100),
        data: z.unknown().optional(),
        remove: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!allowed) throw new Error("Studio administrator access required");
    if (data.kind === "inquiries" || data.kind === "quotations") {
      const table = data.kind === "inquiries" ? "contact_submissions" : "quote_submissions";
      if (data.remove) {
        const result = await context.supabase.from(table).delete().eq("id", data.id);
        if (result.error) throw new Error("Could not delete submission");
      } else if (data.kind === "quotations") {
        const { data: existing } = await context.supabase
          .from("quote_submissions")
          .select("data, estimate")
          .eq("id", data.id)
          .single();
        const prevData = (existing?.data as Record<string, unknown>) || {};
        const incoming = (data.data as Record<string, unknown>) || {};
        const status = quotationStatuses.parse(incoming["status"]);
        const updatedData: Record<string, unknown> = {
          ...prevData,
          ...incoming,
          status,
        };
        const finalEstimate =
          typeof incoming["finalQuotation"] === "number"
            ? Math.round(incoming["finalQuotation"] as number)
            : typeof incoming["estimate"] === "number"
              ? Math.round(incoming["estimate"] as number)
              : (existing?.estimate ?? 0);
        const result = await context.supabase
          .from("quote_submissions")
          .update({
            status,
            estimate: finalEstimate,
            data: updatedData as unknown as Json,
          })
          .eq("id", data.id);
        if (result.error) throw new Error("Could not save quotation");
      } else {
        const { data: existing } = await context.supabase
          .from("contact_submissions")
          .select("data")
          .eq("id", data.id)
          .single();
        const prevData = (existing?.data as Record<string, unknown>) || {};
        const incoming = (data.data as Record<string, unknown>) || {};
        const status = inquiryStatuses.parse(incoming["status"]);
        const updatedData = { ...prevData, ...incoming, status };
        const result = await context.supabase
          .from("contact_submissions")
          .update({
            status,
            data: updatedData as unknown as Json,
          })
          .eq("id", data.id);
        if (result.error) throw new Error("Could not save inquiry");
      }
    } else {
      const parsed = data.remove
        ? null
        : (data.kind === "settings" ? settingsSchema : contentSchemas[data.kind]).parse(data.data);
      const result = data.remove
        ? await context.supabase
            .from("studio_content")
            .delete()
            .eq("kind", data.kind)
            .eq("id", data.id)
        : await context.supabase
            .from("studio_content")
            .upsert({ kind: data.kind, id: data.id, data: parsed as Json });
      if (result.error) throw new Error("Could not save studio content");
    }
    return { saved: true };
  });
export const submitContact = createServerFn({ method: "POST" })
  .validator((input: unknown) => contactInquirySchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = getClientIp();
    if (ip !== "unknown" || process.env["NODE_ENV"] === "production") {
      const { data: allowed, error: rateError } = await supabaseAdmin.rpc("allow_inquiry", {
        _key: `inquiry:${ip}`,
      });
      if (rateError || !allowed) throw new Error("Too many inquiries. Please try again later.");
    }
    const { data: row, error } = await supabaseAdmin
      .from("contact_submissions")
      .insert({ data })
      .select("id")
      .single();
    if (error) throw new Error("Could not save your inquiry. Please try again.");
    return { id: row.id };
  });
export const submitQuote = createServerFn({ method: "POST" })
  .validator((input: unknown) => quoteInquirySchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error: contentError } = await supabaseAdmin
      .from("studio_content")
      .select("kind,data")
      .in("kind", ["categories", "packages", "addOns"]);
    if (contentError || !rows) throw new Error("Could not confirm current prices");
    const cats = rows
      .filter((r) => r.kind === "categories")
      .map((r) => contentSchemas.categories.parse(r.data));
    if (!cats.some((c) => c.active && c.name === data.category))
      throw new Error("Choose an available category");
    const pkgs = rows
      .filter((r) => r.kind === "packages")
      .map((r) => contentSchemas.packages.parse(r.data));
    const pkg = pkgs.find(
      (p) => p.active && p.group === groupFor(data.category) && p.tier === data.packageTier,
    );
    if (data.packageTier !== "Custom" && !pkg) throw new Error("Choose an available package");
    const extras = rows
      .filter((r) => r.kind === "addOns")
      .map((r) => contentSchemas.addOns.parse(r.data));
    const uniqueNames = [...new Set(data.addOns.map((a) => a.name))];
    const addOns = uniqueNames.map((name) => {
      const a = extras.find((a) => a.active && a.name === name);
      if (!a) throw new Error("Choose an available add-on");
      return { name: a.name, price: a.price };
    });
    const verified = { ...data, packagePrice: pkg?.price ?? 0, addOns };
    const estimate = calculateQuote(verified).total;
    const ip = getClientIp();
    if (ip !== "unknown" || process.env["NODE_ENV"] === "production") {
      const { data: allowed, error: rateError } = await supabaseAdmin.rpc("allow_inquiry", {
        _key: `inquiry:${ip}`,
      });
      if (rateError || !allowed) throw new Error("Too many inquiries. Please try again later.");
    }
    const { data: row, error } = await supabaseAdmin
      .from("quote_submissions")
      .insert({ data: verified, estimate })
      .select("id")
      .single();
    if (error) throw new Error("Could not save your quotation. Please try again.");
    return { id: row.id, estimate };
  });
