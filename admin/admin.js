// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// التحقق من الصلاحيات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  setupLanguageToggle();
  loadNotifications();
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

    const response = await fetch(`${API_BASE_URL}/admin/notifications/unread`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      displayNotifications(data.data);
    }
  } catch (error) {
    console.error('خطأ في تحميل الإشعارات:', error);
  }
}

// عرض الإشعارات
function displayNotifications(notifications) {
  const notificationCenter = document.getElementById('notificationCenter');
  const notificationCount = document.getElementById('notificationCount');
  const notificationList = document.getElementById('notificationList');
  
  if (notifications.length > 0) {
    notificationCenter.style.display = 'block';
    notificationCount.textContent = notifications.length;
    
    notificationList.innerHTML = notifications.map(notification => `
      <div class="notification-item ${notification.type}">
        <div class="notification-content">
          <strong>${notification.title}</strong>
          <p>${notification.message}</p>
          <small>${new Date(notification.createdAt).toLocaleString('ar-SA')}</small>
        </div>
        <button onclick="markAsRead(${notification.id})" class="mark-read-btn">✓</button>
      </div>
    `).join('');
  }
}

// تحديد الإشعار كمقروء
async function markAsRead(notificationId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/admin/notifications/${notificationId}/mark-read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      loadNotifications(); // إعادة تحميل الإشعارات
    }
  } catch (error) {
    console.error('خطأ في تحديد الإشعار كمقروء:', error);
  }
}

// إغلاق مركز الإشعارات
function closeNotificationCenter() {
  const notificationCenter = document.getElementById('notificationCenter');
  notificationCenter.style.display = 'none';
}

// العودة للصفحة السابقة
function goBack() {
  window.history.back();
}

// تحديث الإشعارات كل 30 ثانية
setInterval(loadNotifications, 30000);