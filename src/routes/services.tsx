import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/site/Reveal";
import { CtaBand } from "@/components/site/CtaBand";
import { useStudioContent } from "@/lib/studio-content";
import { images } from "@/lib/images";
import { btn } from "@/lib/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://kahanistudio.in/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://kahanistudio.in/og-image.jpg" },
      { title: "Services — Kahani Studio" },
      {
        name: "description",
        content:
          "Wedding, pre-wedding, engagement, birthday, maternity, baby, portrait, event, cinematography and product photography services.",
      },
      { property: "og:title", content: "Photography & Cinematography Services — Kahani Studio" },
      {
        property: "og:description",
        content:
          "Ten bespoke photography and film services, each crafted around your unique story.",
      },
    ],
  }),
  component: Services,
});

const defaultHighlights: Record<string, string[]> = {
  wedding: [
    "Two Lead Photographers & Assistants",
    "Comprehensive Candid & Ritual Coverage",
    "4K Drone & Aerial Cinematography",
    "Handcrafted Heirloom Flush-Mount Album",
  ],
  "pre-wedding": [
    "Curated Golden-Hour Destination Shoots",
    "Personalized Concept & Wardrobe Guidance",
    "Cinematic Teaser Reel for Socials",
    "Private Online High-Resolution Gallery",
  ],
  engagement: [
    "Full Ceremony & Décor Architecture",
    "Intimate Couple Portrait Session",
    "Comprehensive Family Formals",
    "Express 48-Hour Preview Delivery",
  ],
  birthday: [
    "Joyful Unposed Celebration Coverage",
    "Cake Smash & Theme Décor Details",
    "Interactive Guest & Family Portraits",
    "High-Resolution Print-Ready Delivery",
  ],
  maternity: [
    "Comfort-First Studio or Natural Outdoors",
    "Flowing Designer Silks & Gowns",
    "Partner & Sibling Inclusion Frames",
    "Fine-Art Skin & Tone Retouching",
  ],
  baby: [
    "Certified Newborn-Safe Guided Posing",
    "Handmade Organic Props & Soft Wraps",
    "Calm, Unhurried Flow with Feed Breaks",
    "Archival Quality Keepsake Frames",
  ],
  portrait: [
    "Editorial & Studio Lighting Rigs",
    "Guided Direction for Natural Poses",
    "Express Selects for Executive Profiles",
    "Master Color Grading & Retouching",
  ],
  event: [
    "Multi-Camera Sangeet & Reception Teams",
    "Dynamic Stage & Atmospheric Lighting",
    "Guest Interaction & High-Energy Candids",
    "Same-Day Sneak Peek Highlights",
  ],
  cinematography: [
    "Ultra-High Bitrate 4K Cinema Prime Rigs",
    "Multi-Channel Directional Audio Capture",
    "Artistic Color Grade & Licensed Soundtracks",
    "3-Minute Highlight Teaser + Full Feature Film",
  ],
  product: [
    "Precision Tabletop & Creative Staging",
    "Jewellery, Fashion & Lifestyle Compositions",
    "Clean E-Commerce White & Stylized Sets",
    "Full Commercial Publishing & Usage Rights",
  ],
};

function Services() {
  const { categories } = useStudioContent();
  const activeServices = categories.filter((c) => c.active);

  return (
    <>
      <PageHeader
        eyebrow="Our Services"
        title="Every occasion, its own visual language."
        intro="From multi-day royal weddings to intimate maternity portraits, each of our ten signature services is shaped around the people, the emotions, and the fleeting moments that matter."
      />

      {/* Quick Navigation Anchor Bar */}
      <nav aria-label="Services navigation" className="container-x mb-16 overflow-x-auto pb-4 pt-2">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {activeServices.map((c) => (
            <a
              key={c.id}
              href={`#${c.slug}`}
              className="rounded-full border border-border/80 bg-card/60 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur-sm transition-colors hover:border-bronze hover:bg-bronze hover:text-paper dark:hover:text-charcoal"
            >
              {c.short || c.name}
            </a>
          ))}
        </div>
      </nav>

      {/* Services List */}
      <div className="container-x space-y-24 pb-24 lg:space-y-36 lg:pb-36">
        {activeServices.map((c, i) => {
          const highlights =
            c.highlights && c.highlights.length > 0
              ? c.highlights
              : defaultHighlights[c.slug] || [
                  "Professional Lead Creative",
                  "Fine-Art Post-Production",
                  "Private Cloud Gallery",
                  "High-Resolution Print Rights",
                ];

          return (
            <section
              key={c.id}
              id={c.slug}
              className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-12 lg:gap-16"
            >
              <Reveal className={cn("lg:col-span-6", i % 2 && "lg:order-2 lg:col-start-7")}>
                <div className="img-zoom overflow-hidden rounded-xs border border-border/40 shadow-sm">
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className={cn(
                      "w-full object-cover transition-transform duration-700 hover:scale-105",
                      i % 3 === 0 ? "aspect-[4/3]" : "aspect-[5/4]",
                    )}
                  />
                </div>
              </Reveal>

              <Reveal
                delay={0.1}
                className={cn("lg:col-span-6", i % 2 ? "lg:order-1" : "lg:col-start-7")}
              >
                <div className="flex items-center gap-2">
                  <span className="eyebrow text-bronze">
                    {String(i + 1).padStart(2, "0")} — {c.short || "Service"}
                  </span>
                </div>

                <h2 className="text-section mt-3 text-2xl font-serif sm:text-3xl lg:text-4xl">
                  {c.name}
                </h2>

                <p className="mt-4 leading-relaxed text-muted-foreground">{c.description}</p>

                {/* Highlights */}
                <div className="mt-6 rounded-sm border border-border/60 bg-muted/30 p-4">
                  <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-bronze">
                    <Sparkles size={14} className="text-bronze" />
                    <span>Service Highlights</span>
                  </div>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-xs text-foreground/80">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-bronze" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Included Features */}
                <div className="mt-6">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Included in Every Package:
                  </p>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {c.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[14px]">
                        <Check size={16} className="mt-0.5 shrink-0 text-bronze" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/quote"
                    search={{ category: c.name }}
                    className={cn(btn("solid"), "inline-flex items-center gap-2")}
                  >
                    <span>Get a Quote</span>
                    <ArrowRight size={15} />
                  </Link>

                  <Link
                    to="/contact"
                    search={{ category: c.name }}
                    className={cn(btn("outline"), "text-[12px] tracking-[0.14em]")}
                  >
                    <span>Ask a Question</span>
                  </Link>
                </div>
              </Reveal>
            </section>
          );
        })}
      </div>

      <CtaBand />
    </>
  );
}
