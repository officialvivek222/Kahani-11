import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
  const [catSelect, setCatSelect] = useState("Wedding");
  const [customCat, setCustomCat] = useState("");
  const [tierSelect, setTierSelect] = useState("Basic");
  const [customTier, setCustomTier] = useState("");

  const openEdit = (p: Package | null) => {
    setEdit(p);
    if (p) {
      const isStdGroup = groups.includes(p.group);
      setCatSelect(isStdGroup ? p.group : "Custom");
      setCustomCat(isStdGroup ? "" : p.group);

      const isStdTier = ["Basic", "Premium", "Luxury"].includes(p.tier);
      setTierSelect(isStdTier ? p.tier : "Custom");
      setCustomTier(isStdTier ? "" : p.tier);
    }
  };

  return (
    <>
      <PageTitle
        title="Packages"
        sub="Pricing tiers for each category"
        action={
          <button
            className={aBtn()}
            onClick={() =>
              openEdit({
                id: newId("pk"),
                group: "Wedding",
                tier: "Basic",
                price: 0,
                description: "",
                features: [],
                active: true,
                popular: false,
                order: 0,
              })
            }
          >
            <Plus size={16} />
            Add package
          </button>
        }
      />
      <Table head={["Category", "Package name", "Price", "Order", "Most loved", "Features", "Active", ""]}>
        {packages.items.map((p) => (
          <tr key={p.id}>
            <Td>{p.group}</Td>
            <Td className="font-medium">
              <div className="flex items-center gap-2">
                <span>{p.tier}</span>
                {p.popular && (
                  <span className="rounded-full bg-bronze/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-bronze">
                    Most loved
                  </span>
                )}
              </div>
            </Td>
            <Td>{formatINR(p.price)}</Td>
            <Td className="text-muted-foreground">{p.order ?? 0}</Td>
            <Td>{p.popular ? "Yes" : "—"}</Td>
            <Td className="text-muted-foreground">{p.features.length} items</Td>
            <Td>
              <Toggle
                label="Active"
                on={p.active}
                onChange={(v) => packages.upsert({ ...p, active: v })}
              />
            </Td>
            <Td className="text-right">
              <button aria-label="Edit" onClick={() => openEdit(p)} className="p-2">
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
              const finalGroup = (catSelect === "Custom" ? customCat.trim() : catSelect).trim();
              const finalTier = (tierSelect === "Custom" ? customTier.trim() : tierSelect).trim();

              if (!finalGroup) {
                toast.error("Please enter a category name.");
                return;
              }
              if (!finalTier) {
                toast.error("Please enter a package name.");
                return;
              }
              if (finalTier.toLowerCase() === "custom") {
                toast.error("'Custom' is reserved for tailor-made quotations.");
                return;
              }
              const isDup = packages.items.some(
                (p) =>
                  p.id !== edit.id &&
                  p.group.toLowerCase() === finalGroup.toLowerCase() &&
                  p.tier.trim().toLowerCase() === finalTier.toLowerCase(),
              );
              if (isDup) {
                toast.error(`A package named "${finalTier}" already exists in ${finalGroup}.`);
                return;
              }
              packages.upsert({
                ...edit,
                group: finalGroup,
                tier: finalTier,
                features: edit.features.filter(Boolean),
              });
              setEdit(null);
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <L label="Category">
                  <select
                    className={aField}
                    value={catSelect}
                    onChange={(e) => setCatSelect(e.target.value)}
                  >
                    {groups.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                    <option value="Custom">Custom (write your own)</option>
                  </select>
                </L>
                {catSelect === "Custom" && (
                  <input
                    type="text"
                    required
                    minLength={1}
                    maxLength={60}
                    placeholder="Enter category name"
                    className={aField + " mt-2"}
                    value={customCat}
                    onChange={(e) => setCustomCat(e.target.value)}
                  />
                )}
              </div>
              <div>
                <L label="Package name">
                  <select
                    className={aField}
                    value={tierSelect}
                    onChange={(e) => setTierSelect(e.target.value)}
                  >
                    {["Basic", "Premium", "Luxury"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="Custom">Custom (write your own)</option>
                  </select>
                </L>
                {tierSelect === "Custom" && (
                  <input
                    type="text"
                    required
                    minLength={1}
                    maxLength={60}
                    placeholder="Enter package name"
                    className={aField + " mt-2"}
                    value={customTier}
                    onChange={(e) => setCustomTier(e.target.value)}
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <L label="Price (₹)">
                <input
                  type="number"
                  min={0}
                  className={aField}
                  value={edit.price}
                  onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })}
                />
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
            <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm text-foreground">
              <input
                type="checkbox"
                checked={Boolean(edit.popular)}
                onChange={(e) => setEdit({ ...edit, popular: e.target.checked })}
                className="size-4 rounded border-border accent-bronze"
              />
              <span>Show "Most loved" badge</span>
            </label>
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
