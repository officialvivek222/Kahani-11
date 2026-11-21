import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/site/Reveal";
import { CtaBand } from "@/components/site/CtaBand";
import { images } from "@/lib/images";
import { useStudioContent } from "@/lib/studio-content";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://kahanistudio.in/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://kahanistudio.in/og-image.jpg" },
      { title: "About — Kahani Studio" },
      {
        name: "description",
        content:
          "Meet Kahani Studio: our philosophy, creative approach and the stories we love to tell.",
      },
      { property: "og:title", content: "About Kahani Studio" },
      {
        property: "og:description",
        content: "Our photography philosophy, creative approach and specialties.",
      },
    ],
  }),
  component: About,
});

const approach = [
  {
    t: "Listen first",
    d: "Every project begins with a long conversation — about your families, your rituals, what makes you laugh.",
  },
  {
    t: "Observe quietly",
    d: "On the day we move softly and light naturally, so moments unfold without interruption.",
  },
  {
    t: "Edit like authors",
    d: "We sequence images as chapters, grading by hand for warmth that lasts decades.",
  },
];

function About() {
  const { categories } = useStudioContent();
  return (
    <>
      <PageHeader
        eyebrow="About us"
        title="We are storytellers who happen to use cameras."
        intro="Founded in Mumbai in 2014, Kahani Studio is a small team of photographers, filmmakers and editors who believe the best photographs are felt before they are seen."
      />
      <section className="container-x grid gap-10 pb-24 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <img
            src={images.haldi}
            alt="Family celebrating at a haldi ceremony"
            loading="lazy"
            className="aspect-[3/2] w-full object-cover"
          />
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-4 lg:col-start-9 lg:pt-24">
          <img
            src={images.portrait}
            alt="Portrait in an ivory saree"
            loading="lazy"
            className="aspect-[4/5] w-full object-cover"
          />
        </Reveal>
      </section>
      <section className="bg-card py-24 lg:py-32">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow text-bronze">Philosophy</p>
            <h2 className="text-section mt-5">Honest, unhurried, timeless.</h2>
          </Reveal>
          <Reveal
            delay={0.1}
            className="space-y-5 text-muted-foreground lg:col-span-6 lg:col-start-7"
          >
            <p className="font-editorial text-[22px] italic leading-snug text-foreground">
              “A photograph should return you to the feeling, not just the place.”
            </p>
            <p>
              We favour natural light, real expressions and compositions that will feel as right in
              thirty years as they do today. No over-processing, no trends that date.
            </p>
            <p>
              That means fewer instructions and more trust — letting your day be your day, and
              letting us find the poetry in it.
            </p>
          </Reveal>
        </div>
      </section>
      <section className="container-x py-24 lg:py-32">
        <Reveal>
          <p className="eyebrow text-bronze">Creative approach</p>
        </Reveal>
        <div className="mt-10 grid gap-px bg-border md:grid-cols-3">
          {approach.map((a, i) => (
            <Reveal key={a.t} delay={i * 0.1} className="bg-background p-8 lg:p-12">
              <p className="font-editorial italic text-bronze">0{i + 1}</p>
              <h3 className="text-heading-card mt-4">{a.t}</h3>
              <p className="mt-3 text-muted-foreground">{a.d}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="container-x pb-24 lg:pb-32">
        <Reveal>
          <p className="eyebrow text-bronze">Specialties</p>
          <h2 className="text-section mt-5">What we do best</h2>
        </Reveal>
        <ul className="mt-10 border-t border-border">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                to="/services"
                hash={c.slug}
                className="group flex items-baseline justify-between border-b border-border py-5"
              >
                <span className="font-display text-[clamp(24px,1.2rem+1vw,36px)] transition-colors group-hover:text-bronze">
                  {c.name}
                </span>
                <span className="hidden max-w-sm text-right text-sm text-muted-foreground md:block">
                  {c.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <CtaBand />
    </>
  );
}
