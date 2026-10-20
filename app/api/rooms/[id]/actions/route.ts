import { act, failure } from "../../../../../src/server/application.ts";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return await act(request, (await context.params).id); } catch (error) { return failure(error); }
}
