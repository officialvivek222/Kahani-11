import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { newId, useAdmin } from "@/components/admin/store";
import { aBtn, aField, PageTitle, Table, Td, Toggle } from "@/components/admin/ui";
import type { AddOn } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/services")({
  head: () => ({
    meta: [
      { title: "Services — Kahani Studio" },
      { name: "description", content: "Manage services for Kahani Studio." },
      { property: "og:title", content: "Services — Kahani Studio" },
      { property: "og:description", content: "Manage services for Kahani Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function ServiceRow({
  item,
  onSave,
  onRemove,
}: {
  item: AddOn;
  onSave: (updated: AddOn) => void;
  onRemove: (id: string) => void;
}) {
  const [desc, setDesc] = useState(item.description);
  const [price, setPrice] = useState(item.price);

  useEffect(() => {
    setDesc(item.description);
    setPrice(item.price);
  }, [item.description, item.price]);

  const commitDesc = () => {
    if (desc !== item.description) {
      onSave({ ...item, description: desc });
    }
  };

  const commitPrice = () => {
    if (price !== item.price) {
      onSave({ ...item, price });
    }
  };

  return (
    <tr>
      <Td className="font-medium">{item.name}</Td>
      <Td>
        <input
          className={aField}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={commitDesc}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
      </Td>
      <Td>
        <input
          type="number"
          min={0}
          className={aField + " max-w-[130px]"}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          onBlur={commitPrice}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
      </Td>
      <Td>
        <Toggle label="Active" on={item.active} onChange={(v) => onSave({ ...item, active: v })} />
      </Td>
      <Td className="text-right">
        <button
          aria-label="Delete"
          onClick={() => confirm(`Delete ${item.name}?`) && onRemove(item.id)}
          className="p-2 text-destructive"
        >
          <Trash2 size={15} />
        </button>
      </Td>
    </tr>
  );
}

function Page() {
  const { addOns } = useAdmin();
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  return (
    <>
      <PageTitle title="Additional Services" sub="Add-ons offered in the quotation tool" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addOns.upsert({
            id: newId("a"),
            name: name.trim(),
            price,
            description: "",
            active: true,
          });
          setName("");
          setPrice(0);
        }}
        className="mb-6 flex flex-wrap gap-3"
      >
        <input
          placeholder="Service name"
          className={aField + " max-w-xs"}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          min={0}
          placeholder="Price"
          className={aField + " max-w-[140px]"}
          value={price || ""}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <button className={aBtn()}>
          <Plus size={16} />
          Add
        </button>
      </form>
      <Table head={["Service", "Description", "Price (₹)", "Active", ""]}>
        {addOns.items.map((a) => (
          <ServiceRow
            key={a.id}
            item={a}
            onSave={(updated) => addOns.upsert(updated)}
            onRemove={(id) => addOns.remove(id)}
          />
        ))}
      </Table>
    </>
  );
}
