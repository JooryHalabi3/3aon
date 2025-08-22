// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let employees = [];
let departments = [];
let currentFilters = {};

// التحقق من الصلاحيات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  checkSuperAdminPermissions();
  setupLanguageToggle();
  loadData();
});

    // التحقق من أن المستخدم السوبر أدمن
async function checkSuperAdminPermissions() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login/login.html';
      return;
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
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
    
    // التحقق من أن المستخدم سوبر أدمن أو أدمن
    if (user.RoleID !== 1 && user.RoleID !== 3) {
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
    
    // تحميل الأقسام والموظفين في نفس الوقت
    await Promise.all([
      loadDepartments(),
      loadEmployees()
    ]);
    
    updateStats();
    displayEmployees(employees);
    
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
    const response = await fetch(`${API_BASE_URL}/admin/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      departments = data.data;
      populateDepartmentFilter();
    }
  } catch (error) {
    console.error('خطأ في تحميل الأقسام:', error);
  }
}

// تحميل الموظفين
async function loadEmployees() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/admin/organizational-directory`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      employees = data.data;
    } else {
      showError('فشل في تحميل بيانات الموظفين');
    }
  } catch (error) {
    console.error('خطأ في تحميل الموظفين:', error);
    showError('خطأ في الاتصال بالخادم');
  }
}

// ملء فلتر الأقسام
function populateDepartmentFilter() {
  const departmentFilter = document.getElementById('departmentFilter');
  
  // إضافة خيار "جميع الأقسام"
  departmentFilter.innerHTML = '<option value="">جميع الأقسام</option>';
  
  // إضافة الأقسام
  departments.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept.DepartmentID;
    option.textContent = dept.DepartmentName;
    departmentFilter.appendChild(option);
  });
}

// تحديث الإحصائيات
function updateStats() {
  document.getElementById('totalEmployees').textContent = employees.length;
  document.getElementById('totalDepartments').textContent = departments.length;
  
  // حساب عدد المديرين (الموظفين بدور ADMIN)
  const managers = employees.filter(emp => emp.RoleName === 'ADMIN');
  document.getElementById('totalManagers').textContent = managers.length;
}

// عرض الموظفين
function displayEmployees(employeesToShow) {
  const tbody = document.getElementById('directoryBody');
  const noDataMessage = document.getElementById('noDataMessage');
  
  if (employeesToShow.length === 0) {
    tbody.innerHTML = '';
    noDataMessage.style.display = 'block';
    return;
  }
  
  noDataMessage.style.display = 'none';
  
  tbody.innerHTML = employeesToShow.map(employee => `
    <tr>
      <td>${employee.FullName}</td>
      <td>${employee.Username}</td>
      <td>${employee.Email || 'غير محدد'}</td>
      <td>${employee.DepartmentName || 'غير محدد'}</td>
      <td>${getDepartmentManager(employee.DepartmentID)}</td>
      <td>${getRoleName(employee.RoleName)}</td>
      <td>${formatDate(employee.JoinDate)}</td>
      <td>
        <div class="action-buttons">
          <button onclick="viewEmployeeDetails(${employee.EmployeeID})" class="view-btn" data-ar="عرض التفاصيل" data-en="View Details">عرض التفاصيل</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// الحصول على مدير القسم
function getDepartmentManager(departmentId) {
  if (!departmentId) return 'غير محدد';
  
  const manager = employees.find(emp => 
    emp.department_id === departmentId && emp.RoleName === 'ADMIN'
  );
  
  return manager ? manager.FullName : 'غير محدد';
}

// الحصول على اسم الدور
function getRoleName(roleName) {
  const roleNames = {
    'SUPER_ADMIN': 'مدير النظام',
    'ADMIN': 'مدير قسم',
    'EMPLOYEE': 'موظف'
  };
  
  return roleNames[roleName] || roleName;
}

// تنسيق التاريخ
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// تطبيق الفلاتر
function applyFilters() {
  const departmentId = document.getElementById('departmentFilter').value;
  const searchTerm = document.getElementById('searchFilter').value;
  
  currentFilters = {
    departmentId,
    searchTerm
  };
  
  const filteredEmployees = employees.filter(employee => {
    // فلتر القسم
    if (departmentId && employee.department_id !== parseInt(departmentId)) {
      return false;
    }
    
    // فلتر البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = (employee.FullName || '').toLowerCase().includes(searchLower);
      const usernameMatch = (employee.Username || '').toLowerCase().includes(searchLower);
      const emailMatch = (employee.Email || '').toLowerCase().includes(searchLower);
      
      if (!nameMatch && !usernameMatch && !emailMatch) {
        return false;
      }
    }
    
    return true;
  });
  
  displayEmployees(filteredEmployees);
}

// مسح الفلاتر
function clearFilters() {
  document.getElementById('departmentFilter').value = '';
  document.getElementById('searchFilter').value = '';
  
  currentFilters = {};
  displayEmployees(employees);
}

// عرض تفاصيل الموظف
async function viewEmployeeDetails(employeeId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/super-admin/employees/${employeeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      const employee = data.data;
      showEmployeeModal(employee);
    } else {
      showError('فشل في تحميل تفاصيل الموظف');
    }
  } catch (error) {
    console.error('خطأ في تحميل تفاصيل الموظف:', error);
    showError('خطأ في الاتصال بالخادم');
  }
}

// عرض modal تفاصيل الموظف
function showEmployeeModal(employee) {
  const modal = document.getElementById('employeeModal');
  const detailsContainer = document.getElementById('employeeDetails');
  
  detailsContainer.innerHTML = `
    <div class="detail-row">
      <span class="detail-label">اسم الموظف:</span>
      <span class="detail-value">${employee.FullName}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">رقم الموظف:</span>
      <span class="detail-value">${employee.Username}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">البريد الإلكتروني:</span>
      <span class="detail-value">${employee.Email || 'غير محدد'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">رقم الجوال:</span>
      <span class="detail-value">${employee.PhoneNumber || 'غير محدد'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">القسم:</span>
      <span class="detail-value">${employee.DepartmentName || 'غير محدد'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">الدور:</span>
      <span class="detail-value">${getRoleName(employee.RoleName)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">تاريخ الانضمام:</span>
      <span class="detail-value">${formatDate(employee.JoinDate)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">التخصص:</span>
      <span class="detail-value">${employee.Specialty || 'غير محدد'}</span>
    </div>
  `;
  
  modal.style.display = 'flex';
}

// إغلاق modal تفاصيل الموظف
function closeEmployeeModal() {
  document.getElementById('employeeModal').style.display = 'none';
}

// إظهار رسالة التحميل
function showLoading(show) {
  const loadingMessage = document.getElementById('loadingMessage');
  const tableContainer = document.querySelector('.table-container');
  
  if (show) {
    loadingMessage.style.display = 'block';
    tableContainer.style.display = 'none';
  } else {
    loadingMessage.style.display = 'none';
    tableContainer.style.display = 'block';
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
  const employeeModal = document.getElementById('employeeModal');
  
  if (event.target === employeeModal) {
    closeEmployeeModal();
  }
}
