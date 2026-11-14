import { createFileRoute } from "@tanstack/react-router";
import { Eye, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useAdmin } from "@/components/admin/store";
import { aBtn, aField, Badge, Modal, PageTitle, Table, Td } from "@/components/admin/ui";
import { waLink } from "@/config/studio";
import type { Inquiry, InquiryStatus } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/inquiries")({
  head: () => ({
    meta: [
      { title: "Inquiries — Kahani Studio" },
      { name: "description", content: "Manage inquiries for Kahani Studio." },
      { property: "og:title", content: "Inquiries — Kahani Studio" },
      { property: "og:description", content: "Manage inquiries for Kahani Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
const statuses: InquiryStatus[] = [
  "New",
  "Contacted",
  "Follow-up",
  "Quotation Sent",
  "Converted",
  "Cancelled",
];
const digits = (p: string) => p.replace(/\D/g, "");

function Page() {
  const { inquiries } = useAdmin();
  const [filter, setFilter] = useState<"All" | InquiryStatus>("All");
  const [view, setView] = useState<Inquiry | null>(null);
  const list =
    filter === "All" ? inquiries.items : inquiries.items.filter((i) => i.status === filter);
  return (
    <>
      <PageTitle
        title="Inquiries"
        sub={`${inquiries.items.length} total`}
        action={
          <select
            className={aField + " w-48"}
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option>All</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        }
      />
      <Table head={["Customer", "Phone", "Category", "Event date", "Status", ""]}>
        {list.map((q) => (
          <tr key={q.id}>
            <Td>
              <p className="font-medium">{q.name}</p>
              <p className="text-xs text-muted-foreground">{q.id}</p>
            </Td>
            <Td>{q.phone}</Td>
            <Td>{q.category}</Td>
            <Td>{q.eventDate}</Td>
            <Td>
              <select
                aria-label="Status"
                className="rounded-sm border border-input bg-card px-2 py-1 text-xs"
                value={q.status}
                onChange={(e) =>
                  inquiries.upsert({ ...q, status: e.target.value as InquiryStatus })
                }
              >
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Td>
            <Td className="whitespace-nowrap text-right">
              <button aria-label="View" onClick={() => setView(q)} className="p-2">
                <Eye size={15} />
              </button>
              <a
                aria-label="WhatsApp"
                href={waLink(
                  `Hello ${q.name}, this is Kahani Studio regarding your ${q.category} inquiry.`,
                  digits(q.phone),
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-block p-2 text-olive"
              >
                <MessageCircle size={15} />
              </a>
            </Td>
          </tr>
        ))}
      </Table>
      <Modal open={!!view} onClose={() => setView(null)} title={view?.name ?? ""}>
        {view && (
          <div className="space-y-3 text-sm">
            <Badge s={view.status} />
            {[
              ["Inquiry", view.id],
              ["Phone", view.phone],
              ["Email", view.email],
              ["Category", view.category],
              ["Event date", view.eventDate],
              ["Received", view.createdAt],
            ].map(([k, v]) => (
              <p key={k}>
                <span className="inline-block w-24 text-muted-foreground">{k}</span>
                {v}
              </p>
            ))}
            <p className="rounded-sm bg-muted p-3">{view.message}</p>
            <a
              href={waLink(`Hello ${view.name}, this is Kahani Studio.`, digits(view.phone))}
              target="_blank"
              rel="noreferrer"
              className={aBtn()}
            >
              <MessageCircle size={15} />
              Contact on WhatsApp
            </a>
          </div>
        )}
      </Modal>
    </>
  );
}
