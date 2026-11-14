import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { field } from "@/lib/ui";
export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Kahani Studio" },
      { name: "description", content: "Set a new password for your Kahani Studio account." },
      { property: "og:title", content: "Reset Password — Kahani Studio" },
      { property: "og:description", content: "Securely reset your studio account password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});
function Reset() {
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    setValid(
      new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery" ||
        new URLSearchParams(window.location.search).get("type") === "recovery",
    );
  }, []);
  return (
    <section className="container-x max-w-lg py-40">
      <h1 className="text-3xl">Reset password</h1>
      {!valid ? (
        <p className="mt-6">Open the password reset link from your email.</p>
      ) : (
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const { error } = await supabase.auth.updateUser({ password });
            if (error) setNote(error.message);
            else {
              setNote("Password updated.");
              await navigate({ to: "/auth" });
            }
          }}
        >
          <label>
            New password
            <input
              className={field}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <Button type="submit">Update password</Button>
          <p role="status">{note}</p>
        </form>
      )}
    </section>
  );
}
