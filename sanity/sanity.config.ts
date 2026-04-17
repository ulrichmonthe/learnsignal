import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;

if (!projectId) {
  // eslint-disable-next-line no-console
  console.warn(
    "[Sanity] Set SANITY_STUDIO_PROJECT_ID in sanity/.env (see sanity/.env.example).",
  );
}

export default defineConfig({
  name: "learnsignal-signals",
  title: "Signals",
  projectId: projectId || "missing-project-id",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
