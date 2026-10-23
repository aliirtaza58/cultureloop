import { defineTool } from "eve/tools";
import { assistantSchemas } from "../../src/server/assistant-tools.ts";
import { invokeRoomTool } from "../lib/room-tools.ts";

export default defineTool({
  description: "Read the authenticated member's room, separate shortlists/ranks, availability and current proposals.",
  inputSchema: assistantSchemas.read_room,
  availableInSubagents: false,
  execute: (input, ctx) => invokeRoomTool("read_room", input, ctx.session.auth.current),
});
