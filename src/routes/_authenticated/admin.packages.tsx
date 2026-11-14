import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { newId, useAdmin } from "@/components/admin/store";
import { aBtn, aField, L, Modal, PageTitle, Table, Td, Toggle } from "@/components/admin/ui";
import { formatINR } from "@/config/studio";
import type { Package, PackageGroup, PackageTier } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/packages")({
  head: () => ({
    meta: [
      { title: "Packages — Kahani Studio" },
      { name: "description", content: "Manage packages for Kahani Studio." },
      { property: "og:title", content: "Packages — Kahani Studio" },
      { property: "og:description", content: "Manage packages for Kahani Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
const groups: PackageGroup[] = [
  "Wedding",
  "Pre-Wedding",
  "Birthday",
  "Engagement",
  "Events",
  "Other Services",
];

function Page() {
  const { packages } = useAdmin();
  const [edit, setEdit] = useState<Package | null>(null);
  return (
    <>
      <PageTitle
        title="Packages"
        sub="Pricing tiers for each category"
        action={
          <button
            className={aBtn()}
            onClick={() =>
              setEdit({
                id: newId("pk"),
                group: "Wedding",
                tier: "Basic",
                price: 0,
                description: "",
                features: [],
                active: true,
              })
            }
          >
            <Plus size={16} />
            Add package
          </button>
        }
      />
      <Table head={["Category", "Tier", "Price", "Features", "Active", ""]}>
        {packages.items.map((p) => (
          <tr key={p.id}>
            <Td>{p.group}</Td>
            <Td className="font-medium">{p.tier}</Td>
            <Td>{formatINR(p.price)}</Td>
            <Td className="text-muted-foreground">{p.features.length} items</Td>
            <Td>
              <Toggle
                label="Active"
                on={p.active}
                onChange={(v) => packages.upsert({ ...p, active: v })}
              />
            </Td>
            <Td className="text-right">
              <button aria-label="Edit" onClick={() => setEdit(p)} className="p-2">
                <Pencil size={15} />
              </button>
              <button
                aria-label="Delete"
                onClick={() => confirm("Delete this package?") && packages.remove(p.id)}
                className="p-2 text-destructive"
              >
                <Trash2 size={15} />
              </button>
            </Td>
          </tr>
        ))}
      </Table>
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Package">
        {edit && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              packages.upsert({ ...edit, features: edit.features.filter(Boolean) });
              setEdit(null);
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <L label="Category">
                <select
                  className={aField}
                  value={edit.group}
                  onChange={(e) => setEdit({ ...edit, group: e.target.value as PackageGroup })}
                >
                  {groups.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </L>
              <L label="Tier">
                <select
                  className={aField}
                  value={edit.tier}
                  onChange={(e) => setEdit({ ...edit, tier: e.target.value as PackageTier })}
                >
                  {["Basic", "Premium", "Luxury"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </L>
            </div>
            <L label="Price (₹)">
              <input
                type="number"
                min={0}
                className={aField}
                value={edit.price}
                onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })}
              />
            </L>
            <L label="Description">
              <input
                className={aField}
                value={edit.description}
                onChange={(e) => setEdit({ ...edit, description: e.target.value })}
              />
            </L>
            <L label="Features (one per line)">
              <textarea
                rows={5}
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
