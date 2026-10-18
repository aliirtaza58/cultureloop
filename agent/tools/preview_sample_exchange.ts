import { defineTool } from "eve/tools";
import { z } from "zod";
import { proposeExchanges } from "../../src/domain/matching.ts";
import { sampleRoom, sampleTitles } from "../../src/fixtures/sample-room.ts";

export default defineTool({
  description: "Preview a SYNTHETIC three-person book exchange. No live Qloo data, member changes, or reservations.",
  inputSchema: z.object({}),
  async execute() {
    return { evidenceSource: "synthetic", titles: sampleTitles,
      proposal: proposeExchanges(sampleRoom), approvalsRecorded: false };
  },
});
