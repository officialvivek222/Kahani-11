import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { newId, useAdmin } from "@/components/admin/store";
import { aBtn, aField, L, Modal, PageTitle, Table, Td, Toggle } from "@/components/admin/ui";
import { images } from "@/lib/images";
import type { Category } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Kahani Studio" },
      { name: "description", content: "Manage categories for Kahani Studio." },
      { property: "og:title", content: "Categories — Kahani Studio" },
      { property: "og:description", content: "Manage categories for Kahani Studio." },
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
        title="Categories"
        sub="Photography categories shown on the website"
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
              })
            }
          >
            <Plus size={16} />
            Add category
          </button>
        }
      />
      <Table head={["", "Name", "Description", "Active", ""]}>
        {categories.items.map((c) => (
          <tr key={c.id}>
            <Td>
              <img src={c.image} alt="" className="size-10 rounded-sm object-cover" />
            </Td>
            <Td className="font-medium">{c.name}</Td>
            <Td className="max-w-xs truncate text-muted-foreground">{c.description}</Td>
            <Td>
              <Toggle
                label="Active"
                on={c.active}
                onChange={(v) => categories.upsert({ ...c, active: v })}
              />
            </Td>
            <Td className="text-right">
              <button aria-label="Edit" onClick={() => setEdit(c)} className="p-2">
                <Pencil size={15} />
              </button>
              <button
                aria-label="Delete"
                onClick={() => confirm(`Delete ${c.name}?`) && categories.remove(c.id)}
                className="p-2 text-destructive"
              >
                <Trash2 size={15} />
              </button>
            </Td>
          </tr>
        ))}
      </Table>
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Category">
        {edit && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!edit.name.trim()) return;
              categories.upsert({
                ...edit,
                slug: edit.slug || edit.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                short: edit.short || edit.name,
              });
              setEdit(null);
            }}
          >
            <L label="Name">
              <input
                required
                className={aField}
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </L>
            <L label="Description">
              <textarea
                rows={3}
                className={aField}
                value={edit.description}
                onChange={(e) => setEdit({ ...edit, description: e.target.value })}
              />
            </L>
            <L label="Features (one per line)">
              <textarea
                rows={4}
                className={aField}
                value={edit.features.join("\n")}
                onChange={(e) => setEdit({ ...edit, features: e.target.value.split("\n") })}
              />
            </L>
            <button className={aBtn()}>Save</button>
          </form>
        )}
      </Modal>
    </>
  );
}
