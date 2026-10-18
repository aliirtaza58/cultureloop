import type { RoomInput } from "../domain/matching.ts";

/** Independently authored fiction. None of these identities or ranks came from Qloo. */
export const sampleRoom: RoomInput = {
  memberIds: ["aria", "ben", "cyra"],
  listings: [
    { id: "copy-aria", bookId: "fiction-lantern-atlas", ownerId: "aria", available: true },
    { id: "copy-ben", bookId: "fiction-margins-tomorrow", ownerId: "ben", available: true },
    { id: "copy-cyra", bookId: "fiction-river-questions", ownerId: "cyra", available: true },
  ],
  preferences: [
    { memberId: "ben", bookId: "fiction-lantern-atlas", source: "synthetic", rank: 1, catalogSize: 3 },
    { memberId: "cyra", bookId: "fiction-margins-tomorrow", source: "synthetic", rank: 1, catalogSize: 3 },
    { memberId: "aria", bookId: "fiction-river-questions", source: "synthetic", rank: 1, catalogSize: 3 },
  ],
};

export const sampleTitles: Readonly<Record<string, string>> = {
  "fiction-lantern-atlas": "The Lantern Atlas (fictional sample)",
  "fiction-margins-tomorrow": "Margins of Tomorrow (fictional sample)",
  "fiction-river-questions": "A River of Questions (fictional sample)",
};
