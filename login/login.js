// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api/auth';
const COMPLAINTS_API_URL = 'http://localhost:3001/api/complaints';

// رسائل
function showError(message) { alert(message); }
function showSuccess(message) { alert(message); }

// تحقق
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
function validatePhone(phone) {
  const re = /^[0-9]{10,15}$/;
  return re.test(phone);
}
function validateNationalID(id) {
  const re = /^[0-9]{10,15}$/; // 10 أرقام للهوية أو 15 للإقامة
  return re.test(id);
}

// التبويبات
function showTab(tab) {
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (tab === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
  }
}

// ✅ تسجيل الدخول (بدون خانة هوية/إقامة)
async function login() {
  const username = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    showError("يرجى إدخال اسم المستخدم وكلمة المرور.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();

    if (data.success) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.employee));
      showSuccess("تم تسجيل الدخول بنجاح!");
      setTimeout(() => { window.location.href = "home.html"; }, 1500);
    } else {
      showError(data.message || "خطأ في تسجيل الدخول");
    }
  } catch (err) {
    console.error(err);
    showError("فشل الاتصال بالخادم");
  }
}

// ✅ التسجيل الجديد (مع هوية/إقامة)
async function register() {
  const fullName = document.getElementById("regName").value.trim();
  const phoneNumber = document.getElementById("regPhone").value.trim();
  const nationalID = document.getElementById("regNationalID").value.trim();
  const employeeID = document.getElementById("regID").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPass").value;
  const confirmPassword = document.getElementById("regConfirmPass").value;
  const departmentID = document.getElementById("regDepartment").value;

  if (!fullName || !phoneNumber || !nationalID || !employeeID || !email || !password || !confirmPassword || !departmentID) {
    showError("يرجى تعبئة جميع الحقول.");
    return;
  }
  if (departmentID === "") {
    showError("يرجى اختيار القسم.");
    return;
  }
  if (!validatePhone(phoneNumber)) {
    showError("رقم الجوال غير صالح.");
    return;
  }
  if (!validateNationalID(nationalID)) {
    showError("رقم الهوية/الإقامة يجب أن يكون من 10 إلى 15 رقم.");
    return;
  }
  if (password !== confirmPassword) {
    showError("كلمتا المرور غير متطابقتين.");
    return;
  }
  if (!validateEmail(email)) {
    showError("البريد الإلكتروني غير صالح.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        username: employeeID,
        nationalID,
        phoneNumber,
        password,
        email,
        roleID: 2,
        specialty: '',
        departmentID: departmentID
      })
    });
    const data = await response.json();

    if (data.success) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.employee));
      showSuccess("تم التسجيل بنجاح!");
      setTimeout(() => { window.location.href = "home.html"; }, 1500);
    } else {
      showError(data.message || "خطأ في التسجيل");
    }
  } catch (err) {
    console.error(err);
    showError("فشل الاتصال بالخادم");
  }
}

// تحميل الأقسام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  loadDepartments();
  setupLanguageToggle();
});

// إعداد تبديل اللغة
function setupLanguageToggle() {
  const langToggleBtn = document.getElementById('langToggle');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      const currentLang = document.body.classList.contains('lang-en') ? 'en' : 'ar';
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }
}

// تطبيق اللغة
function applyLanguage(lang) {
  const body = document.body;
  const langText = document.getElementById('langText');
  
  if (lang === 'en') {
    body.classList.remove('lang-ar');
    body.classList.add('lang-en');
    if (langText) langText.textContent = 'العربية | English';
  } else {
    body.classList.remove('lang-en');
    body.classList.add('lang-ar');
    if (langText) langText.textContent = 'العربية | English';
  }
  
  // تحديث النصوص
  updateTexts(lang);
}

// تحديث النصوص حسب اللغة
function updateTexts(lang) {
  // تحديث النصوص الثابتة
  const elements = document.querySelectorAll('[data-ar][data-en]');
  elements.forEach(element => {
    if (lang === 'en') {
      element.textContent = element.getAttribute('data-en');
    } else {
      element.textContent = element.getAttribute('data-ar');
    }
  });
  
  // تحديث placeholders
  const inputs = document.querySelectorAll('[data-ar-placeholder][data-en-placeholder]');
  inputs.forEach(input => {
    if (lang === 'en') {
      input.placeholder = input.getAttribute('data-en-placeholder');
    } else {
      input.placeholder = input.getAttribute('data-ar-placeholder');
    }
  });
  
  // تحديث قائمة الأقسام
  updateDepartmentOptions(lang);
}

// تحديث خيارات الأقسام حسب اللغة
function updateDepartmentOptions(lang) {
  const departmentSelect = document.getElementById('regDepartment');
  if (!departmentSelect) return;
  
  const options = departmentSelect.querySelectorAll('option');
  options.forEach(option => {
    if (option.value === '') {
      // الخيار الافتراضي
      if (lang === 'en') {
        option.textContent = 'Select Department';
      } else {
        option.textContent = 'اختر القسم';
      }
    } else {
      // خيارات الأقسام
      if (lang === 'en') {
        option.textContent = option.getAttribute('data-en') || option.textContent;
      } else {
        option.textContent = option.getAttribute('data-ar') || option.textContent;
      }
    }
  });
}

// جلب الأقسام من قاعدة البيانات
async function loadDepartments() {
  try {
    const departmentSelect = document.getElementById('regDepartment');
    if (!departmentSelect) {
      console.error('عنصر اختيار القسم غير موجود');
      return;
    }
    
    // إظهار رسالة التحميل
    departmentSelect.innerHTML = '<option value="">جاري التحميل...</option>';
    
    const response = await fetch(`${COMPLAINTS_API_URL}/departments`);
    const data = await response.json();
    
    if (data.success && data.data) {
      // مسح الخيارات الموجودة
      departmentSelect.innerHTML = '<option value="">اختر القسم</option>';
      
      // إضافة الأقسام للقائمة المنسدلة
      data.data.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.DepartmentID;
        option.textContent = dept.DepartmentName;
        option.setAttribute('data-ar', dept.DepartmentName);
        option.setAttribute('data-en', dept.Description || dept.DepartmentName);
        departmentSelect.appendChild(option);
      });
      
      console.log(`تم تحميل ${data.data.length} قسم بنجاح`);
    } else {
      departmentSelect.innerHTML = '<option value="">خطأ في تحميل الأقسام</option>';
      console.error('فشل في جلب الأقسام:', data.message);
    }
  } catch (error) {
    console.error('خطأ في جلب الأقسام:', error);
    const departmentSelect = document.getElementById('regDepartment');
    if (departmentSelect) {
      departmentSelect.innerHTML = '<option value="">خطأ في الاتصال</option>';
    }
  }
}
