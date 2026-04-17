import { defineCliConfig } from "sanity/cli";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;

export default defineCliConfig({
  api: {
    projectId: projectId || "missing-project-id",
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
});
