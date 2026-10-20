'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {buildLessons}=require('../src/modules/vocabulary/lesson-plan');
const catalog={categories:[{id:'taxi',title:'Taxi'},{id:'hotel',title:'Khách sạn'}],vocabulary:[...Array.from({length:11},(_,i)=>({id:'t'+i,category:'taxi'})),{id:'h1',category:'hotel'}]};
test('lessons deterministically divide each category into groups of five',()=>{
 const l=buildLessons(catalog);assert.deepEqual(l.map(x=>[x.id,x.total]),[['taxi-1',5],['taxi-2',5],['taxi-3',1],['hotel-1',1]]);
 assert.deepEqual(l[0].wordIds,['t0','t1','t2','t3','t4']);
});
test('review progress counts completed and due words without changing catalog',()=>{
 const yesterday=new Date(Date.now()-86400000).toISOString();
 const nextWeek=new Date(Date.now()+7*86400000).toISOString();
 const l=buildLessons(catalog,{t0:{dueAt:yesterday},t1:{dueAt:nextWeek},t2:{dueAt:yesterday},t3:{dueAt:yesterday},t4:{dueAt:yesterday}});
 assert.equal(l[0].reviewed,5);assert.equal(l[0].due,4);assert.equal(l[0].completed,true);assert.equal(l[1].reviewed,0);
});
