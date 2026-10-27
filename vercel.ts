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

// Keep the generated root explicit while making the development command portable.
export default { ...config, services: { ...config.services,
  eve: { ...config.services.eve, root: ".eve/vercel-services/eve",
    devCommand: "node ../../../scripts/dev-service.ts agent" },
} };
