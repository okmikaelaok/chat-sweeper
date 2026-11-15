import { readFile, readdir, writeFile } from 'node:fs/promises';
const lock = JSON.parse(await readFile('package-lock.json','utf8'));
let text = 'ChatSweeper build dependency notices\nGenerated from the pinned package-lock.json. Third-party licenses remain in effect.\n\n';
for (const dir of Object.keys(lock.packages)) {
  if (!dir) continue;
  let entries; try { entries = await readdir(dir); } catch { continue; }
  const pkg = JSON.parse(await readFile(dir + '/package.json','utf8'));
  text += `\n${'='.repeat(72)}\n${pkg.name} ${pkg.version}\nDeclared license: ${pkg.license || 'See package'}\n`;
  const files = entries.filter(name => /^(license|licence|notice)(\.|$)/i.test(name));
  for (const file of files) text += `\n${file}\n${await readFile(dir + '/' + file,'utf8')}\n`;
}
await writeFile('licenses/dependencies.txt',text);
