'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {schedule,summary}=require('../src/modules/vocabulary/srs');
const now=Date.parse('2026-10-20T00:00:00Z');
test('SRS first success schedules two days',()=>{const p=schedule({},'good',now);assert.equal(p.interval,2);assert.equal(Date.parse(p.dueAt)-now,2*86400000);});
test('SRS wrong answer resets day interval',()=>{assert.equal(schedule({interval:30,repetitions:9},'again',now).interval,1);});
test('SRS hard answer grows slowly',()=>{assert.equal(schedule({interval:4,repetitions:3},'hard',now).interval,6);});
test('SRS rejects invalid ratings',()=>assert.throws(()=>schedule({},'excellent',now)));
test('review summary distinguishes new, due, learning and scheduled',()=>{const words=[{id:'a'},{id:'b'},{id:'c'},{id:'d'}];const p={b:{dueAt:new Date(now-1).toISOString()},c:{dueAt:new Date(now+86400000).toISOString(),lastRating:'hard'},d:{dueAt:new Date(now+86400000).toISOString(),lastRating:'good'}};assert.deepEqual(summary(words,p,now),{total:4,new:1,due:1,learning:1,scheduled:1});});
