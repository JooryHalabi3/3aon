// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// التحقق من الصلاحيات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  setupLanguageToggle();
  loadNotifications();
  checkUserPermissions();
});

// التحقق من صلاحيات المستخدم وتطبيقها
async function checkUserPermissions() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ لا يوجد token');
      window.location.href = '/login/login.html';
      return;
    }

    console.log('🔍 جاري فحص صلاحيات المستخدم...');

    // جلب بيانات المستخدم من API
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('فشل في جلب بيانات المستخدم');
    }

    const data = await response.json();
    const user = data.data;
    
    console.log('👤 بيانات المستخدم:', {
      RoleID: user.RoleID,
      RoleName: user.RoleName,
      FullName: user.FullName,
      DepartmentID: user.DepartmentID,
      DepartmentName: user.DepartmentName
    });

    // التحقق من أن المستخدم أدمن
            if (user.RoleID !== 1 && user.RoleID !== 3 && user.RoleName !== 'SUPER_ADMIN' && user.RoleName !== 'ADMIN' && user.RoleName !== 'أدمن' && user.RoleName !== 'سوبر أدمن') {
      console.log('❌ المستخدم ليس أدمن - إعادة توجيه');
      window.location.href = '/login/home.html';
      return;
    }

    // تطبيق الصلاحيات حسب الدور
    await applyRolePermissions(user);

  } catch (error) {
    console.error('❌ خطأ في فحص الصلاحيات:', error);
    
    // محاولة أخيرة باستخدام localStorage
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('⚠️ استخدام بيانات localStorage:', userData);
      
              if (userData.RoleID !== 1 && userData.RoleID !== 3 && userData.RoleName !== 'SUPER_ADMIN' && userData.RoleName !== 'ADMIN' && userData.RoleName !== 'أدمن' && userData.RoleName !== 'سوبر أدمن') {
        window.location.href = '/login/home.html';
        return;
      }
      
      await applyRolePermissions(userData);
    } catch (localStorageError) {
      console.error('❌ خطأ في قراءة localStorage:', localStorageError);
      window.location.href = '/login/login.html';
    }
  }
}

// تطبيق صلاحيات الدور
async function applyRolePermissions(user) {
  const roleID = user.RoleID;
  const roleName = user.RoleName;
  const departmentID = user.DepartmentID;
  const departmentName = user.DepartmentName;

  console.log(`🔧 تطبيق صلاحيات الأدمن للقسم: ${departmentName} (ID: ${departmentID})`);

  // إخفاء جميع البطاقات أولاً
  const allCards = document.querySelectorAll('.card');
  allCards.forEach(card => {
    card.style.display = 'none';
  });

  // الأدمن - عرض البطاقات المخصصة للأدمن فقط
  if (roleID === 3 || roleName === 'ADMIN' || roleName === 'أدمن') {
    console.log('✅ أدمن - عرض البطاقات المخصصة للقسم');
    
    // البطاقات المتاحة للأدمن (خاصة بالقسم)
    const adminCards = [
      '.department-logs-card', // سجلات القسم
      '.department-requests-card', // تتبع طلبات القسم
      '.department-management-card', // إدارة القسم
      '.department-summary-card' // ملخص القسم
    ];
    
    adminCards.forEach(selector => {
      const card = document.querySelector(selector);
      if (card) {
        card.style.display = 'block';
        console.log(`✅ تم عرض البطاقة: ${selector}`);
      }
    });

    // تحديث النصوص لتظهر اسم القسم
    updateDepartmentSpecificTexts(departmentName);
    
  } else {
    console.log('❌ المستخدم ليس أدمن - إعادة توجيه');
    window.location.href = '/login/home.html';
    return;
  }

  // التحقق من وجود بطاقات معروضة
  const visibleCards = document.querySelectorAll('.card[style*="block"]');
  console.log(`📊 عدد البطاقات المعروضة: ${visibleCards.length}`);
  
  if (visibleCards.length === 0) {
    console.log('⚠️ لا توجد بطاقات معروضة - عرض رسالة للمستخدم');
    showNoAccessMessage();
  }
}

// تحديث النصوص لتظهر اسم القسم
function updateDepartmentSpecificTexts(departmentName) {
  const departmentNameText = departmentName || 'قسمك';
  
  // تحديث عنوان السجلات
  const logsCard = document.querySelector('.department-logs-card h3');
  if (logsCard) {
    logsCard.textContent = `سجلات ${departmentNameText}`;
  }
  
  // تحديث وصف السجلات
  const logsDesc = document.querySelector('.department-logs-card p');
  if (logsDesc) {
    logsDesc.textContent = `الاطلاع على سجلات العمليات والشكاوى الخاصة بـ ${departmentNameText}`;
  }
  
  // تحديث عنوان تتبع الطلبات
  const requestsCard = document.querySelector('.department-requests-card h3');
  if (requestsCard) {
    requestsCard.textContent = `تتبع طلبات ${departmentNameText}`;
  }
  
  // تحديث وصف تتبع الطلبات
  const requestsDesc = document.querySelector('.department-requests-card p');
  if (requestsDesc) {
    requestsDesc.textContent = `متابعة حالة الطلبات والشكاوى الخاصة بـ ${departmentNameText} مع المدة المتبقية`;
  }
  
  // تحديث عنوان ملخص القسم
  const summaryCard = document.querySelector('.department-summary-card h3');
  if (summaryCard) {
    summaryCard.textContent = `ملخص ${departmentNameText}`;
  }
  
  // تحديث وصف ملخص القسم
  const summaryDesc = document.querySelector('.department-summary-card p');
  if (summaryDesc) {
    summaryDesc.textContent = `عرض إحصائيات وأداء ${departmentNameText}`;
  }
}

// عرض رسالة عدم الوصول
function showNoAccessMessage() {
  const mainSection = document.querySelector('.dashboard');
  if (mainSection) {
    const noAccessDiv = document.createElement('div');
    noAccessDiv.className = 'no-access-message';
    noAccessDiv.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #666;">
        <h3>🚫 لا توجد صلاحيات متاحة</h3>
        <p>ليس لديك صلاحيات للوصول لهذه الصفحة</p>
        <button onclick="window.location.href='/login/home.html'" class="btn">
          العودة للصفحة الرئيسية
        </button>
      </div>
    `;
    mainSection.appendChild(noAccessDiv);
  }
}

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
  const elements = document.querySelectorAll('[data-ar][data-en]');
  elements.forEach(element => {
    if (lang === 'en') {
      element.textContent = element.getAttribute('data-en');
    } else {
      element.textContent = element.getAttribute('data-ar');
    }
  });
}

// تحميل الإشعارات
async function loadNotifications() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      displayNotifications(data.notifications);
    }
  } catch (error) {
    console.error('خطأ في تحميل الإشعارات:', error);
  }
}

// عرض الإشعارات
function displayNotifications(notifications) {
  const notificationList = document.getElementById('notificationList');
  const notificationCount = document.getElementById('notificationCount');
  
  if (!notificationList || !notificationCount) return;

  const unreadCount = notifications.filter(n => !n.IsRead).length;
  notificationCount.textContent = unreadCount;

  if (unreadCount > 0) {
    document.getElementById('notificationCenter').style.display = 'block';
  }

  notificationList.innerHTML = notifications.map(notification => `
    <div class="notification-item ${notification.IsRead ? 'read' : 'unread'}">
      <div class="notification-title">${notification.Title}</div>
      <div class="notification-body">${notification.Body}</div>
      <div class="notification-time">${new Date(notification.CreatedAt).toLocaleString('ar-SA')}</div>
    </div>
  `).join('');
}

// إغلاق مركز الإشعارات
function closeNotificationCenter() {
  document.getElementById('notificationCenter').style.display = 'none';
}

// العودة للصفحة السابقة
function goBack() {
  window.history.back();
}

// تحديث الإشعارات كل 30 ثانية
setInterval(loadNotifications, 30000);