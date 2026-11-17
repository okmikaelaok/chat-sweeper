// One-time source import. Builds work offline after npm ci; no runtime CDN requests.
import { writeFile, mkdir } from "node:fs/promises";
const resources = {
  LICENSE:
    "https://raw.githubusercontent.com/spdx/license-list-data/main/text/GPL-3.0-only.txt",
  "licenses/shadcn-ui-MIT.txt":
    "https://raw.githubusercontent.com/shadcn-ui/ui/main/LICENSE.md",
  "licenses/lucide-ISC.txt":
    "https://raw.githubusercontent.com/lucide-icons/lucide/main/LICENSE",
};
for (const [file, url] of Object.entries(resources)) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  await writeFile(file, await response.text());
}
for (const component of ["button", "card", "badge", "input"]) {
  const response = await fetch(
    `https://ui.shadcn.com/r/styles/new-york/${component}.json`,
  );
  if (!response.ok) throw new Error(`Cannot fetch shadcn/ui ${component}`);
  const item = await response.json();
  await mkdir("src/ui/components/ui", { recursive: true });
  await writeFile(
    `src/ui/components/ui/${component}.tsx`,
    "// Adapted from shadcn/ui (MIT). See licenses/shadcn-ui-MIT.txt.\n" +
      item.files[0].content,
  );
}
console.log("Imported shadcn/ui source and upstream license texts.");
