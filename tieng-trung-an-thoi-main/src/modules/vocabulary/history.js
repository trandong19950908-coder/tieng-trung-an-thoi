'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function paths(root, env = process.env) {
  const dir = path.resolve(env.DATA_DIR || path.join(root, 'data'));
  return { dataFile: path.join(dir, 'curriculum.json'), archiveDir: path.join(dir, 'curriculum-history') };
}
function parseCurriculum(buffer) {
  const data = JSON.parse(buffer.toString('utf8'));
  if (!data || !Array.isArray(data.tracks) || data.tracks.some(t => !t || !Array.isArray(t.lessons))) {
    throw new Error('Du lieu giao trinh khong hop le.');
  }
  return data;
}
function writeAtomic(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
  try {
    fs.writeFileSync(temp, content, { flag: 'wx', mode: 0o600 });
    fs.renameSync(temp, file);
  } finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}
function fingerprint(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }
function snapshot(root, env = process.env) {
  const {dataFile, archiveDir} = paths(root, env);
  const bytes = fs.readFileSync(dataFile);
  parseCurriculum(bytes);
  fs.mkdirSync(archiveDir, {recursive:true});
  const name = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}.json`;
  const dest = path.join(archiveDir, name);
  fs.writeFileSync(dest, bytes, {flag:'wx', mode:0o600});
  return {name, hash:fingerprint(bytes), summary:summarize(parseCurriculum(bytes))};
}
function list(root, env=process.env) {
  const {archiveDir} = paths(root, env);
  if (!fs.existsSync(archiveDir)) return [];
  return fs.readdirSync(archiveDir).filter(x => /^\d{4}-\d{2}-\d{2}T[\d-]+Z-[a-f0-9]{8}\.json$/.test(x)).sort().reverse();
}
function readVersion(root, name, env=process.env) {
  if (!list(root,env).includes(name)) throw new Error('Khong tim thay phien ban hop le.');
  const bytes = fs.readFileSync(path.join(paths(root,env).archiveDir, name));
  return {bytes, data:parseCurriculum(bytes)};
}
function summarize(data) {
  const ids = data.tracks.flatMap(t => t.lessons.map(l => l.id));
  return {tracks:data.tracks.length, lessons:ids.length, drafts:data.tracks.flatMap(t=>t.lessons).filter(l=>l.status==='draft').length};
}
function compare(root, name, env=process.env) {
  const prior=readVersion(root,name,env).data;
  const current=parseCurriculum(fs.readFileSync(paths(root,env).dataFile));
  const flatten = c => new Map(c.tracks.flatMap(t => t.lessons.map(l => [l.id,JSON.stringify(l)])));
  const a=flatten(prior),b=flatten(current);
  return {snapshot:summarize(prior), current:summarize(current), added:[...b.keys()].filter(k=>!a.has(k)), removed:[...a.keys()].filter(k=>!b.has(k)), modified:[...a.keys()].filter(k=>b.has(k)&&a.get(k)!==b.get(k))};
}
function restore(root, name, confirmed=false, env=process.env) {
  if (!confirmed) throw new Error('Can xac nhan khoi phuc bang --confirm.');
  const version=readVersion(root,name,env);
  const {dataFile}=paths(root,env);
  // Save current state before overwriting. If missing, abort instead of silently overwriting.
  const safety=snapshot(root,env);
  writeAtomic(dataFile, version.bytes);
  return {restored:name, safetyBackup:safety.name, summary:summarize(version.data)};
}
module.exports={paths,parseCurriculum,snapshot,list,readVersion,summarize,compare,restore};
