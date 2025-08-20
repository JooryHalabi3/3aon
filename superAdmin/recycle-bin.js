// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let deletedItems = [];
let currentFilters = {};
let selectedItem = null;

// التحقق من الصلاحيات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  checkSuperAdminPermissions();
  setupLanguageToggle();
  loadDeletedItems();
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

// تحميل العناصر المحذوفة
async function loadDeletedItems() {
  try {
    showLoading(true);
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/super-admin/recycle-bin`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      deletedItems = data.data;
      displayDeletedItems(deletedItems);
    } else {
      showError('فشل في تحميل البيانات المحذوفة');
    }
  } catch (error) {
    console.error('خطأ في تحميل العناصر المحذوفة:', error);
    showError('خطأ في الاتصال بالخادم');
  } finally {
    showLoading(false);
  }
}

// عرض العناصر المحذوفة
function displayDeletedItems(items) {
  const tbody = document.getElementById('deletedItemsBody');
  const noDataMessage = document.getElementById('noDataMessage');
  
  if (items.length === 0) {
    tbody.innerHTML = '';
    noDataMessage.style.display = 'block';
    return;
  }
  
  noDataMessage.style.display = 'none';
  
  tbody.innerHTML = items.map(item => `
    <tr>
      <td>${getEntityTypeName(item.entityType)}</td>
      <td>${item.entityId}</td>
      <td>${item.name || item.summary || 'غير محدد'}</td>
      <td>${formatDate(item.deletedAt)}</td>
      <td>${item.deletedBy || 'غير محدد'}</td>
      <td>
        <div class="action-buttons">
          <button onclick="restoreItem('${item.entityType}', ${item.entityId})" class="restore-btn" data-ar="استرجاع" data-en="Restore">استرجاع</button>
          <button onclick="deletePermanently('${item.entityType}', ${item.entityId})" class="delete-btn" data-ar="حذف نهائي" data-en="Delete">حذف نهائي</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// الحصول على اسم نوع الكيان
function getEntityTypeName(entityType) {
  const typeNames = {
    'complaints': 'الشكاوى',
    'employees': 'الموظفين',
    'departments': 'الأقسام'
  };
  
  return typeNames[entityType] || entityType;
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
  const entityType = document.getElementById('entityTypeFilter').value;
  const fromDate = document.getElementById('fromDateFilter').value;
  const toDate = document.getElementById('toDateFilter').value;
  const searchTerm = document.getElementById('searchFilter').value;
  
  currentFilters = {
    entityType,
    fromDate,
    toDate,
    searchTerm
  };
  
  const filteredItems = deletedItems.filter(item => {
    // فلتر نوع الكيان
    if (entityType && item.entityType !== entityType) {
      return false;
    }
    
    // فلتر التاريخ
    if (fromDate) {
      const itemDate = new Date(item.deletedAt);
      const filterDate = new Date(fromDate);
      if (itemDate < filterDate) {
        return false;
      }
    }
    
    if (toDate) {
      const itemDate = new Date(item.deletedAt);
      const filterDate = new Date(toDate);
      if (itemDate > filterDate) {
        return false;
      }
    }
    
    // فلتر البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = (item.name || '').toLowerCase().includes(searchLower);
      const summaryMatch = (item.summary || '').toLowerCase().includes(searchLower);
      const idMatch = item.entityId.toString().includes(searchTerm);
      
      if (!nameMatch && !summaryMatch && !idMatch) {
        return false;
      }
    }
    
    return true;
  });
  
  displayDeletedItems(filteredItems);
}

// مسح الفلاتر
function clearFilters() {
  document.getElementById('entityTypeFilter').value = '';
  document.getElementById('fromDateFilter').value = '';
  document.getElementById('toDateFilter').value = '';
  document.getElementById('searchFilter').value = '';
  
  currentFilters = {};
  displayDeletedItems(deletedItems);
}

// استرجاع عنصر
function restoreItem(entityType, entityId) {
  selectedItem = { entityType, entityId };
  
  const modal = document.getElementById('restoreModal');
  const message = document.getElementById('restoreMessage');
  
  const item = deletedItems.find(item => 
    item.entityType === entityType && item.entityId === entityId
  );
  
  if (item) {
    message.textContent = `هل أنت متأكد من استرجاع ${getEntityTypeName(entityType)}: "${item.name || item.summary || entityId}"؟`;
  }
  
  modal.style.display = 'flex';
}

// تأكيد الاسترجاع
async function confirmRestore() {
  if (!selectedItem) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/super-admin/recycle-bin/restore`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(selectedItem)
    });

    const data = await response.json();
    
    if (data.success) {
      showSuccess('تم استرجاع العنصر بنجاح');
      closeRestoreModal();
      loadDeletedItems(); // إعادة تحميل البيانات
    } else {
      showError(data.message || 'فشل في استرجاع العنصر');
    }
  } catch (error) {
    console.error('خطأ في استرجاع العنصر:', error);
    showError('خطأ في الاتصال بالخادم');
  }
}

// إغلاق modal الاسترجاع
function closeRestoreModal() {
  document.getElementById('restoreModal').style.display = 'none';
  selectedItem = null;
}

// حذف نهائي
function deletePermanently(entityType, entityId) {
  selectedItem = { entityType, entityId };
  
  const modal = document.getElementById('deleteModal');
  const message = document.getElementById('deleteMessage');
  
  const item = deletedItems.find(item => 
    item.entityType === entityType && item.entityId === entityId
  );
  
  if (item) {
    message.textContent = `هل أنت متأكد من الحذف النهائي لـ ${getEntityTypeName(entityType)}: "${item.name || item.summary || entityId}"؟ لا يمكن التراجع عن هذا الإجراء.`;
  }
  
  modal.style.display = 'flex';
}

// تأكيد الحذف النهائي
async function confirmDelete() {
  if (!selectedItem) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/super-admin/recycle-bin/delete-permanently`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(selectedItem)
    });

    const data = await response.json();
    
    if (data.success) {
      showSuccess('تم حذف العنصر نهائياً');
      closeDeleteModal();
      loadDeletedItems(); // إعادة تحميل البيانات
    } else {
      showError(data.message || 'فشل في حذف العنصر');
    }
  } catch (error) {
    console.error('خطأ في حذف العنصر:', error);
    showError('خطأ في الاتصال بالخادم');
  }
}

// إغلاق modal الحذف
function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  selectedItem = null;
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

// إغلاق modals عند النقر خارجها
window.onclick = function(event) {
  const restoreModal = document.getElementById('restoreModal');
  const deleteModal = document.getElementById('deleteModal');
  
  if (event.target === restoreModal) {
    closeRestoreModal();
  }
  
  if (event.target === deleteModal) {
    closeDeleteModal();
  }
}
