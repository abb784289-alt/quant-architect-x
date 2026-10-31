import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMyExamResults from "./tools/list-my-exam-results";

// Vite inlines the stable ref; the published SUPABASE_URL may be a proxy.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "quantum-leap-academy",
  title: "Quantum Leap Academy",
  version: "0.1.0",
  instructions: "Tools for the Miqyas exam-prep platform. Read the signed-in student's exam results.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listMyExamResults],
});
