import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_exam_results",
  title: "List my exam results",
  description: "List the signed-in student's most recent exam attempts with score, total questions and time taken.",
  inputSchema: { limit: z.number().int().min(1).max(100).optional().describe("Max attempts to return (default 20).") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("exam_sessions")
      .select("id, section_id, score, total_questions, time_taken_seconds, submitted_at, started_at")
      .eq("user_id", ctx.getUserId()!)
      .order("started_at", { ascending: false })
      .limit(limit ?? 20);
    if (error) throw new ToolError(error.message);
    const rows = (data ?? []).map((r) => ({
      id: String(r.id),
      section_id: String(r.section_id),
      score: r.score === null ? null : Number(r.score),
      total_questions: r.total_questions === null ? null : Number(r.total_questions),
      time_taken_seconds: r.time_taken_seconds === null ? null : Number(r.time_taken_seconds),
      submitted_at: r.submitted_at ? String(r.submitted_at) : null,
      started_at: String(r.started_at),
    }));
    const text = rows.length
      ? rows.map((r) => `${r.started_at.slice(0, 10)} section ${r.section_id}: ${r.score ?? "-"}/${r.total_questions ?? "-"}`).join("\n")
      : "No exam attempts yet.";
    return { content: [{ type: "text", text }], structuredContent: { results: rows } };
  },
});
