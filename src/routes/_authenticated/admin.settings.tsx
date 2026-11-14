import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "@/components/admin/store";
import { aBtn, aField, Card, L, PageTitle } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Kahani Studio" },
      { name: "description", content: "Manage settings for Kahani Studio." },
      { property: "og:title", content: "Settings — Kahani Studio" },
      { property: "og:description", content: "Manage settings for Kahani Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
const fields = [
  ["name", "Studio name"],
  ["logoUrl", "Logo URL"],
  ["phone", "Phone number"],
  ["whatsapp", "WhatsApp number (digits, with country code)"],
  ["email", "Email"],
  ["address", "Address"],
  ["instagram", "Instagram URL"],
  ["facebook", "Facebook URL"],
  ["youtube", "YouTube URL"],
] as const;

function Page() {
  const { settings, setSettings } = useAdmin();
  const [f, setF] = useState(settings);
  return (
    <>
      <PageTitle title="Website Settings" sub="Studio details used across the site" />
      <Card className="max-w-2xl p-6">
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await setSettings(f);
            } catch {
              /* Save error is shown by the store */
            }
          }}
        >
          {fields.map(([k, l]) => (
            <div key={k} className={k === "address" ? "sm:col-span-2" : ""}>
              <L label={l}>
                <input
                  className={aField}
                  value={f[k]}
                  onChange={(e) => setF({ ...f, [k]: e.target.value })}
                />
              </L>
            </div>
          ))}
          <div className="sm:col-span-2">
            <button className={aBtn()}>Save settings</button>
          </div>
        </form>
      </Card>
    </>
  );
}
