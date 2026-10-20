'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(root, 'data');
const dataPath = path.join(dataDir, 'content.json');
require('../scripts/bootstrap.js');
const PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const COOKIE_SECRET = process.env.COOKIE_SECRET;
const production = process.env.NODE_ENV === 'production';
if (!ADMIN_PASSWORD || !COOKIE_SECRET || COOKIE_SECRET.length < 32) {
  console.error('Missing ADMIN_PASSWORD or COOKIE_SECRET (at least 32 characters). See README.md');
  process.exit(1);
}
fs.mkdirSync(dataDir, {recursive:true});
const starter = {
  settings: {phone:'', zalo:'', facebook:'', address:'An Thới, Phú Quốc', email:'', headline:'Tự tin nói tiếng Trung, mở rộng cơ hội ngay tại Phú Quốc', subtitle:'Học giao tiếp thực tế, phát âm chuẩn từ nền tảng và ứng dụng trong công việc, du lịch, cuộc sống.', announcement:'ĐĂNG KÝ TƯ VẤN LỘ TRÌNH MIỄN PHÍ', heroImage:'', classroomImage:'', introTitle:'Học để tự tin giao tiếp và mở rộng cơ hội', introText:'Từ những lời chào đầu tiên đến giao tiếp trong học tập, công việc và cuộc sống tại Phú Quốc.'},
  courses: [
    {id:'giaotiep', tag:'DÀNH CHO NGƯỜI MỚI', icon:'🗣️', title:'Tiếng Trung giao tiếp', desc:'Học từ phát âm, từ vựng thông dụng đến phản xạ giao tiếp hằng ngày.', duration:'Lộ trình theo trình độ', badge:'Phổ biến', features:['Luyện phát âm và thanh điệu','Hội thoại theo tình huống','Thực hành nói qua từng buổi']},
    {id:'hsk', tag:'HỌC CÓ MỤC TIÊU', icon:'📚', title:'Luyện thi HSK', desc:'Củng cố từ vựng, ngữ pháp và các kỹ năng theo cấp độ HSK.', duration:'Theo mục tiêu học viên', badge:'', features:['Hệ thống kiến thức theo cấp độ','Rèn nghe, đọc và viết','Bài luyện tập và đánh giá']},
    {id:'dulich', tag:'ỨNG DỤNG CÔNG VIỆC', icon:'🏝️', title:'Tiếng Trung du lịch – dịch vụ', desc:'Giao tiếp với khách hàng trong nhà hàng, khách sạn, bán hàng và du lịch.', duration:'Lộ trình thực hành', badge:'Thực tế', features:['Mẫu câu phục vụ khách','Xử lý tình huống công việc','Luyện hội thoại chuyên ngành']},
    {id:'thieunhi', tag:'HỌC QUA TƯƠNG TÁC', icon:'🌈', title:'Tiếng Trung thiếu nhi', desc:'Làm quen ngôn ngữ qua hình ảnh, trò chơi, bài hát và tương tác.', duration:'Lộ trình phù hợp độ tuổi', badge:'', features:['Từ vựng trực quan','Hoạt động nghe – nói','Xây dựng hứng thú học tập']}
  ],
  posts: [
    {id:'p1', category:'GÓC HỌC TẬP', date:'BÀI VIẾT MẪU', title:'5 cách luyện thanh điệu tiếng Trung mỗi ngày', excerpt:'Bắt đầu bằng những bài tập ngắn và thói quen nghe – nhắc lại.', emoji:'🎧'},
    {id:'p2', category:'KINH NGHIỆM', date:'BÀI VIẾT MẪU', title:'Nên học giao tiếp trước hay luyện thi HSK?', excerpt:'Lựa chọn lộ trình phù hợp với mục tiêu học tập và công việc.', emoji:'📖'},
    {id:'p3', category:'TIẾNG TRUNG ỨNG DỤNG', date:'BÀI VIẾT MẪU', title:'10 câu tiếng Trung hữu ích trong nhà hàng', excerpt:'Các mẫu câu cơ bản dành cho nhân sự ngành dịch vụ du lịch.', emoji:'🍜'}
  ],
  schedules: [],
  leads: []
};
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify(starter,null,2));
function readDB(){const db=JSON.parse(fs.readFileSync(dataPath, 'utf8')); db.settings={...starter.settings,...db.settings};db.courses=Array.isArray(db.courses)?db.courses:starter.courses;db.posts=Array.isArray(db.posts)?db.posts:starter.posts;db.leads=Array.isArray(db.leads)?db.leads:[];db.schedules=Array.isArray(db.schedules)?db.schedules:[];return db;}
function saveDB(db){const temp = dataPath + '.tmp'; fs.writeFileSync(temp,JSON.stringify(db,null,2)); fs.renameSync(temp,dataPath);}
const key = crypto.createHash('sha256').update(COOKIE_SECRET).digest();
function sign(payload){return crypto.createHmac('sha256',key).update(payload).digest('base64url');}
function cookieToken(){const payload = Buffer.from(JSON.stringify({exp:Date.now()+8*3600_000,nonce:crypto.randomBytes(8).toString('hex')})).toString('base64url'); return payload+'.'+sign(payload);}
function authenticated(req){const cookie = (req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('an_thoi_admin=')); if(!cookie)return false; const token=cookie.slice('an_thoi_admin='.length); const idx=token.lastIndexOf('.'); if(idx<0)return false; const payload=token.slice(0,idx),sig=token.slice(idx+1),expected=sign(payload); if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return false; try{return JSON.parse(Buffer.from(payload,'base64url').toString()).exp>Date.now();}catch{return false;}}
const attempts = new Map();
function send(res,status,obj,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}); res.end(JSON.stringify(obj));}
function text(x,max=300){return String(x??'').trim().slice(0,max);}
async function body(req){let s='';for await(const chunk of req){s+=chunk;if(s.length>200000)throw Error('Payload too large');}return JSON.parse(s||'{}');}
function cleanImage(url){const x=text(url,600);if(!x)return '';if(/^\/uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(x))return x;try{const u=new URL(x);return u.protocol==='https:'?x:'';}catch{return '';}}
function cleanCourse(c){return {id:text(c.id,60)||crypto.randomUUID(),tag:text(c.tag,80),icon:text(c.icon,16),title:text(c.title,100),desc:text(c.desc,500),duration:text(c.duration,120),badge:text(c.badge,60),image:cleanImage(c.image),features:Array.isArray(c.features)?c.features.slice(0,8).map(x=>text(x,150)):[]};}
function cleanPost(p){return{id:text(p.id,60)||crypto.randomUUID(),category:text(p.category,100),date:text(p.date,60),title:text(p.title,160),excerpt:text(p.excerpt,500),emoji:text(p.emoji,16),image:cleanImage(p.image),body:text(p.body,12000)};}
const studentPath=path.join(dataDir,'students.json');
if(!fs.existsSync(studentPath))fs.writeFileSync(studentPath,JSON.stringify({students:[]},null,2));
function studentDB(){const x=JSON.parse(fs.readFileSync(studentPath,'utf8'));return Array.isArray(x.students)?x:{students:[]};}
function studentSave(x){const tmp=studentPath+'.tmp';fs.writeFileSync(tmp,JSON.stringify(x,null,2));fs.renameSync(tmp,studentPath);}
function hashPassword(password,salt){return crypto.scryptSync(password,salt,64).toString('hex');}
function studentCookie(id){const raw=Buffer.from(JSON.stringify({id,exp:Date.now()+7*86400_000})).toString('base64url');return raw+'.'+sign('student:'+raw);}
function currentStudent(req){const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('an_thoi_student='));if(!cookie)return null;const token=cookie.slice(16),i=token.lastIndexOf('.');if(i<0)return null;const raw=token.slice(0,i),sig=token.slice(i+1),correct=sign('student:'+raw);if(sig.length!==correct.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(correct)))return null;try{const p=JSON.parse(Buffer.from(raw,'base64url').toString());if(p.exp<Date.now())return null;return studentDB().students.find(x=>x.id===p.id)||null;}catch{return null;}}
const {buildLessons}=require('../src/modules/vocabulary/lesson-plan');
const vocabularyCatalog=JSON.parse(fs.readFileSync(path.join(dataDir,'vocabulary.json'),'utf8'));
const vocabularyPath=path.join(dataDir,'vocabulary.json');
function readVocabulary(){const d=JSON.parse(fs.readFileSync(vocabularyPath,'utf8'));return {version:d.version||'custom',notice:d.notice||'',categories:Array.isArray(d.categories)?d.categories:[],vocabulary:Array.isArray(d.vocabulary)?d.vocabulary:[]};}
function writeVocabulary(d){const tmp=vocabularyPath+'.tmp';fs.writeFileSync(tmp,JSON.stringify(d,null,2));fs.renameSync(tmp,vocabularyPath);}
function vocabulary(){return readVocabulary().vocabulary;}
function cleanVocabItem(v){return {id:text(v.id,64),category:text(v.category,64),hanzi:text(v.hanzi,80),pinyin:text(v.pinyin,160),meaning:text(v.meaning,300),example:text(v.example,400),translation:text(v.translation,500)};}
function validateVocabulary(items,categories){
 if(!Array.isArray(items)||items.length>10000)return 'Số lượng từ vựng không hợp lệ (tối đa 10.000).';
 const ids=new Set(), allowed=new Set(categories.map(c=>c.id));
 for(const v of items){if(!v.id||!/^[a-zA-Z0-9_-]{1,64}$/.test(v.id)||!v.hanzi||!v.meaning||!allowed.has(v.category))return 'Thiếu mã, từ, nghĩa hoặc chủ đề không tồn tại.';
 if(ids.has(v.id))return 'Trùng mã từ vựng: '+v.id;ids.add(v.id);}
 return '';
}

const methods=[{title:'Shadowing – nghe và nói nhại',tag:'Nghe · Nói',summary:'Nghe câu ngắn, lặp lại ngay sau người bản xứ và tự ghi âm để so sánh.',steps:['Chọn đoạn hội thoại 10–20 giây.','Nghe toàn bộ một lượt để hiểu ngữ cảnh.','Nói nhại theo từng câu, chú ý thanh điệu.','Tự ghi âm và so sánh với mẫu.']},{title:'Lặp lại ngắt quãng (SRS)',tag:'Từ vựng',summary:'Ôn từng từ vào thời điểm phù hợp thay vì đọc đi đọc lại cả danh sách.',steps:['Học tối đa 5–10 từ mới mỗi lượt.','Tự nhớ nghĩa trước khi lật thẻ.','Chọn mức độ nhớ trung thực.','Ôn lại các thẻ đến hạn vào ngày hôm sau.']},{title:'Đặt câu trong tình huống thực tế',tag:'Giao tiếp',summary:'Dùng từ vừa học để nói một câu có liên hệ với công việc và cuộc sống.',steps:['Chọn một từ đang học.','Viết một câu ngắn bằng tiếng Trung.','Đọc to cả câu, kiểm tra thanh điệu.','Thay chủ ngữ hoặc địa điểm để tạo câu mới.']}];
const publicDir = path.join(root,'public');
const uploadDir = path.join(dataDir,'uploads');fs.mkdirSync(uploadDir,{recursive:true});
const uploadMime={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
function cleanSchedule(x){return {id:text(x.id,60)||crypto.randomUUID(),courseId:text(x.courseId,60),title:text(x.title,130),startDate:text(x.startDate,10),time:text(x.time,60),location:text(x.location,160),tuition:text(x.tuition,80),capacity:text(x.capacity,50),status:['Sắp khai giảng','Đang tuyển sinh','Đã đủ chỗ','Đã kết thúc'].includes(x.status)?x.status:'Đang tuyển sinh',note:text(x.note,500)};}
function uploadBody(req){return new Promise((resolve,reject)=>{const chunks=[];let size=0;req.on('data',chunk=>{size+=chunk.length;if(size>5*1024*1024){reject(Error('File vượt quá 5MB'));req.destroy();return;}chunks.push(chunk);});req.on('end',()=>resolve(Buffer.concat(chunks)));req.on('error',reject);});}
function detectImage(buffer){if(buffer.length>16&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff&&buffer[buffer.length-2]===0xff&&buffer[buffer.length-1]===0xd9)return 'jpg';if(buffer.length>45&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&buffer.subarray(12,16).toString()==='IHDR'&&buffer.includes(Buffer.from('IEND')))return 'png';if(buffer.length>20&&buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP'&&['VP8 ','VP8L','VP8X'].includes(buffer.subarray(12,16).toString()))return 'webp';return null;}

const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const {validateCurriculum,publicCurriculum}=require('../src/modules/vocabulary/curriculum');
const curriculumPath=path.join(dataDir,'curriculum.json');
function readCurriculum(){return JSON.parse(fs.readFileSync(curriculumPath,'utf8'));}
function saveCurriculum(obj){const temp=curriculumPath+'.tmp';fs.writeFileSync(temp,JSON.stringify(obj,null,2));fs.renameSync(temp,curriculumPath);}
const server=http.createServer(async (req,res)=>{
  const url=new URL(req.url,'http://localhost'); const pathname=url.pathname;
  try {
    if(pathname==='/api/learning/curriculum'&&req.method==='GET'){const student=currentStudent(req);return send(res,200,publicCurriculum(readCurriculum(),readVocabulary(),student?.progress||{}));}
    if(pathname==='/api/learning/catalog'&&req.method==='GET')return send(res,200,{...readVocabulary(),methods});
    if(pathname==='/api/learning/lessons'&&req.method==='GET'){const student=currentStudent(req);return send(res,200,{lessons:buildLessons(readVocabulary(),student?.progress||{}),authenticated:!!student});}
    if(pathname==='/api/student/register'&&req.method==='POST'){
      const input=await body(req);const name=text(input.name,80),email=text(input.email,120).toLowerCase(),password=String(input.password||'');
      if(name.length<2||!/^\S+@\S+\.\S+$/.test(email)||password.length<10||password.length>128)return send(res,400,{error:'Nhập họ tên, email hợp lệ và mật khẩu từ 10 ký tự.'});
      const db=studentDB();if(db.students.some(x=>x.email===email))return send(res,409,{error:'Email này đã được đăng ký.'});
      const salt=crypto.randomBytes(16).toString('hex'),id=crypto.randomUUID();db.students.push({id,name,email,salt,passwordHash:hashPassword(password,salt),progress:{},createdAt:new Date().toISOString()});studentSave(db);
      return send(res,201,{ok:true},{'Set-Cookie':`an_thoi_student=${studentCookie(id)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${production?'; Secure':''}`});
    }
    if(pathname==='/api/student/login'&&req.method==='POST'){
      const input=await body(req),email=text(input.email,120).toLowerCase(),password=String(input.password||'');const db=studentDB(),student=db.students.find(x=>x.email===email);
      const fakeSalt='00000000000000000000000000000000';const expected=student?student.passwordHash:hashPassword('dummy-not-a-password',fakeSalt);const actual=hashPassword(password,student?student.salt:fakeSalt);
      if(actual.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return send(res,401,{error:'Email hoặc mật khẩu không đúng.'});
      return send(res,200,{ok:true},{'Set-Cookie':`an_thoi_student=${studentCookie(student.id)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${production?'; Secure':''}`});
    }
    if(pathname==='/api/student/logout'&&req.method==='POST')return send(res,200,{ok:true},{'Set-Cookie':'an_thoi_student=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'});
    if(pathname==='/api/student/me'&&req.method==='GET'){const x=currentStudent(req);if(!x)return send(res,401,{error:'Bạn chưa đăng nhập.'});return send(res,200,{id:x.id,name:x.name,email:x.email,progress:x.progress||{}});}
    if(pathname==='/api/student/quiz-results'&&req.method==='GET'){
      const student=currentStudent(req);if(!student)return send(res,401,{error:'Vui lòng đăng nhập.'});
      const history=Array.isArray(student.quizHistory)?student.quizHistory:[];
      const total=history.reduce((n,a)=>n+a.total,0),correct=history.reduce((n,a)=>n+a.correct,0);
      return send(res,200,{history:history.slice(-30).reverse(),summary:{sessions:history.length,total,correct,percent:total?Math.round(100*correct/total):0}});
    }
    if(pathname==='/api/student/quiz-results'&&req.method==='POST'){
      const student=currentStudent(req);if(!student)return send(res,401,{error:'Vui lòng đăng nhập để lưu bài kiểm tra.'});
      const input=await body(req);
      if(!['meaning','pinyin','hanzi'].includes(input.mode)||typeof input.category!=='string'||!readVocabulary().categories.some(c=>c.id===input.category)||!Array.isArray(input.answers)||input.answers.length<1||input.answers.length>100)
        return send(res,400,{error:'Thông tin bài kiểm tra không hợp lệ.'});
      const allowed=new Map(vocabulary().filter(w=>w.category===input.category).map(w=>[w.id,w]));
      const answers=[];
      const seenIds = new Set();
      for(const a of input.answers){
        if(!a||typeof a.id!=='string'||!allowed.has(a.id)||typeof a.choice!=='string'||a.choice.length>300)return send(res,400,{error:'Đáp án không hợp lệ.'});
        if (seenIds.has(a.id)) {
  return send(res, 400, {
    error: 'Bài kiểm tra chứa từ vựng trùng lặp.'
  });
}

seenIds.add(a.id);
	const correct=String(allowed.get(a.id)[input.mode])===a.choice;
        answers.push({id:a.id,correct});
      }
      const record={id:crypto.randomUUID(),category:input.category,mode:input.mode,total:answers.length,correct:answers.filter(a=>a.correct).length,createdAt:new Date().toISOString()};
      const db=studentDB(),person=db.students.find(x=>x.id===student.id);
      person.quizHistory=Array.isArray(person.quizHistory)?person.quizHistory:[];
      // Cập nhật lịch ôn tập theo đáp án đã được chấm trên máy chủ.
      // Với mã từ xuất hiện nhiều lần, chỉ áp dụng lần xuất hiện đầu tiên.
      const uniqueAnswers = new Map();
      for (const answer of answers) {
        if (!uniqueAnswers.has(answer.id)) uniqueAnswers.set(answer.id, answer);
      }
      person.progress = person.progress || {};
      const now = Date.now();
      const day = 86400000;
      for (const answer of uniqueAnswers.values()) {
        const prev = person.progress[answer.id] || {repetitions:0, interval:0};
        const interval = answer.correct
          ? (prev.repetitions === 0 ? 2 : Math.max(3, Math.ceil((prev.interval || 2) * 2)))
          : 1;
        person.progress[answer.id] = {
          repetitions:(prev.repetitions || 0) + 1,
          interval,
          lastRating:answer.correct ? 'good' : 'again',
          lastReviewed:new Date(now).toISOString(),
          dueAt:new Date(now + interval * day).toISOString()
        };
      }
      person.quizHistory.push(record);
      person.quizHistory = person.quizHistory.slice(-100);
      const updatedWords = uniqueAnswers.size;
      studentSave(db);
      return send(res,201,{ok:true,record,updatedWords});
    }
    if(pathname==='/api/student/review'&&req.method==='POST'){
      const student=currentStudent(req);if(!student)return send(res,401,{error:'Vui lòng đăng nhập để lưu tiến độ.'});
      const input=await body(req);if(!vocabulary().some(x=>x.id===input.id)||!['again','hard','good'].includes(input.rating))return send(res,400,{error:'Dữ liệu ôn tập không hợp lệ.'});
      const db=studentDB(),x=db.students.find(x=>x.id===student.id);const prev=x.progress[input.id]||{repetitions:0,interval:0};
      const interval=input.rating==='again'?1:input.rating==='hard'?Math.max(1,Math.ceil((prev.interval||1)*1.5)):prev.repetitions===0?2:Math.max(3,Math.ceil((prev.interval||2)*2));
      x.progress[input.id]={repetitions:prev.repetitions+1,interval,lastRating:input.rating,lastReviewed:new Date().toISOString(),dueAt:new Date(Date.now()+interval*86400000).toISOString()};studentSave(db);
      return send(res,200,{ok:true,progress:x.progress});
    }
    if(pathname==='/api/public'&&req.method==='GET'){const db=readDB();return send(res,200,{settings:db.settings,courses:db.courses,posts:db.posts,schedules:db.schedules});}
    if(pathname==='/api/leads'&&req.method==='POST'){
      const input=await body(req);
      if(input.website)return send(res,200,{ok:true}); // honeypot
      const name=text(input.name,100), phone=text(input.phone,30),course=text(input.course,120),note=text(input.note,500);
      if(name.length<2||!/^\+?[0-9 .()\-]{9,20}$/.test(phone))return send(res,400,{error:'Vui lòng nhập họ tên và số điện thoại hợp lệ.'});
      if(input.consent!==true)return send(res,400,{error:'Vui lòng đồng ý để trung tâm liên hệ tư vấn.'});
      const db=readDB(); db.leads.unshift({id:crypto.randomUUID(),name,phone,course,note,status:'Mới',createdAt:new Date().toISOString()});saveDB(db);return send(res,201,{ok:true});
    }
    if(pathname==='/api/login'&&req.method==='POST'){
      const ip=req.socket.remoteAddress||'unknown';const record=attempts.get(ip)||{count:0,until:0}; if(record.until>Date.now())return send(res,429,{error:'Quá nhiều lần thử. Vui lòng thử lại sau 15 phút.'});
      const input=await body(req);const a=crypto.createHash('sha256').update(String(input.password??'')).digest(), b=crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
      if(!crypto.timingSafeEqual(a,b)){record.count++;if(record.count>=8){record.until=Date.now()+15*60_000;record.count=0;}attempts.set(ip,record);return send(res,401,{error:'Sai mật khẩu quản trị.'});}
      attempts.delete(ip);return send(res,200,{ok:true},{'Set-Cookie':`an_thoi_admin=${cookieToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${production?'; Secure':''}`});
    }
    if(pathname==='/api/logout'&&req.method==='POST')return send(res,200,{ok:true},{'Set-Cookie':'an_thoi_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});
    if(pathname.startsWith('/api/admin')){
      if(!authenticated(req))return send(res,401,{error:'Vui lòng đăng nhập quản trị.'});
      if(pathname==='/api/admin/curriculum'&&req.method==='GET')return send(res,200,readCurriculum());
      if(pathname==='/api/admin/curriculum'&&req.method==='PUT'){const incoming=await body(req);let validated;try{validated=validateCurriculum(incoming,readVocabulary());}catch(e){return send(res,400,{error:e.message});}saveCurriculum(validated);return send(res,200,{ok:true,tracks:validated.tracks.length});}
      if(pathname==='/api/admin/vocabulary'&&req.method==='GET')return send(res,200,readVocabulary());
      if(pathname==='/api/admin/vocabulary'&&req.method==='PUT'){
        const input=await body(req);
        const old=readVocabulary();
        if(!Array.isArray(input.vocabulary))return send(res,400,{error:'Thiếu danh sách từ vựng.'});
        const items=input.vocabulary.map(cleanVocabItem),err=validateVocabulary(items,old.categories);
        if(err)return send(res,400,{error:err});
        writeVocabulary({...old,vocabulary:items});
        return send(res,200,{ok:true,count:items.length});
      }
      if(pathname==='/api/admin/vocabulary/import'&&req.method==='POST'){
        const input=await body(req),old=readVocabulary();
        if(!Array.isArray(input.rows)||input.rows.length>2000)return send(res,400,{error:'Mỗi lần nhập tối đa 2.000 dòng.'});
        const rows=input.rows.map(cleanVocabItem),all=input.replace===true?rows:[...old.vocabulary,...rows];
        const err=validateVocabulary(all,old.categories);if(err)return send(res,400,{error:err});
        writeVocabulary({...old,vocabulary:all});return send(res,200,{ok:true,imported:rows.length,count:all.length});
      }
      if(pathname==='/api/admin/upload' && req.method==='POST'){
        const kind=(req.headers['content-type']||'').split(';')[0].toLowerCase();if(!uploadMime[kind])return send(res,415,{error:'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.'});
        const buffer=await uploadBody(req);if(!buffer.length||buffer.length>5*1024*1024||detectImage(buffer)!==uploadMime[kind])return send(res,400,{error:'Ảnh không hợp lệ, sai định dạng hoặc vượt 5MB.'});
        const filename=crypto.randomBytes(16).toString('hex')+'.'+uploadMime[kind];fs.writeFileSync(path.join(uploadDir,filename),buffer,{flag:'wx'});
        return send(res,201,{ok:true,url:'/uploads/'+filename});
      }
      if(req.method==='GET'){return send(res,200,readDB());}
      if(req.method==='PUT'){
        const input=await body(req);const db=readDB();
        if(pathname==='/api/admin/settings'){
          const allowed=['phone','zalo','facebook','address','email','headline','subtitle','announcement','heroImage','classroomImage','introTitle','introText'];for(const field of allowed)db.settings[field]=field.endsWith('Image')?cleanImage(input[field]):text(input[field],['subtitle','introText'].includes(field)?500:200);
        }else if(pathname==='/api/admin/courses'){
          if(!Array.isArray(input.courses)||input.courses.length>30)return send(res,400,{error:'Dữ liệu khóa học không hợp lệ.'});db.courses=input.courses.map(cleanCourse);
        }else if(pathname==='/api/admin/posts'){
          if(!Array.isArray(input.posts)||input.posts.length>100)return send(res,400,{error:'Dữ liệu bài viết không hợp lệ.'});db.posts=input.posts.map(cleanPost);
        }else if(pathname==='/api/admin/schedules'){
          if(!Array.isArray(input.schedules)||input.schedules.length>150)return send(res,400,{error:'Danh sách lịch khai giảng không hợp lệ.'});
          db.schedules=input.schedules.map(cleanSchedule);
        }else if(pathname==='/api/admin/leads'){
          const item=db.leads.find(x=>x.id===input.id);if(!item)return send(res,404,{error:'Không tìm thấy đăng ký.'});item.status=['Mới','Đang tư vấn','Đã liên hệ','Đã đăng ký','Không phù hợp'].includes(input.status)?input.status:item.status;
        }else return send(res,404,{error:'Không tìm thấy chức năng.'});saveDB(db);return send(res,200,{ok:true});
      }
      return send(res,405,{error:'Phương thức không hỗ trợ.'});
    }
    if(pathname.startsWith('/api/'))return send(res,404,{error:'API không tồn tại.'});
    if(pathname.startsWith('/uploads/')){
      if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'Method not allowed'});
      const name=pathname.slice('/uploads/'.length);if(!/^[a-f0-9]{32}\.(jpg|png|webp)$/.test(name))return send(res,404,{error:'Không tìm thấy ảnh.'});
      const filename=path.join(uploadDir,name);const ext=path.extname(name);const type={'.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'}[ext];
      res.writeHead(200,{'Content-Type':type,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'});
      const stream=fs.createReadStream(filename);stream.on('error',()=>{res.destroy();});if(req.method==='HEAD')res.end();else stream.pipe(res);return;
    }
    if(pathname.startsWith('/khoa-hoc/')){const slug=pathname.slice('/khoa-hoc/'.length);if(!/^[a-z0-9_-]{1,60}$/.test(slug))return send(res,404,{error:'Không tìm thấy khóa học.'});const db=readDB();if(!db.courses.some(c=>c.id===slug))return send(res,404,{error:'Không tìm thấy khóa học.'});req.url='/course.html';}
    if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{error:'Method not allowed'});
    const relative=pathname==='/'?'index.html':pathname==='/admin'?'admin.html':pathname.startsWith('/khoa-hoc/')?'course.html':decodeURIComponent(pathname.slice(1));
    const target=path.resolve(publicDir,relative);
    if(!target.startsWith(publicDir+path.sep))return send(res,403,{error:'Forbidden'});
    fs.stat(target,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; script-src 'self'; connect-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'"});fs.createReadStream(target).pipe(res);});
  }catch(err){console.error(err);return send(res,400,{error:'Yêu cầu không hợp lệ.'});}
});
server.listen(PORT,()=>console.log(`Tiếng Trung An Thới: http://localhost:${PORT}`));
