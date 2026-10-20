'use strict';
/* Admin curriculum editor. Data stays in the existing /api/admin/curriculum endpoint. */
window.renderCurriculumEditor = async function renderCurriculumEditor(panel, api) {
  const html = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  panel.innerHTML = '<section class="curr-editor"><h2>Biên tập giáo trình</h2><p id="curr-notice">Đang tải giáo trình và ngân hàng từ vựng...</p></section>';
  let model, catalog, activeTrack = 0, activeLesson = 0, saving = false;
  try {
    [model, catalog] = await Promise.all([api('/api/admin/curriculum'), api('/api/admin/vocabulary')]);
  } catch (e) { panel.querySelector('#curr-notice').textContent = 'Không tải được dữ liệu: ' + e.message; return; }
  const categories = catalog.categories || [];
  const words = catalog.vocabulary || [];
  const idFrom = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,45) || 'bai';
  const uniqueId = (prefix, set) => { let id = prefix, n = 2; while(set.has(id)) id = prefix + '-' + n++; return id; };
  const input = (field, label, value, long = false) => `<label class="curr-field">${html(label)}${long ? `<textarea data-field="${field}" rows="3">${html(value)}</textarea>` : `<input data-field="${field}" value="${html(value)}">`}</label>`;
  function snapshot(){
    const t=model.tracks[activeTrack], l=t?.lessons?.[activeLesson];
    const fields=panel.querySelectorAll('[data-track-field]');
    fields.forEach(e=>{if(t)t[e.dataset.trackField]=e.value;});
    panel.querySelectorAll('[data-lesson-field]').forEach(e=>{if(l)l[e.dataset.lessonField]=e.value;});
    if(l){
      l.wordIds = [...panel.querySelectorAll('[data-word-id]:checked')].map(e=>e.dataset.wordId);
      l.dialogs = [...panel.querySelectorAll('.curr-dialog')].map(row=>({
        hanzi:row.querySelector('[data-dialog="hanzi"]').value,
        pinyin:row.querySelector('[data-dialog="pinyin"]').value,
        translation:row.querySelector('[data-dialog="translation"]').value
      })).filter(d=>d.hanzi||d.pinyin||d.translation);
    }
  }
  function draw(message='') {
    const t=model.tracks[activeTrack]; if(t && activeLesson>=t.lessons.length)activeLesson=Math.max(0,t.lessons.length-1);
    const l=t?.lessons?.[activeLesson];
    panel.innerHTML = `<section class="curr-editor">
      <div class="curr-header"><div><h2>Biên tập giáo trình</h2><p>Quản lý lộ trình, bài học, hội thoại và từ vựng. Dữ liệu được lưu trên máy chủ.</p></div><button type="button" id="curr-save" class="primary">Lưu thay đổi</button></div>
      <p class="curr-message" role="status">${html(message)}</p>
      <div class="curr-layout"><div class="curr-sidebar"><h3>Lộ trình (${model.tracks.length})</h3>
      ${model.tracks.map((x,i)=>`<button type="button" class="curr-item ${i===activeTrack?'active':''}" data-track="${i}">${html(x.title||x.id)}</button>`).join('')}
      <button type="button" class="curr-add" id="curr-add-track">+ Thêm lộ trình</button></div>
      <div class="curr-main">${t ? `<div class="curr-heading"><h3>Thông tin lộ trình</h3><button type="button" id="curr-delete-track" class="curr-danger">Xóa lộ trình</button></div>
      <div class="curr-fields">${[['id','Mã lộ trình'],['title','Tên lộ trình'],['level','Trình độ']].map(([k,v])=>`<label class="curr-field">${v}<input data-track-field="${k}" value="${html(t[k])}" ${k==='id'?'readonly':''}></label>`).join('')}
      <label class="curr-field">Chủ đề<select data-track-field="categoryId">${categories.map(c=>`<option value="${html(c.id)}" ${c.id===t.categoryId?'selected':''}>${html(c.title||c.name||c.id)}</option>`).join('')}</select></label>
      <label class="curr-field curr-wide">Mô tả<textarea data-track-field="description" rows="2">${html(t.description)}</textarea></label></div>
      <h3>Bài học (${t.lessons.length})</h3><div class="curr-lessons">${t.lessons.map((x,i)=>`<button type="button" data-lesson="${i}" class="curr-item ${i===activeLesson?'active':''}">${html(x.title||x.id)}</button>`).join('')}<button type="button" id="curr-add-lesson" class="curr-add">+ Thêm bài</button></div>
      ${l ? `<div class="curr-heading"><h3>Chi tiết bài học</h3><button type="button" id="curr-delete-lesson" class="curr-danger">Xóa bài</button></div>
      <div class="curr-fields">${[['id','Mã bài'],['title','Tên bài']].map(([k,v])=>`<label class="curr-field">${v}<input data-lesson-field="${k}" value="${html(l[k])}" ${k==='id'?'readonly':''}></label>`).join('')}
      <label class="curr-field curr-wide">Mục tiêu bài học<textarea data-lesson-field="objective" rows="2">${html(l.objective)}</textarea></label></div>
      <h4>Chọn từ vựng (${l.wordIds.length})</h4><p>Danh sách được lọc theo chủ đề của lộ trình; tối đa 60 từ mỗi bài.</p>
      <div class="curr-words">${words.filter(w=>w.category===t.categoryId).map(w=>`<label><input type="checkbox" data-word-id="${html(w.id)}" ${l.wordIds.includes(w.id)?'checked':''}> <strong>${html(w.hanzi)}</strong> <span>${html(w.pinyin)} – ${html(w.meaning)}</span></label>`).join('')||'Chưa có từ vựng cho chủ đề này.'}</div>
      <div class="curr-heading"><h4>Hội thoại (${l.dialogs.length})</h4><button type="button" id="curr-add-dialog" class="curr-add">+ Thêm câu</button></div>
      <div id="curr-dialogs">${l.dialogs.map((d,i)=>`<div class="curr-dialog" data-index="${i}"><label>Chữ Hán<input data-dialog="hanzi" value="${html(d.hanzi)}"></label><label>Pinyin<input data-dialog="pinyin" value="${html(d.pinyin)}"></label><label>Dịch nghĩa<input data-dialog="translation" value="${html(d.translation)}"></label><button type="button" class="curr-danger" data-remove-dialog="${i}">Xóa</button></div>`).join('')}</div>` : '<p>Chọn hoặc thêm bài học để bắt đầu.</p>'}
      ` : '<p>Hãy thêm một lộ trình để bắt đầu.</p>'}</div></div></section>`;
    panel.querySelector('#curr-save').onclick = async ()=>{
      snapshot();if(saving)return;saving=true;
      const b=panel.querySelector('#curr-save');b.disabled=true;
      try {await api('/api/admin/curriculum','PUT',model);draw('Đã lưu giáo trình thành công.');}
      catch(e){b.disabled=false;panel.querySelector('.curr-message').textContent='Không thể lưu: '+e.message;}
      finally{saving=false;}
    };
    panel.querySelectorAll('[data-track]').forEach(b=>b.onclick=()=>{snapshot();activeTrack=Number(b.dataset.track);activeLesson=0;draw();});
    panel.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>{snapshot();activeLesson=Number(b.dataset.lesson);draw();});
    panel.querySelector('#curr-add-track').onclick=()=>{snapshot();const cat=categories[0]?.id;if(!cat)return draw('Cần tạo chủ đề từ vựng trước.');const ids=new Set(model.tracks.map(t=>t.id));let id=uniqueId('lo-trinh',ids);model.tracks.push({id,title:'Lộ trình mới',description:'',level:'',categoryId:cat,lessons:[]});activeTrack=model.tracks.length-1;activeLesson=0;draw();};
    if(!t)return;
    panel.querySelector('#curr-delete-track').onclick=()=>{if(!confirm('Xóa lộ trình và các bài trong lộ trình này?'))return;model.tracks.splice(activeTrack,1);activeTrack=0;activeLesson=0;draw('Chưa lưu. Nhấn Lưu thay đổi để xác nhận.');};
    panel.querySelector('[data-track-field="categoryId"]').onchange=()=>{snapshot();t.lessons.forEach(x=>{x.wordIds=x.wordIds.filter(id=>words.some(w=>w.id===id&&w.category===t.categoryId));});draw('Đã lọc từ theo chủ đề mới; hãy kiểm tra lại bài học và lưu.');};
    panel.querySelector('#curr-add-lesson').onclick=()=>{snapshot();const ids=new Set(model.tracks.flatMap(x=>x.lessons.map(y=>y.id)));const id=uniqueId(t.id+'-bai',ids);t.lessons.push({id,title:'Bài học mới',objective:'',wordIds:[],dialogs:[]});activeLesson=t.lessons.length-1;draw();};
    if(!l)return;
    panel.querySelector('#curr-delete-lesson').onclick=()=>{if(!confirm('Xóa bài học này?'))return;t.lessons.splice(activeLesson,1);activeLesson=0;draw('Chưa lưu.');};
    panel.querySelector('#curr-add-dialog').onclick=()=>{snapshot();l.dialogs.push({hanzi:'',pinyin:'',translation:''});draw();};
    panel.querySelectorAll('[data-remove-dialog]').forEach(b=>b.onclick=()=>{snapshot();l.dialogs.splice(Number(b.dataset.removeDialog),1);draw();});
  }
  draw();
};
