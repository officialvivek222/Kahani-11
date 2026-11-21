import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { formatINR } from "@/config/studio";
import type { Package } from "@/types";
import { btn } from "@/lib/ui";
import { cn } from "@/lib/utils";
export function PackageCard({ pkg }: { pkg: Package }) {
  const hi = pkg.popular === true || (pkg.popular === undefined && pkg.tier === "Premium");
  return (
    <div
      className={cn(
        "relative flex flex-col border p-8 lg:p-10",
        hi ? "border-bronze bg-card" : "border-border bg-transparent",
      )}
    >
      {hi && (
        <span className="eyebrow absolute -top-3 left-8 bg-bronze px-3 py-1 text-paper">
          Most loved
        </span>
      )}
      <p className="eyebrow text-muted-foreground">{pkg.group}</p>
      <h3 className="text-heading-card mt-3">{pkg.tier}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{pkg.description}</p>
      <p className="mt-8 font-display text-[44px] leading-none">
        {formatINR(pkg.price)}
        <span className="ml-2 font-sans text-xs tracking-wider text-muted-foreground">onwards</span>
      </p>
      <div className="hairline my-8" />
      <ul className="flex-1 space-y-3 text-[15px]">
        {pkg.features.map((f) => (
          <li key={f} className="flex gap-3">
            <Check size={16} className="mt-1 shrink-0 text-bronze" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        to="/quote"
        search={{ category: pkg.group, package: pkg.id, tier: pkg.tier }}
        onClick={() =>
          window.__lovableEvents?.track?.("project.package_selected", {
            package_id: pkg.id,
            tier: pkg.tier,
            group: pkg.group,
          })
        }
        className={cn(btn(hi ? "solid" : "outline"), "mt-10")}
      >
        Get a Quote
      </Link>
    </div>
  );
}
