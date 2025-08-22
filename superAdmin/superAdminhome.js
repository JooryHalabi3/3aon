// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let notifications = [];
let complaintsData = [];
let currentLang = 'ar';

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthentication();
  setupEventListeners();
  await loadInitialData();
  setupLanguageToggle();
  applyLanguage(currentLang);
});

// التحقق من المصادقة والصلاحيات
async function checkAuthentication() {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user) {
      window.location.href = '/login/login.html';
      return;
    }

    // التحقق من صلاحيات السوبر أدمن
    if (user.RoleID !== 1 && user.Username?.toLowerCase() !== 'superadmin') {
      alert('ليس لديك صلاحية للوصول لهذه الصفحة');
      window.location.href = '/login/home.html';
      return;
    }

  } catch (error) {
    console.error('خطأ في التحقق من المصادقة:', error);
    window.location.href = '/login/login.html';
  }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
  // تبديل اللغة
  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(currentLang);
    });
  }

  // مراقبة الإشعارات الجديدة
  setInterval(checkForNewNotifications, 30000); // كل 30 ثانية
}

// تحميل البيانات الأولية
async function loadInitialData() {
  try {
    await Promise.all([
      loadNotifications(),
      loadComplaints(),
      loadKPIs()
    ]);
  } catch (error) {
    console.error('خطأ في تحميل البيانات:', error);
    showError('حدث خطأ في تحميل البيانات');
  }
}

// تحميل الإشعارات
async function loadNotifications() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/notifications/super-admin`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      notifications = data.data;
      updateNotificationCount();
      displayNotifications();
    }
  } catch (error) {
    console.error('خطأ في تحميل الإشعارات:', error);
  }
}

// تحديث عدد الإشعارات
function updateNotificationCount() {
  const notifCount = document.getElementById('notifCount');
  const notificationCount = document.getElementById('notificationCount');
  
  if (notifications.length > 0) {
    if (notifCount) {
      notifCount.style.display = 'block';
      notifCount.textContent = notifications.length;
    }
    if (notificationCount) {
      notificationCount.textContent = notifications.length;
    }
  } else {
    if (notifCount) notifCount.style.display = 'none';
    if (notificationCount) notificationCount.textContent = '0';
  }
}

// عرض الإشعارات
function displayNotifications() {
  const notificationList = document.getElementById('notificationList');
  if (!notificationList) return;

  if (notifications.length === 0) {
    notificationList.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #666;">
        <div style="font-size: 48px; margin-bottom: 1rem;">🔔</div>
        <p>لا توجد إشعارات جديدة</p>
      </div>
    `;
    return;
  }

  notificationList.innerHTML = notifications.map(notification => `
    <div class="notification-item" onclick="handleNotificationClick('${notification.id}', '${notification.type}')">
      <div class="notification-title">${notification.title}</div>
      <div class="notification-message">${notification.message}</div>
      <div class="notification-time">${formatTime(notification.createdAt)}</div>
    </div>
  `).join('');
}

// معالجة النقر على الإشعار
function handleNotificationClick(notificationId, type) {
  // تحديث حالة الإشعار كمقروء
  markNotificationAsRead(notificationId);
  
  // التوجيه حسب نوع الإشعار
  switch (type) {
    case 'complaint':
      // التوجيه لتفاصيل الشكوى
      const complaintId = getComplaintIdFromNotification(notificationId);
      if (complaintId) {
        window.location.href = `/general complaints/track.html?id=${complaintId}`;
      }
      break;
    case 'overdue':
      // التوجيه لصفحة الشكاوى المتأخرة
      window.location.href = '/general complaints/general-complaints.html?filter=overdue';
      break;
    case 'admin_alert':
      // التوجيه لصفحة التنبيهات
      window.location.href = '/superAdmin/logs.html?filter=alerts';
      break;
    default:
      console.log('نوع إشعار غير معروف:', type);
  }
}

// تحديث حالة الإشعار كمقروء
async function markNotificationAsRead(notificationId) {
  try {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // إزالة الإشعار من القائمة
    notifications = notifications.filter(n => n.id !== notificationId);
    updateNotificationCount();
    displayNotifications();
  } catch (error) {
    console.error('خطأ في تحديث حالة الإشعار:', error);
  }
}

// الحصول على معرف الشكوى من الإشعار
function getComplaintIdFromNotification(notificationId) {
  const notification = notifications.find(n => n.id === notificationId);
  return notification?.complaintId || null;
}

// تحميل الشكاوى
async function loadComplaints() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/complaints/recent`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      complaintsData = data.data;
      displayComplaintsTable();
    }
  } catch (error) {
    console.error('خطأ في تحميل الشكاوى:', error);
  }
}

// عرض جدول الشكاوى
function displayComplaintsTable() {
  const tbody = document.getElementById('complaintsTableBody');
  if (!tbody) return;

  if (complaintsData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: #666;">
          لا توجد شكاوى لعرضها
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = complaintsData.map(complaint => `
    <tr>
      <td>#${complaint.ComplaintID}</td>
      <td>${complaint.ComplaintType || 'غير محدد'}</td>
      <td>${complaint.DepartmentName || 'غير محدد'}</td>
      <td>${formatDate(complaint.ComplaintDate)}</td>
      <td>
        <span class="status-badge status-${getStatusClass(complaint.CurrentStatus)}">
          ${complaint.CurrentStatus || 'جديدة'}
        </span>
      </td>
      <td>
        <button class="action-btn view" onclick="viewComplaintDetails('${complaint.ComplaintID}')">
          عرض التفاصيل
        </button>
        <button class="action-btn edit" onclick="editComplaint('${complaint.ComplaintID}')">
          تعديل
        </button>
      </td>
    </tr>
  `).join('');
}

// تحميل KPIs
async function loadKPIs() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/complaints/kpis`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      updateKPIs(data.data);
    }
  } catch (error) {
    console.error('خطأ في تحميل KPIs:', error);
  }
}

// تحديث KPIs
function updateKPIs(kpis) {
  document.getElementById('kpiTotal').textContent = kpis.total || 0;
  document.getElementById('kpiOpen').textContent = kpis.open || 0;
  document.getElementById('kpiResponded').textContent = `${kpis.respondedPercentage || 0}%`;
  document.getElementById('kpiDueSoon').textContent = kpis.dueSoon || 0;
  document.getElementById('kpiLate').textContent = kpis.overdue || 0;
}

// عرض تفاصيل الشكوى
function viewComplaintDetails(complaintId) {
  // حفظ معرف الشكوى في localStorage
  localStorage.setItem('selectedComplaintId', complaintId);
  window.location.href = '/general complaints/track.html';
}

// تعديل الشكوى
function editComplaint(complaintId) {
  // حفظ معرف الشكوى في localStorage
  localStorage.setItem('selectedComplaintId', complaintId);
  window.location.href = '/general complaints/reply.html';
}

// تبديل مركز الإشعارات
function toggleNotificationCenter() {
  const notificationCenter = document.getElementById('notificationCenter');
  if (notificationCenter) {
    const isVisible = notificationCenter.style.display !== 'none';
    notificationCenter.style.display = isVisible ? 'none' : 'block';
  }
}

// إغلاق مركز الإشعارات
function closeNotificationCenter() {
  const notificationCenter = document.getElementById('notificationCenter');
  if (notificationCenter) {
    notificationCenter.style.display = 'none';
  }
}

// فحص الإشعارات الجديدة
async function checkForNewNotifications() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/notifications/check-new`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      // إضافة الإشعارات الجديدة
      notifications.unshift(...data.data);
      updateNotificationCount();
      displayNotifications();
      
      // إظهار تنبيه للمستخدم
      showNewNotificationAlert(data.data.length);
    }
  } catch (error) {
    console.error('خطأ في فحص الإشعارات الجديدة:', error);
  }
}

// إظهار تنبيه للإشعارات الجديدة
function showNewNotificationAlert(count) {
  // إنشاء toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: #27ae60;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    z-index: 1002;
    animation: slideInRight 0.3s ease;
  `;
  toast.innerHTML = `لديك ${count} إشعار${count > 1 ? 'ات' : ''} جديد${count > 1 ? 'ة' : ''}`;
  
  document.body.appendChild(toast);
  
  // إزالة التنبيه بعد 3 ثواني
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// إعداد تبديل اللغة
function setupLanguageToggle() {
  const langToggleBtn = document.getElementById('langToggle');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      currentLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(currentLang);
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

// دوال مساعدة
function formatDate(dateString) {
  if (!dateString) return 'غير محدد';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatTime(dateString) {
  if (!dateString) return 'غير محدد';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'الآن';
  } else if (diffInHours < 24) {
    return `منذ ${diffInHours} ساعة`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `منذ ${diffInDays} يوم`;
  }
}

function getStatusClass(status) {
  if (!status) return 'new';
  
  const statusMap = {
    'جديدة': 'new',
    'قيد المراجعة': 'pending',
    'قيد المعالجة': 'processing',
    'تم الحل': 'resolved',
    'مغلقة': 'closed'
  };
  
  return statusMap[status] || 'new';
}

function showError(message) {
  // إنشاء toast notification للخطأ
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: #e74c3c;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    z-index: 1002;
    animation: slideInRight 0.3s ease;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // إزالة التنبيه بعد 5 ثواني
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 5000);
}

// إضافة CSS للرسوم المتحركة
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
