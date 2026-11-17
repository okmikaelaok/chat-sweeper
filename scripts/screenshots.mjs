import { spawn } from "node:child_process";
import { mkdtemp, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
const chrome =
  process.env.CHROME_BIN ||
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
await mkdir("docs/images", { recursive: true });
for (const theme of ["light", "dark"]) {
  const profile = await mkdtemp(path.resolve(".tools/preview-profile-"));
  const url =
    pathToFileURL(path.resolve("tests/preview.html")).href + "?theme=" + theme;
  await new Promise((resolve, reject) => {
    const child = spawn(
      chrome,
      [
        "--headless",
        "--disable-gpu",
        "--no-first-run",
        `--user-data-dir=${profile}`,
        "--virtual-time-budget=3000",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--window-size=520,960",
        `--screenshot=${path.resolve("docs/images/" + theme + ".png")}`,
        url,
      ],
      { windowsHide: true, stdio: "ignore" },
    );
    child.on("error", reject);
    child.on("close", (code) =>
      code ? reject(new Error("Screenshot failed")) : resolve(),
    );
  });
  console.log(`Captured docs/images/${theme}.png`);
}
