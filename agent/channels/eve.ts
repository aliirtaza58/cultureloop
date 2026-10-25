import { eveChannel } from "eve/channels/eve";

// Keep the public health probe; reject every standard session/control/stream request.
// Conversation access belongs exclusively to the room-bound custom channel.
export default eveChannel({ auth: () => null });
