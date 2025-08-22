// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let userDepartment = null;
let currentLang = 'ar';
let currentEmployeeId = null;

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
    
    // التحقق من أن المستخدم أدمن أو سوبر أدمن
    if (user.RoleID !== 1 && user.RoleID !== 3 && user.RoleName !== 'SUPER_ADMIN' && user.RoleName !== 'ADMIN' && user.RoleName !== 'أدمن' && user.RoleName !== 'سوبر أدمن') {
      document.getElementById('accessDenied').style.display = 'flex';
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
    const departmentTitle = document.getElementById('departmentTitle');
    const departmentDescription = document.getElementById('departmentDescription');
    
    if (departmentTitle) {
      departmentTitle.textContent = `إدارة صلاحيات ${userDepartment.name}`;
    }
    
    if (departmentDescription) {
      departmentDescription.textContent = `عرض وإدارة صلاحيات موظفي ${userDepartment.name}`;
    }
  }
}

// تحميل بيانات القسم
async function loadDepartmentData() {
  try {
    showLoading();
    
    await Promise.all([
      loadEmployeesStats(),
      loadEmployees()
    ]);
    
  } catch (error) {
    console.error('خطأ في تحميل بيانات القسم:', error);
    showError('حدث خطأ في تحميل البيانات');
  } finally {
    hideLoading();
  }
}

// تحميل إحصائيات الموظفين
async function loadEmployeesStats() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/admin/department/employees`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      const employees = data.data || [];
      
      // فلترة الموظفين (استبعاد المدير)
      const filteredEmployees = employees.filter(emp => emp.RoleID !== 3); // استبعاد الأدمن
      
      updateStatsCards(filteredEmployees);
    }
  } catch (error) {
    console.error('خطأ في تحميل إحصائيات الموظفين:', error);
  }
}

// تحديث بطاقات الإحصائيات
function updateStatsCards(employees) {
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.Status === 'active').length;
  const employeesWithPermissions = employees.filter(emp => emp.HasPermissions).length;

  document.getElementById('totalEmployees').textContent = totalEmployees;
  document.getElementById('activeEmployees').textContent = activeEmployees;
  document.getElementById('employeesWithPermissions').textContent = employeesWithPermissions;
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
      const employees = data.data || [];
      
      // فلترة الموظفين (استبعاد المدير)
      const filteredEmployees = employees.filter(emp => emp.RoleID !== 3); // استبعاد الأدمن
      
      displayEmployees(filteredEmployees);
    }
  } catch (error) {
    console.error('خطأ في تحميل الموظفين:', error);
  }
}

// عرض الموظفين
function displayEmployees(employees) {
  const tbody = document.getElementById('employeesTableBody');
  const noEmployees = document.getElementById('noEmployees');
  
  if (!employees || employees.length === 0) {
    tbody.innerHTML = '';
    noEmployees.style.display = 'block';
    return;
  }

  noEmployees.style.display = 'none';
  
  tbody.innerHTML = employees.map(employee => `
    <tr>
      <td>
        <div class="employee-info">
          <div class="employee-avatar">${getInitials(employee.FullName)}</div>
          <div class="employee-details">
            <h4>${escapeHtml(employee.FullName)}</h4>
            <p>${escapeHtml(employee.Username)}</p>
          </div>
        </div>
      </td>
      <td>${escapeHtml(employee.Specialty || 'موظف')}</td>
      <td>${escapeHtml(employee.Email || '-')}</td>
      <td>${escapeHtml(employee.PhoneNumber || '-')}</td>
      <td>
        <span class="status-badge ${employee.Status === 'active' ? 'status-active' : 'status-inactive'}">
          ${employee.Status === 'active' ? 'نشط' : 'غير نشط'}
        </span>
      </td>
      <td>
        <span class="permissions-badge">
          ${employee.HasPermissions ? 'لديه صلاحيات' : 'لا توجد صلاحيات'}
        </span>
      </td>
      <td>
        <button class="action-btn edit-btn" onclick="openPermissionsModal(${employee.EmployeeID}, '${escapeHtml(employee.FullName)}', '${escapeHtml(employee.Specialty || 'موظف')}')">
          تعديل الصلاحيات
        </button>
        <button class="action-btn view-btn" onclick="viewEmployeeDetails(${employee.EmployeeID})">
          عرض التفاصيل
        </button>
      </td>
    </tr>
  `).join('');
}

// فتح نافذة تعديل الصلاحيات
function openPermissionsModal(employeeId, employeeName, employeePosition) {
  currentEmployeeId = employeeId;
  
  // تحديث معلومات الموظف في النافذة
  document.getElementById('modalEmployeeAvatar').textContent = getInitials(employeeName);
  document.getElementById('modalEmployeeName').textContent = employeeName;
  document.getElementById('modalEmployeePosition').textContent = employeePosition;
  
  // تحميل الصلاحيات الحالية للموظف
  loadEmployeePermissions(employeeId);
  
  // عرض النافذة
  document.getElementById('permissionsModal').style.display = 'flex';
}

// تحميل صلاحيات الموظف
async function loadEmployeePermissions(employeeId) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/employee/permissions/${employeeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      const permissions = data.data || [];
      
      // تحديث الـ checkboxes
      updatePermissionCheckboxes(permissions);
    } else {
      // إذا لم توجد صلاحيات، اترك جميع الـ checkboxes غير محددة
      clearPermissionCheckboxes();
    }
  } catch (error) {
    console.error('خطأ في تحميل صلاحيات الموظف:', error);
    clearPermissionCheckboxes();
  }
}

// تحديث الـ checkboxes حسب الصلاحيات
function updatePermissionCheckboxes(permissions) {
  const permissionMap = {
    'viewComplaints': 'عرض الشكاوى',
    'editComplaints': 'تعديل الشكاوى',
    'assignComplaints': 'تعيين الشكاوى',
    'viewReports': 'عرض التقارير',
    'exportReports': 'تصدير التقارير',
    'viewEmployees': 'عرض الموظفين',
    'editEmployees': 'تعديل بيانات الموظفين'
  };

  // إعادة تعيين جميع الـ checkboxes
  clearPermissionCheckboxes();

  // تحديد الـ checkboxes حسب الصلاحيات الموجودة
  permissions.forEach(permission => {
    const checkboxId = Object.keys(permissionMap).find(key => 
      permissionMap[key] === permission.PermissionName
    );
    
    if (checkboxId) {
      const checkbox = document.getElementById(checkboxId);
      if (checkbox) {
        checkbox.checked = true;
      }
    }
  });
}

// مسح جميع الـ checkboxes
function clearPermissionCheckboxes() {
  const checkboxes = document.querySelectorAll('input[name="permissions"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
}

// حفظ الصلاحيات
async function savePermissions() {
  try {
    const token = localStorage.getItem('token');
    
    // جمع الصلاحيات المحددة
    const selectedPermissions = [];
    const checkboxes = document.querySelectorAll('input[name="permissions"]:checked');
    
    checkboxes.forEach(checkbox => {
      selectedPermissions.push(checkbox.id);
    });

    const response = await fetch(`${API_BASE_URL}/admin/employee/permissions/${currentEmployeeId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        permissions: selectedPermissions
      })
    });

    if (response.ok) {
      alert('تم حفظ الصلاحيات بنجاح');
      closePermissionsModal();
      // إعادة تحميل البيانات
      await loadDepartmentData();
    } else {
      const errorData = await response.json();
      alert(`خطأ في حفظ الصلاحيات: ${errorData.message}`);
    }
  } catch (error) {
    console.error('خطأ في حفظ الصلاحيات:', error);
    alert('حدث خطأ في حفظ الصلاحيات');
  }
}

// إغلاق نافذة الصلاحيات
function closePermissionsModal() {
  document.getElementById('permissionsModal').style.display = 'none';
  currentEmployeeId = null;
}

// عرض تفاصيل الموظف
function viewEmployeeDetails(employeeId) {
  // يمكن إضافة نافذة منبثقة لعرض تفاصيل الموظف
  alert('سيتم إضافة هذه الميزة قريباً');
}

// البحث في الموظفين
function searchEmployees() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const rows = document.querySelectorAll('#employeesTableBody tr');
  
  rows.forEach(row => {
    const employeeName = row.querySelector('.employee-details h4').textContent.toLowerCase();
    const employeeUsername = row.querySelector('.employee-details p').textContent.toLowerCase();
    const employeePosition = row.cells[1].textContent.toLowerCase();
    
    if (employeeName.includes(searchTerm) || 
        employeeUsername.includes(searchTerm) || 
        employeePosition.includes(searchTerm)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
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

  // البحث
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', searchEmployees);
  }

  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', searchEmployees);
  }

  // إغلاق النافذة المنبثقة عند النقر خارجها
  const modal = document.getElementById('permissionsModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closePermissionsModal();
      }
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

  // تحديث placeholders
  const inputs = document.querySelectorAll('[data-ar-placeholder][data-en-placeholder]');
  inputs.forEach(input => {
    if (lang === 'en') {
      input.placeholder = input.getAttribute('data-en-placeholder');
    } else {
      input.placeholder = input.getAttribute('data-ar-placeholder');
    }
  });
}

// وظائف مساعدة
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2);
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
