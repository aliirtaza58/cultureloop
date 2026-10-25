import { defineSandbox } from "eve/sandbox";
import { JustBashSandbox } from "eve/sandbox/just-bash";

// Explicit in-process filesystem; no container/VM provider or automatic install.
// This is not a network isolation boundary. Model shell/file tools remain disabled.
export const environment = JustBashSandbox.environment({ autoInstall: false });
export default defineSandbox(() => environment.open());
