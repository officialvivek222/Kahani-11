import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { images } from "@/lib/images";
import { studio } from "@/config/studio";

export const Route = createFileRoute("/admin_/login")({
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Studio Login — Kahani Studio" },
      { name: "description", content: "Sign in to the Kahani Studio dashboard." },
      { property: "og:title", content: "Studio Login — Kahani Studio" },
      { property: "og:description", content: "Sign in to the Kahani Studio dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

function Login() {
  const [note, setNote] = useState(false);
  return (
    <div className="grid min-h-screen bg-admin-bg lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          src={images.bride}
          alt="Kahani Studio bridal portrait"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-overlay/40" />
        <p className="absolute bottom-10 left-10 font-display text-4xl text-paper">
          {studio.tagline}
        </p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setNote(true);
          }}
          className="w-full max-w-sm rounded-sm border border-border bg-card p-8"
        >
          <Link to="/" className="font-display text-xl tracking-[0.2em]">
            {studio.name}
          </Link>
          <h1 className="mt-6 font-sans text-xl font-medium">Sign in to your studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage portfolio, packages and inquiries.
          </p>
          <label className="mt-6 block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Email</span>
            <input
              type="email"
              required
              className="w-full rounded-sm border border-input bg-card px-3 py-2.5 outline-none focus:border-bronze"
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Password</span>
            <input
              type="password"
              required
              className="w-full rounded-sm border border-input bg-card px-3 py-2.5 outline-none focus:border-bronze"
            />
          </label>
          <button className="mt-6 w-full rounded-sm bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-olive">
            Sign in
          </button>
          {note && (
            <p className="mt-4 rounded-sm bg-muted p-3 text-xs text-muted-foreground">
              Sign-in isn't connected yet — it will be added with the backend. You can{" "}
              <Link to="/admin" className="underline">
                preview the dashboard
              </Link>{" "}
              with sample data.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
