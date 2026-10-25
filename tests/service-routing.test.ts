import assert from "node:assert/strict";
import { test } from "node:test";
import config from "../vercel.ts";
import { serviceLaunch } from "../scripts/dev-service.ts";

function destination(path: string) {
  const route = config.routes.find(route => route.src && new RegExp(route.src).test(path));
  return typeof route?.destination === "object" ? route.destination.service : route?.destination;
}

test("one service graph keeps room APIs on web and routes only assistant endpoints to eve", () => {
  assert.deepEqual(Object.keys(config.services).sort(), ["eve", "web"]);
  const room = "11111111-1111-4111-8111-111111111111";
  assert.equal(destination(`/cultureloop/rooms/${room}/messages`), "eve");
  assert.equal(destination(`/cultureloop/rooms/${room}/stream`), "eve");
  for (const path of ["/", `/rooms/${room}`, `/api/rooms/${room}`, `/api/rooms/${room}/actions`,
    `/api/rooms/${room}/agreement`, `/cultureloop/rooms/${room}/unknown`]) assert.equal(destination(path), "web");
  assert.equal(destination("/eve/v1/health"), "eve");
});

const verifiedFixture = { DATABASE_URL: "postgres://synthetic-fixture/not-a-connection", CULTURELOOP_HOSTED_DB_VERIFIED: "true",
  SESSION_SECRET: "synthetic-test-secret-".repeat(3) };
test("combined services refuse absent/unverified or embedded database settings before spawning", () => {
  assert.throws(() => serviceLaunch("web", {}), /shared PostgreSQL/);
  assert.throws(() => serviceLaunch("agent", { ...verifiedFixture, CULTURELOOP_HOSTED_DB_VERIFIED: "false" }), /shared PostgreSQL/);
  assert.throws(() => serviceLaunch("web", { ...verifiedFixture, CULTURELOOP_LOCAL_PROTOTYPE: "true" }), /embedded/);
  assert.throws(() => serviceLaunch("web", { ...verifiedFixture, SESSION_SECRET: "short" }), /SESSION_SECRET/);
});

test("portable service commands preserve the public origin and avoid port 3000", () => {
  for (const mode of ["web", "agent"] as const) {
    const launch = serviceLaunch(mode, { ...verifiedFixture, PORT: "4321", CULTURELOOP_APP_ORIGIN: "http://127.0.0.1:3017" });
    assert.equal(launch.args.at(-1), "4321");
    assert.equal(launch.env.CULTURELOOP_APP_ORIGIN, "http://127.0.0.1:3017");
    assert.throws(() => serviceLaunch(mode, { ...verifiedFixture, PORT: "3000" }), /excluding 3000/);
  }
  assert.ok(serviceLaunch("agent", verifiedFixture).args.includes("--no-default-extensions"));
  assert.ok(config.services.eve?.devCommand === "node ../../../scripts/dev-service.ts agent");
});
