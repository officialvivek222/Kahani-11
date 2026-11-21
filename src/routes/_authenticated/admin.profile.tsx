import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { aField, Card, L, PageTitle } from "@/components/admin/ui";
import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { adminContentOptions } from "@/components/admin/store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/admin/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Kahani Studio" },
      { name: "description", content: "Manage profile for Kahani Studio." },
      { property: "og:title", content: "Profile — Kahani Studio" },
      { property: "og:description", content: "Manage profile for Kahani Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(adminContentOptions);
  const client = useQueryClient();
  const [name, setName] = useState(data.profile.display_name);
  const [avatar, setAvatar] = useState(data.profile.avatar_url);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  return (
    <>
      <PageTitle title="Admin Profile" />
      <div className="grid max-w-3xl gap-6">
        <Card className="flex items-center gap-4 p-6">
          <span className="grid size-14 place-items-center rounded-full bg-bronze text-lg text-paper">
            KS
          </span>
          <div>
            <p className="font-medium">Studio Admin</p>
            <p className="text-sm text-muted-foreground">Owner</p>
          </div>
        </Card>

        <Card className="p-6">
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const display_name = z.string().trim().min(1).max(100).parse(name);
                const avatar_url = z
                  .union([z.literal(""), z.string().url().startsWith("https://").max(2048)])
                  .parse(avatar);
                const { error } = await supabase
                  .from("profiles")
                  .update({ display_name, avatar_url })
                  .eq("id", data.profile.id);
                if (error) throw error;
                await client.invalidateQueries({ queryKey: ["studio-admin"] });
                toast.success("Profile updated");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not save profile");
              }
            }}
          >
            <L label="Full name">
              <input
                className={aField}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </L>
            <L label="Avatar URL">
              <input
                className={aField}
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                maxLength={2048}
              />
            </L>
            <div className="sm:col-span-2">
              <Button type="submit">Update profile</Button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-base font-medium">Change password</h2>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingPassword(true);
              try {
                if (newPassword.length < 8) {
                  throw new Error("Password must be at least 8 characters.");
                }
                if (newPassword !== confirmPassword) {
                  throw new Error("Passwords do not match.");
                }
                const { error } = await supabase.auth.updateUser({
                  password: newPassword,
                });
                if (error) throw error;
                setNewPassword("");
                setConfirmPassword("");
                toast.success("Password updated successfully");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not update password");
              } finally {
                setSavingPassword(false);
              }
            }}
          >
            <L label="New password">
              <input
                type="password"
                className={aField}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
              />
            </L>
            <L label="Confirm password">
              <input
                type="password"
                className={aField}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
              />
            </L>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? "Updating…" : "Change password"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
