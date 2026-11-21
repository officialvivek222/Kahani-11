import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdmin } from "@/components/admin/store";
import { aBtn, aField, Card, L, PageTitle } from "@/components/admin/ui";
import { getMapSrc } from "@/lib/studio-schemas";

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
  ["youtube", "YouTube URL"],
] as const;

function Page() {
  const { settings, setSettings } = useAdmin();
  const [f, setF] = useState(settings);

  const rawMap = f.mapEmbed?.trim() || "";
  const mapSrc = rawMap ? getMapSrc(rawMap) : null;
  const isInvalidMap = Boolean(rawMap && !mapSrc);

  return (
    <>
      <PageTitle title="Website Settings" sub="Studio details used across the site" />
      <Card className="max-w-2xl p-6">
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (isInvalidMap) return;
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
                  value={f[k] || ""}
                  onChange={(e) => setF({ ...f, [k]: e.target.value })}
                />
              </L>
              {k === "address" && (
                <div className="mt-4 border-t border-border/60 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Google Map (embed code)
                    </label>
                    {f.mapEmbed && (
                      <button
                        type="button"
                        onClick={() => setF({ ...f, mapEmbed: "" })}
                        className="text-xs text-muted-foreground underline hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    className="mt-1.5 w-full rounded border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-bronze focus:outline-none"
                    placeholder='<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
                    value={f.mapEmbed || ""}
                    onChange={(e) => setF({ ...f, mapEmbed: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Open Google Maps &gt; search your studio &gt; Share &gt; Embed a map &gt; Copy
                    HTML &gt; paste here.
                  </p>
                  {isInvalidMap && (
                    <p className="mt-1.5 text-xs font-medium text-destructive">
                      This is a share link. Please use Share &gt; Embed a map &gt; Copy HTML
                      instead.
                    </p>
                  )}
                  {mapSrc && (
                    <div className="mt-3 overflow-hidden rounded border border-border">
                      <p className="border-b border-border bg-muted/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                        Live Map Preview
                      </p>
                      <iframe
                        title="Google Map Preview"
                        src={mapSrc}
                        className="h-44 w-full border-0"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div className="sm:col-span-2">
            <button className={aBtn()} disabled={isInvalidMap}>
              Save settings
            </button>
          </div>
        </form>
      </Card>
    </>
  );
}
