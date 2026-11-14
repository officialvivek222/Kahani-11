import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronLeft, MessageCircle, Mail } from "lucide-react";
import type * as React from "react";
import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitQuote } from "@/lib/studio.functions";
import { quoteInquirySchema } from "@/lib/studio-schemas";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { formatINR, useStudio, waLink } from "@/config/studio";
import { useStudioContent } from "@/lib/studio-content";
import {
  buildWhatsAppMessage,
  calculateQuote,
  CUSTOM_BASE,
  groupFor,
  type QuoteInput,
} from "@/lib/quote";
import { btn, field } from "@/lib/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quote")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { category?: string | undefined; tier?: string | undefined } => ({
    category: typeof s["category"] === "string" ? s["category"] : undefined,
    tier: typeof s["tier"] === "string" ? s["tier"] : undefined,
  }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Get a Quote — Kahani Studio" },
      {
        name: "description",
        content:
          "Build a personalised photography quotation in five simple steps and send it on WhatsApp.",
      },
      { property: "og:title", content: "Custom Quotation — Kahani Studio" },
      {
        property: "og:description",
        content: "Choose your package and add-ons to see an instant estimate.",
      },
    ],
  }),
  component: Quote,
});

const steps = ["Category", "Package", "Add-ons", "Event", "Your details", "Summary"];
const tiers = ["Basic", "Premium", "Luxury", "Custom"] as const;

const eventSchema = z.object({
  eventDate: z
    .string()
    .min(1, "Choose a date")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter date as YYYY-MM-DD"),
  location: z.string().trim().min(2, "Enter a location").max(120),
  durationDays: z.number().int().min(1).max(10),
});
const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  mobile: z
    .string()
    .trim()
    .regex(/^[+\d\s-]{8,16}$/, "Enter a valid mobile number"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[+\d\s-]{8,16}$/, "Enter a valid WhatsApp number"),
  email: z.string().trim().email("Enter a valid email").max(255),
});

function Quote() {
  const studio = useStudio();
  const { addOns, categories, packages } = useStudioContent();
  const search = Route.useSearch();
  const initialCat =
    categories.find(
      (c) =>
        c.name === search.category ||
        c.short === search.category ||
        groupFor(c.name) === search.category,
    )?.name ?? "";
  const [step, setStep] = useState(initialCat ? 1 : 0);
  const [q, setQ] = useState<QuoteInput>({
    category: initialCat,
    packageTier: (tiers as readonly string[]).includes(search.tier ?? "")
      ? (search.tier as QuoteInput["packageTier"])
      : "",
    packagePrice: 0,
    addOns: [],
    durationDays: 1,
    eventDate: "",
    location: "",
    notes: "",
    name: "",
    mobile: "",
    whatsapp: "",
    email: "",
  });
  const [errors, setErrors] = useState<
    Partial<
      Record<
        | "step"
        | "eventDate"
        | "location"
        | "durationDays"
        | "name"
        | "mobile"
        | "whatsapp"
        | "email",
        string
      >
    >
  >({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const started = useRef(false);
  const stepStart = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const saveQuote = useServerFn(submitQuote);

  const groupPkgs = packages.filter((p) => p.active && p.group === groupFor(q.category));
  const priceOf = (tier: string) =>
    tier === "Custom" ? 0 : (groupPkgs.find((p) => p.tier === tier)?.price ?? 0);
  const full = { ...q, packagePrice: priceOf(q.packageTier) };
  const calc = useMemo(
    () => calculateQuote(full),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [full.packageTier, full.packagePrice, full.addOns, full.durationDays],
  );

  const up = <K extends keyof QuoteInput>(k: K, v: QuoteInput[K]) => {
    setSaved(false);
    setNotice("");
    setQ((p) => ({ ...p, [k]: v }));
  };
  const startQuote = () => {
    if (started.current) return;
    started.current = true;
    window.__lovableEvents?.track?.("project.quote_started");
  };
  const next = () => {
    setErrors({});
    if (step === 0 && !q.category) return setErrors({ step: "Please choose a category." });
    if (step === 1 && !q.packageTier) return setErrors({ step: "Please choose a package." });
    if (step === 3) {
      const r = eventSchema.safeParse(q);
      if (!r.success)
        return setErrors(
          Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])),
        );
    }
    if (step === 4) {
      const r = contactSchema.safeParse(q);
      if (!r.success)
        return setErrors(
          Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])),
        );
    }
    startQuote();
    setStep((s) => Math.min(s + 1, steps.length - 1));
    stepStart.current?.scrollIntoView({
      block: "start",
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };
  const toggleAddOn = (a: { id: string; name: string; price: number }) => {
    const selected = !q.addOns.some((x) => x.name === a.name);
    up(
      "addOns",
      selected
        ? [...q.addOns, { name: a.name, price: a.price }]
        : q.addOns.filter((x) => x.name !== a.name),
    );
    window.__lovableEvents?.track?.("project.add_on_chosen", { add_on_id: a.id, selected });
  };
  const sendInquiry = async () => {
    setBusy(true);
    setNotice("");
    try {
      const data = quoteInquirySchema.parse(full);
      const result = await saveQuote({ data });
      setSaved(true);
      setNotice(
        `Your quotation request is saved. Reference: ${result.id.slice(0, 8)}. Estimated total: ${formatINR(result.estimate)}.`,
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not save your request. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="container-x pb-24 pt-28 sm:pt-32 lg:pb-32 lg:pt-44">
      <p className="eyebrow text-bronze">Custom quotation</p>
      <h1 className="text-page mt-4 max-w-3xl">Build your story, see your estimate.</h1>

      <ol aria-label="Quotation progress" className="mt-8 grid grid-cols-6 gap-2 sm:mt-12">
        {steps.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined}>
            <div className={cn("h-1", i <= step ? "bg-foreground" : "bg-border")} />
            <p
              className={cn(
                "mt-3 hidden text-[11px] uppercase tracking-[0.16em] sm:block",
                i === step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {String(i + 1).padStart(2, "0")} {s}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground sm:hidden">
        Step {step + 1} of {steps.length} — {steps[step]}
      </p>

      <div className="mt-8 grid gap-8 lg:mt-12 lg:grid-cols-12 lg:gap-12">
        <div ref={stepStart} className="min-w-0 scroll-mt-24 lg:col-span-8">
          <div
            aria-live="polite"
            className="mb-6 flex items-baseline justify-between gap-4 border-y border-border py-3 lg:hidden"
          >
            <span className="text-xs uppercase text-muted-foreground">Estimate</span>
            <span className="shrink-0 font-display text-[28px]">{formatINR(calc.total)}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
            >
              {step === 0 && (
                <Step title="What are we photographing?">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {categories
                      .filter((c) => c.active)
                      .map((c) => (
                        <Button
                          variant="ghost"
                          aria-pressed={q.category === c.name}
                          key={c.id}
                          onClick={() => {
                            startQuote();
                            up("category", c.name);
                            up("packageTier", "");
                          }}
                          className={cn(
                            "group relative aspect-[4/5] h-auto min-w-0 whitespace-normal rounded-none p-0 overflow-hidden text-left",
                            q.category === c.name &&
                              "ring-2 ring-bronze ring-offset-2 ring-offset-background",
                          )}
                        >
                          <img
                            src={c.image}
                            alt=""
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-overlay/75 to-transparent" />
                          <span className="absolute bottom-3 left-3 right-3 font-display text-[20px] leading-tight text-paper">
                            {c.name.replace(" Photography", "")}
                          </span>
                          {q.category === c.name && (
                            <Check
                              className="absolute right-3 top-3 bg-bronze p-1 text-paper"
                              size={22}
                            />
                          )}
                        </Button>
                      ))}
                  </div>
                </Step>
              )}
              {step === 1 && (
                <Step title="Choose a package">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {tiers.map((t) => {
                      const p = groupPkgs.find((x) => x.tier === t);
                      return (
                        <Button
                          variant="ghost"
                          aria-pressed={q.packageTier === t}
                          key={t}
                          disabled={t !== "Custom" && !p}
                          onClick={() => {
                            startQuote();
                            up("packageTier", t);
                            window.__lovableEvents?.track?.("project.package_selected", {
                              tier: t,
                              group: groupFor(q.category),
                            });
                          }}
                          className={cn(
                            "block h-auto min-w-0 whitespace-normal rounded-none border p-5 text-left transition-colors disabled:opacity-40 sm:p-6",
                            q.packageTier === t
                              ? "border-bronze bg-card"
                              : "border-border hover:border-foreground/40",
                          )}
                        >
                          <div className="flex items-baseline justify-between">
                            <span className="text-heading-card font-display">{t}</span>
                            {q.packageTier === t && <Check size={18} className="text-bronze" />}
                          </div>
                          <p className="mt-2 font-display text-[28px]">
                            {t === "Custom"
                              ? `From ${formatINR(CUSTOM_BASE)}`
                              : formatINR(p?.price ?? 0)}
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {t === "Custom"
                              ? "Build it your way — we'll tailor coverage after a call."
                              : p?.features.slice(0, 3).join(" · ")}
                          </p>
                        </Button>
                      );
                    })}
                  </div>
                </Step>
              )}
              {step === 2 && (
                <Step title="Anything extra?" hint="Optional — choose as many as you like.">
                  <div className="divide-y divide-border border-y border-border">
                    {addOns
                      .filter((a) => a.active)
                      .map((a) => {
                        const on = q.addOns.some((x) => x.name === a.name);
                        return (
                          <label
                            key={a.id}
                            className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                          >
                            <input
                              aria-label={a.name}
                              type="checkbox"
                              checked={on}
                              onChange={() => toggleAddOn(a)}
                              className="size-5 shrink-0 accent-bronze"
                            />
                            <span className="min-w-0">
                              <span className="block">{a.name}</span>
                              <span className="text-sm text-muted-foreground">{a.description}</span>
                            </span>
                            <span className="col-start-2 font-display text-[20px] sm:col-start-3">
                              + {formatINR(a.price)}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </Step>
              )}
              {step === 3 && (
                <Step title="Tell us about the event">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Fd label="Event date" err={errors.eventDate}>
                      <input
                        type="date"
                        className={field}
                        value={q.eventDate}
                        onChange={(e) => up("eventDate", e.target.value)}
                      />
                    </Fd>
                    <Fd label="Duration (days)" err={errors.durationDays}>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        className={field}
                        value={q.durationDays}
                        onChange={(e) => up("durationDays", Number(e.target.value))}
                      />
                    </Fd>
                  </div>
                  <Fd label="Location / venue" err={errors.location}>
                    <input
                      className={field}
                      value={q.location}
                      onChange={(e) => up("location", e.target.value)}
                      placeholder="e.g. Taj Lake Palace, Udaipur"
                    />
                  </Fd>
                  <Fd label="Additional notes">
                    <textarea
                      rows={4}
                      className={field}
                      value={q.notes}
                      maxLength={1000}
                      onChange={(e) => up("notes", e.target.value)}
                      placeholder="Guest count, rituals, special requests…"
                    />
                  </Fd>
                </Step>
              )}
              {step === 4 && (
                <Step title="How can we reach you?">
                  <Fd label="Full name" err={errors.name}>
                    <input
                      className={field}
                      value={q.name}
                      onChange={(e) => up("name", e.target.value)}
                      autoComplete="name"
                    />
                  </Fd>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Fd label="Mobile number" err={errors.mobile}>
                      <input
                        className={field}
                        inputMode="tel"
                        value={q.mobile}
                        onChange={(e) => up("mobile", e.target.value)}
                        autoComplete="tel"
                      />
                    </Fd>
                    <Fd label="WhatsApp number" err={errors.whatsapp}>
                      <input
                        className={field}
                        inputMode="tel"
                        value={q.whatsapp}
                        onChange={(e) => up("whatsapp", e.target.value)}
                      />
                    </Fd>
                  </div>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => up("whatsapp", q.mobile)}
                    className="min-h-12 px-0 text-xs uppercase tracking-[0.16em] text-bronze"
                  >
                    Same as mobile
                  </Button>
                  <Fd label="Email" err={errors.email}>
                    <input
                      type="email"
                      className={field}
                      value={q.email}
                      onChange={(e) => up("email", e.target.value)}
                      autoComplete="email"
                    />
                  </Fd>
                </Step>
              )}
              {step === 5 && (
                <Step title="Your quotation summary">
                  <dl className="grid gap-px bg-border sm:grid-cols-2">
                    {[
                      ["Category", q.category],
                      ["Package", q.packageTier],
                      ["Add-ons", q.addOns.map((a) => a.name).join(", ") || "None"],
                      ["Event date", q.eventDate],
                      ["Location", q.location],
                      ["Duration", `${q.durationDays} day(s)`],
                      ["Name", q.name],
                      ["Mobile", q.mobile],
                      ["WhatsApp", q.whatsapp],
                      ["Email", q.email],
                    ].map(([k, v]) => (
                      <div key={k} className="min-w-0 bg-background p-5">
                        <dt className="eyebrow text-muted-foreground">{k}</dt>
                        <dd className="mt-1 break-words [overflow-wrap:anywhere]">{v}</dd>
                      </div>
                    ))}
                    {q.notes && (
                      <div className="bg-background p-5 sm:col-span-2">
                        <dt className="eyebrow text-muted-foreground">Notes</dt>
                        <dd className="mt-1">{q.notes}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="grid gap-3 pt-4 sm:flex sm:flex-wrap">
                    <a
                      href={waLink(buildWhatsAppMessage(full), studio.whatsapp)}
                      onClick={() =>
                        window.__lovableEvents?.track?.("project.whatsapp_inquiry_clicked", {
                          source: "quote",
                        })
                      }
                      target="_blank"
                      rel="noreferrer"
                      className={btn("bronze")}
                    >
                      <MessageCircle size={16} />
                      Send on WhatsApp
                    </a>
                    <Button
                      className="min-h-12"
                      disabled={busy || saved}
                      onClick={sendInquiry}
                      variant="outline"
                    >
                      <Mail size={16} />
                      {busy ? "Saving…" : saved ? "Inquiry saved" : "Send inquiry"}
                    </Button>
                  </div>
                  {notice && (
                    <p
                      role="status"
                      className="border border-border bg-card p-4 text-sm text-muted-foreground"
                    >
                      {notice}
                    </p>
                  )}
                </Step>
              )}
            </motion.div>
          </AnimatePresence>
          {errors.step && <p className="mt-4 text-sm text-destructive">{errors.step}</p>}
          <div className="sticky bottom-0 z-20 mt-8 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-t border-border bg-background py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:flex sm:justify-between">
            <Button
              variant="ghost"
              disabled={step === 0}
              onClick={() => {
                setErrors({});
                setStep((s) => s - 1);
                stepStart.current?.scrollIntoView({
                  block: "start",
                  behavior: reducedMotion ? "auto" : "smooth",
                });
              }}
              className="min-h-12 px-2 text-[13px] uppercase disabled:opacity-30"
            >
              <ChevronLeft size={16} />
              Back
            </Button>
            {step < steps.length - 1 && (
              <Button
                onClick={next}
                className={cn(
                  btn("solid"),
                  "h-auto min-h-12 whitespace-normal px-3 tracking-normal sm:px-7",
                )}
              >
                {step === 4 ? "Review quotation" : "Continue"}
              </Button>
            )}
          </div>
        </div>

        <aside className="min-w-0 lg:col-span-4">
          <div className="sticky top-28 border border-border bg-card p-6 lg:p-8">
            <p className="eyebrow text-muted-foreground">Estimate</p>
            <p className="mt-3 font-display text-[48px] leading-none">{formatINR(calc.total)}</p>
            <div className="hairline my-6" />
            <ul className="space-y-3 text-sm">
              <Row
                k={`${q.packageTier || "Package"}${q.category ? ` · ${groupFor(q.category)}` : ""}`}
                v={calc.base}
              />
              {calc.extraDays > 0 && (
                <Row k={`Extra days × ${calc.extraDays}`} v={calc.extraDaysCost} />
              )}
              {q.addOns.map((a) => (
                <Row key={a.name} k={a.name} v={a.price} />
              ))}
            </ul>
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              This is an estimate only. The final price is subject to studio confirmation based on
              dates, travel and requirements.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Step({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-heading-card font-display">{title}</h2>
      {hint && <p className="-mt-3 text-sm text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}
function Fd({
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
function Row({ k, v }: { k: string; v: number }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
      <span className="min-w-0 break-words text-muted-foreground">{k}</span>
      <span className="shrink-0">{formatINR(v)}</span>
    </li>
  );
}
