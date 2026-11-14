import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/components/admin/store";
import { PageTitle, Table, Td } from "@/components/admin/ui";
import { formatINR } from "@/config/studio";
import type { QuotationStatus } from "@/types";
import { useState } from "react";
import type { Quotation } from "@/types";
import { Modal } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/quotations")({
  head: () => ({
    meta: [
      { title: "Quotations — Kahani Studio" },
      { name: "description", content: "Manage quotations for Kahani Studio." },
      { property: "og:title", content: "Quotations — Kahani Studio" },
      { property: "og:description", content: "Manage quotations for Kahani Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
const statuses: QuotationStatus[] = ["Pending", "Sent", "Accepted", "Declined"];

function Page() {
  const { quotations } = useAdmin();
  const [view, setView] = useState<Quotation | null>(null);
  return (
    <>
      <PageTitle title="Quotations" sub="Estimates requested through the website" />
      <Table head={["Quotation", "Customer", "Package", "Estimate", "Event date", "Status", ""]}>
        {quotations.items.map((q) => (
          <tr key={q.id}>
            <Td className="font-mono text-xs">{q.id}</Td>
            <Td className="font-medium">{q.customer}</Td>
            <Td>{q.packageName}</Td>
            <Td>{formatINR(q.estimate)}</Td>
            <Td>{q.eventDate}</Td>
            <Td>
              <select
                aria-label="Status"
                className="rounded-sm border border-input bg-card px-2 py-1 text-xs"
                value={q.status}
                onChange={(e) =>
                  quotations.upsert({ ...q, status: e.target.value as QuotationStatus })
                }
              >
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Td>
            <Td>
              <Button
                variant="ghost"
                size="icon"
                aria-label="View quotation"
                onClick={() => setView(q)}
              >
                <Eye size={16} />
              </Button>
            </Td>
          </tr>
        ))}
      </Table>
      <Modal open={!!view} onClose={() => setView(null)} title={view?.customer ?? "Quotation"}>
        {view && (
          <dl className="space-y-3 break-words text-sm">
            {[
              ["Phone", view.phone],
              ["Email", view.email],
              ["Location", view.location],
              ["Duration", `${view.durationDays ?? 1} day(s)`],
              ["Add-ons", view.addOns || "None"],
              ["Notes", view.notes || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
    </>
  );
}
