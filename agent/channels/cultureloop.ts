import { defineChannel, GET, POST } from "eve/channels";
import { database } from "../../src/server/database.ts";
import { RoomStore } from "../../src/server/store.ts";
import { failure } from "../../src/server/application.ts";
import { sendAssistant, streamAssistant } from "../../src/server/assistant-transport.ts";

export default defineChannel({
  turnPolicy: "queue",
  routes: [
    POST("/cultureloop/rooms/:roomId/messages", async (request, { from, params }) => {
      try {
        const pool = await database();
        return await sendAssistant(request, params.roomId!, new RoomStore(pool), pool, (address, text, auth) => from(address).send(text, { auth }));
      } catch (error) { return failure(error); }
    }),
    GET("/cultureloop/rooms/:roomId/stream", async (request, { resolveSession, attachSession, params }) => {
      try {
        const pool = await database();
        return await streamAssistant(request, params.roomId!, new RoomStore(pool), async address => {
          const session = await resolveSession(address);
          if (!session) return null;
          const stream = await attachSession(session.id).getEventStream();
          return stream.pipeThrough(new TransformStream({ transform(event, controller) {
            controller.enqueue(new TextEncoder().encode(`${JSON.stringify(event)}\n`));
          } }));
        });
      } catch (error) { return failure(error); }
    }),
  ],
});
