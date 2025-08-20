// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let deletedData = [];
let selectedItems = [];

// تحميل البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  setupLanguageToggle();
  loadDeletedData();
  loadStats();
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

// تحميل البيانات المحذوفة
async function loadDeletedData() {
  try {
    showLoading(true);
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/recycle-bin`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      deletedData = data.data;
      displayDeletedData(deletedData);
    } else {
      showNoDataMessage();
    }
  } catch (error) {
    console.error('خطأ في تحميل البيانات المحذوفة:', error);
    showNoDataMessage();
  } finally {
    showLoading(false);
  }
}

// تحميل الإحصائيات
async function loadStats() {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/recycle-bin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      document.getElementById('totalDeleted').textContent = data.data.totalDeleted || 0;
      document.getElementById('recentDeleted').textContent = data.data.recentDeleted || 0;
      document.getElementById('restoredCount').textContent = data.data.restoredCount || 0;
    }
  } catch (error) {
    console.error('خطأ في تحميل الإحصائيات:', error);
  }
}

// عرض البيانات المحذوفة
function displayDeletedData(data) {
  const tbody = document.getElementById('deletedDataBody');
  const noDataMessage = document.getElementById('noDataMessage');
  
  if (data.length === 0) {
    showNoDataMessage();
    return;
  }
  
  noDataMessage.style.display = 'none';
  
  tbody.innerHTML = data.map(item => `
    <tr>
      <td><input type="checkbox" value="${item.id}" onchange="toggleItemSelection(this)"></td>
      <td>${getDataTypeLabel(item.dataType)}</td>
      <td>${item.id}</td>
      <td>${item.name || item.summary}</td>
      <td>${formatDate(item.deletedAt)}</td>
      <td>${item.deletedBy}</td>
      <td>
        <button onclick="restoreItem(${item.id})" class="action-btn restore-action" data-ar="استرجاع" data-en="Restore">استرجاع</button>
        <button onclick="deleteItemPermanently(${item.id})" class="action-btn delete-action" data-ar="حذف نهائي" data-en="Delete">حذف نهائي</button>
      </td>
    </tr>
  `).join('');
}

// الحصول على تسمية نوع البيانات
function getDataTypeLabel(dataType) {
  const labels = {
    'complaints': 'الشكاوى',
    'users': 'المستخدمين',
    'reports': 'التقارير',
    'employees': 'الموظفين',
    'departments': 'الأقسام'
  };
  return labels[dataType] || dataType;
}

// تنسيق التاريخ
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('ar-SA');
}

// إظهار رسالة عدم وجود بيانات
function showNoDataMessage() {
  const tbody = document.getElementById('deletedDataBody');
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

// تبديل تحديد العنصر
function toggleItemSelection(checkbox) {
  const itemId = checkbox.value;
  
  if (checkbox.checked) {
    selectedItems.push(itemId);
  } else {
    selectedItems = selectedItems.filter(id => id !== itemId);
  }
  
  updateSelectAllCheckbox();
}

// تحديث checkbox تحديد الكل
function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById('selectAll');
  const checkboxes = document.querySelectorAll('#deletedDataBody input[type="checkbox"]');
  
  const checkedCount = checkboxes.filter(cb => cb.checked).length;
  const totalCount = checkboxes.length;
  
  selectAllCheckbox.checked = checkedCount === totalCount && totalCount > 0;
  selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < totalCount;
}

// تحديد/إلغاء تحديد الكل
function toggleSelectAll() {
  const selectAllCheckbox = document.getElementById('selectAll');
  const checkboxes = document.querySelectorAll('#deletedDataBody input[type="checkbox"]');
  
  checkboxes.forEach(checkbox => {
    checkbox.checked = selectAllCheckbox.checked;
    toggleItemSelection(checkbox);
  });
}

// تطبيق الفلاتر
function applyFilters() {
  const dataType = document.getElementById('dataTypeFilter').value;
  const fromDate = document.getElementById('fromDateFilter').value;
  const toDate = document.getElementById('toDateFilter').value;
  const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
  
  let filteredData = deletedData;
  
  // فلتر نوع البيانات
  if (dataType) {
    filteredData = filteredData.filter(item => item.dataType === dataType);
  }
  
  // فلتر التاريخ
  if (fromDate) {
    filteredData = filteredData.filter(item => new Date(item.deletedAt) >= new Date(fromDate));
  }
  
  if (toDate) {
    filteredData = filteredData.filter(item => new Date(item.deletedAt) <= new Date(toDate));
  }
  
  // فلتر البحث
  if (searchTerm) {
    filteredData = filteredData.filter(item => 
      (item.name && item.name.toLowerCase().includes(searchTerm)) ||
      (item.summary && item.summary.toLowerCase().includes(searchTerm)) ||
      item.id.toString().includes(searchTerm)
    );
  }
  
  displayDeletedData(filteredData);
}

// مسح الفلاتر
function clearFilters() {
  document.getElementById('dataTypeFilter').value = '';
  document.getElementById('fromDateFilter').value = '';
  document.getElementById('toDateFilter').value = '';
  document.getElementById('searchFilter').value = '';
  
  displayDeletedData(deletedData);
}

// استرجاع العناصر المحددة
function restoreSelected() {
  if (selectedItems.length === 0) {
    alert('يرجى تحديد العناصر المراد استرجاعها');
    return;
  }
  
  showRestoreModal();
}

// إظهار modal تأكيد الاسترجاع
function showRestoreModal() {
  const modal = document.getElementById('restoreModal');
  const itemsList = document.getElementById('restoreItemsList');
  
  const selectedData = deletedData.filter(item => selectedItems.includes(item.id.toString()));
  
  itemsList.innerHTML = selectedData.map(item => `
    <div style="padding: 8px; border-bottom: 1px solid #eee;">
      <strong>${item.name || item.summary}</strong> (${getDataTypeLabel(item.dataType)})
    </div>
  `).join('');
  
  modal.style.display = 'block';
}

// إغلاق modal الاسترجاع
function closeRestoreModal() {
  document.getElementById('restoreModal').style.display = 'none';
}

// تأكيد الاسترجاع
async function confirmRestore() {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/recycle-bin/restore`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ itemIds: selectedItems })
    });

    const data = await response.json();
    
    if (data.success) {
      alert('تم استرجاع العناصر بنجاح');
      closeRestoreModal();
      selectedItems = [];
      loadDeletedData();
      loadStats();
    } else {
      alert('حدث خطأ أثناء استرجاع العناصر');
    }
  } catch (error) {
    console.error('خطأ في استرجاع العناصر:', error);
    alert('حدث خطأ أثناء استرجاع العناصر');
  }
}

// حذف نهائي للعناصر المحددة
function deletePermanently() {
  if (selectedItems.length === 0) {
    alert('يرجى تحديد العناصر المراد حذفها نهائياً');
    return;
  }
  
  showDeleteModal();
}

// إظهار modal تأكيد الحذف
function showDeleteModal() {
  const modal = document.getElementById('deleteModal');
  const itemsList = document.getElementById('deleteItemsList');
  
  const selectedData = deletedData.filter(item => selectedItems.includes(item.id.toString()));
  
  itemsList.innerHTML = selectedData.map(item => `
    <div style="padding: 8px; border-bottom: 1px solid #eee;">
      <strong>${item.name || item.summary}</strong> (${getDataTypeLabel(item.dataType)})
    </div>
  `).join('');
  
  modal.style.display = 'block';
}

// إغلاق modal الحذف
function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
}

// تأكيد الحذف النهائي
async function confirmDelete() {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/recycle-bin/delete-permanent`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ itemIds: selectedItems })
    });

    const data = await response.json();
    
    if (data.success) {
      alert('تم حذف العناصر نهائياً');
      closeDeleteModal();
      selectedItems = [];
      loadDeletedData();
      loadStats();
    } else {
      alert('حدث خطأ أثناء حذف العناصر');
    }
  } catch (error) {
    console.error('خطأ في حذف العناصر:', error);
    alert('حدث خطأ أثناء حذف العناصر');
  }
}

// استرجاع عنصر واحد
async function restoreItem(itemId) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/recycle-bin/restore`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ itemIds: [itemId] })
    });

    const data = await response.json();
    
    if (data.success) {
      alert('تم استرجاع العنصر بنجاح');
      loadDeletedData();
      loadStats();
    } else {
      alert('حدث خطأ أثناء استرجاع العنصر');
    }
  } catch (error) {
    console.error('خطأ في استرجاع العنصر:', error);
    alert('حدث خطأ أثناء استرجاع العنصر');
  }
}

// حذف عنصر واحد نهائياً
async function deleteItemPermanently(itemId) {
  if (!confirm('هل أنت متأكد من حذف هذا العنصر نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/recycle-bin/delete-permanent`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ itemIds: [itemId] })
    });

    const data = await response.json();
    
    if (data.success) {
      alert('تم حذف العنصر نهائياً');
      loadDeletedData();
      loadStats();
    } else {
      alert('حدث خطأ أثناء حذف العنصر');
    }
  } catch (error) {
    console.error('خطأ في حذف العنصر:', error);
    alert('حدث خطأ أثناء حذف العنصر');
  }
}
