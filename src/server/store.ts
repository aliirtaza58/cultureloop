import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { ExchangeRoom, MemberActor } from "../domain/exchanges.ts";
import { sampleRoom, sampleTitles } from "../fixtures/sample-room.ts";

/** Small SQL boundary, implemented by pg in production and embedded Postgres in tests. */
export interface SqlConnection {
  query<T extends Record<string, unknown> = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<{ rows: T[]; rowCount?: number | null }>;
  release(): void;
}
export interface SqlPool { connect(): Promise<SqlConnection> }
export interface Membership { readonly id: string; readonly alias: string }
export interface RoomView { readonly room: ExchangeRoom; readonly members: readonly Membership[]; readonly actor: MemberActor }
export const hashCapability = (token: string): string => createHash("sha256").update(token).digest("hex");
export const newCapability = (): string => randomBytes(32).toString("base64url");

function alias(value: string): string {
  const text = value.trim();
  if (!text || text.length > 50) throw new Error("Choose a name of 1 to 50 characters.");
  return text;
}
function session(value: string): string {
  if (!/^[A-Za-z0-9_-]{43}$/.test(value)) throw new Error("A valid private guest session is required.");
  return hashCapability(value);
}
function identifier(value: string): void {
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value)) throw new Error("Invalid room identity.");
}

export class RoomStore {
  readonly #pool: SqlPool;
  constructor(pool: SqlPool) { this.#pool = pool; }
  async #transaction<T>(operation: (connection: SqlConnection) => Promise<T>): Promise<T> {
    const connection = await this.#pool.connect();
    try {
      await connection.query("BEGIN");
      const value = await operation(connection);
      await connection.query("COMMIT");
      return value;
    } catch (error) { await connection.query("ROLLBACK"); throw error; }
    finally { connection.release(); }
  }
  async #read(connection: SqlConnection, roomId: string, sessionToken: string, lock: boolean): Promise<RoomView> {
    identifier(roomId);
    const sessionHash = session(sessionToken);
    // Check membership before loading private room state; lock the room for every mutation.
    const memberships = await connection.query<{ member_id: string; alias: string }>(
      "SELECT member_id, alias FROM cultureloop_memberships WHERE room_id = $1 AND session_hash = $2", [roomId, sessionHash]);
    const member = memberships.rows[0];
    if (!member) throw new Error("Room membership required.");
    const rooms = await connection.query<{ state: ExchangeRoom; revision: number }>(
      `SELECT state, revision FROM cultureloop_rooms WHERE id = $1${lock ? " FOR UPDATE" : ""}`, [roomId]);
    if (!rooms.rows[0]) throw new Error("Room unavailable.");
    const room = rooms.rows[0].state;
    if (room.id !== roomId || room.revision !== rooms.rows[0].revision || !room.memberIds.includes(member.member_id)) {
      throw new Error("Stored room state requires review.");
    }
    const members = await connection.query<{ member_id: string; alias: string }>(
      "SELECT member_id, alias FROM cultureloop_memberships WHERE room_id = $1 ORDER BY member_id", [roomId]);
    return { room, members: members.rows.map(m => ({ id: m.member_id, alias: m.alias })),
      actor: { roomId, memberId: member.member_id } };
  }
  async read(roomId: string, sessionToken: string): Promise<RoomView> {
    return this.#transaction(connection => this.#read(connection, roomId, sessionToken, false));
  }
  async create(sessionToken: string, displayName: string): Promise<{ view: RoomView; inviteToken: string }> {
    const sessionHash = session(sessionToken), display = alias(displayName);
    const id = randomUUID(), memberId = randomUUID(), inviteToken = newCapability();
    const room: ExchangeRoom = { id, revision: 1, memberIds: [memberId], listings: [],
      preferences: [], shortlists: [], cycles: [], holds: [] };
    return this.#transaction(async connection => {
      await connection.query("INSERT INTO cultureloop_rooms (id, invite_hash, state, revision) VALUES ($1, $2, $3::jsonb, $4)",
        [id, hashCapability(inviteToken), JSON.stringify(room), room.revision]);
      await connection.query("INSERT INTO cultureloop_memberships (room_id, member_id, session_hash, alias) VALUES ($1, $2, $3, $4)",
        [id, memberId, sessionHash, display]);
      return { view: await this.#read(connection, id, sessionToken, false), inviteToken };
    });
  }
  async join(inviteToken: string, sessionToken: string, displayName: string): Promise<RoomView> {
    const sessionHash = session(sessionToken), display = alias(displayName);
    if (!/^[A-Za-z0-9_-]{43}$/.test(inviteToken)) throw new Error("Invalid room invitation.");
    return this.#transaction(async connection => {
      const result = await connection.query<{ id: string; state: ExchangeRoom }>(
        "SELECT id, state FROM cultureloop_rooms WHERE invite_hash = $1 FOR UPDATE", [hashCapability(inviteToken)]);
      const target = result.rows[0];
      if (!target) throw new Error("Invalid room invitation.");
      const existing = await connection.query("SELECT member_id FROM cultureloop_memberships WHERE room_id = $1 AND session_hash = $2", [target.id, sessionHash]);
      if (existing.rows.length) return this.#read(connection, target.id, sessionToken, false);
      if (target.state.memberIds.length >= 6) throw new Error("This room already has six members.");
      const memberId = randomUUID();
      const room = { ...target.state, revision: target.state.revision + 1, memberIds: [...target.state.memberIds, memberId] };
      await connection.query("INSERT INTO cultureloop_memberships (room_id, member_id, session_hash, alias) VALUES ($1, $2, $3, $4)", [target.id, memberId, sessionHash, display]);
      await connection.query("UPDATE cultureloop_rooms SET state = $2::jsonb, revision = $3 WHERE id = $1", [target.id, JSON.stringify(room), room.revision]);
      return this.#read(connection, target.id, sessionToken, false);
    });
  }
  async createExample(sessionToken: string): Promise<RoomView> {
    const created = await this.create(sessionToken, "Aria (fictional)");
    return this.#transaction(async connection => {
      const base = await this.#read(connection, created.view.room.id, sessionToken, true);
      const ids: Record<string, string> = { aria: base.actor.memberId, ben: randomUUID(), cyra: randomUUID() };
      for (const name of ["ben", "cyra"]) {
        await connection.query("INSERT INTO cultureloop_memberships (room_id,member_id,session_hash,alias) VALUES ($1,$2,$3,$4)",
          [base.room.id, ids[name], hashCapability(newCapability()), `${name[0]!.toUpperCase()}${name.slice(1)} (fictional)`]);
      }
      const backupId = "fiction-next-reader";
      const room: ExchangeRoom = { ...base.room, revision: base.room.revision + 1, mode: "example",
        exampleControllerMemberId: base.actor.memberId,
        memberIds: Object.values(ids), shortlists: [],
        listings: [...sampleRoom.listings.map(l => ({ ...l, ownerId: ids[l.ownerId]!, title: sampleTitles[l.bookId] })),
          { id: "copy-aria-backup", bookId: backupId, title: "Notes for the Next Reader (fictional sample)", ownerId: ids.aria!, available: true }],
        preferences: [...sampleRoom.preferences.map(p => ({ ...p, memberId: ids[p.memberId]!, catalogSize: 4 })),
          { memberId: ids.ben!, bookId: backupId, source: "synthetic", rank: 2, catalogSize: 4 }],
      };
      await connection.query("UPDATE cultureloop_rooms SET state=$2::jsonb, revision=$3 WHERE id=$1",
        [room.id, JSON.stringify(room), room.revision]);
      return this.#read(connection, room.id, sessionToken, false);
    });
  }
  /** Every decision rechecks membership and locks the room before reading or writing holds. */
  async mutate(roomId: string, sessionToken: string, operation: (view: RoomView) => ExchangeRoom): Promise<RoomView> {
    return this.#transaction(async connection => {
      const view = await this.#read(connection, roomId, sessionToken, true);
      const next = operation(view);
      if (next === view.room) return view;
      if (next.id !== roomId || next.revision <= view.room.revision) throw new Error("Invalid room revision transition.");
      if (next.memberIds.join(",") !== view.room.memberIds.join(",")) throw new Error("Membership changes require the join operation.");
      await connection.query("DELETE FROM cultureloop_holds WHERE room_id = $1", [roomId]);
      for (const hold of next.holds) {
        await connection.query("INSERT INTO cultureloop_holds (room_id, listing_id, cycle_id, cycle_revision, expires_at) VALUES ($1,$2,$3,$4,$5)",
          [roomId, hold.listingId, hold.cycleId, hold.cycleRevision, new Date(hold.expiresAt)]);
      }
      const result = await connection.query("UPDATE cultureloop_rooms SET state = $2::jsonb, revision = $3 WHERE id = $1 AND revision = $4 RETURNING id",
        [roomId, JSON.stringify(next), next.revision, view.room.revision]);
      if (result.rows.length !== 1) throw new Error("Room changed; reload before retrying.");
      return { ...view, room: next };
    });
  }
}
