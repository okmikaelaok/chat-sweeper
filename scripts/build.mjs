import { build } from 'esbuild';
import { readFile, writeFile, mkdir, copyFile, readdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
await import('./notices.mjs');
await mkdir('.tools', {recursive:true});
await mkdir('extension/assets', {recursive:true});
await mkdir('extension/assets/previews', {recursive:true});
const previewSource = 'docs/images/v0.1.2';
const previewFiles = (await readdir(previewSource)).filter(file => file.endsWith('.png'));
for (const file of await readdir('extension/assets/previews')) {
  if (file.endsWith('.png') && !previewFiles.includes(file)) await rm(path.join('extension/assets/previews', file));
}
for (const file of previewFiles) {
  await copyFile(path.join(previewSource, file), path.join('extension/assets/previews', file));
}
const sourceIcon = await readFile('extension/assets/chat-sweeper-icon.png');
if (!sourceIcon.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error('The source icon must be a PNG.');
const iconWidth = sourceIcon.readUInt32BE(16), iconHeight = sourceIcon.readUInt32BE(20);
if (iconWidth !== iconHeight || iconWidth < 128) throw new Error('The source icon must be square and at least 128×128.');
// Resize the supplied artwork without cropping, recolouring or replacing it.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconWidth}" height="${iconHeight}" viewBox="0 0 ${iconWidth} ${iconHeight}"><image href="data:image/png;base64,${sourceIcon.toString('base64')}" width="${iconWidth}" height="${iconHeight}"/></svg>`;
for (const size of [16,32,48,128]) await writeFile(`extension/assets/icon-${size}.png`,new Resvg(svg,{fitTo:{mode:'width',value:size}}).render().asPng());
await build({entryPoints:['scripts/render.tsx'], outfile:'.tools/render.mjs', bundle:true, platform:'node', format:'esm', packages:'external', jsx:'automatic'});
const {shells, icons} = await import('../.tools/render.mjs?' + Date.now());
await build({entryPoints:['scripts/start.tsx'], outfile:'.tools/start.mjs', bundle:true, platform:'node', format:'esm', packages:'external', jsx:'automatic'});
const {startMarkup} = await import('../.tools/start.mjs?' + Date.now());
const cli = path.resolve('node_modules/@tailwindcss/cli/dist/index.mjs');
const css = spawnSync(process.execPath, [cli,'-i','src/ui/styles.css','-o','extension/assets/styles.css','--minify'], {stdio:'inherit'});
if (css.status !== 0) process.exit(css.status || 1);
const startCss = spawnSync(process.execPath, [cli,'-i','src/ui/start.css','-o','extension/assets/start.css','--minify'], {stdio:'inherit'});
if (startCss.status !== 0) process.exit(startCss.status || 1);
const styles = await readFile('extension/assets/styles.css','utf8');
await writeFile('extension/ui.js', 'globalThis.ChatSweeperUI = ' + JSON.stringify({shells,styles,icons}) + ';\n');
await rm('extension/dates.js', {force:true});
for (const file of ['background.js','content.js','sites.js','protection.js','theme.js','dialogs.js','start.js']) {
  await writeFile('extension/' + file, await readFile('src/' + file,'utf8'));
}
await writeFile('extension/start.html', '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ChatSweeper</title><link rel="icon" type="image/png" sizes="32x32" href="assets/icon-32.png"><link rel="stylesheet" href="assets/start.css"></head><body>' + startMarkup + '<script src="theme.js"></script><script src="dialogs.js"></script><script src="start.js"></script></body></html>');
for (const file of ['LICENSE','NOTICE','THIRD_PARTY_NOTICES.md']) await copyFile(file, 'extension/' + file);
await mkdir('extension/licenses', {recursive:true});
for (const file of ['shadcn-ui-MIT.txt','lucide-ISC.txt','dependencies.txt']) await copyFile('licenses/' + file,'extension/licenses/' + file);
console.log('Built ChatSweeper. Load the extension/ folder in your browser.');
