import { failure, searchRoom } from "../../../../../src/server/application.ts";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return await searchRoom(request, (await context.params).id); } catch (error) { return failure(error); }
}
