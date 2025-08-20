// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let employees = [];
let departments = [];

// تحميل البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  // التحقق من تسجيل الدخول
  const token = localStorage.getItem('token');
  if (!token) {
    alert('يرجى تسجيل الدخول أولاً');
    window.location.href = '/login/home.html';
    return;
  }
  
  setupLanguageToggle();
  loadEmployees();
  loadStats();
  loadDepartments();
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

// تحميل الموظفين
async function loadEmployees() {
  try {
    showLoading(true);
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/employees`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      employees = data.data;
      displayEmployees(employees);
    } else {
      showNoDataMessage();
    }
  } catch (error) {
    console.error('خطأ في تحميل الموظفين:', error);
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      alert('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
      window.location.href = '/login/home.html';
      return;
    }
    showNoDataMessage();
  } finally {
    showLoading(false);
  }
}

// تحميل الإحصائيات
async function loadStats() {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/employees/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      document.getElementById('totalEmployees').textContent = data.data.totalEmployees || 0;
      document.getElementById('activeEmployees').textContent = data.data.activeEmployees || 0;
      document.getElementById('totalDepartments').textContent = data.data.totalDepartments || 0;
      document.getElementById('managers').textContent = (data.data.superAdmins + data.data.employees) || 0;
    }
  } catch (error) {
    console.error('خطأ في تحميل الإحصائيات:', error);
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
      updateDepartmentFilter();
    }
  } catch (error) {
    console.error('خطأ في تحميل الأقسام:', error);
  }
}

// تحديث فلتر الأقسام
function updateDepartmentFilter() {
  const departmentFilter = document.getElementById('departmentFilter');
  departmentFilter.innerHTML = '<option value="" data-ar="جميع الأقسام" data-en="All Departments">جميع الأقسام</option>';
  
  departments.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept.DepartmentID;
    option.textContent = dept.DepartmentName;
    departmentFilter.appendChild(option);
  });
}

// عرض الموظفين
function displayEmployees(employeeData) {
  const tbody = document.getElementById('employeeTableBody');
  const noDataMessage = document.getElementById('noDataMessage');
  
  if (employeeData.length === 0) {
    showNoDataMessage();
    return;
  }
  
  noDataMessage.style.display = 'none';
  
  tbody.innerHTML = employeeData.map(employee => {
    return `
      <tr>
        <td>${employee.EmployeeID}</td>
        <td>${employee.FullName}</td>
        <td>${employee.Email}</td>
        <td>${employee.NationalID || 'غير محدد'}</td>
        <td>${employee.DepartmentName || 'غير محدد'}</td>
        <td>${employee.RoleName || getRoleName(employee.RoleID)}</td>
        <td>${employee.Username || 'غير محدد'}</td>
        <td>${getStatusBadge(employee.Status)}</td>
        <td>${formatDate(employee.HireDate)}</td>
        <td>
          <button onclick="loginAsEmployee(${employee.EmployeeID})" class="action-btn login-action" data-ar="دخول" data-en="Login">دخول</button>
          <button onclick="editEmployee(${employee.EmployeeID})" class="action-btn edit-action" data-ar="تعديل" data-en="Edit">تعديل</button>
          <button onclick="deleteEmployee(${employee.EmployeeID})" class="action-btn delete-action" data-ar="حذف" data-en="Delete">حذف</button>
        </td>
      </tr>
    `;
  }).join('');
}

// الحصول على اسم الدور
function getRoleName(roleID) {
  const roleNames = {
    1: 'سوبر أدمن',
    2: 'موظف',
    3: 'أدمن (رئيس قسم)'
  };
  return roleNames[roleID] || 'غير محدد';
}

// الحصول على شارة الحالة
function getStatusBadge(status) {
  const statusConfig = {
    'active': { name: 'نشط', class: 'status-active' },
    'inactive': { name: 'غير نشط', class: 'status-inactive' }
  };
  
  const config = statusConfig[status] || { name: 'غير محدد', class: 'status-unknown' };
  return `<span class="status-badge ${config.class}">${config.name}</span>`;
}

// تنسيق التاريخ
function formatDate(dateString) {
  if (!dateString) return 'غير محدد';
  return new Date(dateString).toLocaleDateString('ar-SA');
}

// إظهار رسالة عدم وجود بيانات
function showNoDataMessage() {
  const tbody = document.getElementById('employeeTableBody');
  const noDataMessage = document.getElementById('noDataMessage');
  
  tbody.innerHTML = '';
  noDataMessage.style.display = 'block';
}

// إظهار/إخفاء رسالة التحميل
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

// تطبيق الفلاتر
function applyFilters() {
  const department = document.getElementById('departmentFilter').value;
  const role = document.getElementById('roleFilter').value;
  const status = document.getElementById('statusFilter').value;
  const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
  
  let filteredData = employees;
  
  // فلتر القسم
  if (department) {
    const dept = departments.find(d => d.DepartmentID == department);
    if (dept) {
      filteredData = filteredData.filter(emp => emp.DepartmentName === dept.DepartmentName);
    }
  }
  
  // فلتر الدور
  if (role) {
    filteredData = filteredData.filter(emp => emp.RoleID == role);
  }
  
  // فلتر الحالة
  if (status) {
    filteredData = filteredData.filter(emp => emp.Status === status);
  }
  
  // فلتر البحث
  if (searchTerm) {
    filteredData = filteredData.filter(emp => 
      emp.FullName.toLowerCase().includes(searchTerm) ||
      emp.Email.toLowerCase().includes(searchTerm) ||
      emp.NationalID?.toLowerCase().includes(searchTerm) ||
      emp.EmployeeID.toString().includes(searchTerm)
    );
  }
  
  displayEmployees(filteredData);
}

// مسح الفلاتر
function clearFilters() {
  document.getElementById('departmentFilter').value = '';
  document.getElementById('roleFilter').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('searchFilter').value = '';
  
  displayEmployees(employees);
}

// تحديث البيانات
function refreshData() {
  loadEmployees();
  loadStats();
}

// الدخول كموظف
async function loginAsEmployee(employeeId) {
  if (!confirm('هل تريد الدخول كموظف؟ سيتم تسجيل هذا الإجراء في السجل.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/employees/${employeeId}/login-as`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      // حفظ token الموظف
      localStorage.setItem('employeeToken', data.data.token);
      localStorage.setItem('employeeData', JSON.stringify(data.data.employee));
      
      alert(`تم الدخول بنجاح كموظف: ${data.data.employee.FullName}`);
      
      // إعادة توجيه إلى الصفحة المناسبة حسب دور الموظف
      redirectBasedOnRole(data.data.employee.RoleID);
    } else {
      alert('خطأ في الدخول: ' + data.message);
    }
  } catch (error) {
    console.error('خطأ في الدخول كموظف:', error);
    alert('خطأ في الدخول كموظف');
  }
}

// إعادة التوجيه حسب الدور
function redirectBasedOnRole(roleID) {
  switch (roleID) {
    case 1: // Super Admin
      window.location.href = '/superAdmin/superAdmin.html';
      break;
    case 2: // Employee
      window.location.href = '/login/home.html';
      break;
    case 3: // Admin (Department Head)
      window.location.href = '/admin/admin.html';
      break;
    default:
      window.location.href = '/login/home.html';
  }
}

// تعديل موظف
function editEmployee(employeeId) {
  const employee = employees.find(emp => emp.EmployeeID === employeeId);
  if (employee) {
    // يمكن إضافة موديل لتعديل الموظف هنا
    alert(`تعديل الموظف: ${employee.FullName}\nسيتم إضافة هذه الميزة قريباً`);
  }
}

// حذف موظف
async function deleteEmployee(employeeId) {
  const employee = employees.find(emp => emp.EmployeeID === employeeId);
  if (!employee) return;
  
  if (!confirm(`هل تريد حذف الموظف: ${employee.FullName}؟\nسيتم حذفه نهائياً من قاعدة البيانات.`)) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/employees/${employeeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      alert('تم حذف الموظف نهائياً من قاعدة البيانات');
      loadEmployees(); // إعادة تحميل البيانات
      loadStats(); // تحديث الإحصائيات
    } else {
      alert('خطأ في حذف الموظف: ' + data.message);
    }
  } catch (error) {
    console.error('خطأ في حذف الموظف:', error);
    alert('خطأ في حذف الموظف');
  }
}

// إضافة موظف
function addEmployee() {
  // يمكن إضافة موديل لإضافة موظف جديد هنا
  alert('سيتم إضافة ميزة إضافة موظف جديد قريباً');
}

// تصدير البيانات
function exportData() {
  // يمكن إضافة ميزة تصدير البيانات هنا
  alert('سيتم إضافة ميزة تصدير البيانات قريباً');
}

// تحديث تلقائي كل دقيقة
setInterval(() => {
  // تحديث الإحصائيات فقط
  loadStats();
}, 60000); // كل دقيقة
