'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=path.resolve(process.env.DATA_DIR||path.join(root,'data'));
fs.mkdirSync(data,{recursive:true});
for(const [dest,source] of [['vocabulary.json','content/vocabulary.json'],['content.json','content/site.seed.json'],['curriculum.json','content/curriculum.seed.json']]){
 const target=path.join(data,dest);
 if(!fs.existsSync(target))fs.copyFileSync(path.join(root,source),target,fs.constants.COPYFILE_EXCL);
}
console.log('Data initialized (existing files preserved): '+data);
