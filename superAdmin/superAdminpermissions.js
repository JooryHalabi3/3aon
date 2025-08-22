// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let currentUser = null;
let users = [];
let departments = [];
let currentFilters = {};
let selectedRole = null;
let selectedUser = null;

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
    
    // التحقق من أن المستخدم السوبر أدمن
    if (user.RoleName !== 'SUPER_ADMIN') {
      alert('ليس لديك صلاحية للوصول لهذه الصفحة');
      window.location.href = '/login/home.html';
      return;
    }

    currentUser = user;
    displayCurrentUserInfo();
    
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

// عرض معلومات المستخدم الحالي
function displayCurrentUserInfo() {
  const userInfoContainer = document.getElementById('currentUserInfo');
  
  userInfoContainer.innerHTML = `
    <div class="user-detail">
      <span class="detail-label">الاسم:</span>
      <span class="detail-value">${currentUser.FullName}</span>
    </div>
    <div class="user-detail">
      <span class="detail-label">الدور:</span>
      <span class="detail-value">${getRoleName(currentUser.RoleName)}</span>
    </div>
    <div class="user-detail">
      <span class="detail-label">القسم:</span>
      <span class="detail-value">${currentUser.DepartmentName || 'غير محدد'}</span>
    </div>
    <div class="user-detail">
      <span class="detail-label">البريد الإلكتروني:</span>
      <span class="detail-value">${currentUser.Email}</span>
    </div>
  `;
}

// تحميل البيانات
async function loadData() {
  try {
    // تحميل البيانات في نفس الوقت
    await Promise.all([
      loadDepartments(),
      loadUsers()
    ]);
    
    populateFilters();
    displayUsers(users);
    
  } catch (error) {
    console.error('خطأ في تحميل البيانات:', error);
    showError('خطأ في الاتصال بالخادم');
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

// تحميل المستخدمين
async function loadUsers() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/super-admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      users = data.data;
    } else {
      showError('فشل في تحميل بيانات المستخدمين');
    }
  } catch (error) {
    console.error('خطأ في تحميل المستخدمين:', error);
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

// عرض المستخدمين
function displayUsers(usersToShow) {
  const tbody = document.getElementById('usersTableBody');
  
  if (usersToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">لا توجد بيانات للعرض</td></tr>';
    return;
  }
  
  tbody.innerHTML = usersToShow.map(user => `
    <tr>
      <td>${user.FullName}</td>
      <td>${user.Email || 'غير محدد'}</td>
      <td>${user.DepartmentName || 'غير محدد'}</td>
      <td>
        <span class="role-badge ${user.RoleName.toLowerCase()}">${getRoleName(user.RoleName)}</span>
      </td>
      <td>${formatDate(user.JoinDate)}</td>
      <td>
        <div class="action-buttons">
          <button onclick="editUserPermissions(${user.EmployeeID})" class="edit-btn" data-ar="تعديل الصلاحيات" data-en="Edit Permissions">تعديل الصلاحيات</button>
          ${user.RoleName !== 'SUPER_ADMIN' ? `<button onclick="changeUserRole(${user.EmployeeID})" class="change-role-btn" data-ar="تغيير الدور" data-en="Change Role">تغيير الدور</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
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
  const role = document.getElementById('roleFilter').value;
  const departmentId = document.getElementById('departmentFilter').value;
  const searchTerm = document.getElementById('searchFilter').value;
  
  currentFilters = {
    role,
    departmentId,
    searchTerm
  };
  
  const filteredUsers = users.filter(user => {
    // فلتر الدور
    if (role && user.RoleName !== role) {
      return false;
    }
    
    // فلتر القسم
    if (departmentId && user.department_id !== parseInt(departmentId)) {
      return false;
    }
    
    // فلتر البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = (user.FullName || '').toLowerCase().includes(searchLower);
      const emailMatch = (user.Email || '').toLowerCase().includes(searchLower);
      const usernameMatch = (user.Username || '').toLowerCase().includes(searchLower);
      
      if (!nameMatch && !emailMatch && !usernameMatch) {
        return false;
      }
    }
    
    return true;
  });
  
  displayUsers(filteredUsers);
}

// مسح الفلاتر
function clearFilters() {
  document.getElementById('roleFilter').value = '';
  document.getElementById('departmentFilter').value = '';
  document.getElementById('searchFilter').value = '';
  
  currentFilters = {};
  displayUsers(users);
}

// تعديل صلاحيات الدور
function editRolePermissions(roleName) {
  selectedRole = roleName;
  
  const modal = document.getElementById('rolePermissionsModal');
  const title = document.getElementById('roleModalTitle');
  const form = document.getElementById('rolePermissionsForm');
  
  title.textContent = `تعديل صلاحيات ${getRoleName(roleName)}`;
  
  // إنشاء نموذج الصلاحيات حسب الدور
  form.innerHTML = generateRolePermissionsForm(roleName);
  
  modal.style.display = 'flex';
}

// إنشاء نموذج صلاحيات الدور
function generateRolePermissionsForm(roleName) {
  const permissions = getRolePermissions(roleName);
  
  return `
    <div class="permissions-grid">
      ${permissions.map(permission => `
        <div class="permission-item">
          <input type="checkbox" id="${permission.id}" ${permission.enabled ? 'checked' : ''}>
          <label for="${permission.id}">${permission.name}</label>
          <p class="permission-description">${permission.description}</p>
        </div>
      `).join('')}
    </div>
  `;
}

// الحصول على صلاحيات الدور
function getRolePermissions(roleName) {
  const permissions = {
    'SUPER_ADMIN': [
      {
        id: 'full_system_access',
        name: 'الوصول الكامل للنظام',
        description: 'صلاحيات كاملة على جميع أجزاء النظام',
        enabled: true
      },
      {
        id: 'user_management',
        name: 'إدارة المستخدمين',
        description: 'إنشاء وتعديل وحذف المستخدمين',
        enabled: true
      },
      {
        id: 'department_management',
        name: 'إدارة الأقسام',
        description: 'إدارة الأقسام والإعدادات',
        enabled: true
      },
      {
        id: 'assign_complaints',
        name: 'إسناد الشكاوى',
        description: 'إسناد الشكاوى للموظفين',
        enabled: true
      },
      {
        id: 'transfer_complaints',
        name: 'تحويل الشكاوى',
        description: 'تحويل الشكاوى بين الأقسام',
        enabled: true
      },
      {
        id: 'view_all_complaints',
        name: 'عرض جميع الشكاوى',
        description: 'عرض شكاوى جميع الأقسام',
        enabled: true
      },
      {
        id: 'view_reports',
        name: 'عرض التقارير',
        description: 'عرض جميع التقارير والإحصائيات',
        enabled: true
      }
    ],
    'ADMIN': [
      {
        id: 'assign_complaints',
        name: 'إسناد الشكاوى',
        description: 'إسناد الشكاوى لموظفي قسمه',
        enabled: true
      },
      {
        id: 'transfer_complaints',
        name: 'تحويل الشكاوى',
        description: 'تحويل الشكاوى بين الأقسام',
        enabled: true
      },
      {
        id: 'view_department_complaints',
        name: 'عرض شكاوى القسم',
        description: 'عرض شكاوى قسمه فقط',
        enabled: true
      },
      {
        id: 'view_reports',
        name: 'عرض تقارير القسم',
        description: 'عرض تقارير قسمه',
        enabled: true
      },
      {
        id: 'update_complaint_status',
        name: 'تحديث حالة الشكاوى',
        description: 'تحديث حالة الشكاوى',
        enabled: true
      },
      {
        id: 'add_comments',
        name: 'إضافة تعليقات',
        description: 'إضافة تعليقات على الشكاوى',
        enabled: true
      }
    ],
    'EMPLOYEE': [
      {
        id: 'view_assigned_complaints',
        name: 'عرض الشكاوى المسندة',
        description: 'عرض الشكاوى المسندة له',
        enabled: true
      },
      {
        id: 'update_complaint_status',
        name: 'تحديث حالة الشكاوى',
        description: 'تحديث حالة الشكاوى المسندة له',
        enabled: true
      },
      {
        id: 'add_comments',
        name: 'إضافة تعليقات',
        description: 'إضافة تعليقات على الشكاوى',
        enabled: true
      },
      {
        id: 'submit_complaint',
        name: 'تقديم شكوى',
        description: 'تقديم شكوى جديدة',
        enabled: true
      },
      {
        id: 'follow_own_complaint',
        name: 'متابعة شكاويه',
        description: 'متابعة الشكاوى المقدمة منه',
        enabled: true
      },
      {
        id: 'view_public_complaints',
        name: 'عرض الشكاوى العامة',
        description: 'عرض الشكاوى العامة',
        enabled: true
      }
    ]
  };
  
  return permissions[roleName] || [];
}

// حفظ صلاحيات الدور
async function saveRolePermissions() {
  if (!selectedRole) return;
  
  try {
    const permissions = {};
    const checkboxes = document.querySelectorAll('#rolePermissionsForm input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
      permissions[checkbox.id] = checkbox.checked;
    });
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/super-admin/roles/${selectedRole}/permissions`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ permissions })
    });

    const data = await response.json();
    
    if (data.success) {
      showSuccess('تم حفظ صلاحيات الدور بنجاح');
      closeRoleModal();
    } else {
      showError(data.message || 'فشل في حفظ الصلاحيات');
    }
  } catch (error) {
    console.error('خطأ في حفظ صلاحيات الدور:', error);
    showError('خطأ في الاتصال بالخادم');
  }
}

// إغلاق modal صلاحيات الدور
function closeRoleModal() {
  document.getElementById('rolePermissionsModal').style.display = 'none';
  selectedRole = null;
}

// تعديل صلاحيات المستخدم
async function editUserPermissions(userId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/super-admin/users/${userId}/permissions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      selectedUser = data.data;
      showUserPermissionsModal();
    } else {
      showError('فشل في تحميل صلاحيات المستخدم');
    }
  } catch (error) {
    console.error('خطأ في تحميل صلاحيات المستخدم:', error);
    showError('خطأ في الاتصال بالخادم');
  }
}

// عرض modal صلاحيات المستخدم
function showUserPermissionsModal() {
  const modal = document.getElementById('userPermissionsModal');
  const title = document.getElementById('userModalTitle');
  const form = document.getElementById('userPermissionsForm');
  
  title.textContent = `تعديل صلاحيات ${selectedUser.FullName}`;
  
  form.innerHTML = generateUserPermissionsForm();
  
  modal.style.display = 'flex';
}

// إنشاء نموذج صلاحيات المستخدم
function generateUserPermissionsForm() {
  return `
    <div class="user-info-section">
      <p><strong>الدور الحالي:</strong> ${getRoleName(selectedUser.RoleName)}</p>
      <p><strong>القسم:</strong> ${selectedUser.DepartmentName || 'غير محدد'}</p>
    </div>
    
    <div class="permissions-section">
      <h4>الصلاحيات الإضافية</h4>
      <div class="permissions-grid">
        <div class="permission-item">
          <input type="checkbox" id="custom_export" ${selectedUser.customPermissions?.export ? 'checked' : ''}>
          <label for="custom_export">تصدير البيانات</label>
          <p class="permission-description">إمكانية تصدير البيانات والتقارير</p>
        </div>
        <div class="permission-item">
          <input type="checkbox" id="custom_analytics" ${selectedUser.customPermissions?.analytics ? 'checked' : ''}>
          <label for="custom_analytics">التحليلات المتقدمة</label>
          <p class="permission-description">الوصول للتحليلات والتقارير المتقدمة</p>
        </div>
        <div class="permission-item">
          <input type="checkbox" id="custom_notifications" ${selectedUser.customPermissions?.notifications ? 'checked' : ''}>
          <label for="custom_notifications">إدارة الإشعارات</label>
          <p class="permission-description">إدارة إعدادات الإشعارات</p>
        </div>
      </div>
    </div>
  `;
}

// حفظ صلاحيات المستخدم
async function saveUserPermissions() {
  if (!selectedUser) return;
  
  try {
    const customPermissions = {
      export: document.getElementById('custom_export')?.checked || false,
      analytics: document.getElementById('custom_analytics')?.checked || false,
      notifications: document.getElementById('custom_notifications')?.checked || false
    };
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/super-admin/users/${selectedUser.EmployeeID}/permissions`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ customPermissions })
    });

    const data = await response.json();
    
    if (data.success) {
      showSuccess('تم حفظ صلاحيات المستخدم بنجاح');
      closeUserModal();
      loadUsers(); // إعادة تحميل البيانات
    } else {
      showError(data.message || 'فشل في حفظ الصلاحيات');
    }
  } catch (error) {
    console.error('خطأ في حفظ صلاحيات المستخدم:', error);
    showError('خطأ في الاتصال بالخادم');
  }
}

// إغلاق modal صلاحيات المستخدم
function closeUserModal() {
  document.getElementById('userPermissionsModal').style.display = 'none';
  selectedUser = null;
}

// تغيير دور المستخدم
async function changeUserRole(userId) {
  const user = users.find(u => u.EmployeeID === userId);
  if (!user) return;
  
  const newRole = prompt(`تغيير دور ${user.FullName}\n\nالأدوار المتاحة:\n1. ADMIN - مدير قسم\n2. EMPLOYEE - موظف\n\nأدخل الدور الجديد:`, user.RoleName);
  
  if (!newRole || newRole === user.RoleName) return;
  
  if (!['ADMIN', 'EMPLOYEE'].includes(newRole)) {
    showError('دور غير صالح');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/super-admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: newRole })
    });

    const data = await response.json();
    
    if (data.success) {
      showSuccess('تم تغيير دور المستخدم بنجاح');
      loadUsers(); // إعادة تحميل البيانات
    } else {
      showError(data.message || 'فشل في تغيير الدور');
    }
  } catch (error) {
    console.error('خطأ في تغيير دور المستخدم:', error);
    showError('خطأ في الاتصال بالخادم');
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

// إغلاق modals عند النقر خارجها
window.onclick = function(event) {
  const roleModal = document.getElementById('rolePermissionsModal');
  const userModal = document.getElementById('userPermissionsModal');
  
  if (event.target === roleModal) {
    closeRoleModal();
  }
  
  if (event.target === userModal) {
    closeUserModal();
  }
}
  
  