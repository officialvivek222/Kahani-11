import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";
import { Gallery } from "@/components/site/Gallery";
import { CtaBand } from "@/components/site/CtaBand";
import { useStudioContent } from "@/lib/studio-content";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Portfolio — Kahani Studio" },
      {
        name: "description",
        content:
          "Weddings, pre-wedding shoots, engagements, events and portraits by Kahani Studio.",
      },
      { property: "og:title", content: "Portfolio — Kahani Studio" },
      {
        property: "og:description",
        content: "Browse our wedding, pre-wedding, event and portrait stories.",
      },
    ],
  }),
  component: Portfolio,
});
function Portfolio() {
  const { portfolio } = useStudioContent();
  return (
    <>
      <PageHeader
        eyebrow="Portfolio"
        title="Stories, frame by frame."
        intro="A selection of recent celebrations. Tap any photograph to view it full-screen."
      />
      <section className="container-x pb-24 lg:pb-32">
        <Gallery items={portfolio} />
      </section>
      <CtaBand />
    </>
  );
}
