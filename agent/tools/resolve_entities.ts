import { defineTool } from "eve/tools";
import { assistantSchemas } from "../../src/server/assistant-tools.ts";
import { invokeRoomTool } from "../lib/room-tools.ts";

export default defineTool({
  description: "Look up Qloo identity candidates. The participant must confirm them in the room; this does not change inventory or interests.",
  inputSchema: assistantSchemas.resolve_entities,
  availableInSubagents: false,
  execute: (input, ctx) => invokeRoomTool("resolve_entities", input, ctx.session.auth.current),
});
