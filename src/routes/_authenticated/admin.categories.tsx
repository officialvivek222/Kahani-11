import { createFileRoute } from "@tanstack/react-router";
import { Check, Image as ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { newId, useAdmin } from "@/components/admin/store";
import { aBtn, aField, L, Modal, PageTitle, Table, Td, Toggle } from "@/components/admin/ui";
import { images } from "@/lib/images";
import type { Category } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({
    meta: [
      { title: "Services & Categories — Kahani Studio" },
      { name: "description", content: "Manage photography services and categories." },
      { property: "og:title", content: "Services & Categories — Kahani Studio" },
      { property: "og:description", content: "Manage photography services and categories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { categories } = useAdmin();
  const [edit, setEdit] = useState<Category | null>(null);

  return (
    <>
      <PageTitle
        title="Services & Categories"
        sub="Photography and cinematography services displayed on the public website and quote calculator"
        action={
          <button
            className={aBtn()}
            onClick={() =>
              setEdit({
                id: newId("c"),
                slug: "",
                name: "",
                short: "",
                description: "",
                image: images.portrait,
                active: true,
                features: [],
                highlights: [],
                order: 0,
              })
            }
          >
            <Plus size={16} />
            Add Service
          </button>
        }
      />
      <Table head={["Photo", "Service Name", "Description", "Features", "Status", "Actions"]}>
        {categories.items.map((c) => (
          <tr key={c.id}>
            <Td>
              <img
                src={c.image}
                alt={c.name}
                className="size-12 rounded-sm border border-border object-cover"
              />
            </Td>
            <Td className="font-medium">
              <p className="font-semibold text-foreground">{c.name}</p>
              <p className="text-xs text-bronze">{c.short || c.slug}</p>
            </Td>
            <Td className="max-w-xs truncate text-muted-foreground">{c.description}</Td>
            <Td className="text-xs text-muted-foreground">{c.features?.length || 0} features</Td>
            <Td>
              <Toggle
                label="Active"
                on={c.active}
                onChange={(v) => categories.upsert({ ...c, active: v })}
              />
            </Td>
            <Td className="text-right">
              <button
                aria-label="Edit"
                onClick={() => setEdit({ ...c, highlights: c.highlights || [] })}
                className="rounded-xs p-2 hover:bg-muted"
                title="Edit Service"
              >
                <Pencil size={15} />
              </button>
              <button
                aria-label="Delete"
                onClick={() => confirm(`Delete service "${c.name}"?`) && categories.remove(c.id)}
                className="rounded-xs p-2 text-destructive hover:bg-destructive/10"
                title="Delete Service"
              >
                <Trash2 size={15} />
              </button>
            </Td>
          </tr>
        ))}
      </Table>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id.startsWith("c-") ? "New Photography Service" : `Edit ${edit?.name}`}
      >
        {edit && (
          <form
            className="space-y-4 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              if (!edit.name.trim()) return;
              const slug =
                edit.slug.trim() ||
                edit.name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "");
              categories.upsert({
                ...edit,
                slug,
                short: edit.short.trim() || edit.name,
                features: edit.features.map((f) => f.trim()).filter(Boolean),
                highlights: (edit.highlights || []).map((h) => h.trim()).filter(Boolean),
                order: edit.order !== undefined ? Number(edit.order) : undefined,
              });
              setEdit(null);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <L label="Service Full Name">
                <input
                  required
                  placeholder="e.g. Wedding Photography"
                  className={aField}
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </L>
              <L label="Short Name / Tag">
                <input
                  placeholder="e.g. Wedding"
                  className={aField}
                  value={edit.short}
                  onChange={(e) => setEdit({ ...edit, short: e.target.value })}
                />
              </L>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <L label="URL Slug">
                <input
                  placeholder="e.g. wedding"
                  className={aField}
                  value={edit.slug}
                  onChange={(e) => setEdit({ ...edit, slug: e.target.value })}
                />
              </L>
              <L label="Cover Image">
                <select
                  className={aField}
                  value={
                    Object.entries(images).find(([, url]) => url === edit.image)?.[0] || edit.image
                  }
                  onChange={(e) => {
                    const key = e.target.value as keyof typeof images;
                    setEdit({ ...edit, image: images[key] || e.target.value });
                  }}
                >
                  {Object.entries(images).map(([k]) => (
                    <option key={k} value={k}>
                      {k.charAt(0).toUpperCase() + k.slice(1)} Preset Photo
                    </option>
                  ))}
                </select>
              </L>
              <L label="Display order">
                <input
                  type="number"
                  min={0}
                  max={999}
                  className={aField}
                  value={edit.order ?? 0}
                  onChange={(e) => setEdit({ ...edit, order: Number(e.target.value) })}
                />
              </L>
            </div>

            <L label="Editorial Description">
              <textarea
                rows={3}
                required
                placeholder="Describe the service feel, style, and approach..."
                className={aField}
                value={edit.description}
                onChange={(e) => setEdit({ ...edit, description: e.target.value })}
              />
            </L>

            <L label="Service Highlights (one highlight per line)">
              <textarea
                rows={3}
                placeholder="Two Lead Photographers&#10;4K Drone Aerials&#10;Heirloom Album"
                className={aField}
                value={(edit.highlights || []).join("\n")}
                onChange={(e) => setEdit({ ...edit, highlights: e.target.value.split("\n") })}
              />
            </L>

            <L label="Included Features (one feature per line)">
              <textarea
                rows={4}
                required
                placeholder="Candid & traditional coverage&#10;Two lead photographers&#10;Curated online gallery"
                className={aField}
                value={edit.features.join("\n")}
                onChange={(e) => setEdit({ ...edit, features: e.target.value.split("\n") })}
              />
            </L>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={edit.active}
                  onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
                  className="rounded-xs border-input accent-bronze"
                />
                <span className="font-medium">Active on website & quote calculator</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEdit(null)}
                  className="rounded-sm border border-input px-4 py-2 text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button type="submit" className={aBtn()}>
                  Save Service
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
