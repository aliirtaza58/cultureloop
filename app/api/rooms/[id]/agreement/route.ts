import { downloadAgreement, failure } from "../../../../../src/server/application.ts";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return await downloadAgreement(request, (await context.params).id); } catch (error) { return failure(error); }
}
