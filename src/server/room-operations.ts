import type { ExchangeRoom } from "../domain/exchanges.ts";
import { repairExchanges } from "../domain/exchanges.ts";
import type { RoomStore, RoomView } from "./store.ts";
import type { QlooService } from "./qloo-service.ts";
import { rankingInputs } from "./qloo-service.ts";

/** Bound by the server's verified membership, never by model arguments. */
export interface RoomAccess {
  read(): Promise<RoomView>;
  mutate(operation: (view: RoomView) => ExchangeRoom): Promise<RoomView>;
}
export function roomAccess(store: RoomStore, roomId: string, session: string): RoomAccess {
  return { read: () => store.read(roomId, session), mutate: operation => store.mutate(roomId, session, operation) };
}
export type RoomQloo = Pick<QlooService, "search" | "rank">;

export async function rankRoom(access: RoomAccess, qloo: RoomQloo): Promise<RoomView> {
  const view = await access.read();
  if (view.room.mode === "example") throw new Error("Example simulation uses labeled synthetic rankings.");
  const ranked = await qloo.rank(view.room);
  return access.mutate(current => {
    if (rankingInputs(current.room) !== ranked.inputs) throw new Error("Room changed; refresh the rankings again.");
    return { ...current.room, revision: current.room.revision + 1, preferences: ranked.evidence,
      evidenceSnapshots: [...(current.room.evidenceSnapshots ?? []), ...ranked.snapshots] };
  });
}
export function findRoomExchanges(access: RoomAccess, now: number): Promise<RoomView> {
  return access.mutate(current => {
    if (current.room.memberIds.length < 2) throw new Error("At least two members must join before matching.");
    return repairExchanges(current.room, current.actor, now);
  });
}
