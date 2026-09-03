// Alias: same logic as /api/okrs/[id]/analyze but works before an OKR is saved.
// Re-exports the handler from the dynamic route with a fixed id.
export { POST } from "@/app/api/okrs/[id]/analyze/route";
