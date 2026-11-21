import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { field } from "@/lib/ui";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Kahani Studio" },
      { name: "description", content: "Set a new password for your Kahani Studio account." },
      { property: "og:title", content: "Reset Password — Kahani Studio" },
      { property: "og:description", content: "Securely reset your studio account password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        if (isMounted) {
          setValid(true);
          setLoading(false);
        }
      }
    });

    async function checkRecoveryLink() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && isMounted) {
            setValid(true);
            setLoading(false);
            return;
          }
        }

        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        if (
          hashParams.get("type") === "recovery" ||
          urlParams.get("type") === "recovery"
        ) {
          if (isMounted) {
            setValid(true);
            setLoading(false);
          }
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session && isMounted) {
          setValid(true);
          setLoading(false);
          return;
        }

        if (isMounted) {
          setValid(false);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setValid(false);
          setLoading(false);
        }
      }
    }

    void checkRecoveryLink();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setNote("");
    setBusy(true);

    try {
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setNote("Password updated");
      await supabase.auth.signOut();
      setTimeout(async () => {
        await navigate({ to: "/auth" });
      }, 2000);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to update password");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="container-x max-w-lg py-40">
        <h1 className="text-3xl">Reset password</h1>
        <p className="mt-6 text-muted-foreground">Checking reset link…</p>
      </section>
    );
  }

  if (!valid) {
    return (
      <section className="container-x max-w-lg py-40">
        <h1 className="text-3xl">Reset password</h1>
        <div className="mt-6 space-y-4">
          <p className="text-destructive">This link has expired</p>
          <Button
            type="button"
            onClick={() => void navigate({ to: "/auth", search: { mode: "forgot" } as any })}
          >
            Send a new link
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="container-x max-w-lg py-40">
      <h1 className="text-3xl">Reset password</h1>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <label className="block">
          New password
          <div className="relative mt-1">
            <input
              className={`${field} pr-10`}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </label>

        <label className="block">
          Confirm password
          <div className="relative mt-1">
            <input
              className={`${field} pr-10`}
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </label>

        <Button type="submit" disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </Button>

        {errorMessage && (
          <p role="status" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        {note && (
          <p role="status" className="text-sm text-muted-foreground">
            {note}
          </p>
        )}
      </form>
    </section>
  );
}
