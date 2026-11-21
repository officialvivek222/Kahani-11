import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const addSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  name: z.string().trim().min(1, "Name is required").max(100),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user: caller },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "list") {
      const { data: adminRoles, error: rolesError } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, created_at")
        .eq("role", "admin");

      if (rolesError) throw rolesError;

      const admins = await Promise.all(
        (adminRoles || []).map(async (row) => {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(row.user_id);
          const u = userData?.user;
          return {
            id: row.user_id,
            email: u?.email || "",
            display_name:
              (u?.user_metadata?.display_name as string) ||
              (u?.user_metadata?.full_name as string) ||
              u?.email?.split("@")[0] ||
              "Admin",
            created_at: row.created_at || u?.created_at,
            last_sign_in_at: u?.last_sign_in_at || null,
          };
        }),
      );

      return new Response(JSON.stringify({ admins }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "add") {
      const { email, name, password } = addSchema.parse(body);

      let targetUserId: string;

      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: name },
      });

      if (createError) {
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const existing = listData.users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase(),
        );

        if (!existing) {
          throw createError;
        }

        targetUserId = existing.id;

        await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          password,
          user_metadata: { display_name: name },
        });
      } else {
        targetUserId = createData.user.id;
      }

      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", targetUserId)
        .eq("role", "admin")
        .maybeSingle();

      if (!existingRole) {
        const { error: insertRoleError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: targetUserId, role: "admin" });
        if (insertRoleError) throw insertRoleError;
      }

      await supabaseAdmin
        .from("profiles")
        .upsert({ id: targetUserId, display_name: name }, { onConflict: "id" })
        .catch(() => {});

      return new Response(JSON.stringify({ success: true, user_id: targetUserId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "remove") {
      const userId = body?.user_id;
      if (!userId || typeof userId !== "string") {
        return new Response(JSON.stringify({ error: "Missing user_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (userId === caller.id) {
        return new Response(JSON.stringify({ error: "You cannot remove your own admin account." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { count, error: countError } = await supabaseAdmin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      if (countError) throw countError;

      if ((count ?? 0) <= 1) {
        return new Response(JSON.stringify({ error: "Cannot remove the last remaining admin." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: deleteError } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");

      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const message = err.errors[0]?.message || "Invalid input data";
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
