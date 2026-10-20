'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const tracksHost = $('#tracks');
  const detail = $('#detail');
  const state = {tracks: [], filter: 'all', currentTrack: null, currentLesson: null};
  const category = track => /^hsk/i.test(track.categoryId || '') ? 'hsk' : 'work';
  const glyph = track => ({hsk1:'一',hsk2:'二',hsk3:'三',hotel:'宿',taxi:'车',restaurant:'餐',daily:'说'})[track.categoryId] || '学';
  const el = (tag, className, content) => {const node=document.createElement(tag);if(className)node.className=className;if(content!==undefined)node.textContent=String(content);return node;};
  const add = (parent,...children) => {children.forEach(child=>parent.append(child));return parent;};
  function trackCard(track) {
    const card=el('article','track-card');card.dataset.category=category(track);
    const art=el('div','track-art');add(art,el('strong','',glyph(track)),el('span','',category(track)==='hsk'?'LUYỆN THI & NỀN TẢNG':'GIAO TIẾP ỨNG DỤNG'));
    const body=el('div','track-body');add(body,el('h3','',track.title),el('p','',track.description||'Học từ vựng và mẫu câu theo từng bài.'));
    const footer=el('div','track-footer');const total=(track.lessons||[]).reduce((n,l)=>n+(l.total||0),0);
    add(footer,el('span','',`${track.lessons?.length||0} bài · ${total} từ`));
    const button=el('button','open-track','Xem bài học ↗');button.type='button';button.addEventListener('click',()=>openTrack(track));add(footer,button);add(body,footer);return add(card,art,body);
  }
  function renderCatalog(){tracksHost.replaceChildren();const shown=state.tracks.filter(t=>state.filter==='all'||category(t)===state.filter);shown.forEach(t=>tracksHost.append(trackCard(t)));$('#track-count').textContent=`${shown.length} lộ trình`;if(!shown.length)tracksHost.append(el('p','', 'Chưa có lộ trình trong nhóm này.'));}
  function openTrack(track){state.currentTrack=track;$('#detail-title').textContent=track.title;$('#detail-description').textContent=track.description||'';$('#detail-category').textContent=category(track)==='hsk'?'HSK tham khảo':'Giao tiếp ứng dụng';const total=(track.lessons||[]).reduce((n,l)=>n+(l.total||0),0),done=(track.lessons||[]).reduce((n,l)=>n+(l.reviewed||0),0),pct=total?Math.round(done/total*100):0;const progress=$('#detail-progress');progress.replaceChildren(el('strong','',`${done}/${total} từ đã ôn`));const line=el('div','progress-line');const fill=el('span');fill.style.width=`${pct}%`;add(line,fill);add(progress,line);
    detail.hidden=false;renderLessonList(track.lessons||[]);selectLesson(track.lessons?.[0]||null);detail.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function renderLessonList(lessons){const host=$('#lesson-list');host.replaceChildren();lessons.forEach((lesson,i)=>{const b=el('button','lesson-picker',`${i+1}. ${lesson.title}`);b.type='button';b.dataset.lessonId=lesson.id;add(b,el('small','',`${lesson.total||0} từ · đã ôn ${lesson.reviewed||0}`));b.addEventListener('click',()=>selectLesson(lesson));host.append(b);});}
  function selectLesson(lesson){state.currentLesson=lesson;document.querySelectorAll('.lesson-picker').forEach(btn=>{const chosen=btn.dataset.lessonId===lesson?.id;btn.classList.toggle('selected',chosen);btn.setAttribute('aria-pressed',String(chosen));});const host=$('#lesson-content');host.replaceChildren();if(!lesson){host.append(el('p','', 'Chưa có bài học trong lộ trình này.'));return;}add(host,el('h3','',lesson.title),el('p','objective',lesson.objective||'Học từ vựng và thực hành hội thoại.'));
    add(host,el('h4','section-label',`TỪ VỰNG · ${(lesson.words||[]).length} TỪ`));const grid=el('div','word-grid');(lesson.words||[]).forEach(w=>{const word=el('div','word');const col=el('div');add(col,el('b','',w.hanzi),el('span','pinyin',w.pinyin),el('div','meaning',w.meaning));const speak=el('button','speak','🔊 Nghe');speak.type='button';speak.setAttribute('aria-label',`Nghe phát âm ${w.hanzi}`);speak.addEventListener('click',()=>speakChinese(w.hanzi));add(word,col,speak);grid.append(word);});if(!grid.children.length)grid.append(el('p','', 'Bài học chưa có từ vựng.'));host.append(grid);
    if(lesson.dialogs?.length){host.append(el('h4','section-label','HỘI THOẠI ỨNG DỤNG'));lesson.dialogs.forEach(d=>{const box=el('div','dialog');add(box,el('strong','',d.hanzi),el('p','pinyin',d.pinyin),el('p','meaning',d.translation));const speak=el('button','speak','🔊 Nghe câu');speak.type='button';speak.addEventListener('click',()=>speakChinese(d.hanzi));add(box,speak);host.append(box);});}
    const actions=el('div','lesson-actions');const practice=el('a','primary-btn','Ôn từ vựng →');practice.href='/hoc.html';const next=el('button','secondary-btn','Bài tiếp theo →');next.type='button';const list=state.currentTrack?.lessons||[];const index=list.findIndex(l=>l.id===lesson.id);if(index<0||index===list.length-1){next.disabled=true;next.textContent='Đã đến bài cuối';}else next.addEventListener('click',()=>{selectLesson(list[index+1]);detail.scrollIntoView({behavior:'smooth'});});add(actions,practice,next);host.append(actions);
  }
  function speakChinese(text){if(!('speechSynthesis' in window)){window.alert('Trình duyệt chưa hỗ trợ đọc văn bản.');return;}window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(text||''));u.lang='zh-CN';u.rate=.83;window.speechSynthesis.speak(u);}
  document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.filter;document.querySelectorAll('.filter').forEach(x=>{const active=x===b;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active));});renderCatalog();}));
  $('#back-catalog').addEventListener('click',()=>{detail.hidden=true;$('#catalog').scrollIntoView({behavior:'smooth'});});
  (async()=>{try{const res=await fetch('/api/learning/curriculum',{headers:{Accept:'application/json'}});if(!res.ok)throw new Error(`Không thể tải giáo trình (HTTP ${res.status}).`);const data=await res.json();if(!Array.isArray(data.tracks))throw new Error('Dữ liệu giáo trình không đúng định dạng.');state.tracks=data.tracks;$('#notice').textContent='';$('#curriculum-notice').textContent=data.notice||$('#curriculum-notice').textContent;renderCatalog();}catch(err){$('#notice').textContent=err.message||'Không thể tải dữ liệu.';$('#track-count').textContent='Không tải được';}})();
})();
