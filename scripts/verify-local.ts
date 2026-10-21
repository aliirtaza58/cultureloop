import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { RoomView } from "../src/server/store.ts";

const origin = "http://127.0.0.1:3017";
const directory = ".private/prototype-verification";
interface Result { view: RoomView; inviteToken?: string; identities?: { id: string; name: string; proof: string }[]; origin?: string }
class Guest {
  cookie = "";
  async call(path: string, data?: unknown, expected = 200, requestOrigin = origin): Promise<Result> {
    const response = await fetch(origin + path, { method: data === undefined ? "GET" : "POST",
      headers: { ...(this.cookie ? { Cookie: this.cookie } : {}), ...(data === undefined ? {} : { Origin: requestOrigin, "Content-Type": "application/json" }) },
      body: data === undefined ? undefined : JSON.stringify(data), signal: AbortSignal.timeout(30000) });
    const result = await response.json() as Result & { error?: string };
    assert.equal(response.status, expected, `Unexpected status for ${path.split("?")[0]}: ${result.error ?? ""}`);
    const cookie = response.headers.get("set-cookie");
    if (cookie) this.cookie = cookie.split(";")[0]!;
    return result;
  }
  act(id: string, command: Record<string, unknown>, simulateMember?: string, expected = 200) {
    return this.call(`/api/rooms/${id}/actions`, { command, ...(simulateMember ? { simulateMember } : {}) }, expected);
  }
}
await mkdir(directory, { recursive: true });
if (process.argv.includes("--resume")) {
  const saved = JSON.parse(await readFile(`${directory}/restart.json`, "utf8")) as { id: string; cookie: string; revision: number };
  const reader = new Guest(); reader.cookie = saved.cookie;
  const actual = await reader.call(`/api/rooms/${saved.id}`);
  assert.equal(actual.view.room.revision, saved.revision);
  assert.ok(actual.view.room.cycles.some(c => c.status === "held"));
  console.log("Verified saved room revision and held exchange after server restart.");
} else {
  // All rooms, ownership declarations and decisions here are explicitly fictional test activity.
  // No participant research or real handoff is represented by this verifier.
  const controller = new Guest();
  let example = (await controller.call("/api/rooms", { type: "example" })).view;
  const id = example.room.id;
  const startingRanks = structuredClone(example.room.preferences);
  assert.deepEqual(example.room.shortlists, []);
  example = (await controller.act(id, { type: "sample-shortlists" })).view;
  assert.deepEqual(example.room.preferences, startingRanks);
  example = (await controller.act(id, { type: "generate" })).view;
  let cycle = example.room.cycles.find(c => c.status === "pending")!;
  assert.ok(cycle); assert.deepEqual(cycle.acceptedBy, []);
  for (const memberId of cycle.cycle.memberIds) example = (await controller.act(id,
    { type: "accept", cycleId: cycle.cycle.id, revision: cycle.revision }, memberId)).view;
  assert.equal(example.room.holds.length, 3);
  const exported = await fetch(`${origin}/api/rooms/${id}/agreement`, { headers: { Cookie: controller.cookie } });
  assert.equal(exported.status, 200);
  assert.match(exported.headers.get("content-disposition") ?? "", /attachment/);
  assert.match(await exported.text(), /FICTIONAL EXAMPLE/);
  await outsiderExport(id);
  const revision = example.room.revision;
  example = (await controller.act(id, { type: "accept", cycleId: cycle.cycle.id, revision: cycle.revision }, cycle.cycle.memberIds[0])).view;
  assert.equal(example.room.revision, revision);
  const given = cycle.cycle.transfers.find(t => t.fromMemberId === example.actor.memberId)!;
  example = (await controller.act(id, { type: "withdraw", listingId: given.listingId })).view;
  assert.equal(example.room.holds.length, 0);
  example = (await controller.act(id, { type: "generate" })).view;
  const repaired = example.room.cycles.find(c => c.status === "pending")!;
  assert.ok(repaired); assert.notEqual(repaired.cycle.id, cycle.cycle.id); assert.deepEqual(repaired.acceptedBy, []);
  await controller.act(id, { type: "accept", cycleId: cycle.cycle.id, revision: cycle.revision }, undefined, 409);
  cycle = repaired;
  for (const memberId of cycle.cycle.memberIds) example = (await controller.act(id,
    { type: "accept", cycleId: cycle.cycle.id, revision: cycle.revision }, memberId)).view;
  assert.equal(example.room.holds.length, 3);
  await writeFile(`${directory}/restart.json`, JSON.stringify({ id, cookie: controller.cookie, revision: example.room.revision }));
  assert.equal((await controller.call(`/api/rooms/${id}`)).view.room.revision, example.room.revision);

  const first = new Guest(), second = new Guest(), outsider = new Guest();
  const created = await first.call("/api/rooms", { type: "create", alias: "Fictional HTTP reader A" });
  const roomId = created.view.room.id;
  await outsider.call(`/api/rooms/${roomId}`, undefined, 403);
  const joined = await second.call("/api/rooms", { type: "join", alias: "Fictional HTTP reader B", invite: created.inviteToken });
  assert.equal(joined.view.room.memberIds.length, 2);
  await first.act(roomId, { type: "generate" }, joined.view.actor.memberId, 409);
  await first.call(`/api/rooms/${roomId}/actions`, { command: { type: "generate" } }, 403, "https://other.test");
  await first.call(`/api/rooms/${roomId}/actions`, { command: { type: "generate" } }, 403, "http://127.0.0.1:3000");

  let liveMode: string = "not requested; example ranks synthetic";
  const qlooOrigins: string[] = [];
  if (process.argv.includes("--qloo")) {
    let selections: Record<string, string> = {};
    try { selections = JSON.parse(await readFile(".private/qloo-feasibility/selections.json", "utf8")) as Record<string, string>; }
    catch (error) { if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error; }
    async function select(reader: Guest, query: string) {
      const result = await reader.call(`/api/rooms/${roomId}/search?${new URLSearchParams({ query, category: "book" })}`);
      qlooOrigins.push(result.origin ?? "unknown");
      const exact = result.identities?.filter(i => i.name.toLowerCase() === query.toLowerCase()) ?? [];
      const selected = selections[query] ? result.identities?.find(i => i.id === selections[query]) : exact.length === 1 ? exact[0] : undefined;
      assert.ok(selected, "Identity is ambiguous; review canonical research selection privately before continuing.");
      return selected;
    }
    const bookA = await select(first, "The Hobbit"), bookB = await select(second, "Dune");
    await first.act(roomId, { type: "offer", proof: bookA.proof });
    await second.act(roomId, { type: "offer", proof: bookA.proof }, undefined, 409);
    await second.act(roomId, { type: "offer", proof: bookB.proof });
    await first.act(roomId, { type: "add-interest", proof: bookA.proof });
    const another = await select(first, "Dune"); // Same query: private cache, separate session-bound proof.
    let real = (await first.act(roomId, { type: "add-interest", proof: another.proof })).view;
    assert.equal(real.room.interests?.length, 2);
    real = (await first.act(roomId, { type: "remove-interest", entityId: bookA.id })).view;
    assert.equal(real.room.interests?.length, 1);
    real = (await first.act(roomId, { type: "rank" })).view; // At most one Insights request: only A has interests.
    assert.equal(real.room.evidenceSnapshots?.length, 1);
    qlooOrigins.push(real.room.evidenceSnapshots![0]!.origin);
    const beforeShortlist = structuredClone(real.room.preferences);
    await first.act(roomId, { type: "shortlist", bookId: bookB.id, acceptable: true });
    real = (await second.act(roomId, { type: "shortlist", bookId: bookA.id, acceptable: true })).view;
    assert.deepEqual(real.room.preferences, beforeShortlist);
    real = (await first.act(roomId, { type: "generate" })).view;
    const pair = real.room.cycles.find(c => c.status === "pending")!; assert.ok(pair);
    real = (await first.act(roomId, { type: "accept", cycleId: pair.cycle.id, revision: pair.revision })).view;
    assert.equal(real.room.holds.length, 0);
    await second.act(roomId, { type: "accept", cycleId: pair.cycle.id, revision: pair.revision + 99 }, undefined, 409);
    real = (await second.act(roomId, { type: "accept", cycleId: pair.cycle.id, revision: pair.revision })).view;
    assert.equal(real.room.holds.length, 2);
    await second.act(roomId, { type: "complete", cycleId: pair.cycle.id, revision: pair.revision, confirmed: false }, undefined, 400);
    real = (await second.act(roomId, { type: "complete", cycleId: pair.cycle.id, revision: pair.revision, confirmed: true })).view;
    assert.ok(real.room.cycles.some(c => c.status === "completed"));
    assert.equal(real.room.holds.length, 0);
    liveMode = "Qloo-backed research identities/ranking through HTTP; fictional inventory/decisions; no real handoff";
  }
  const report = { verifiedAt: new Date().toISOString(), origin, exampleWorkflow: "passed", ranksPreserved: true,
    changedCopyRequiresFreshApproval: true, membershipIsolation: true, originIsolation: true,
    realRoomQlooCheck: liveMode, qlooLiveRequests: qlooOrigins.filter(value => value === "live").length,
    qlooCacheReuses: qlooOrigins.filter(value => value === "cache").length,
    hosted: false, modelInference: false, restart: "run --resume after restarting server" };
  await writeFile(`${directory}/http.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

async function outsiderExport(id: string) {
  const response = await fetch(`${origin}/api/rooms/${id}/agreement`);
  assert.equal(response.status, 403);
}
