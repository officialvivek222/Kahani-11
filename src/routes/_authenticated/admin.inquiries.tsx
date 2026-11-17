import { createFileRoute } from "@tanstack/react-router";
import { Eye, Mail, MessageCircle, Phone, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAdmin } from "@/components/admin/store";
import { aBtn, aField, Badge, Card, Modal, PageTitle, Table, Td } from "@/components/admin/ui";
import { waLink } from "@/config/studio";
import type { Inquiry, InquiryStatus } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/inquiries")({
  head: () => ({
    meta: [
      { title: "Inquiries — Kahani Studio" },
      { name: "description", content: "Manage client inquiries for Kahani Studio." },
      { property: "og:title", content: "Inquiries — Kahani Studio" },
      { property: "og:description", content: "Manage client inquiries for Kahani Studio." },
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
  const [search, setSearch] = useState("");
  const [view, setView] = useState<Inquiry | null>(null);

  const filtered = inquiries.items.filter((item) => {
    const matchesFilter = filter === "All" || item.status === filter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const totalCount = inquiries.items.length;
  const newCount = inquiries.items.filter((i) => i.status === "New").length;
  const contactedCount = inquiries.items.filter(
    (i) => i.status === "Contacted" || i.status === "Follow-up",
  ).length;
  const convertedCount = inquiries.items.filter((i) => i.status === "Converted").length;

  return (
    <>
      <PageTitle
        title="Client Inquiries"
        sub="Inquiries received from the website contact forms and general inquiries"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search inquiries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={aField + " pl-8 py-1.5 text-xs w-48 sm:w-64"}
              />
            </div>
            <select
              aria-label="Filter status"
              className={aField + " w-40 py-1.5 text-xs"}
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
            >
              <option value="All">All Inquiries ({totalCount})</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s} ({inquiries.items.filter((i) => i.status === s).length})
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Metric Counters */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Inquiries</p>
          <p className="mt-1 text-2xl font-bold">{totalCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">New / Unread</p>
          <p className="mt-1 text-2xl font-bold">{newCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">In Follow-up</p>
          <p className="mt-1 text-2xl font-bold">{contactedCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Converted</p>
          <p className="mt-1 text-2xl font-bold">{convertedCount}</p>
        </Card>
      </div>

      <Table head={["Customer", "Contact Details", "Category", "Event Date", "Status", "Actions"]}>
        {filtered.length === 0 ? (
          <tr>
            <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
              {search ? "No inquiries match your search filter." : "No inquiries received yet."}
            </td>
          </tr>
        ) : (
          filtered.map((q) => (
            <tr key={q.id}>
              <Td>
                <p className="font-semibold text-foreground">{q.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{q.id}</p>
              </Td>
              <Td>
                <p className="text-xs font-medium text-foreground">{q.phone || "—"}</p>
                <p className="text-xs text-muted-foreground">{q.email || "—"}</p>
              </Td>
              <Td className="text-xs font-medium">{q.category}</Td>
              <Td className="text-xs text-muted-foreground">{q.eventDate || "—"}</Td>
              <Td>
                <select
                  aria-label="Update status"
                  className="rounded-sm border border-input bg-card px-2 py-1 text-xs font-medium"
                  value={q.status}
                  onChange={(e) =>
                    inquiries.upsert({ ...q, status: e.target.value as InquiryStatus })
                  }
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Td>
              <Td className="whitespace-nowrap text-right">
                <button
                  aria-label="View Details"
                  onClick={() => setView(q)}
                  className="rounded-xs p-2 hover:bg-muted"
                  title="View Details"
                >
                  <Eye size={15} />
                </button>
                {q.phone && (
                  <a
                    aria-label="Contact on WhatsApp"
                    href={waLink(
                      `Hello ${q.name}! This is Kahani Studio regarding your ${q.category} photography inquiry. How may we assist you with your celebration?`,
                      digits(q.phone),
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded-xs p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    title="Open WhatsApp Chat"
                  >
                    <MessageCircle size={15} />
                  </a>
                )}
                <button
                  aria-label="Delete inquiry"
                  onClick={() =>
                    confirm(`Delete inquiry from "${q.name}"?`) && inquiries.remove(q.id)
                  }
                  className="rounded-xs p-2 text-destructive hover:bg-destructive/10"
                  title="Delete Inquiry"
                >
                  <Trash2 size={15} />
                </button>
              </Td>
            </tr>
          ))
        )}
      </Table>

      <Modal
        open={!!view}
        onClose={() => setView(null)}
        title={view ? `Inquiry from ${view.name}` : ""}
      >
        {view && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <Badge s={view.status} />
              <span className="font-mono text-xs text-muted-foreground">ID: {view.id}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Customer Name</p>
                <p className="font-semibold text-foreground">{view.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Photography Category</p>
                <p className="font-semibold text-foreground">{view.category}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone Number</p>
                <p className="font-medium text-foreground">{view.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="font-medium text-foreground">{view.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Event Date</p>
                <p className="font-medium text-foreground">
                  {view.eventDate || "Flexible / Not specified"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Received On</p>
                <p className="font-medium text-foreground">
                  {view.createdAt ? new Date(view.createdAt).toLocaleString("en-IN") : "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs text-muted-foreground">Requirements & Client Message</p>
              <div className="rounded-sm border border-border bg-muted/40 p-3 leading-relaxed">
                {view.message || "No additional message provided."}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </p>
              <div className="flex flex-wrap gap-2">
                {view.phone && (
                  <a
                    href={waLink(
                      `Hello ${view.name}, this is Kahani Studio regarding your ${view.category} photography inquiry.`,
                      digits(view.phone),
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-sm bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp Chat</span>
                  </a>
                )}
                {view.phone && (
                  <a
                    href={`tel:${digits(view.phone)}`}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-border px-4 py-2 text-xs font-medium hover:bg-muted"
                  >
                    <Phone size={14} />
                    <span>Call Client</span>
                  </a>
                )}
                {view.email && (
                  <a
                    href={`mailto:${view.email}?subject=Kahani%20Studio%20%E2%80%94%20${encodeURIComponent(view.category)}%20Inquiry`}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-border px-4 py-2 text-xs font-medium hover:bg-muted"
                  >
                    <Mail size={14} />
                    <span>Send Email</span>
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <label className="flex items-center gap-2 text-xs">
                <span className="font-medium text-muted-foreground">Update Status:</span>
                <select
                  className="rounded-sm border border-input bg-card px-2 py-1 text-xs font-medium"
                  value={view.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value as InquiryStatus;
                    const updated = { ...view, status: newStatus };
                    setView(updated);
                    await inquiries.upsert(updated);
                  }}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => setView(null)}
                className="rounded-sm border border-input px-4 py-1.5 text-xs font-medium hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
