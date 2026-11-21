import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const aField =
  "w-full rounded-sm border border-input bg-card text-foreground px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-bronze";
export const aBtn = (v: "primary" | "ghost" | "danger" = "primary") =>
  cn(
    "inline-flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-colors",
    v === "primary" && "bg-primary text-primary-foreground hover:bg-olive",
    v === "ghost" && "border border-border bg-card hover:bg-muted",
    v === "danger" && "text-destructive hover:bg-destructive/10",
  );

export function PageTitle({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-sans text-2xl font-medium tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-sm border border-border bg-card", className)}>{children}</div>;
}
export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </Card>
  );
}
export const Td = ({ children, className }: { children: ReactNode; className?: string }) => (
  <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>
);

const tone: Record<string, string> = {
  New: "bg-bronze/15 text-bronze",
  Contacted: "bg-olive/15 text-olive",
  "Follow-up": "bg-taupe/30 text-foreground",
  "Quotation Sent": "bg-accent text-foreground",
  Converted: "bg-olive text-paper",
  Cancelled: "bg-muted text-muted-foreground",
  Pending: "bg-bronze/15 text-bronze",
  Sent: "bg-accent text-foreground",
  Accepted: "bg-olive text-paper",
  Declined: "bg-muted text-muted-foreground",
  Active: "bg-olive/15 text-olive",
  Inactive: "bg-muted text-muted-foreground",
  Published: "bg-olive/15 text-olive",
  Draft: "bg-muted text-muted-foreground",
  Featured: "bg-bronze/15 text-bronze",
};
export const Badge = ({ s }: { s: string }) => (
  <span
    className={cn(
      "inline-block whitespace-nowrap rounded-sm px-2 py-0.5 text-xs font-medium",
      tone[s] ?? "bg-muted",
    )}
  >
    {s}
  </span>
);

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-sm bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-sans text-lg font-medium">{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function L({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-5 w-9 rounded-full transition-colors",
        on ? "bg-olive" : "bg-border",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-4 rounded-full bg-paper dark:bg-foreground shadow-xs transition-all",
          on ? "left-[18px]" : "left-0.5",
        )}
      />
    </button>
  );
}
