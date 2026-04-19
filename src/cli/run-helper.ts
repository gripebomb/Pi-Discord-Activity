import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentFile = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(currentFile), "../..");

for (const candidate of [
  path.resolve(packageRoot, ".env"),
  path.resolve(packageRoot, ".env.local"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), ".env.local")
]) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate, override: candidate.endsWith(".local") });
  }
}

const { startHelper } = await import("../helper/index.js");

void startHelper();
