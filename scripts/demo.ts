import { proposeExchanges } from "../src/domain/matching.ts";
import { sampleRoom, sampleTitles } from "../src/fixtures/sample-room.ts";

console.log("CultureLoop — SYNTHETIC example; no Qloo or model calls\n");
const proposal = proposeExchanges(sampleRoom);
for (const cycle of proposal.cycles) {
  for (const transfer of cycle.transfers) {
    console.log(`${transfer.fromMemberId} gives ${sampleTitles[transfer.bookId]} to ${transfer.toMemberId}`);
  }
}
console.log(`\n${proposal.membersServed} members served. Participant approval is still required.`);
