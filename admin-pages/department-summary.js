// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let userDepartment = null;
let currentLang = 'ar';
let charts = {};

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthentication();
  await loadDepartmentData();
  setupEventListeners();
  applyLanguage(currentLang);
});

// التحقق من المصادقة والصلاحيات
async function checkAuthentication() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login/login.html';
      return;
    }

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
    
    // التحقق من أن المستخدم أدمن
            if (user.RoleID !== 1 && user.RoleID !== 3 && user.RoleName !== 'SUPER_ADMIN' && user.RoleName !== 'ADMIN' && user.RoleName !== 'أدمن' && user.RoleName !== 'سوبر أدمن') {
      alert('ليس لديك صلاحية للوصول لهذه الصفحة');
      window.location.href = '/login/home.html';
      return;
    }

    // حفظ معلومات القسم
    userDepartment = {
      id: user.DepartmentID,
      name: user.DepartmentName
    };

    // تحديث عنوان الصفحة ليشمل اسم القسم
    updatePageTitle();

  } catch (error) {
    console.error('خطأ في التحقق من المصادقة:', error);
    window.location.href = '/login/login.html';
  }
}

// تحديث عنوان الصفحة ليشمل اسم القسم
function updatePageTitle() {
  if (userDepartment && userDepartment.name) {
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    
    if (pageTitle) {
      pageTitle.textContent = `ملخص ${userDepartment.name}`;
    }
    
    if (pageSubtitle) {
      pageSubtitle.textContent = `عرض إحصائيات وأداء ${userDepartment.name}`;
    }
  }
}

// تحميل بيانات القسم
async function loadDepartmentData() {
  try {
    showLoading();
    
    await Promise.all([
      loadDepartmentStats(),
      loadEmployees(),
      loadRecentComplaints(),
      loadChartsData()
    ]);
    
  } catch (error) {
    console.error('خطأ في تحميل بيانات القسم:', error);
    showError('حدث خطأ في تحميل البيانات');
  } finally {
    hideLoading();
  }
}

// تحميل إحصائيات القسم
async function loadDepartmentStats() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/admin/department/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      updateStatsCards(data.data);
    }
  } catch (error) {
    console.error('خطأ في تحميل إحصائيات القسم:', error);
  }
}

// تحديث بطاقات الإحصائيات
function updateStatsCards(stats) {
  const elements = {
    totalEmployees: document.getElementById('totalEmployees'),
    totalComplaints: document.getElementById('totalComplaints'),
    pendingComplaints: document.getElementById('pendingComplaints'),
    resolvedComplaints: document.getElementById('resolvedComplaints'),
    avgResolutionTime: document.getElementById('avgResolutionTime'),
    satisfactionRate: document.getElementById('satisfactionRate')
  };

  if (elements.totalEmployees) {
    elements.totalEmployees.textContent = stats.totalEmployees || 0;
  }
  
  if (elements.totalComplaints) {
    elements.totalComplaints.textContent = stats.totalComplaints || 0;
  }
  
  if (elements.pendingComplaints) {
    elements.pendingComplaints.textContent = stats.pendingComplaints || 0;
  }
  
  if (elements.resolvedComplaints) {
    elements.resolvedComplaints.textContent = stats.resolvedComplaints || 0;
  }
  
  if (elements.avgResolutionTime) {
    elements.avgResolutionTime.textContent = stats.avgResolutionTime || 0;
  }
  
  if (elements.satisfactionRate) {
    elements.satisfactionRate.textContent = `${stats.satisfactionRate || 0}%`;
  }
}

// تحميل الموظفين
async function loadEmployees() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/admin/department/employees`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      displayEmployees(data.data);
    }
  } catch (error) {
    console.error('خطأ في تحميل الموظفين:', error);
  }
}

// عرض الموظفين
function displayEmployees(employees) {
  const employeesGrid = document.getElementById('employeesGrid');
  if (!employeesGrid) return;

  if (!employees || employees.length === 0) {
    employeesGrid.innerHTML = `
      <div class="loading">
        <p>لا يوجد موظفين في هذا القسم</p>
      </div>
    `;
    return;
  }

  employeesGrid.innerHTML = employees.map(employee => `
    <div class="employee-card">
      <div class="employee-avatar">
        ${getInitials(employee.FullName)}
      </div>
      <div class="employee-name">${escapeHtml(employee.FullName)}</div>
      <div class="employee-role">${escapeHtml(employee.Specialty || 'موظف')}</div>
    </div>
  `).join('');
}

// تحميل الشكاوى الأخيرة
async function loadRecentComplaints() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/admin/department/recent-complaints`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      displayRecentComplaints(data.data);
    }
  } catch (error) {
    console.error('خطأ في تحميل الشكاوى الأخيرة:', error);
  }
}

// عرض الشكاوى الأخيرة
function displayRecentComplaints(complaints) {
  const complaintsList = document.getElementById('recentComplaintsList');
  if (!complaintsList) return;

  if (!complaints || complaints.length === 0) {
    complaintsList.innerHTML = `
      <div class="loading">
        <p>لا توجد شكاوى حديثة</p>
      </div>
    `;
    return;
  }

  complaintsList.innerHTML = complaints.map(complaint => `
    <div class="complaint-item">
      <div class="complaint-info">
        <h4>${escapeHtml(complaint.ComplaintDetails)}</h4>
        <p>${formatDateTime(complaint.ComplaintDate)}</p>
      </div>
      <span class="complaint-status status-${getStatusClass(complaint.CurrentStatus)}">
        ${getStatusText(complaint.CurrentStatus)}
      </span>
    </div>
  `).join('');
}

// تحميل بيانات الرسوم البيانية
async function loadChartsData() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/admin/department/charts-data`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      createCharts(data.data);
    }
  } catch (error) {
    console.error('خطأ في تحميل بيانات الرسوم البيانية:', error);
  }
}

// إنشاء الرسوم البيانية
function createCharts(data) {
  // رسم بياني لتوزيع الشكاوى حسب النوع
  const complaintsTypeCtx = document.getElementById('complaintsTypeChart');
  if (complaintsTypeCtx && data.complaintsByType) {
    const labels = data.complaintsByType.map(item => item.complaintType);
    const values = data.complaintsByType.map(item => item.complaintCount);
    
    charts.complaintsType = new Chart(complaintsTypeCtx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  // رسم بياني للشكاوى الشهرية
  const monthlyComplaintsCtx = document.getElementById('monthlyComplaintsChart');
  if (monthlyComplaintsCtx && data.monthlyComplaints) {
    const labels = data.monthlyComplaints.map(item => {
      const [year, month] = item.month.split('-');
      return `${month}/${year}`;
    });
    const values = data.monthlyComplaints.map(item => item.complaintCount);
    
    charts.monthlyComplaints = new Chart(monthlyComplaintsCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'عدد الشكاوى',
          data: values,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }
}
        }
      }
    });
  }

  // رسم بياني للشكاوى الشهرية
  const monthlyComplaintsCtx = document.getElementById('monthlyComplaintsChart');
  if (monthlyComplaintsCtx) {
    charts.monthlyComplaints = new Chart(monthlyComplaintsCtx, {
      type: 'line',
      data: {
        labels: data.monthlyComplaints?.labels || [],
        datasets: [{
          label: 'عدد الشكاوى',
          data: data.monthlyComplaints?.data || [],
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
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

// وظائف مساعدة
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2);
}

function getStatusClass(status) {
  const statusMap = {
    'جديدة': 'pending',
    'قيد المعالجة': 'processing',
    'مغلقة': 'resolved'
  };
  return statusMap[status] || 'pending';
}

function getStatusText(status) {
  const statusMap = {
    'جديدة': 'معلقة',
    'قيد المعالجة': 'قيد المعالجة',
    'مغلقة': 'محلولة'
  };
  return statusMap[status] || status;
}

function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoading() {
  // يمكن إضافة مؤشر تحميل هنا
}

function hideLoading() {
  // يمكن إخفاء مؤشر التحميل هنا
}

function showError(message) {
  console.error(message);
  // يمكن إضافة عرض رسالة خطأ للمستخدم هنا
}

// العودة للصفحة السابقة
function goBack() {
  window.history.back();
}
