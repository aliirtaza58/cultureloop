import { defineTool } from "eve/tools";
import { assistantSchemas } from "../../src/server/assistant-tools.ts";
import { invokeRoomTool } from "../lib/room-tools.ts";

export default defineTool({
  description: "Explain the exact displayed cycle revision using recorded transfers, ranks and provenance. Do not invent taste reasons.",
  inputSchema: assistantSchemas.explain_proposal,
  availableInSubagents: false,
  execute: (input, ctx) => invokeRoomTool("explain_proposal", input, ctx.session.auth.current),
});
