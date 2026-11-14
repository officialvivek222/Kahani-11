import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { newId, useAdmin } from "@/components/admin/store";
import { aBtn, aField, Card, L, Modal, PageTitle, Toggle } from "@/components/admin/ui";
import type { Testimonial } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/testimonials")({
  head: () => ({
    meta: [
      { title: "Testimonials — Kahani Studio" },
      { name: "description", content: "Manage testimonials for Kahani Studio." },
      { property: "og:title", content: "Testimonials — Kahani Studio" },
      { property: "og:description", content: "Manage testimonials for Kahani Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { testimonials } = useAdmin();
  const [edit, setEdit] = useState<Testimonial | null>(null);
  return (
    <>
      <PageTitle
        title="Testimonials"
        action={
          <button
            className={aBtn()}
            onClick={() =>
              setEdit({
                id: newId("t"),
                name: "",
                event: "",
                rating: 5,
                review: "",
                published: false,
              })
            }
          >
            <Plus size={16} />
            Add review
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {testimonials.items.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.event}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {t.published ? "Published" : "Draft"}
                </span>
                <Toggle
                  label="Published"
                  on={t.published}
                  onChange={(v) => testimonials.upsert({ ...t, published: v })}
                />
              </div>
            </div>
            <div className="mt-3 flex gap-0.5 text-bronze">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} size={13} className={k < t.rating ? "fill-current" : "opacity-30"} />
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t.review}</p>
            <div className="mt-4 flex gap-1">
              <button aria-label="Edit" onClick={() => setEdit(t)} className="p-2">
                <Pencil size={15} />
              </button>
              <button
                aria-label="Delete"
                onClick={() => confirm("Delete this review?") && testimonials.remove(t.id)}
                className="p-2 text-destructive"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Review">
        {edit && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!edit.name.trim() || !edit.review.trim()) return;
              testimonials.upsert(edit);
              setEdit(null);
            }}
          >
            <L label="Customer name">
              <input
                required
                className={aField}
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </L>
            <L label="Event">
              <input
                className={aField}
                value={edit.event}
                onChange={(e) => setEdit({ ...edit, event: e.target.value })}
              />
            </L>
            <L label="Rating">
              <select
                className={aField}
                value={edit.rating}
                onChange={(e) => setEdit({ ...edit, rating: Number(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} stars
                  </option>
                ))}
              </select>
            </L>
            <L label="Review">
              <textarea
                required
                rows={4}
                className={aField}
                value={edit.review}
                onChange={(e) => setEdit({ ...edit, review: e.target.value })}
              />
            </L>
            <button className={aBtn()}>Save</button>
          </form>
        )}
      </Modal>
    </>
  );
}
