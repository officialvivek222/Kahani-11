import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  BadgeIndianRupee,
  FileText,
  FolderTree,
  Image,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Package,
  PlusSquare,
  Settings,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { AdminStoreProvider, adminContentOptions } from "@/components/admin/store";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { studio } from "@/config/studio";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/site/ThemeToggle";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <span className="font-display text-2xl tracking-[0.2em]">KAHANI STUDIO</span>
        <div className="size-6 animate-spin rounded-full border-2 border-bronze border-t-transparent" />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/admin")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminContentOptions),
  errorComponent: AccessRequired,
  pendingComponent: LoadingScreen,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Studio Admin — Kahani Studio" },
      { name: "description", content: "Kahani Studio management dashboard." },
      { property: "og:title", content: "Studio Admin — Kahani Studio" },
      { property: "og:description", content: "Kahani Studio management dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});
function AccessRequired() {
  const client = useQueryClient();
  const navigate = useNavigate();
  return (
    <div className="container-x py-32">
      <h1 className="text-3xl">Studio access required</h1>
      <p className="mt-4">Your account has not been approved as a studio administrator.</p>
      <Button
        className="mt-6"
        onClick={async () => {
          await client.cancelQueries();
          client.clear();
          await supabase.auth.signOut();
          await navigate({ to: "/auth", replace: true });
        }}
      >
        Sign out
      </Button>
    </div>
  );
}

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/portfolio", label: "Portfolio", icon: Image },
  { to: "/admin/categories", label: "Services & Categories", icon: FolderTree },
  { to: "/admin/packages", label: "Packages", icon: Package },
  { to: "/admin/services", label: "Additional Services", icon: PlusSquare },
  { to: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { to: "/admin/quotations", label: "Quotations", icon: BadgeIndianRupee },
  { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { to: "/admin/settings", label: "Website Settings", icon: Settings },
  { to: "/admin/team", label: "Team", icon: Users },
  { to: "/admin/profile", label: "Profile", icon: User },
] as const;

function AdminTopBarProfile() {
  const { data } = useSuspenseQuery(adminContentOptions);
  const name = data.profile?.display_name?.trim() || "Admin";
  const initials =
    name
      .split(/\s+/)
      .map((w: string) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A";

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle className="size-9" />
      <span className="text-sm font-medium">{name}</span>
      <span className="grid size-8 place-items-center rounded-full bg-bronze text-xs font-medium text-paper">
        {initials}
      </span>
    </div>
  );
}

function AdminLayout() {
  const [open, setOpen] = useState(false);
  const client = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await client.cancelQueries();
    client.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }
  const side = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center justify-between px-6">
        <Link to="/" className="font-display text-lg tracking-[0.2em] text-paper">
          {studio.name}
        </Link>
        <button className="lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)}>
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {nav.map(({ to, label, icon: I }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/admin" }}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent data-[status=active]:bg-sidebar-accent data-[status=active]:text-paper"
          >
            <I size={16} className="opacity-80" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-sidebar-border px-6 py-3 text-xs text-muted-foreground">
        <a
          href="https://wa.me/91XXXXXXXXXX?text=Hi%20Rootmile%2C%20I%20need%20help%20with%20the%20Kahani%20Studio%20website"
          target="_blank"
          rel="noopener"
          className="hover:text-sidebar-foreground hover:underline"
        >
          Need help or changes? Rootmile Technologies
        </a>
      </div>
      <Button
        variant="ghost"
        onClick={signOut}
        className="justify-start border-t border-sidebar-border px-6 py-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LogOut size={16} />
        Sign out
      </Button>
    </div>
  );
  return (
    <AdminStoreProvider>
      <div className="min-h-screen bg-admin-bg font-sans text-foreground">
        <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{side}</aside>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-overlay/50" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-64">{side}</div>
          </div>
        )}
        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-8">
            <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>
            <p className="hidden text-xs text-muted-foreground sm:block">
              <FileText size={12} className="mr-1 inline" />
              Studio workspace
            </p>
            <AdminTopBarProfile />
          </header>
          <div className={cn("mx-auto max-w-[1280px] p-4 lg:p-8")}>
            <Outlet />
          </div>
        </div>
      </div>
    </AdminStoreProvider>
  );
}
