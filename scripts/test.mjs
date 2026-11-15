import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const chrome = process.env.CHROME_BIN || ['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
if (!chrome) throw new Error('Set CHROME_BIN to your Chrome/Chromium executable to run the browser fixtures.');
await mkdir('.tools/test-results',{recursive:true});
let failed = false, checks = 0;
for (const [name, file, query] of [['dates','dates.html',''],['chatgpt','integration.html','?site=chatgpt'],['gemini','integration.html','?site=gemini'],['themes','themes.html',''],['new-chatgpt','discovery.html','?site=chatgpt'],['new-gemini','discovery.html','?site=gemini']]) {
  const profile = await mkdtemp(path.resolve('.tools/test-profile-'));
  const url = pathToFileURL(path.resolve('tests/' + file)).href + query;
  const output = await new Promise((resolve,reject) => {
    const child = spawn(chrome,['--headless','--disable-gpu','--no-first-run',`--user-data-dir=${profile}`,'--virtual-time-budget=25000','--dump-dom',url],{windowsHide:true});
    let stdout='', stderr=''; child.stdout.on('data',b=>stdout+=b); child.stderr.on('data',b=>stderr+=b);
    const timer = setTimeout(()=>{child.kill();reject(new Error(name + ' timed out'));},40000);
    child.on('error',reject); child.on('close',code=>{clearTimeout(timer);resolve({stdout,stderr,code});});
  });
  await writeFile(`.tools/test-results/${name}.html`,output.stdout);
  await writeFile(`.tools/test-results/${name}.log`,output.stderr);
  const result = output.stdout.match(/<pre id="result">([^<]*)/);
  console.log(`${name}: ${result?.[1] || 'No result (see .tools/test-results)'}`);
  if (!result?.[1].startsWith('PASS:')) failed = true;
  else checks += Number(result[1].match(/\d+/)?.[0] || 0);
}
const packageInfo = JSON.parse(await readFile('package.json','utf8'));
const manifest = JSON.parse(await readFile('extension/manifest.json','utf8'));
if (manifest.name !== 'ChatSweeper' || manifest.version !== packageInfo.version) throw new Error('Unexpected manifest branding/version');
if (manifest.author !== 'Mikaela Marie Punzalan' || !manifest.description.startsWith('Select. Manage. Keep or Sweep.')) throw new Error('Missing author/subtitle');
for (const file of [...manifest.content_scripts[0].js,manifest.background.service_worker,...Object.values(manifest.icons)]) if (!existsSync('extension/' + file)) throw new Error('Missing extension file: '+file);
for (const [size,file] of Object.entries(manifest.icons)) {
  const png = await readFile('extension/'+file);
  if (png.readUInt32BE(16) !== Number(size) || png.readUInt32BE(20) !== Number(size)) throw new Error('Incorrect PNG icon size: '+file);
}
if (manifest.content_scripts[0].matches.length !== 3 || manifest.permissions.join() !== 'activeTab,storage') throw new Error('Permissions changed unexpectedly');
for (const file of ['content.js','background.js','dates.js','sites.js','protection.js','theme.js','dialogs.js','start.js']) {
  const text = await readFile('extension/'+file,'utf8');
  if (/\bfetch\s*\(|XMLHttpRequest|\beval\s*\(/.test(text)) throw new Error('Unexpected network/eval in '+file);
}
if (packageInfo.name !== 'chatsweeper' || packageInfo.license !== 'GPL-3.0-only') throw new Error('Unexpected package metadata');
const license = await readFile('LICENSE','utf8');
if (!license.includes('Version 3, 29 June 2007') || license.length < 30000) throw new Error('Missing full GPLv3 license');
console.log(`${checks} browser checks; manifest, asset paths and permission checks passed.`);
if (failed) process.exit(1);
