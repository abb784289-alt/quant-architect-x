import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const email = "admin@almeqyas.app";
        const password = "Admin@Meqyas2026";

        // Refuse if an admin already exists.
        const { data: existing } = await supabaseAdmin
          .from("user_roles").select("id").eq("role", "admin").limit(1);
        if (existing && existing.length > 0) {
          return new Response(JSON.stringify({ ok: false, reason: "admin_exists" }), {
            status: 409, headers: { "content-type": "application/json" },
          });
        }

        // Create (or find) the auth user.
        let userId: string | null = null;
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email, password, email_confirm: true,
          user_metadata: { full_name: "Admin" },
        });
        if (created?.user) {
          userId = created.user.id;
        } else if (createErr) {
          // Fallback: user may already exist — look them up.
          const { data: list } = await supabaseAdmin.auth.admin.listUsers();
          const found = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
          if (found) userId = found.id;
        }
        if (!userId) {
          return new Response(JSON.stringify({ ok: false, reason: "no_user", error: createErr?.message }), {
            status: 500, headers: { "content-type": "application/json" },
          });
        }

        const { error: roleErr } = await supabaseAdmin
          .from("user_roles").insert({ user_id: userId, role: "admin" });
        if (roleErr && !roleErr.message.includes("duplicate")) {
          return new Response(JSON.stringify({ ok: false, reason: "role_insert", error: roleErr.message }), {
            status: 500, headers: { "content-type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ ok: true, email }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});