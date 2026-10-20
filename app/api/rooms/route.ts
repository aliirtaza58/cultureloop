import { enter, failure } from "../../../src/server/application.ts";
export const runtime = "nodejs";
export async function POST(request: Request) { try { return await enter(request); } catch (error) { return failure(error); } }
