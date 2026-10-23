import { defineTool } from "eve/tools";
import { assistantSchemas } from "../../src/server/assistant-tools.ts";
import { invokeRoomTool } from "../lib/room-tools.ts";

export default defineTool({
  description: "Find or repair two- and three-person exchanges using only existing explicit shortlists. Preserves unchanged cycles; does not approve.",
  inputSchema: assistantSchemas.find_exchange_cycles,
  availableInSubagents: false,
  execute: (input, ctx) => invokeRoomTool("find_exchange_cycles", input, ctx.session.auth.current),
});
