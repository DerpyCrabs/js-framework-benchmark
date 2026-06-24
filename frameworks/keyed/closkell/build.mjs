import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const closkellRoot = path.resolve(process.env.CLOSKELL_ROOT || path.join(here, "../../../../Closkell"));
const manifestPath = path.join(closkellRoot, "Cargo.toml");
const outPath = path.join(here, "dist", "app.js");

if (!fs.existsSync(manifestPath)) {
  throw new Error(`Closkell workspace was not found at ${closkellRoot}. Set CLOSKELL_ROOT to override.`);
}

const result = spawnSync(
  "cargo",
  [
    "run",
    "-q",
    "--manifest-path",
    manifestPath,
    "-p",
    "cli",
    "--",
    "build",
    path.join("src", "app.clsk"),
    "--out",
    outPath,
    "--app",
    "--root",
    "main",
    "--vendor-runtime"
  ],
  {
    cwd: here,
    stdio: "inherit",
    windowsHide: true,
    env: {
      ...process.env,
      CLOSKELL_ENV_DEV: "false",
      CLOSKELL_ENV_MODE: "production"
    }
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const compiled = fs.readFileSync(outPath, "utf8");
fs.writeFileSync(
  outPath,
  compiled.replaceAll('from "@closkell/runtime"', 'from "../node_modules/@closkell/runtime/src/index.js"')
);
