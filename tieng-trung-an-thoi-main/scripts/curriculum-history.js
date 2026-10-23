#!/usr/bin/env node
'use strict';
const path=require('node:path');
const history=require('../src/modules/vocabulary/history');
const root=path.resolve(__dirname,'..');
const [cmd,name,flag]=process.argv.slice(2);
try {
 let out;
 switch(cmd){
  case 'snapshot':out=history.snapshot(root);break;
  case 'list':out=history.list(root);break;
  case 'diff':if(!name)throw Error('Can ten phien ban.');out=history.compare(root,name);break;
  case 'restore':if(!name)throw Error('Can ten phien ban.');out=history.restore(root,name,flag==='--confirm');break;
  default:throw Error('Cach dung: node scripts/curriculum-history.js snapshot | list | diff TEN.json | restore TEN.json --confirm');
 }
 console.log(JSON.stringify(out,null,2));
} catch (error) { console.error('LOI:',error.message);process.exitCode=1; }
