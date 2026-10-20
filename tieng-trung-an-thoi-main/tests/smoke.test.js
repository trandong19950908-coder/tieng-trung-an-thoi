'use strict';
const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const data=fs.mkdtempSync(path.join(os.tmpdir(),'an-thoi-ci-'));
const port=20000+Math.floor(Math.random()*30000);
const secret='development-ci-secret-longer-than-thirty-two-characters';
let child;
async function ready(){for(let i=0;i<80;i++){try{const r=await fetch(`http://127.0.0.1:${port}/api/public`);if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('Server failed to start');}
test('bootstrap preserves previously created data',()=>{const env={...process.env,DATA_DIR:data};const r=spawn(process.execPath,['scripts/bootstrap.js'],{cwd:root,env});return new Promise((resolve,reject)=>r.on('exit',code=>{try{assert.equal(code,0);const db=path.join(data,'content.json');assert.ok(fs.existsSync(db));fs.writeFileSync(db,'{"custom":1}');const p=spawn(process.execPath,['scripts/bootstrap.js'],{cwd:root,env});p.on('exit',c=>{try{assert.equal(c,0);assert.equal(fs.readFileSync(db,'utf8'),'{"custom":1}');resolve();}catch(e){reject(e);}});}catch(e){reject(e);}}));});
test('working routes + student account + admin authentication', async()=>{
 child=spawn(process.execPath,['server/index.js'],{cwd:root,env:{...process.env,DATA_DIR:data,PORT:String(port),ADMIN_PASSWORD:'test-admin-strong-password',COOKIE_SECRET:secret},stdio:['ignore','pipe','pipe']});
 await ready(); const base=`http://127.0.0.1:${port}`;
 const pub=await fetch(base+'/api/public');assert.equal(pub.status,200);assert.ok((await pub.json()).courses.length);
 const catalog=await fetch(base+'/api/learning/catalog');assert.equal(catalog.status,200);assert.ok((await catalog.json()).vocabulary.length>=70);
 for(const page of ['/','/admin','/hoc.html'])assert.equal((await fetch(base+page)).status,200);
 const reg=await fetch(base+'/api/student/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Test Learner',email:'student@example.test',password:'securetestpassword123'})});assert.equal(reg.status,201);assert.match(reg.headers.get('set-cookie')||'',/HttpOnly/);
 const deny=await fetch(base+'/api/admin');assert.equal(deny.status,401);
 const login=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'test-admin-strong-password'})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
 assert.equal((await fetch(base+'/api/admin',{headers:{Cookie:cookie}})).status,200);
 const deniedVocab=await fetch(base+'/api/admin/vocabulary');assert.equal(deniedVocab.status,401);
 const vocabAdmin=await fetch(base+'/api/admin/vocabulary',{headers:{Cookie:cookie}});assert.equal(vocabAdmin.status,200);
 const list=await vocabAdmin.json();assert.ok(list.vocabulary.length>=70);
 const example={id:'test_hotel_welcome',category:'hotel',hanzi:'欢迎',pinyin:'huānyíng',meaning:'Chào mừng',example:'欢迎光临。',translation:'Hân hạnh đón tiếp.'};
 const importFirst=await fetch(base+'/api/admin/vocabulary/import',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({rows:[example]})});assert.equal(importFirst.status,200);
 const importDup=await fetch(base+'/api/admin/vocabulary/import',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({rows:[example]})});assert.equal(importDup.status,400);
 const importUnknown=await fetch(base+'/api/admin/vocabulary/import',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({rows:[{...example,id:'newid',category:'nonexistent'}]})});assert.equal(importUnknown.status,400);
 const updated=await fetch(base+'/api/learning/catalog');assert.equal(updated.status,200);assert.ok((await updated.json()).vocabulary.some(x=>x.id===example.id));

});
after(()=>{if(child)child.kill();fs.rmSync(data,{recursive:true,force:true});});
