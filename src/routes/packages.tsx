import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/site/PageHeader";
import { PackageCard } from "@/components/site/PackageCard";
import { CtaBand } from "@/components/site/CtaBand";
import { useStudioContent } from "@/lib/studio-content";
import type { PackageGroup } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/packages")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Packages & Pricing — Kahani Studio" },
      {
        name: "description",
        content:
          "Basic, Premium and Luxury photography packages for weddings, pre-weddings, birthdays, engagements and events.",
      },
      { property: "og:title", content: "Packages & Pricing — Kahani Studio" },
      {
        property: "og:description",
        content: "Transparent sample pricing for every kind of celebration.",
      },
    ],
  }),
  component: Packages,
});

const groups: PackageGroup[] = [
  "Wedding",
  "Pre-Wedding",
  "Birthday",
  "Engagement",
  "Events",
  "Other Services",
];

function Packages() {
  const { packages } = useStudioContent();
  const [g, setG] = useState<PackageGroup>("Wedding");
  return (
    <>
      <PageHeader
        eyebrow="Packages & pricing"
        title="Thoughtful packages, honest pricing."
        intro="Sample starting prices. Every celebration is different — use the quotation tool for a personal estimate."
      />
      <section className="container-x pb-24 lg:pb-32">
        <div role="tablist" className="mb-12 flex gap-6 overflow-x-auto border-b border-border">
          {groups.map((x) => (
            <button
              role="tab"
              aria-selected={g === x}
              key={x}
              onClick={() => setG(x)}
              className={cn(
                "-mb-px shrink-0 border-b py-3 text-[13px] uppercase tracking-[0.16em]",
                g === x
                  ? "border-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {x}
            </button>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {packages
            .filter((p) => p.group === g && p.active)
            .map((p) => (
              <PackageCard key={p.id} pkg={p} />
            ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Prices are indicative and exclude travel outside the city. Final pricing is confirmed by
          the studio.
        </p>
      </section>
      <CtaBand />
    </>
  );
}
