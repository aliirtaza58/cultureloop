import { disableRoute } from "eve/channels";

// The standard protocol does not enforce conversation ownership. Use our room-bound channel.
export default disableRoute();
