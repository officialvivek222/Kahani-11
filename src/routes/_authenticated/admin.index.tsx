import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeIndianRupee, Image, Inbox, Package, Sparkles } from "lucide-react";
import { useAdmin } from "@/components/admin/store";
import { Badge, Card, PageTitle } from "@/components/admin/ui";
import { formatINR } from "@/config/studio";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Index — Kahani Studio" },
      { name: "description", content: "Manage index for Kahani Studio." },
      { property: "og:title", content: "Index — Kahani Studio" },
      { property: "og:description", content: "Manage index for Kahani Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const s = useAdmin();
  const pipelineValue = s.quotations.items.reduce(
    (acc, q) => acc + (q.finalQuotation ?? q.estimate),
    0,
  );
  const stats = [
    { l: "Total Inquiries", v: String(s.inquiries.items.length), i: Inbox },
    {
      l: "New Inquiries",
      v: String(s.inquiries.items.filter((x) => x.status === "New").length),
      i: Sparkles,
    },
    { l: "Quotation Requests", v: String(s.quotations.items.length), i: BadgeIndianRupee },
    { l: "Pipeline Value", v: formatINR(pipelineValue), i: Package },
    { l: "Portfolio Items", v: String(s.portfolio.items.length), i: Image },
  ];
  return (
    <>
      <PageTitle title="Dashboard" sub="Good morning — here's what's happening at the studio." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map(({ l, v, i: I }) => (
          <Card key={l} className="p-5">
            <I size={16} className="text-bronze" />
            <p className="mt-4 text-3xl font-medium">{v}</p>
            <p className="mt-1 text-xs text-muted-foreground">{l}</p>
          </Card>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="font-sans text-sm font-medium">Recent inquiries</h2>
            <Link to="/admin/inquiries" className="text-xs text-bronze">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {s.inquiries.items.slice(0, 5).map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <p>{q.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {q.category} · {q.eventDate}
                  </p>
                </div>
                <Badge s={q.status} />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="font-sans text-sm font-medium">Quotation requests</h2>
            <Link to="/admin/quotations" className="text-xs text-bronze">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {s.quotations.items.slice(0, 5).map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <p>{q.customer}</p>
                  <p className="text-xs text-muted-foreground">
                    {q.packageName} · {formatINR(q.finalQuotation ?? q.estimate)}
                  </p>
                </div>
                <Badge s={q.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
