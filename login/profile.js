let currentLang = localStorage.getItem('lang') || 'ar';
let editing = false;

// اللغة
function applyLanguage(lang){
  currentLang = lang;
  localStorage.setItem('lang', lang);

  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-ar]').forEach(el=>{
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  const langText = document.getElementById('langText');
  if(langText){
    langText.textContent = lang === 'ar' ? 'English | العربية' : 'العربية | English';
  }

  document.body.classList.remove('lang-ar','lang-en');
  document.body.classList.add(lang==='ar' ? 'lang-ar' : 'lang-en');
}

// جلب البيانات من الـ API
async function loadProfile(){
  try{
    const res = await fetch('/api/profile', {
      headers:{ "Authorization": "Bearer " + localStorage.getItem("token") }
    });
    const data = await res.json();

    document.getElementById('empName').textContent   = data.name      ?? '---';
    document.getElementById('empPhone').textContent  = data.phone     ?? '---';
    document.getElementById('empId').textContent     = data.idNumber  ?? '---';
    document.getElementById('empNumber').textContent = data.empNumber ?? '---';
    document.getElementById('empEmail').textContent  = data.email     ?? '---';
  }catch(err){
    console.error('خطأ في تحميل البيانات', err);
  }
}

// تفعيل التعديل
function enableEdit(){
  if(editing) return;
  editing = true;

  const fields = [
    {id:'empName', type:'text'},
    {id:'empPhone', type:'tel'},
    {id:'empId', type:'text'},
    {id:'empNumber', type:'text'},
    {id:'empEmail', type:'email'}
  ];

  fields.forEach(f=>{
    const el = document.getElementById(f.id);
    const value = el.textContent;
    const input = document.createElement('input');
    input.type = f.type;
    input.value = value;
    input.className = 'info-value';
    input.style.cssText = 'border: 2px solid #1565c0; background: white;';
    el.replaceWith(input);
    input.id = f.id;
  });

  document.getElementById('editBtn').style.display = 'none';

  let saveBtn = document.getElementById('saveBtn');
  if(!saveBtn){
    saveBtn = document.createElement('button');
    saveBtn.id = 'saveBtn';
    saveBtn.className = 'btn btn-primary';
    saveBtn.setAttribute('data-ar','حفظ');
    saveBtn.setAttribute('data-en','Save');
    saveBtn.textContent = currentLang === 'ar' ? 'حفظ' : 'Save';
    document.querySelector('.profile-actions').prepend(saveBtn);
    saveBtn.addEventListener('click', saveEdit);
  }else{
    saveBtn.style.display = 'inline-block';
  }
}

// حفظ التعديلات
async function saveEdit(){
  const updated = {
    name:      document.getElementById('empName').value,
    phone:     document.getElementById('empPhone').value,
    idNumber:  document.getElementById('empId').value,
    empNumber: document.getElementById('empNumber').value,
    email:     document.getElementById('empEmail').value
  };

  try{
    const res = await fetch('/api/profile', {
      method:'PUT',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(updated)
    });

    if(res.ok){
      alert(currentLang==='ar' ? 'تم حفظ البيانات بنجاح' : 'Data saved successfully');

      Object.keys(updated).forEach(key=>{
        const input = document.getElementById('emp'+key.charAt(0).toUpperCase()+key.slice(1));
        const div = document.createElement('div');
        div.id = input.id;
        div.className = 'info-value';
        div.textContent = updated[key];
        input.replaceWith(div);
      });

      document.getElementById('saveBtn').style.display = 'none';
      document.getElementById('editBtn').style.display = 'inline-block';
      editing = false;
    }else{
      alert(currentLang==='ar' ? 'خطأ أثناء حفظ البيانات' : 'Error saving data');
    }
  }catch(err){
    alert(currentLang==='ar' ? 'خطأ في الاتصال بالسيرفر' : 'Server connection error');
  }
}

// تسجيل الخروج
function setupLogout(){
  const logoutModal = document.getElementById('logoutModal');
  
  document.getElementById('logoutBtn').addEventListener('click', ()=> {
    logoutModal.style.display='flex';
  });
  
  document.getElementById('cancelLogout').addEventListener('click', ()=> {
    logoutModal.style.display='none';
  });
  
  document.getElementById('closeModal').addEventListener('click', ()=> {
    logoutModal.style.display='none';
  });
  
  document.getElementById('confirmLogout').addEventListener('click', ()=>{
    localStorage.clear();
    window.location.href = '/login/3oan.html';
  });
  
  // إغلاق المودال عند النقر خارجه
  logoutModal.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
      logoutModal.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  applyLanguage(currentLang);
  loadProfile();

  document.getElementById('langToggle').addEventListener('click', ()=>{
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    applyLanguage(newLang);
  });

  document.getElementById('editBtn').addEventListener('click', enableEdit);

  // زر العودة → صفحة الهوم
  document.getElementById('backBtn').addEventListener('click', ()=>{
    window.location.href = '/login/home.html';
  });

  setupLogout();
});
