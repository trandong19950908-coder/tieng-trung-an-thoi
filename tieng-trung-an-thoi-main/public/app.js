'use strict';
const $=s=>document.querySelector(s);
function setBgImage(el,url){try{const u=new URL(url);if(u.protocol!=='https:' && !/^\/uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(url))return;el.style.backgroundImage=`linear-gradient(0deg,rgba(8,55,38,.15),rgba(8,55,38,.15)),url("${u.href.replace(/["'()\\]/g,'')}")`;el.classList.add('has-photo');}catch{}}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
$('#year').textContent=new Date().getFullYear();
$('#menu-toggle').addEventListener('click',()=>{const nav=$('#nav-links'),open=nav.classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String(open));});
document.querySelectorAll('#nav-links a').forEach(a=>a.addEventListener('click',()=>{$('#nav-links').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false');}));
async function init(){try{const r=await fetch('/api/public');if(!r.ok)throw Error();const d=await r.json();const s=d.settings;
 if(s.heroImage) setBgImage($('#hero-photo'),s.heroImage);if(s.classroomImage)setBgImage($('#classroom-display'),s.classroomImage);$('#intro-title').textContent=s.introTitle;$('#intro-text').textContent=s.introText;
 $('#headline').textContent=s.headline;$('#subtitle').textContent=s.subtitle;$('#footer-address').textContent='📍 '+s.address;
 if(s.phone){$('#footer-phone').textContent='☎ '+s.phone;$('#contact-hint').textContent=s.phone;}
 if(s.email)$('#footer-email').textContent='✉ '+s.email;
 if(s.facebook&&/^https:\/\//.test(s.facebook)){$('#facebook-link').href=s.facebook;$('#facebook-link').hidden=false;}
 $('#course-grid').innerHTML=d.courses.map((c,i)=>`<article class="course-card"><div class="course-top"><span class="course-icon">${esc(c.icon)}</span>${c.badge?`<span class="course-badge">${esc(c.badge)}</span>`:''}</div><small class="course-tag">${esc(c.tag)}</small><h3>${esc(c.title)}</h3><p>${esc(c.desc)}</p><ul>${c.features.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><div class="course-foot"><small>${esc(c.duration)}</small><a href="/khoa-hoc/${encodeURIComponent(c.id)}" class="course-pick">Xem chi tiết ↗</a></div></article>`).join('');
 const scheduleGrid=$('#schedule-grid');if(scheduleGrid){scheduleGrid.innerHTML=d.schedules?.length?d.schedules.filter(x=>x.status!=='Đã kết thúc').map(x=>`<article class="course-card"><small class="course-tag">${esc(x.status)}</small><h3>${esc(x.title)}</h3><p>📅 ${esc(x.startDate||'Liên hệ xác nhận lịch')}</p><p>🕒 ${esc(x.time)}</p><p>📍 ${esc(x.location)}</p><p>Học phí: ${esc(x.tuition||'Liên hệ tư vấn')}</p><a class="course-pick" href="#dang-ky">Đăng ký tư vấn ↗</a></article>`).join(''):'<p>Hiện chưa có lịch khai giảng được công bố. Vui lòng đăng ký tư vấn để được cập nhật.</p>';}
 $('#course-select').innerHTML='<option value="Chưa xác định">Tôi cần được tư vấn</option>'+d.courses.map(c=>`<option value="${esc(c.title)}">${esc(c.title)}</option>`).join('');
 const selected=new URLSearchParams(location.search).get('course');if(selected&&[...$('#course-select').options].some(o=>o.value===selected))$('#course-select').value=selected;
 document.querySelectorAll('.course-pick').forEach(a=>a.addEventListener('click',()=>{$('#course-select').value=a.dataset.course;}));
 $('#post-grid').innerHTML=d.posts.map((p,i)=>`<article class="post-card"><div class="post-cover post-cover-${i%3}"><span>${esc(p.emoji||'📘')}</span><small>中文 • AN THỚI</small></div><div class="post-content"><div class="post-meta">${esc(p.category)} <span>·</span> ${esc(p.date)}</div><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p><a href="#dang-ky">Tìm hiểu cùng trung tâm ↗</a></div></article>`).join('');
 }catch(e){$('#course-grid').textContent='Chưa tải được danh sách khóa học. Vui lòng thử lại.';}}
init();
$('#lead-form').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,btn=f.querySelector('button[type=submit]'),out=$('#form-feedback');btn.disabled=true;out.textContent='Đang gửi yêu cầu...';const o=Object.fromEntries(new FormData(f));o.consent=f.elements.consent.checked;
try{const r=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(o)});const d=await r.json();if(!r.ok)throw Error(d.error||'Không gửi được.');out.textContent='✓ Gửi thành công! Trung tâm sẽ liên hệ theo thông tin bạn cung cấp.';out.className='form-feedback success';f.reset();}catch(err){out.textContent=err.message;out.className='form-feedback error';}finally{btn.disabled=false;}});

// V1.1: Optional Chinese pronunciation via native speech synthesis (no external service).
document.querySelectorAll('[data-speak]').forEach(button=>button.addEventListener('click',()=>{
 const status=document.querySelector('#speak-status');
 if(!('speechSynthesis' in window)){status.textContent='Trình duyệt chưa hỗ trợ phát âm.';return;}
 window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(button.dataset.speak);utterance.lang='zh-CN';utterance.rate=.8;
 status.textContent='Đang phát âm: '+button.dataset.speak;utterance.onend=()=>{status.textContent='Nhấn ▶ để nghe phát âm';};
 utterance.onerror=()=>{status.textContent='Không có giọng tiếng Trung trên thiết bị này.';};window.speechSynthesis.speak(utterance);
}));
