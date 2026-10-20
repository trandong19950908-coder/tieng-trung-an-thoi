(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AnThoiCSVPreview = api;
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';
  const HEADERS = ['id','category','hanzi','pinyin','meaning','example','translation'];
  function parseCSV(input) {
    const rows=[];let row=[],value='',quoted=false,started=false;
    input=String(input).replace(/^\uFEFF/,'');
    for(let i=0;i<input.length;i++) {
      const c=input[i];
      if(quoted){if(c==='"'&&input[i+1]==='"'){value+='"';i++;}else if(c==='"'){quoted=false;}else value+=c;}
      else if(c==='"'&&!started&&value===''){quoted=true;started=true;}
      else if(c===','){row.push(value);value='';started=false;}
      else if(c==='\n'){row.push(value.replace(/\r$/,''));rows.push(row);row=[];value='';started=false;}
      else {if(c==='"')throw Error('Dấu ngoặc kép CSV không hợp lệ.');value+=c;started=true;}
    }
    if(quoted)throw Error('Dấu ngoặc kép trong CSV chưa đóng.');
    if(value||row.length){row.push(value.replace(/\r$/,''));rows.push(row);}
    return rows;
  }
  function preview(text,catalog) {
    const rows=parseCSV(text),head=rows.shift();
    if(!head||HEADERS.some((h,i)=>head[i]?.trim()!==h)||head.length!==HEADERS.length)throw Error('CSV cần đúng 7 cột. Hãy tải CSV mẫu.');
    const categories=new Set((catalog.categories||[]).map(x=>x.id));
    const current=new Set((catalog.vocabulary||[]).map(x=>x.id));
    const seen=new Set(),valid=[],errors=[];
    for(let i=0;i<rows.length;i++) {
      const cells=rows[i];if(cells.every(x=>!x.trim()))continue;
      const line=i+2;
      if(cells.length!==HEADERS.length){errors.push(`Dòng ${line}: phải có đúng 7 cột.`);continue;}
      const word=Object.fromEntries(HEADERS.map((h,j)=>[h,cells[j].trim()]));
      if(!/^[a-zA-Z0-9_-]{1,64}$/.test(word.id)){errors.push(`Dòng ${line}: mã ID không hợp lệ.`);continue;}
      if(seen.has(word.id)||current.has(word.id)){errors.push(`Dòng ${line}: trùng ID ${word.id}.`);continue;}
      seen.add(word.id);
      if(!categories.has(word.category)){errors.push(`Dòng ${line}: chủ đề ${word.category} chưa tồn tại.`);continue;}
      if(!word.hanzi||!word.meaning){errors.push(`Dòng ${line}: thiếu Hán tự hoặc nghĩa.`);continue;}
      const limits={category:64,hanzi:80,pinyin:160,meaning:300,example:400,translation:500};
      if(Object.entries(limits).some(([k,max])=>word[k].length>max)){errors.push(`Dòng ${line}: dữ liệu vượt độ dài cho phép.`);continue;}
      valid.push(word);
    }
    if(valid.length>2000)errors.push('Mỗi lần nhập tối đa 2.000 từ.');
    if((catalog.vocabulary||[]).length+valid.length>10000)errors.push('Ngân hàng tối đa 10.000 từ.');
    return {valid,errors,total:rows.filter(x=>x.some(v=>v.trim())).length};
  }
  return {HEADERS,parseCSV,preview};
});
