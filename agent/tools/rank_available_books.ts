import { defineTool } from "eve/tools";
import { assistantSchemas } from "../../src/server/assistant-tools.ts";
import { invokeRoomTool } from "../lib/room-tools.ts";

export default defineTool({
  description: "Refresh Qloo evidence for the current room's fixed available catalog. Leaves willingness and approvals unchanged.",
  inputSchema: assistantSchemas.rank_available_books,
  availableInSubagents: false,
  execute: (input, ctx) => invokeRoomTool("rank_available_books", input, ctx.session.auth.current),
});
