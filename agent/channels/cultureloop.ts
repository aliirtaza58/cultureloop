import { defineChannel, GET, POST } from "eve/channels";
import { database } from "../../src/server/database.ts";
import { RoomStore } from "../../src/server/store.ts";
import { failure, requireSession } from "../../src/server/application.ts";
import { sendAssistant, streamAssistant } from "../../src/server/assistant-transport.ts";

export default defineChannel({
  turnPolicy: "queue",
  routes: [
    POST("/cultureloop/rooms/:roomId/messages", async (request, { from, resolveSession, attachSession, params }) => {
      try {
        requireSession(request);
        const pool = await database();
        return await sendAssistant(request, params.roomId!, new RoomStore(pool), pool, async (address, text, auth) => {
          const target = from(address), previous = await resolveSession(address);
          const startIndex = previous ? Math.max(0, await attachSession(previous.id).getStreamTailIndex()) : 0;
          const session = await target.send(text, { auth });
          return { id: session.id, startIndex: session.id === previous?.id ? startIndex : 0 };
        });
      } catch (error) { return failure(error); }
    }),
    GET("/cultureloop/rooms/:roomId/stream", async (request, { resolveSession, attachSession, params }) => {
      try {
        requireSession(request);
        const pool = await database();
        return await streamAssistant(request, params.roomId!, new RoomStore(pool), async (address, startIndex) => {
          const session = await resolveSession(address);
          if (!session) return null;
          const stream = await attachSession(session.id).getEventStream({ startIndex });
          return stream.pipeThrough(new TransformStream({ transform(event, controller) {
            controller.enqueue(new TextEncoder().encode(`${JSON.stringify(event)}\n`));
          } }));
        });
      } catch (error) { return failure(error); }
    }),
  ],
});
