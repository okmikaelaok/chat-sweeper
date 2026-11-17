import { mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
// Python's standard library provides ZIP packaging without an extra npm dependency.
await mkdir("dist", { recursive: true });
const python =
  process.env.PYTHON_BIN || (process.platform === "win32" ? "py" : "python3");
execFileSync(python, ["scripts/package.py"], { stdio: "inherit" });
