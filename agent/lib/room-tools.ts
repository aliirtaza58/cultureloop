import { database } from "../../src/server/database.ts";
import { RoomStore } from "../../src/server/store.ts";
import { assistantPrincipal } from "../../src/server/assistant-access.ts";
import { requireFreeAssistant } from "../../src/server/assistant-configuration.ts";
import { roomAssistantTools } from "../../src/server/assistant-tools.ts";
import type { AssistantToolName } from "../../src/server/assistant-tools.ts";
import { QlooClient } from "../../src/integrations/qloo.ts";
import { QlooService } from "../../src/server/qloo-service.ts";
import { rateLimit } from "../../src/server/limits.ts";
import { failure } from "../../src/server/application.ts";

export async function invokeRoomTool(name: AssistantToolName, input: unknown, current: unknown) {
  try {
    requireFreeAssistant();
    const caller = assistantPrincipal(current), pool = await database();
    const access = new RoomStore(pool).forAssistant(caller.attributes.roomId, caller.principalId);
    const qloo = new QlooService(pool, new QlooClient({ apiKey: process.env.QLOO_API_KEY ?? "", baseUrl: process.env.QLOO_BASE_URL }));
    const tools = roomAssistantTools(access, qloo, async tool => {
      await rateLimit(pool, `assistant-tool:${caller.attributes.roomId}:${caller.principalId}`, 60);
      if (tool === "rank_available_books") await rateLimit(pool, `rank:${caller.attributes.roomId}`, 10);
      if (tool === "resolve_entities") await rateLimit(pool, `assistant-search:${caller.attributes.roomId}:${caller.principalId}`, 30);
    });
    return { ok: true, result: await tools.invoke(name, input) };
  } catch (error) {
    const response = await failure(error).json() as { error: string };
    return { ok: false, error: response.error };
  }
}
