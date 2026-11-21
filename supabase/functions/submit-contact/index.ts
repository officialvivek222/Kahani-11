import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const contactInquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  phone: z.string().trim().regex(/^[+\d\s-]{8,16}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").max(255),
  category: z.string().min(1, "Choose a category"),
  message: z.string().trim().min(5, "Tell us a little more").max(1000),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const data = contactInquirySchema.parse(body);

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

    const { data: row, error: insertError } = await supabase
      .from("contact_submissions")
      .insert({ data, status: "New" })
      .select("id")
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: "Could not save inquiry" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const toEmail = Deno.env.get("STUDIO_NOTIFICATION_EMAIL") || "hello@kahanistudio.in";
    const fromEmail = Deno.env.get("RESEND_FROM") || "Kahani Studio <notifications@kahanistudio.in>";

    if (resendKey) {
      const subject = `[Kahani Studio] New Inquiry from ${data.name} (${data.category})`;
      const textContent = `New Contact Inquiry Received:\n\nName: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email}\nCategory: ${data.category}\nMessage:\n${data.message}\n\nSent at: ${new Date().toISOString()}`;

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

    return new Response(JSON.stringify({ id: row.id }), {
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
