import { withEve } from "eve/vercel";

// One deployment, existing Next.js app and one independently built eve runtime.
const config = await withEve({
  services: {
    web: { framework: "nextjs", root: ".", buildCommand: "npm run build",
      devCommand: "node scripts/dev-service.ts web" },
  },
  routes: [
    { src: "^/cultureloop/rooms/[^/]+/(messages|stream)$", destination: { type: "service", service: "eve" } },
    { src: "^(.*)$", destination: { type: "service", service: "web" } },
  ],
});

// The SDK's generated hosted build command targets Linux. Keep local development portable.
export default { ...config, services: { ...config.services,
  eve: { ...config.services.eve, devCommand: "node ../../../scripts/dev-service.ts agent" },
} };
