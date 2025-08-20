// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let complaints = [];
let departments = [];
let employees = [];
let currentFilters = {};

// التحقق من الصلاحيات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  checkSuperAdminPermissions();
  setupLanguageToggle();
  loadData();
});

// التحقق من أن المستخدم Super Admin
async function checkSuperAdminPermissions() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login/login.html';
      return;
    }

    const response = await fetch(`${API_BASE_URL}/auth/current-user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!data.success) {
      window.location.href = '/login/login.html';
      return;
    }

    const user = data.data;
    
    // التحقق من أن المستخدم Super Admin
    if (user.RoleName !== 'SUPER_ADMIN') {
      alert('ليس لديك صلاحية للوصول لهذه الصفحة');
      window.location.href = '/login/home.html';
      return;
    }
    
  } catch (error) {
    console.error('خطأ في التحقق من الصلاحيات:', error);
    window.location.href = '/login/login.html';
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

// تحميل البيانات
async function loadData() {
  try {
    showLoading(true);
    
    // تحميل البيانات في نفس الوقت
    await Promise.all([
      loadDepartments(),
      loadEmployees(),
      loadComplaints()
    ]);
    
    populateFilters();
    updateStats();
    displayComplaints(complaints);
    
  } catch (error) {
    console.error('خطأ في تحميل البيانات:', error);
    showError('خطأ في الاتصال بالخادم');
  } finally {
    showLoading(false);
  }
}

// تحميل الأقسام
async function loadDepartments() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/complaints/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      departments = data.data;
    }
  } catch (error) {
    console.error('خطأ في تحميل الأقسام:', error);
  }
}

// تحميل الموظفين
async function loadEmployees() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/super-admin/employees`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      employees = data.data;
    }
  } catch (error) {
    console.error('خطأ في تحميل الموظفين:', error);
  }
}

// تحميل الشكاوى
async function loadComplaints() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/super-admin/complaint-tracking`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      complaints = data.data;
    } else {
      showError('فشل في تحميل الشكاوى');
    }
  } catch (error) {
    console.error('خطأ في تحميل الشكاوى:', error);
    showError('خطأ في الاتصال بالخادم');
  }
}

// ملء الفلاتر
function populateFilters() {
  // ملء فلتر الأقسام
  const departmentFilter = document.getElementById('departmentFilter');
  departmentFilter.innerHTML = '<option value="">جميع الأقسام</option>';
  departments.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept.DepartmentID;
    option.textContent = dept.DepartmentName;
    departmentFilter.appendChild(option);
  });
  
  // ملء فلتر الموظفين
  const assigneeFilter = document.getElementById('assigneeFilter');
  assigneeFilter.innerHTML = '<option value="">جميع الموظفين</option>';
  employees.forEach(emp => {
    const option = document.createElement('option');
    option.value = emp.EmployeeID;
    option.textContent = emp.FullName;
    assigneeFilter.appendChild(option);
  });
}

// تحديث الإحصائيات
function updateStats() {
  document.getElementById('totalComplaints').textContent = complaints.length;
  
  const inProgress = complaints.filter(c => c.Status === 'in_progress').length;
  document.getElementById('inProgressComplaints').textContent = inProgress;
  
  const overdue = complaints.filter(c => c.isOverdue).length;
  document.getElementById('overdueComplaints').textContent = overdue;
  
  const today = new Date().toISOString().split('T')[0];
  const completedToday = complaints.filter(c => 
    c.Status === 'completed' && 
    c.CompletedDate && 
    c.CompletedDate.startsWith(today)
  ).length;
  document.getElementById('completedToday').textContent = completedToday;
}

// عرض الشكاوى
function displayComplaints(complaintsToShow) {
  const complaintsList = document.getElementById('complaintsList');
  const noDataMessage = document.getElementById('noDataMessage');
  
  if (complaintsToShow.length === 0) {
    complaintsList.innerHTML = '';
    noDataMessage.style.display = 'block';
    return;
  }
  
  noDataMessage.style.display = 'none';
  
  complaintsList.innerHTML = complaintsToShow.map(complaint => `
    <div class="complaint-item ${complaint.isOverdue ? 'overdue' : ''} ${complaint.isUrgent ? 'urgent' : ''}">
      <div class="complaint-header">
        <div>
          <div class="complaint-title">${complaint.Subject || 'شكوى بدون عنوان'}</div>
          <div class="complaint-id">رقم الشكوى: ${complaint.ComplaintID}</div>
        </div>
        <span class="complaint-status status-${complaint.Status}">${getStatusName(complaint.Status)}</span>
      </div>
      
      <div class="complaint-info">
        <div class="info-group">
          <span class="info-label">القسم:</span>
          <span class="info-value">${complaint.DepartmentName || 'غير محدد'}</span>
        </div>
        <div class="info-group">
          <span class="info-label">المكلّف:</span>
          <span class="info-value">${complaint.AssigneeName || 'غير محدد'}</span>
        </div>
        <div class="info-group">
          <span class="info-label">تاريخ الإنشاء:</span>
          <span class="info-value">${formatDate(complaint.CreatedAt)}</span>
        </div>
        <div class="info-group">
          <span class="info-label">آخر تحديث:</span>
          <span class="info-value">${formatDate(complaint.UpdatedAt)}</span>
        </div>
      </div>
      
      <div class="complaint-timeline">
        <div class="timeline-title">سجل التتبع</div>
        ${generateTimeline(complaint.timeline)}
      </div>
      
      <div class="complaint-actions">
        <button onclick="viewComplaintDetails(${complaint.ComplaintID})" class="action-btn view-btn" data-ar="عرض التفاصيل" data-en="View Details">عرض التفاصيل</button>
        ${complaint.Status === 'pending' ? `<button onclick="assignComplaint(${complaint.ComplaintID})" class="action-btn assign-btn" data-ar="إسناد الشكوى" data-en="Assign Complaint">إسناد الشكوى</button>` : ''}
      </div>
    </div>
  `).join('');
}

// إنشاء الخط الزمني
function generateTimeline(timeline) {
  if (!timeline || timeline.length === 0) {
    return '<div class="timeline-item"><span>لا يوجد سجل تتبع</span></div>';
  }
  
  return timeline.map(item => `
    <div class="timeline-item">
      <div class="timeline-icon">${getTimelineIcon(item.action)}</div>
      <div class="timeline-content">
        <div class="timeline-action">${getActionName(item.action)}</div>
        <div class="timeline-details">${item.details || ''}</div>
        <div class="timeline-date">${formatDate(item.timestamp)} - ${item.userName || 'غير محدد'}</div>
      </div>
    </div>
  `).join('');
}

// الحصول على أيقونة الخط الزمني
function getTimelineIcon(action) {
  const icons = {
    'created': '📝',
    'assigned': '👤',
    'status_changed': '🔄',
    'commented': '💬',
    'completed': '✅',
    'closed': '🔒'
  };
  
  return icons[action] || '📋';
}

// الحصول على اسم الإجراء
function getActionName(action) {
  const actionNames = {
    'created': 'تم إنشاء الشكوى',
    'assigned': 'تم إسناد الشكوى',
    'status_changed': 'تم تغيير الحالة',
    'commented': 'تم إضافة تعليق',
    'completed': 'تم إكمال الشكوى',
    'closed': 'تم إغلاق الشكوى'
  };
  
  return actionNames[action] || action;
}

// الحصول على اسم الحالة
function getStatusName(status) {
  const statusNames = {
    'pending': 'قيد الانتظار',
    'assigned': 'مسندة',
    'in_progress': 'قيد المعالجة',
    'completed': 'مكتملة',
    'closed': 'مغلقة',
    'overdue': 'متأخرة'
  };
  
  return statusNames[status] || status;
}

// تنسيق التاريخ
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// تطبيق الفلاتر
function applyFilters() {
  const status = document.getElementById('statusFilter').value;
  const departmentId = document.getElementById('departmentFilter').value;
  const assigneeId = document.getElementById('assigneeFilter').value;
  const searchTerm = document.getElementById('searchFilter').value;
  
  currentFilters = {
    status,
    departmentId,
    assigneeId,
    searchTerm
  };
  
  const filteredComplaints = complaints.filter(complaint => {
    // فلتر الحالة
    if (status && complaint.Status !== status) {
      return false;
    }
    
    // فلتر القسم
    if (departmentId && complaint.DepartmentID !== parseInt(departmentId)) {
      return false;
    }
    
    // فلتر المكلّف
    if (assigneeId && complaint.AssigneeID !== parseInt(assigneeId)) {
      return false;
    }
    
    // فلتر البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const subjectMatch = (complaint.Subject || '').toLowerCase().includes(searchLower);
      const descriptionMatch = (complaint.Description || '').toLowerCase().includes(searchLower);
      const idMatch = complaint.ComplaintID.toString().includes(searchTerm);
      
      if (!subjectMatch && !descriptionMatch && !idMatch) {
        return false;
      }
    }
    
    return true;
  });
  
  displayComplaints(filteredComplaints);
}

// مسح الفلاتر
function clearFilters() {
  document.getElementById('statusFilter').value = '';
  document.getElementById('departmentFilter').value = '';
  document.getElementById('assigneeFilter').value = '';
  document.getElementById('searchFilter').value = '';
  
  currentFilters = {};
  displayComplaints(complaints);
}

// عرض تفاصيل الشكوى
async function viewComplaintDetails(complaintId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/super-admin/complaints/${complaintId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      const complaint = data.data;
      showComplaintModal(complaint);
    } else {
      showError('فشل في تحميل تفاصيل الشكوى');
    }
  } catch (error) {
    console.error('خطأ في تحميل تفاصيل الشكوى:', error);
    showError('خطأ في الاتصال بالخادم');
  }
}

// عرض modal تفاصيل الشكوى
function showComplaintModal(complaint) {
  const modal = document.getElementById('complaintModal');
  const detailsContainer = document.getElementById('complaintDetails');
  
  detailsContainer.innerHTML = `
    <div class="detail-row">
      <span class="detail-label">رقم الشكوى:</span>
      <span class="detail-value">${complaint.ComplaintID}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">الموضوع:</span>
      <span class="detail-value">${complaint.Subject || 'غير محدد'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">الوصف:</span>
      <span class="detail-value">${complaint.Description || 'غير محدد'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">القسم:</span>
      <span class="detail-value">${complaint.DepartmentName || 'غير محدد'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">المكلّف:</span>
      <span class="detail-value">${complaint.AssigneeName || 'غير محدد'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">الحالة:</span>
      <span class="detail-value">${getStatusName(complaint.Status)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">تاريخ الإنشاء:</span>
      <span class="detail-value">${formatDate(complaint.CreatedAt)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">آخر تحديث:</span>
      <span class="detail-value">${formatDate(complaint.UpdatedAt)}</span>
    </div>
    ${complaint.CompletedDate ? `
    <div class="detail-row">
      <span class="detail-label">تاريخ الإكمال:</span>
      <span class="detail-value">${formatDate(complaint.CompletedDate)}</span>
    </div>
    ` : ''}
  `;
  
  modal.style.display = 'flex';
}

// إغلاق modal تفاصيل الشكوى
function closeComplaintModal() {
  document.getElementById('complaintModal').style.display = 'none';
}

// إسناد الشكوى
async function assignComplaint(complaintId) {
  // يمكن إضافة منطق إسناد الشكوى هنا
  alert('سيتم إضافة منطق إسناد الشكوى في المرحلة التالية');
}

// إظهار رسالة التحميل
function showLoading(show) {
  const loadingMessage = document.getElementById('loadingMessage');
  const complaintsContainer = document.querySelector('.complaints-container');
  
  if (show) {
    loadingMessage.style.display = 'block';
    complaintsContainer.style.display = 'none';
  } else {
    loadingMessage.style.display = 'none';
    complaintsContainer.style.display = 'block';
  }
}

// إظهار رسالة نجاح
function showSuccess(message) {
  alert(`✅ ${message}`);
}

// إظهار رسالة خطأ
function showError(message) {
  alert(`❌ ${message}`);
}

// إغلاق modal عند النقر خارجها
window.onclick = function(event) {
  const complaintModal = document.getElementById('complaintModal');
  
  if (event.target === complaintModal) {
    closeComplaintModal();
  }
}

// تحديث البيانات كل 30 ثانية
setInterval(() => {
  if (!document.hidden) {
    loadComplaints();
  }
}, 30000);
