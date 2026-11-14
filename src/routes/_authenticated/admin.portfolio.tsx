import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { newId, useAdmin } from "@/components/admin/store";
import { aBtn, aField, Card, L, Modal, PageTitle } from "@/components/admin/ui";
import { images } from "@/lib/images";
import type { PortfolioFilter, PortfolioItem } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Kahani Studio" },
      { name: "description", content: "Manage portfolio for Kahani Studio." },
      { property: "og:title", content: "Portfolio — Kahani Studio" },
      { property: "og:description", content: "Manage portfolio for Kahani Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
const cats: PortfolioFilter[] = ["Wedding", "Pre-Wedding", "Engagement", "Events", "Portraits"];

function Page() {
  const { portfolio } = useAdmin();
  const [edit, setEdit] = useState<PortfolioItem | null>(null);
  const blank: PortfolioItem = {
    id: newId("p"),
    title: "",
    location: "",
    category: "Wedding",
    image: images.hero,
    ratio: "landscape",
    featured: false,
  };
  return (
    <>
      <PageTitle
        title="Portfolio"
        sub={`${portfolio.items.length} projects`}
        action={
          <button className={aBtn()} onClick={() => setEdit(blank)}>
            <Plus size={16} />
            Add project
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {portfolio.items.map((p) => (
          <Card key={p.id} className="overflow-hidden">
            <div className="relative aspect-[3/2]">
              <img
                src={p.image}
                alt={p.title}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              {p.featured && (
                <span className="absolute left-2 top-2 rounded-sm bg-bronze px-2 py-0.5 text-xs text-paper">
                  Featured
                </span>
              )}
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.category} · {p.location}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  aria-label="Toggle featured"
                  onClick={() => portfolio.upsert({ ...p, featured: !p.featured })}
                  className="p-2"
                >
                  <Star size={15} className={cn(p.featured && "fill-bronze text-bronze")} />
                </button>
                <button aria-label="Edit" onClick={() => setEdit(p)} className="p-2">
                  <Pencil size={15} />
                </button>
                <button
                  aria-label="Delete"
                  onClick={() => confirm(`Delete "${p.title}"?`) && portfolio.remove(p.id)}
                  className="p-2 text-destructive"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.title ? "Edit project" : "New project"}
      >
        {edit && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!edit.title.trim()) return;
              portfolio.upsert(edit);
              setEdit(null);
            }}
          >
            <L label="Title">
              <input
                required
                className={aField}
                value={edit.title}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              />
            </L>
            <L label="Location">
              <input
                className={aField}
                value={edit.location}
                onChange={(e) => setEdit({ ...edit, location: e.target.value })}
              />
            </L>
            <div className="grid grid-cols-2 gap-3">
              <L label="Category">
                <select
                  className={aField}
                  value={edit.category}
                  onChange={(e) =>
                    setEdit({ ...edit, category: e.target.value as PortfolioFilter })
                  }
                >
                  {cats.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </L>
              <L label="Shape">
                <select
                  className={aField}
                  value={edit.ratio}
                  onChange={(e) =>
                    setEdit({ ...edit, ratio: e.target.value as PortfolioItem["ratio"] })
                  }
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                  <option value="square">Square</option>
                </select>
              </L>
            </div>
            <L label="Image">
              <select
                className={aField}
                value={edit.image}
                onChange={(e) => setEdit({ ...edit, image: e.target.value })}
              >
                {Object.entries(images).map(([k, v]) => (
                  <option key={k} value={v}>
                    {k}
                  </option>
                ))}
              </select>
            </L>
            <p className="text-xs text-muted-foreground">
              Photo uploads will be available once storage is connected.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={edit.featured}
                onChange={(e) => setEdit({ ...edit, featured: e.target.checked })}
              />
              Feature on homepage
            </label>
            <button className={aBtn()}>Save</button>
          </form>
        )}
      </Modal>
    </>
  );
}
