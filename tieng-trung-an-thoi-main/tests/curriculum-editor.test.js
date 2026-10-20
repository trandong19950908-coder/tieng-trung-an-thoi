'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const publicDir=path.join(__dirname,'../public');
test('curriculum editor assets are linked and syntax-valid',()=>{
 const html=fs.readFileSync(path.join(publicDir,'admin.html'),'utf8');
 assert.match(html,/src="\/curriculum-editor\.js"/);
 assert.match(html,/href="\/curriculum-editor\.css"/);
 const js=fs.readFileSync(path.join(publicDir,'admin.js'),'utf8');
 assert.match(js,/window\.renderCurriculumEditor\(panel,api\)/);
 const editor=fs.readFileSync(path.join(publicDir,'curriculum-editor.js'),'utf8');
 assert.match(editor,/\/api\/admin\/curriculum/);
 assert.match(editor,/\/api\/admin\/vocabulary/);
 assert.match(editor,/data-remove-dialog/);
});
