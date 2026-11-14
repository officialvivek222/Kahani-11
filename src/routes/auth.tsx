import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { studio } from "@/config/studio";
import { field } from "@/lib/ui";
import { z } from "zod";
import "@lovable.dev/cloud-auth-js/styles.css";
export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Studio Sign-in — Kahani Studio" },
      { name: "description", content: "Securely sign in to manage Kahani Studio." },
      { property: "og:title", content: "Studio Sign-in — Kahani Studio" },
      { property: "og:description", content: "Secure studio account access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Auth,
});
function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void navigate({ to: "/admin" });
    });
  }, [navigate]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNote("");
    setBusy(true);
    try {
      z.string().email().max(255).parse(email);
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setNote("Check your email for a password reset link.");
        return;
      }
      z.string().min(8).max(128).parse(password);
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth",
            data: { display_name: z.string().trim().min(1).max(100).parse(name) },
          },
        });
        if (error) throw error;
        setNote(
          "Check your email to confirm your account. Studio access requires administrator approval.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await navigate({ to: "/admin" });
      }
    } catch (e) {
      setNote(
        e instanceof z.ZodError
          ? "Enter a valid email, name, and password of at least 8 characters."
          : e instanceof Error
            ? e.message
            : "Sign-in failed",
      );
    } finally {
      setBusy(false);
    }
  }
  async function social(provider: "google" | "lovable") {
    setNote("");
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) setNote(result.error.message);
    else if (!result.redirected) await navigate({ to: "/admin" });
  }
  return (
    <section className="flex min-h-screen items-center justify-center bg-admin-bg px-6 py-28">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-display text-2xl">
          {studio.name}
        </Link>
        <h1 className="mt-8 font-sans text-2xl">
          {mode === "signup"
            ? "Create your account"
            : mode === "forgot"
              ? "Reset your password"
              : "Sign in to your studio"}
        </h1>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          {mode === "signup" && (
            <label className="block">
              Display name
              <input
                className={field}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
            </label>
          )}
          <label className="block">
            Email
            <input
              type="email"
              autoComplete="email"
              className={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
            />
          </label>
          {mode !== "forgot" && (
            <label className="block">
              Password
              <input
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className={field}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={128}
              />
            </label>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy
              ? "Please wait…"
              : mode === "signup"
                ? "Create account"
                : mode === "forgot"
                  ? "Send reset link"
                  : "Sign in"}
          </Button>
          {mode === "signin" && (
            <button
              type="button"
              onClick={() => {
                setEmail("admin@kahanistudio.in");
                setPassword("KahaniAdmin@2026");
              }}
              className="mt-1 block w-full text-center text-xs text-bronze hover:underline"
            >
              Fill demo credentials (admin@kahanistudio.in)
            </button>
          )}
          {note && (
            <p role="status" className="text-sm text-muted-foreground">
              {note}
            </p>
          )}
        </form>
        {mode !== "forgot" && (
          <div className="mt-5 space-y-3">
            <Button
              variant="outline"
              className="google-signin w-full"
              onClick={() => social("google")}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              Continue with Google
            </Button>
            <Button className="lovable-auth-button w-full" onClick={() => social("lovable")}>
              Continue with Lovable
            </Button>
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant="link"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setNote("");
            }}
          >
            {mode === "signup" ? "Already have an account?" : "Create account"}
          </Button>
          <Button
            variant="link"
            onClick={() => {
              setMode(mode === "forgot" ? "signin" : "forgot");
              setNote("");
            }}
          >
            {mode === "forgot" ? "Back to sign in" : "Forgot password?"}
          </Button>
        </div>
      </div>
    </section>
  );
}
