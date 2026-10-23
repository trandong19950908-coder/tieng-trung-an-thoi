'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const h=require('../src/modules/vocabulary/history');
function fixture(t) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'an-thoi-history-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const env={DATA_DIR:path.join(root,'data')};fs.mkdirSync(env.DATA_DIR);
 const write=x=>fs.writeFileSync(path.join(env.DATA_DIR,'curriculum.json'),JSON.stringify(x));
 const basic={tracks:[{id:'hsk1',lessons:[{id:'bai-1',status:'published',title:'Chao hoi'}]}]};
 write(basic);return {root,env,write,basic};
}
test('snapshot preserves content and lists versions',t=>{const f=fixture(t),s=h.snapshot(f.root,f.env);assert.equal(h.list(f.root,f.env)[0],s.name);assert.equal(h.readVersion(f.root,s.name,f.env).data.tracks[0].id,'hsk1');});
test('diff identifies added, removed, and modified lessons',t=>{const f=fixture(t),s=h.snapshot(f.root,f.env);f.write({tracks:[{id:'hsk1',lessons:[{id:'bai-1',title:'Sua'},{id:'bai-2',title:'Them'}]}]});const d=h.compare(f.root,s.name,f.env);assert.deepEqual(d.added,['bai-2']);assert.deepEqual(d.modified,['bai-1']);});
test('restore requires confirm and saves the previous current version',t=>{const f=fixture(t),s=h.snapshot(f.root,f.env);f.write({tracks:[{id:'hsk1',lessons:[]}]});assert.throws(()=>h.restore(f.root,s.name,false,f.env),/confirm/);assert.equal(h.summarize(JSON.parse(fs.readFileSync(h.paths(f.root,f.env).dataFile))).lessons,0);const result=h.restore(f.root,s.name,true,f.env);assert.equal(h.summarize(JSON.parse(fs.readFileSync(h.paths(f.root,f.env).dataFile))).lessons,1);assert.notEqual(result.safetyBackup,s.name);assert.equal(h.readVersion(f.root,result.safetyBackup,f.env).data.tracks[0].lessons.length,0);});
test('rejects invalid file names and malformed JSON snapshots',t=>{const f=fixture(t);assert.throws(()=>h.readVersion(f.root,'../students.json',f.env),/hop le/);fs.writeFileSync(h.paths(f.root,f.env).dataFile,'{}');assert.throws(()=>h.snapshot(f.root,f.env),/khong hop le/);});
test('respects custom DATA_DIR',t=>{const f=fixture(t);assert.equal(h.paths(f.root,f.env).dataFile,path.join(f.env.DATA_DIR,'curriculum.json'));});
