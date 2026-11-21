import { supabase } from "@/integrations/supabase/client";
import {
  contentSchemas,
  settingsSchema,
  contactInquirySchema,
  quoteInquirySchema,
  inquiryStatuses,
  quotationStatuses,
} from "./studio-schemas";
import type { Json } from "@/integrations/supabase/types";

export async function getPublicContent() {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from("studio_content")
      .select("kind,id,data")
      .order("created_at")
      .order("id");
    if (!error && data) return data;
    if (attempt < 2) await new Promise((res) => setTimeout(res, 500));
  }
  throw new Error("Studio content unavailable");
}

export async function getAdminContent() {
  const { data: sessionResp } = await supabase.auth.getSession();
  const userId = sessionResp?.session?.user?.id;
  if (!userId) throw new Error("Studio administrator access required");

  const [roleResp, content, contacts, quotes, profile] = await Promise.all([
    (supabase.rpc as any)("has_role", {
      _user_id: userId,
      _role: "admin",
    }),
    supabase
      .from("studio_content")
      .select("kind,id,data")
      .order("created_at")
      .order("id"),
    supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }),
    supabase.from("quote_submissions").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").eq("id", userId).single(),
  ]);

  if (!roleResp.data) throw new Error("Studio administrator access required");
  if (content.error || contacts.error || quotes.error || profile.error)
    throw new Error("Could not load studio data");

  return {
    content: content.data,
    contacts: contacts.data,
    quotes: quotes.data,
    profile: profile.data,
  };
}

export async function saveAdminContent(input: {
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
}) {
  const { data: userResp } = await supabase.auth.getUser();
  const userId = userResp?.user?.id;
  if (!userId) throw new Error("Studio administrator access required");

  const { data: allowed } = await (supabase.rpc as any)("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!allowed) throw new Error("Studio administrator access required");

  if (input.kind === "inquiries" || input.kind === "quotations") {
    const table = input.kind === "inquiries" ? "contact_submissions" : "quote_submissions";
    if (input.remove) {
      const result = await supabase.from(table).delete().eq("id", input.id);
      if (result.error) throw new Error("Could not delete submission");
    } else if (input.kind === "quotations") {
      const { data: existing } = await supabase
        .from("quote_submissions")
        .select("data, estimate")
        .eq("id", input.id)
        .single();
      const prevData = (existing?.data as Record<string, unknown>) || {};
      const incoming = (input.data as Record<string, unknown>) || {};
      const rawStatus = incoming["status"];
      const normalizedStatus =
        typeof rawStatus === "string"
          ? quotationStatuses.options.find(
              (s) => s.toLowerCase() === rawStatus.trim().toLowerCase(),
            ) ?? rawStatus
          : rawStatus;
      const status = quotationStatuses.parse(normalizedStatus);
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
      const result = await supabase
        .from("quote_submissions")
        .update({
          status,
          estimate: finalEstimate,
          data: updatedData as unknown as Json,
        })
        .eq("id", input.id);
      if (result.error) throw new Error("Could not save quotation");
    } else {
      const { data: existing } = await supabase
        .from("contact_submissions")
        .select("data")
        .eq("id", input.id)
        .single();
      const prevData = (existing?.data as Record<string, unknown>) || {};
      const incoming = (input.data as Record<string, unknown>) || {};
      const rawStatus = incoming["status"];
      const normalizedStatus =
        typeof rawStatus === "string"
          ? inquiryStatuses.options.find(
              (s) => s.toLowerCase() === rawStatus.trim().toLowerCase(),
            ) ?? rawStatus
          : rawStatus;
      const status = inquiryStatuses.parse(normalizedStatus);
      const updatedData = { ...prevData, ...incoming, status };
      const result = await supabase
        .from("contact_submissions")
        .update({
          status,
          data: updatedData as unknown as Json,
        })
        .eq("id", input.id);
      if (result.error) throw new Error("Could not save inquiry");
    }
  } else {
    const parsed = input.remove
      ? null
      : (input.kind === "settings" ? settingsSchema : contentSchemas[input.kind]).parse(input.data);
    const result = input.remove
      ? await supabase.from("studio_content").delete().eq("kind", input.kind).eq("id", input.id)
      : await supabase
          .from("studio_content")
          .upsert({ kind: input.kind, id: input.id, data: parsed as Json });
    if (result.error) throw new Error("Could not save studio content");
  }
  return { saved: true };
}

export async function submitContact(args: { data: unknown }) {
  const parsed = contactInquirySchema.parse(args.data);
  const { data, error } = await supabase.functions.invoke("submit-contact", {
    body: parsed,
  });
  if (error) {
    throw new Error(error.message || "Could not save your inquiry. Please try again.");
  }
  return data;
}

export async function submitQuote(args: { data: unknown }) {
  const parsed = quoteInquirySchema.parse(args.data);
  const { data, error } = await supabase.functions.invoke("submit-quote", {
    body: parsed,
  });
  if (error) {
    throw new Error(error.message || "Could not save your quotation. Please try again.");
  }
  return data;
}
