import { cn } from "@/lib/utils";
type V = "solid" | "outline" | "light" | "ghostLight" | "bronze";
export const btn = (v: V = "solid", extra?: string) =>
  cn(
    "inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[13px] font-medium uppercase tracking-[0.18em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:pointer-events-none",
    v === "solid" && "bg-primary text-primary-foreground hover:bg-olive",
    v === "outline" &&
      "border border-foreground/70 text-foreground hover:bg-foreground hover:text-background",
    v === "light" && "bg-card text-foreground hover:bg-muted",
    v === "ghostLight" && "border border-paper/70 text-paper hover:bg-paper hover:text-charcoal",
    v === "bronze" && "bg-bronze text-paper hover:bg-olive",
    extra,
  );
export const field =
  "min-h-12 min-w-0 w-full max-w-full border border-input bg-card text-foreground px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-bronze";
