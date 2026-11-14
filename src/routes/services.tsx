import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/site/Reveal";
import { CtaBand } from "@/components/site/CtaBand";
import { useStudioContent } from "@/lib/studio-content";
import { btn } from "@/lib/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Services — Kahani Studio" },
      {
        name: "description",
        content:
          "Wedding, pre-wedding, engagement, birthday, maternity, baby, portrait, event, cinematography and product photography.",
      },
      { property: "og:title", content: "Photography Services — Kahani Studio" },
      {
        property: "og:description",
        content: "Ten photography and film services, each crafted around your story.",
      },
    ],
  }),
  component: Services,
});

function Services() {
  const { categories } = useStudioContent();
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Every occasion, its own language."
        intro="From grand weddings to quiet newborn mornings, each service is shaped around the people and the moment."
      />
      <div className="container-x space-y-24 pb-24 lg:space-y-36 lg:pb-36">
        {categories
          .filter((c) => c.active)
          .map((c, i) => (
            <section
              key={c.id}
              id={c.slug}
              className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-12 lg:gap-16"
            >
              <Reveal className={cn("lg:col-span-6", i % 2 && "lg:order-2 lg:col-start-7")}>
                <div className="img-zoom">
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className={cn(
                      "w-full object-cover",
                      i % 3 === 0 ? "aspect-[4/3]" : "aspect-[5/4]",
                    )}
                  />
                </div>
              </Reveal>
              <Reveal
                delay={0.1}
                className={cn("lg:col-span-5", i % 2 ? "lg:order-1" : "lg:col-start-8")}
              >
                <p className="eyebrow text-bronze">
                  {String(i + 1).padStart(2, "0")} — {c.short}
                </p>
                <h2 className="text-section mt-4">{c.name}</h2>
                <p className="mt-5 text-muted-foreground">{c.description}</p>
                <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                  {c.features.map((f) => (
                    <li key={f} className="flex gap-3 text-[15px]">
                      <Check size={16} className="mt-1 shrink-0 text-bronze" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/quote"
                  search={{ category: c.name }}
                  className={cn(btn("outline"), "mt-10")}
                >
                  Request a quotation
                </Link>
              </Reveal>
            </section>
          ))}
      </div>
      <CtaBand />
    </>
  );
}
