import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Check, Copy, RefreshCw, Trash2, UserPlus, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { aBtn, aField, Card, Modal, PageTitle, Table, Td } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/team")({
  head: () => ({
    meta: [
      { title: "Team & Admins — Kahani Studio" },
      { name: "description", content: "Manage administrators and team access." },
      { property: "og:title", content: "Team & Admins — Kahani Studio" },
      { property: "og:description", content: "Manage administrators and team access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeamPage,
});

type AdminUser = {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  last_sign_in_at: string | null;
};

function generatePassword(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Never";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Unknown";
  }
}

function TeamPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    });
  }, []);

  const {
    data: admins = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-team-list"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-admins", {
        body: { action: "list" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.admins || []) as AdminUser[];
    },
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(() => generatePassword());
  const [adding, setAdding] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState(false);
  const [lastAdded, setLastAdded] = useState<{ name: string; email: string; password: string } | null>(
    null,
  );

  const [adminToRemove, setAdminToRemove] = useState<AdminUser | null>(null);
  const [removing, setRemoving] = useState(false);

  const handleGenerate = () => {
    setPassword(generatePassword());
    setCopiedPass(false);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopiedPass(true);
    toast.success("Password copied to clipboard");
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleCopyDetails = () => {
    if (!lastAdded) return;
    const text = `Kahani Studio Admin Access\nEmail: ${lastAdded.email}\nTemporary Password: ${lastAdded.password}\nLogin at: ${window.location.origin}/auth`;
    navigator.clipboard.writeText(text);
    setCopiedDetails(true);
    toast.success("Login details copied to clipboard");
    setTimeout(() => setCopiedDetails(false), 2000);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 8) {
      toast.error("Please fill all fields. Password must be at least 8 characters.");
      return;
    }

    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-admins", {
        body: {
          action: "add",
          name: name.trim(),
          email: email.trim(),
          password,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setLastAdded({ name: name.trim(), email: email.trim(), password });
      toast.success("Admin added successfully");
      setName("");
      setEmail("");
      setPassword(generatePassword());
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add admin";
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!adminToRemove) return;
    setRemoving(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-admins", {
        body: {
          action: "remove",
          user_id: adminToRemove.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Admin removed");
      setAdminToRemove(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove admin";
      toast.error(msg);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <PageTitle
        title="Team & Administrators"
        sub="Manage access permissions for the Kahani Studio administration panel."
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-4 sm:p-6">
            <h2 className="mb-4 text-base font-medium">Current Administrators ({admins.length})</h2>

            {isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading administrators…</div>
            ) : admins.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No administrators found.</div>
            ) : (
              <Table head={["Name", "Email", "Added Date", "Last Login", "Actions"]}>
                {admins.map((adm) => {
                  const isSelf = adm.id === currentUserId;
                  return (
                    <tr key={adm.id} className="transition-colors hover:bg-muted/40">
                      <Td className="font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Shield size={14} className="text-bronze opacity-80" />
                          <span>{adm.display_name}</span>
                          {isSelf && (
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                              You
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td className="text-muted-foreground">{adm.email}</Td>
                      <Td className="text-muted-foreground">{formatDate(adm.created_at)}</Td>
                      <Td className="text-muted-foreground">{formatDate(adm.last_sign_in_at)}</Td>
                      <Td>
                        {!isSelf && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setAdminToRemove(adm)}
                          >
                            <Trash2 size={14} className="mr-1" />
                            Remove
                          </Button>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </Table>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus size={18} className="text-bronze" />
              <h2 className="text-base font-medium">Add Administrator</h2>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className={aField}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@kahanistudio.in"
                  className={aField}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Temporary Password
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="flex items-center gap-1 text-xs text-primary transition-colors hover:underline"
                  >
                    <RefreshCw size={11} />
                    Generate
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    minLength={8}
                    className={aField}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={handleCopyPassword}
                    title="Copy password"
                  >
                    {copiedPass ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Must be at least 8 characters long.</p>
              </div>

              <Button type="submit" disabled={adding} className="w-full">
                {adding ? "Adding Admin…" : "Add Admin"}
              </Button>
            </form>
          </Card>

          {lastAdded && (
            <Card className="border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-foreground">Admin Account Created</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Share these login details with them. They should change the password in Profile after first login.
              </p>
              <div className="mt-3 rounded border border-border bg-muted/50 p-3 font-mono text-xs text-foreground">
                <p>
                  <span className="text-muted-foreground">Email:</span> {lastAdded.email}
                </p>
                <p className="mt-1">
                  <span className="text-muted-foreground">Password:</span> {lastAdded.password}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={handleCopyDetails}
              >
                {copiedDetails ? (
                  <>
                    <Check size={14} className="mr-1 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-1" />
                    Copy Login Details
                  </>
                )}
              </Button>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(adminToRemove)}
        onClose={() => setAdminToRemove(null)}
        title="Remove Administrator"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-foreground">
              {adminToRemove?.display_name} ({adminToRemove?.email})
            </span>{" "}
            from the administration team? They will immediately lose access to the studio management panel.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAdminToRemove(null)} disabled={removing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveConfirm}
              disabled={removing}
            >
              {removing ? "Removing…" : "Confirm Remove"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
