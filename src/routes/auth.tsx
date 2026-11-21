import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { studio } from "@/config/studio";
import { field } from "@/lib/ui";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: string | undefined } => ({
    mode: typeof search["mode"] === "string" ? (search["mode"] as string) : undefined,
  }),
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
  const searchParams = Route.useSearch();
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [loadingAdminCheck, setLoadingAdminCheck] = useState(true);

  const [mode, setMode] = useState<"signin" | "forgot">(() =>
    searchParams.mode === "forgot" ? "forgot" : "signin",
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    let isMounted = true;
    async function checkAuthAndAdmin() {
      try {
        const { data: userResp } = await supabase.auth.getUser();
        if (userResp?.user) {
          void navigate({ to: "/admin" });
          return;
        }

        const { data, error } = await (supabase.rpc as any)("admin_exists");
        if (!error && isMounted) {
          setAdminExists(Boolean(data));
        } else if (isMounted) {
          setAdminExists(true);
        }
      } catch {
        if (isMounted) setAdminExists(true);
      } finally {
        if (isMounted) setLoadingAdminCheck(false);
      }
    }
    void checkAuthAndAdmin();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNote("");
    setBusy(true);

    try {
      if (!adminExists) {
        const validName = z
          .string()
          .trim()
          .min(1, "Please enter your name.")
          .max(100)
          .parse(name);
        const validEmail = z
          .string()
          .trim()
          .email("Please enter a valid email address.")
          .max(255)
          .parse(email);

        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords must match.");
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: validEmail,
          password,
          options: {
            data: {
              display_name: validName,
            },
          },
        });
        if (signUpError) throw signUpError;

        if (signUpData.session) {
          await (supabase.rpc as any)("claim_first_admin");
          await navigate({ to: "/admin" });
        } else {
          setNote("Check your email to confirm, then log in here.");
          setAdminExists(true);
          setMode("signin");
        }
        return;
      }

      if (mode === "forgot") {
        if (cooldown > 0) return;
        const validEmail = z
          .string()
          .trim()
          .email("Please enter a valid email address.")
          .max(255)
          .parse(email);

        const { error } = await supabase.auth.resetPasswordForEmail(validEmail, {
          redirectTo: window.location.origin + "/reset-password",
        });

        if (error) {
          const isRateLimit =
            error.status === 429 ||
            /rate limit|security purposes|too many requests|over_email_send_rate_limit/i.test(
              error.message || "",
            );
          if (isRateLimit) {
            setNote(error.message);
            setCooldown(60);
            return;
          }
        }

        setNote("If this email has an account, a reset link has been sent.");
        setCooldown(60);
        return;
      }

      const validEmail = z
        .string()
        .trim()
        .email("Please enter a valid email address.")
        .max(255)
        .parse(email);
      z.string().min(1, "Please enter your password.").parse(password);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: validEmail,
        password,
      });
      if (signInError) throw signInError;

      await (supabase.rpc as any)("claim_first_admin");
      await navigate({ to: "/admin" });
    } catch (e) {
      setNote(
        e instanceof z.ZodError
          ? e.errors[0]?.message || "Validation failed"
          : e instanceof Error
            ? e.message
            : "Action failed",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loadingAdminCheck) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-admin-bg px-6 py-28">
        <div className="w-full max-w-sm text-center">
          <Link to="/" className="font-display text-2xl">
            {studio.name}
          </Link>
          <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-admin-bg px-6 py-28">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-display text-2xl">
          {studio.name}
        </Link>
        <h1 className="mt-8 font-sans text-2xl">
          {!adminExists
            ? "Create admin account"
            : mode === "forgot"
              ? "Reset your password"
              : "Sign in to your studio"}
        </h1>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          {!adminExists && (
            <label className="block">
              Name
              <input
                type="text"
                autoComplete="name"
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

          {(mode !== "forgot" || !adminExists) && (
            <label className="block">
              Password
              <input
                type="password"
                autoComplete={!adminExists ? "new-password" : "current-password"}
                className={field}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={128}
              />
            </label>
          )}

          {!adminExists && (
            <label className="block">
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                className={field}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                maxLength={128}
              />
            </label>
          )}

          <Button
            type="submit"
            disabled={busy || Boolean(adminExists && mode === "forgot" && cooldown > 0)}
            className="w-full"
          >
            {busy
              ? "Please wait…"
              : !adminExists
                ? "Create admin account"
                : mode === "forgot"
                  ? cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : "Send reset link"
                  : "Sign in"}
          </Button>

          {note && (
            <p role="status" className="text-sm text-muted-foreground">
              {note}
            </p>
          )}
        </form>

        {adminExists && (
          <div className="mt-5 flex flex-wrap gap-2">
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
        )}
      </div>
    </section>
  );
}
