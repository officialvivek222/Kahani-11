import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const quoteInquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  mobile: z.string().trim().regex(/^[+\d\s-]{8,16}$/, "Enter a valid mobile number"),
  whatsapp: z.string().trim().regex(/^[+\d\s-]{8,16}$/, "Enter a valid WhatsApp number"),
  email: z.string().trim().email("Enter a valid email").max(255),
  category: z.string().min(1, "Choose a category"),
  packageId: z.string().max(100).optional(),
  packageTier: z.string().trim().min(1).max(60),
  packagePrice: z.number().int().min(0).default(0),
  addOns: z.array(z.object({ name: z.string(), price: z.number().int().min(0) })).default([]),
  durationDays: z.number().int().min(1).max(10),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .refine(
      (d) => d >= new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10),
      "Event date cannot be in the past",
    ),
  location: z.string().trim().min(2).max(120),
  notes: z.string().max(1000).optional().default(""),
});

const CUSTOM_BASE = 20000;
const EXTRA_DAY_RATE = 0.35;

function groupFor(cat: string) {
  if (/Pre-Wedding/.test(cat)) return "Pre-Wedding";
  if (/^(Wedding|Cinematography)/.test(cat)) return "Wedding";
  if (/Birthday/.test(cat)) return "Birthday";
  if (/Engagement/.test(cat)) return "Engagement";
  if (/Event/.test(cat)) return "Events";
  return "Other Services";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const data = quoteInquirySchema.parse(body);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (ip !== "unknown") {
      const { data: allowed, error: rateError } = await supabase.rpc("allow_inquiry", {
        _key: `inquiry:${ip}`,
      });
      if (rateError || !allowed) {
        return new Response(JSON.stringify({ error: "Too many inquiries. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: rows, error: contentError } = await supabase
      .from("studio_content")
      .select("kind,data")
      .in("kind", ["categories", "packages", "addOns"]);

    if (contentError || !rows) {
      return new Response(JSON.stringify({ error: "Could not confirm current prices" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cats = rows.filter((r) => r.kind === "categories").map((r) => r.data as any);
    if (!cats.some((c) => c.active && c.name === data.category)) {
      return new Response(JSON.stringify({ error: "Choose an available category" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pkgs = rows.filter((r) => r.kind === "packages").map((r) => r.data as any);
    const targetGroup = groupFor(data.category);
    let pkg: any = null;
    if (data.packageId) {
      pkg = pkgs.find(
        (p: any) => p.active && p.id === data.packageId,
      );
    }
    if (!pkg && data.packageTier) {
      pkg = pkgs.find(
        (p: any) =>
          p.active &&
          p.group === targetGroup &&
          p.tier.toLowerCase() === data.packageTier.toLowerCase(),
      );
    }
    if (data.packageTier !== "Custom" && !pkg) {
      return new Response(JSON.stringify({ error: "Choose an available package" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extras = rows.filter((r) => r.kind === "addOns").map((r) => r.data as any);
    const uniqueNames = [...new Set(data.addOns.map((a) => a.name))];
    const addOns = uniqueNames.map((name) => {
      const a = extras.find((a: any) => a.active && a.name === name);
      if (!a) throw new Error("Choose an available add-on");
      return { name: a.name, price: Number(a.price) };
    });

    const packagePrice = pkg?.price ?? 0;
    const base = data.packageTier === "Custom" ? CUSTOM_BASE : packagePrice;
    const extraDays = Math.max(0, Math.floor(data.durationDays || 1) - 1);
    const extraDaysCost = Math.round(base * EXTRA_DAY_RATE * extraDays);
    const addOnsTotal = addOns.reduce((s, a) => s + a.price, 0);
    const estimate = base + extraDaysCost + addOnsTotal;

    const verified = { ...data, packagePrice, addOns };

    const { data: row, error: insertError } = await supabase
      .from("quote_submissions")
      .insert({ data: verified, estimate, status: "Pending" })
      .select("id")
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: "Could not save quotation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const toEmail = Deno.env.get("STUDIO_NOTIFICATION_EMAIL") || "hello@kahanistudio.in";
    const fromEmail = Deno.env.get("RESEND_FROM") || "Kahani Studio <notifications@kahanistudio.in>";

    if (resendKey) {
      const subject = `[Kahani Studio] New Quote Request from ${data.name} (${data.category} - ${data.packageTier})`;
      const addOnsSummary =
        addOns.length > 0
          ? addOns.map((a) => `- ${a.name} (₹${a.price.toLocaleString("en-IN")})`).join("\n")
          : "None";

      const textContent = `New Quotation Request Received:\n\nCustomer: ${data.name}\nMobile: ${data.mobile}\nWhatsApp: ${data.whatsapp}\nEmail: ${data.email}\nCategory: ${data.category}\nPackage Tier: ${data.packageTier}\nEvent Date: ${data.eventDate}\nDuration: ${data.durationDays} day(s)\nLocation: ${data.location}\nEstimated Total: ₹${estimate.toLocaleString("en-IN")}\n\nAdd-ons:\n${addOnsSummary}\n\nNotes:\n${data.notes || "None"}\n\nSent at: ${new Date().toISOString()}`;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [toEmail],
            subject,
            text: textContent,
          }),
        });
        if (!res.ok) {
          console.error("Resend API failed:", await res.text());
        }
      } catch (err) {
        console.error("Resend email send error:", err);
      }
    }

    return new Response(JSON.stringify({ id: row.id, estimate }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.errors[0]?.message : (err as Error).message;
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
