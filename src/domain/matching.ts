/** Ranking utility is an application heuristic, never an enjoyment probability. */
export type EvidenceSource = "synthetic" | "qloo" | "explicit";

export interface Listing {
  readonly id: string;
  readonly bookId: string;
  readonly ownerId: string;
  readonly available: boolean;
}

export interface Preference {
  readonly memberId: string;
  readonly bookId: string;
  readonly source: EvidenceSource;
  readonly rank?: number;
  readonly catalogSize?: number;
  readonly veto?: boolean;
}

export interface RoomInput {
  readonly memberIds: readonly string[];
  readonly listings: readonly Listing[];
  readonly preferences: readonly Preference[];
}

export interface Transfer {
  readonly listingId: string;
  readonly bookId: string;
  readonly fromMemberId: string;
  readonly toMemberId: string;
  readonly evidence: Preference;
  readonly rankUtility: number;
}

export interface ExchangeCycle {
  readonly id: string;
  readonly memberIds: readonly string[];
  readonly transfers: readonly Transfer[];
}

export interface ExchangeProposal {
  readonly cycles: readonly ExchangeCycle[];
  readonly membersServed: number;
  readonly weakestRankUtility: number;
  readonly totalRankUtility: number;
  readonly approvalRequired: true;
}

const MAX_MEMBERS = 6;
const MAX_BOOKS_PER_MEMBER = 3;
const EPSILON = 1e-9;

function requireId(value: string, label: string): void {
  if (typeof value !== "string" || value.length === 0 || value.length > 200) {
    throw new Error(`${label} must be a nonempty ID of at most 200 characters.`);
  }
}

function validateRoom(room: RoomInput): void {
  if (room.memberIds.length < 2 || room.memberIds.length > MAX_MEMBERS) {
    throw new Error("A room must contain 2 to 6 members.");
  }
  const members = new Set(room.memberIds);
  if (members.size !== room.memberIds.length) throw new Error("Member IDs must be unique.");
  for (const id of members) requireId(id, "Member");
  const listingIds = new Set<string>();
  const bookIds = new Set<string>();
  const listingCounts = new Map<string, number>();
  for (const listing of room.listings) {
    requireId(listing.id, "Listing");
    requireId(listing.bookId, "Book");
    if (!members.has(listing.ownerId)) throw new Error("Listing owner is outside the room.");
    if (typeof listing.available !== "boolean") throw new Error("Listing availability must be boolean.");
    if (listingIds.has(listing.id)) throw new Error("Physical listing IDs must be unique.");
    listingIds.add(listing.id);
    bookIds.add(listing.bookId);
    const count = (listingCounts.get(listing.ownerId) ?? 0) + 1;
    if (count > MAX_BOOKS_PER_MEMBER) throw new Error("A member may offer at most 3 books.");
    listingCounts.set(listing.ownerId, count);
  }
  const seen = new Set<string>();
  for (const preference of room.preferences) {
    if (!members.has(preference.memberId) || !bookIds.has(preference.bookId)) {
      throw new Error("Preference references a member or book outside the room.");
    }
    const key = JSON.stringify([preference.memberId, preference.bookId]);
    if (seen.has(key)) throw new Error("Each member/book preference must be unique.");
    seen.add(key);
    if (!["synthetic", "qloo", "explicit"].includes(preference.source)) {
      throw new Error("Unknown evidence source.");
    }
    if (preference.veto !== undefined && typeof preference.veto !== "boolean") {
      throw new Error("Veto must be boolean.");
    }
    if (preference.rank !== undefined || preference.catalogSize !== undefined) {
      if (!Number.isInteger(preference.rank) || !Number.isInteger(preference.catalogSize)
        || preference.rank! < 1 || preference.catalogSize! < preference.rank!
        || preference.catalogSize! > 50) {
        throw new Error("Rank must be within a valid catalog of at most 50 titles.");
      }
    }
    if (!preference.veto && preference.source !== "explicit" && preference.rank === undefined) {
      throw new Error("Ranked evidence must supply a rank and catalog size.");
    }
  }
}

/** Enumerates only room-scoped two-/three-person cycles; does not alter inventory. */
export function enumerateCycles(room: RoomInput): ExchangeCycle[] {
  validateRoom(room);
  const members = [...room.memberIds].sort();
  const preferences = new Map(room.memberIds.map(id => [id, new Map<string, Preference>()]));
  const explicitMembers = new Set<string>();
  for (const preference of room.preferences) {
    preferences.get(preference.memberId)!.set(preference.bookId, preference);
    if (preference.source === "explicit" && !preference.veto) explicitMembers.add(preference.memberId);
  }
  const listings = [...room.listings].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const cycles: ExchangeCycle[] = [];

  function addOrientation(order: string[]): void {
    const choices = order.map((giver, index) => {
      const recipient = order[(index + 1) % order.length]!;
      return listings.flatMap(listing => {
        if (!listing.available || listing.ownerId !== giver) return [];
        const evidence = preferences.get(recipient)!.get(listing.bookId);
        if (!evidence || evidence.veto) return [];
        if (explicitMembers.has(recipient) && evidence.source !== "explicit") return [];
        const rankUtility = evidence.source === "explicit"
          ? 1 : (evidence.catalogSize! - evidence.rank! + 1) / evidence.catalogSize!;
        return [{ listingId: listing.id, bookId: listing.bookId, fromMemberId: giver,
          toMemberId: recipient, evidence: { ...evidence }, rankUtility } satisfies Transfer];
      });
    });
    if (choices.some(options => options.length === 0)) return;
    function combine(index: number, selected: Transfer[]): void {
      if (index === choices.length) {
        const transfers = [...selected];
        const id = JSON.stringify(transfers.map(t => [t.fromMemberId, t.listingId, t.toMemberId]));
        cycles.push({ id, memberIds: [...order], transfers });
        return;
      }
      for (const transfer of choices[index]!) combine(index + 1, [...selected, transfer]);
    }
    combine(0, []);
  }

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      addOrientation([members[i]!, members[j]!]);
      for (let k = j + 1; k < members.length; k++) {
        addOrientation([members[i]!, members[j]!, members[k]!]);
        addOrientation([members[i]!, members[k]!, members[j]!]);
      }
    }
  }
  return cycles.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

function summarize(cycles: readonly ExchangeCycle[]): ExchangeProposal {
  const ordered = [...cycles].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const transfers = ordered.flatMap(cycle => cycle.transfers);
  return {
    cycles: ordered,
    membersServed: transfers.length,
    weakestRankUtility: transfers.length ? Math.min(...transfers.map(t => t.rankUtility)) : 0,
    totalRankUtility: transfers.reduce((sum, transfer) => sum + transfer.rankUtility, 0),
    approvalRequired: true,
  };
}

function isBetter(candidate: ExchangeProposal, current: ExchangeProposal): boolean {
  if (candidate.membersServed !== current.membersServed) return candidate.membersServed > current.membersServed;
  const weakestGap = candidate.weakestRankUtility - current.weakestRankUtility;
  if (Math.abs(weakestGap) > EPSILON) return weakestGap > 0;
  const totalGap = candidate.totalRankUtility - current.totalRankUtility;
  if (Math.abs(totalGap) > EPSILON) return totalGap > 0;
  return JSON.stringify(candidate.cycles.map(c => c.id)) < JSON.stringify(current.cycles.map(c => c.id));
}

/** Maximize members served, then the weakest rank utility, then total utility. */
export function proposeExchanges(room: RoomInput): ExchangeProposal {
  const cycles = enumerateCycles(room);
  const cyclesByMember = new Map(room.memberIds.map(id => [id, cycles.filter(c => c.memberIds.includes(id))]));
  let best = summarize([]);
  function visit(remaining: string[], selected: ExchangeCycle[]): void {
    if (remaining.length === 0) {
      const candidate = summarize(selected);
      if (isBetter(candidate, best)) best = candidate;
      return;
    }
    const first = remaining[0]!;
    visit(remaining.slice(1), selected);
    for (const cycle of cyclesByMember.get(first)!) {
      if (!cycle.memberIds.every(id => remaining.includes(id))) continue;
      visit(remaining.filter(id => !cycle.memberIds.includes(id)), [...selected, cycle]);
    }
  }
  visit([...room.memberIds].sort(), []);
  return best;
}
