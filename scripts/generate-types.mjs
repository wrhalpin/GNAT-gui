#!/usr/bin/env node
import { execSync } from "child_process";
import { existsSync } from "fs";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const OUT = "src/api/generated.ts";

try {
  execSync(
    `npx openapi-typescript ${BACKEND_URL}/openapi.json -o ${OUT}`,
    { stdio: "inherit", cwd: new URL("../frontend", import.meta.url).pathname }
  );
  console.log(`Types written to frontend/${OUT}`);
} catch {
  console.warn("Type generation skipped (backend not running)");
}
