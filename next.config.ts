import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next from inferring a parent workspace root with extra lockfiles.
  // This reduces excessive file watching that can trigger EMFILE and flaky HMR.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
