'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validateCurriculum,publicCurriculum}=require('../src/modules/vocabulary/curriculum');
const seed=require('../content/curriculum.seed.json');
const catalog=require('../content/vocabulary.json');
const clone=()=>JSON.parse(JSON.stringify(seed));
test('legacy lessons remain published after validation',()=>{
 const c=validateCurriculum(clone(),catalog);
 assert.equal(c.tracks[0].lessons[0].status,'published');
 assert.equal(publicCurriculum(c,catalog).tracks[0].lessons.length,c.tracks[0].lessons.length);
});
test('draft lessons remain in admin data but are hidden from public catalog',()=>{
 const x=clone();x.tracks[0].lessons[0].status='draft';
 const c=validateCurriculum(x,catalog);
 assert.equal(c.tracks[0].lessons[0].status,'draft');
 const publicData=publicCurriculum(c,catalog);
 assert.equal(publicData.tracks[0].lessons.some(l=>l.id===c.tracks[0].lessons[0].id),false);
 assert.equal(c.tracks[0].lessons.length,seed.tracks[0].lessons.length);
});
test('publish a draft lesson without changing its ID or vocabulary',()=>{
 const x=clone(); x.tracks[0].lessons[0].status='draft';
 let c=validateCurriculum(x,catalog);
 const id=c.tracks[0].lessons[0].id;
 const words=c.tracks[0].lessons[0].wordIds;
 c.tracks[0].lessons[0].status='published';
 c=validateCurriculum(c,catalog);
 const lesson=publicCurriculum(c,catalog).tracks[0].lessons.find(l=>l.id===id);
 assert.deepEqual(lesson.wordIds,words);
});
test('reject invalid status',()=>{
 const x=clone();x.tracks[0].lessons[0].status='private';
 assert.throws(()=>validateCurriculum(x,catalog),/Trạng thái/);
});
test('editor exposes status and creates drafts',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const script=fs.readFileSync(path.join(__dirname,'../public/curriculum-editor.js'),'utf8');
 assert.match(script,/data-lesson-field=\"status\"/);
 assert.match(script,/status:'draft'/);
});
