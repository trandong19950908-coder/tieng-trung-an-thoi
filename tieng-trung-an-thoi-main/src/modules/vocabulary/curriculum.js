'use strict';
const SLUG=/^[a-z0-9][a-z0-9-]{0,59}$/;
const safe=(v,n=240)=>String(v??'').trim().slice(0,n);
function validateCurriculum(value,catalog){
 if(!value || !Array.isArray(value.tracks) || value.tracks.length>40)throw Error('Danh sách lộ trình không hợp lệ (tối đa 40).');
 const known=new Set(catalog.categories.map(c=>c.id)), words=new Map(catalog.vocabulary.map(w=>[w.id,w]));
 const trackIds=new Set(),lessonIds=new Set();let count=0;
 const tracks=value.tracks.map(t=>{
  const id=safe(t.id,60);if(!SLUG.test(id)||trackIds.has(id))throw Error('Mã lộ trình trùng hoặc không hợp lệ.');trackIds.add(id);
  if(!known.has(t.categoryId))throw Error('Chủ đề từ vựng chưa tồn tại: '+t.categoryId);
  if(!Array.isArray(t.lessons)||t.lessons.length>100)throw Error('Tối đa 100 bài mỗi lộ trình.');
  return {id,categoryId:t.categoryId,title:safe(t.title,120),description:safe(t.description,500),level:safe(t.level,60),lessons:t.lessons.map(l=>{
   count++;if(count>1000)throw Error('Quá 1000 bài học.');const lid=safe(l.id,60);if(!SLUG.test(lid)||lessonIds.has(lid))throw Error('Mã bài học trùng hoặc không hợp lệ.');lessonIds.add(lid);
   if(!Array.isArray(l.wordIds)||l.wordIds.length>60||new Set(l.wordIds).size!==l.wordIds.length)throw Error('Danh sách từ trong bài không hợp lệ.');
   if(l.wordIds.some(w=>!words.has(w)||words.get(w).category!==t.categoryId))throw Error('Từ không tồn tại hoặc không thuộc chủ đề bài học.');
   const dialogs=Array.isArray(l.dialogs)?l.dialogs:[];if(dialogs.length>12)throw Error('Tối đa 12 câu hội thoại mỗi bài.');
   return {id:lid,title:safe(l.title,120),objective:safe(l.objective,400),wordIds:l.wordIds,dialogs:dialogs.map(d=>({hanzi:safe(d.hanzi,300),pinyin:safe(d.pinyin,400),translation:safe(d.translation,500)}))};
  })};
 });
 return {schemaVersion:1,notice:'Học liệu biên soạn tham khảo. Nhãn HSK cần được giáo viên đối chiếu đề cương chính thức.',tracks};
}
function publicCurriculum(data,catalog,progress={}){
 const words=new Map(catalog.vocabulary.map(w=>[w.id,w]));
 return {schemaVersion:1,notice:data.notice,tracks:data.tracks.map(t=>({...t,lessons:t.lessons.map(l=>({...l,words:l.wordIds.map(id=>words.get(id)).filter(Boolean),reviewed:l.wordIds.filter(id=>progress[id]).length,total:l.wordIds.length}))}))};
}
module.exports={validateCurriculum,publicCurriculum};
