import type * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { PageHeader } from "@/components/site/PageHeader";
import { formatWhatsAppDisplay, useStudio, waLink } from "@/config/studio";
import { useStudioContent } from "@/lib/studio-content";
import { images } from "@/lib/images";
import { btn, field } from "@/lib/ui";
import { submitContact } from "@/lib/studio.functions";
import { Button } from "@/components/ui/button";
import { getMapSrc } from "@/lib/studio-schemas";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://kahanistudio.in/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://kahanistudio.in/og-image.jpg" },
      { title: "Contact — Kahani Studio" },
      {
        name: "description",
        content: "Call, WhatsApp, email or visit Kahani Studio in Mumbai to plan your shoot.",
      },
      { property: "og:title", content: "Contact Kahani Studio" },
      {
        property: "og:description",
        content: "Get in touch to plan your wedding, portrait or event shoot.",
      },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d\s-]{8,16}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").max(255),
  category: z.string().min(1, "Choose a category"),
  message: z.string().trim().min(5, "Tell us a little more").max(1000),
});
type Form = z.infer<typeof schema>;

function Contact() {
  const studio = useStudio();
  const { categories } = useStudioContent();
  const mapSrc =
    (studio.mapEmbed && getMapSrc(studio.mapEmbed)) ||
    `https://maps.google.com/maps?q=${encodeURIComponent(studio.address)}&z=15&output=embed`;
  const [f, setF] = useState<Form>({ name: "", phone: "", email: "", category: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const saveContact = submitContact;
  const set =
    (k: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(f);
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setFailure("");
    setBusy(true);
    try {
      await saveContact({ data: r.data });
      setReady(true);
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Could not save your inquiry. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const waMsg = `Hello ${studio.name}!\nName: ${f.name}\nPhone: ${f.phone}\nEmail: ${f.email}\nInterested in: ${f.category}\n\n${f.message}`;

  const info = [
    {
      icon: Phone,
      label: "Phone",
      value: studio.phone,
      href: `tel:${studio.phone.replace(/\s/g, "")}`,
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: formatWhatsAppDisplay(studio.whatsapp),
      href: waLink(undefined, studio.whatsapp),
    },
    { icon: Mail, label: "Email", value: studio.email, href: `mailto:${studio.email}` },
    { icon: MapPin, label: "Studio", value: studio.address },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let's begin your story."
        intro="Write to us with your date and a few details. We usually reply within a working day."
      />
      <section className="container-x grid gap-16 pb-24 lg:grid-cols-12 lg:pb-32">
        <form onSubmit={submit} noValidate className="min-w-0 space-y-5 lg:col-span-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <F label="Full name" err={errors.name}>
              <input className={field} value={f.name} onChange={set("name")} autoComplete="name" />
            </F>
            <F label="Phone" err={errors.phone}>
              <input
                type="tel"
                inputMode="tel"
                className={field}
                value={f.phone}
                onChange={set("phone")}
                autoComplete="tel"
              />
            </F>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <F label="Email" err={errors.email}>
              <input
                className={field}
                value={f.email}
                onChange={set("email")}
                type="email"
                autoComplete="email"
              />
            </F>
            <F label="Photography type" err={errors.category}>
              <select className={field} value={f.category} onChange={set("category")}>
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
            </F>
          </div>
          <F label="Your message" err={errors.message}>
            <textarea rows={6} className={field} value={f.message} onChange={set("message")} />
          </F>
          <Button className="min-h-12 w-full sm:w-auto" type="submit" disabled={busy || ready}>
            {busy ? "Saving…" : ready ? "Inquiry saved" : "Send inquiry"}
          </Button>
          {failure && (
            <p role="alert" className="text-sm text-destructive">
              {failure}
            </p>
          )}
          {ready && (
            <div className="border border-bronze bg-card p-6 text-sm">
              <p className="font-medium">Your inquiry has been saved for the studio.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={waLink(waMsg, studio.whatsapp)}
                  onClick={() =>
                    window.__lovableEvents?.track?.("project.whatsapp_inquiry_clicked", {
                      source: "contact",
                    })
                  }
                  target="_blank"
                  rel="noreferrer"
                  className={btn("bronze", "px-5 py-2.5")}
                >
                  Send on WhatsApp
                </a>
                <a
                  href={`mailto:${studio.email}?subject=${encodeURIComponent("Inquiry from " + f.name)}&body=${encodeURIComponent(waMsg)}`}
                  className={btn("outline", "px-5 py-2.5")}
                >
                  Send by email
                </a>
              </div>
            </div>
          )}
        </form>
        <aside className="min-w-0 space-y-8 lg:col-span-4 lg:col-start-9">
          {info.map(({ icon: I, label, value, href }) => (
            <div key={label} className="flex gap-4 border-b border-border pb-6">
              <I size={18} className="mt-1 shrink-0 text-bronze" />
              <div className="min-w-0 break-words">
                <p className="eyebrow text-muted-foreground">{label}</p>
                {href ? (
                  <a
                    href={href}
                    onClick={() => {
                      if (label === "WhatsApp")
                        window.__lovableEvents?.track?.("project.whatsapp_inquiry_clicked", {
                          source: "contact",
                        });
                    }}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="mt-1 block hover:text-bronze"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="mt-1">{value}</p>
                )}
              </div>
            </div>
          ))}
          <p className="text-sm text-muted-foreground">{studio.hours}</p>
          <div className="flex gap-4">
            <a
              aria-label="Instagram"
              href={studio.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="border border-border p-3 hover:border-foreground transition-colors"
            >
              <img
                src={images.instagram}
                alt="Instagram"
                width={16}
                height={16}
                className="size-4 object-contain rounded-[3px]"
              />
            </a>
            <a
              aria-label="YouTube"
              href={studio.social.youtube}
              target="_blank"
              rel="noreferrer"
              className="border border-border p-3 hover:border-foreground transition-colors"
            >
              <img
                src={images.youtube}
                alt="YouTube"
                width={16}
                height={16}
                className="size-4 object-contain"
              />
            </a>
          </div>
        </aside>
      </section>
      <section className="container-x pb-24">
        <div className="overflow-hidden border border-border bg-card">
          <iframe
            title="Kahani Studio Location Map"
            src={mapSrc}
            className="h-[320px] w-full border-0 sm:h-[400px]"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studio.address)}`}
            target="_blank"
            rel="noreferrer"
            className={btn(
              "outline",
              "inline-flex items-center gap-2 text-xs uppercase tracking-wider",
            )}
          >
            <MapPin size={14} />
            <span>Get directions</span>
          </a>
        </div>
      </section>
    </>
  );
}

function F({
  label,
  err,
  children,
}: {
  label: string;
  err?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block text-muted-foreground">{label}</span>
      {children}
      {err && <span className="mt-1 block text-xs text-destructive">{err}</span>}
    </label>
  );
}
