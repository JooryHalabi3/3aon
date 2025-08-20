// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api/auth';

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

  if (!fullName || !phoneNumber || !nationalID || !employeeID || !email || !password || !confirmPassword) {
    showError("يرجى تعبئة جميع الحقول.");
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
        specialty: ''
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
