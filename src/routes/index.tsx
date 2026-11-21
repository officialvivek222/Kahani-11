import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useStudioContent } from "@/lib/studio-content";
import { images } from "@/lib/images";
import { btn } from "@/lib/ui";
import { useStudio } from "@/config/studio";
import { Reveal } from "@/components/site/Reveal";
import { Gallery } from "@/components/site/Gallery";
import { PackageCard } from "@/components/site/PackageCard";
import { Testimonials } from "@/components/site/Testimonials";
import { CtaBand } from "@/components/site/CtaBand";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://kahanistudio.in/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://kahanistudio.in/og-image.jpg" },
      { title: "Kahani Studio — Wedding & Story Photography" },
      {
        name: "description",
        content:
          "Editorial wedding, pre-wedding and portrait photography and cinematography. Every picture has a story.",
      },
      { property: "og:title", content: "Kahani Studio — Wedding & Story Photography" },
      {
        property: "og:description",
        content: "Editorial wedding, pre-wedding and portrait photography and cinematography.",
      },
    ],
  }),
  component: Home,
});

const why = [
  {
    n: "01",
    t: "Creative Storytelling",
    d: "We plan every story like an editor — beginnings, quiet middles and unforgettable endings.",
  },
  {
    n: "02",
    t: "Professional Photography",
    d: "Twelve years, 600+ celebrations, and a calm team you'll barely notice on the day.",
  },
  {
    n: "03",
    t: "Cinematic Experience",
    d: "Films shot on cinema cameras with honest sound, natural grade and real emotion.",
  },
  {
    n: "04",
    t: "Timeless Memories",
    d: "No trends that date. Images and albums made to be handed down.",
  },
];

// Asymmetric collage spans for the 10 categories
const spans = [
  "lg:col-span-7 lg:row-span-2",
  "lg:col-span-5 lg:row-span-2",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-3",
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-6",
  "lg:col-span-6",
];

function Home() {
  const studio = useStudio();
  const { categories, packages, portfolio } = useStudioContent();
  const insta = [
    images.bride,
    images.haldi,
    images.prewedding,
    images.engagement,
    images.maternity,
    images.event,
  ];
  return (
    <>
      {/* Hero */}
      <section className="relative isolate flex min-h-[92svh] items-end overflow-hidden pt-28 text-paper">
        <motion.img
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease: "easeOut" }}
          src={images.hero}
          alt="Bride and groom at their wedding ceremony at sunset"
          width={1920}
          height={1088}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-overlay/80 via-overlay/30 to-overlay/40" />
        <div className="container-x pb-12 sm:pb-20 lg:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          >
            <p className="eyebrow text-taupe">{studio.name} presents</p>
            <h1 className="text-hero mt-6 max-w-4xl">
              Every Picture <em className="font-editorial text-[0.85em]">Has</em> a Story
            </h1>
            <p className="mt-6 max-w-md text-paper/85">
              We capture the emotions, moments and memories that deserve to live forever.
            </p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:gap-4">
              <Link to="/portfolio" className={btn("light")}>
                Explore Our Work
              </Link>
              <Link to="/quote" className={btn("ghostLight")}>
                Get a Quote
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Intro */}
      <section className="container-x grid items-center gap-12 py-24 lg:grid-cols-12 lg:gap-20 lg:py-36">
        <Reveal className="lg:col-span-6">
          <div className="img-zoom">
            <img
              src={images.bride}
              alt="Bride beneath a red veil"
              loading="lazy"
              width={832}
              height={1216}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </Reveal>
        <Reveal delay={0.15} className="lg:col-span-5 lg:col-start-8">
          <p className="eyebrow text-bronze">The Studio</p>
          <h2 className="text-section mt-5">
            More Than Photography. <em className="text-olive">A Collection of Memories.</em>
          </h2>
          <p className="mt-8 text-muted-foreground">
            Kahani means story. For over a decade we have photographed weddings, families and
            celebrations across India — quietly, patiently, and with deep respect for the people in
            front of the lens.
          </p>
          <p className="mt-4 text-muted-foreground">
            We don't chase poses. We wait for the glance across the mandap, the grandmother's laugh,
            the hand that won't let go.
          </p>
          <Link
            to="/about"
            className="mt-10 inline-block border-b border-bronze pb-1 text-[13px] uppercase tracking-[0.18em]"
          >
            Our story
          </Link>
        </Reveal>
      </section>

      {/* Categories */}
      <section className="bg-card py-24 lg:py-36">
        <div className="container-x">
          <Reveal className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="eyebrow text-bronze">What we photograph</p>
              <h2 className="text-section mt-5 max-w-2xl">Ten ways to tell a story</h2>
            </div>
            <Link to="/services" className={btn("outline")}>
              All services
            </Link>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:auto-rows-[260px] lg:grid-cols-12">
            {categories.map((c, i) => (
              <Reveal
                key={c.id}
                delay={(i % 3) * 0.08}
                className={cn("col-span-1", i < 2 && "col-span-2 sm:col-span-1", spans[i])}
              >
                <Link
                  to="/services"
                  hash={c.slug}
                  className="img-zoom group relative block h-full min-h-[200px] sm:min-h-[260px]"
                >
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-overlay/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4 text-paper sm:p-6">
                    <span className="eyebrow text-taupe">{String(i + 1).padStart(2, "0")}</span>
                    <p className="mt-1 font-display text-[22px] leading-tight sm:text-[28px]">
                      {c.name.replace(" Photography", "")}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section className="container-x py-24 lg:py-36">
        <Reveal className="mb-12">
          <p className="eyebrow text-bronze">Portfolio</p>
          <h2 className="text-section mt-5">Stories We've Captured</h2>
        </Reveal>
        <Gallery items={portfolio.filter((p) => p.featured)} />
        <div className="mt-12 text-center">
          <Link to="/portfolio" className={btn("outline")}>
            View full portfolio
          </Link>
        </div>
      </section>

      {/* Why */}
      <section className="bg-charcoal py-24 text-paper lg:py-36">
        <div className="container-x grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow text-taupe">Why Kahani</p>
            <h2 className="text-section mt-5">Made with patience, kept forever</h2>
          </Reveal>
          <div className="grid gap-x-12 gap-y-14 sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
            {why.map((w, i) => (
              <Reveal key={w.n} delay={i * 0.1}>
                <p className="font-editorial italic text-bronze">{w.n}</p>
                <h3 className="text-heading-card mt-3">{w.t}</h3>
                <p className="mt-3 text-paper/70">{w.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="container-x py-24 lg:py-36">
        <Reveal className="mb-14 text-center">
          <p className="eyebrow text-bronze">Wedding packages</p>
          <h2 className="text-section mt-5">Choose your chapter</h2>
        </Reveal>
        <div className="grid gap-6 lg:grid-cols-3">
          {[...packages]
            .filter((p) => p.group === "Wedding" && p.active)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.price - b.price)
            .map((p) => (
              <PackageCard key={p.id} pkg={p} />
            ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Sample pricing.{" "}
          <Link to="/packages" className="underline underline-offset-4">
            See all packages
          </Link>
        </p>
      </section>

      {/* Testimonials */}
      <section className="bg-card py-24 lg:py-32">
        <div className="container-x">
          <p className="eyebrow mb-10 text-center text-bronze">Kind words</p>
          <Testimonials />
        </div>
      </section>

      {/* Instagram */}
      <section className="container-x py-24 lg:py-32">
        <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-bronze">On Instagram</p>
            <h2 className="text-section mt-4">{studio.instagramHandle}</h2>
          </div>
          <a
            href={studio.social.instagram}
            target="_blank"
            rel="noreferrer"
            className={btn("outline")}
          >
            <img
              src={images.instagram}
              alt="Instagram"
              width={18}
              height={18}
              className="size-[18px] object-contain rounded-[4px]"
            />
            Follow Us
          </a>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
          {insta.map((src, i) => (
            <a
              key={i}
              href={studio.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="img-zoom block aspect-square"
              aria-label="Open Instagram"
            >
              <img
                src={src}
                alt={`Kahani Studio gallery preview ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </a>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
