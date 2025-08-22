// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let requests = [];
const DEADLINE_DAYS = 3; // المدة المحددة للشكوى (3 أيام)

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
  loadRequests();
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

// تحميل الطلبات
async function loadRequests() {
  try {
    showLoading(true);
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/requests`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      requests = data.data;
      displayRequests(requests);
    } else {
      showNoDataMessage();
    }
  } catch (error) {
    console.error('خطأ في تحميل الطلبات:', error);
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
    
    const response = await fetch(`${API_BASE_URL}/admin/requests/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      document.getElementById('totalRequests').textContent = data.data.totalRequests || 0;
      document.getElementById('pendingRequests').textContent = data.data.pendingRequests || 0;
      document.getElementById('urgentRequests').textContent = data.data.urgentRequests || 0;
      document.getElementById('completedRequests').textContent = data.data.completedRequests || 0;
    }
  } catch (error) {
    console.error('خطأ في تحميل الإحصائيات:', error);
  }
}

// عرض الطلبات
function displayRequests(requestData) {
  const tbody = document.getElementById('requestTableBody');
  const noDataMessage = document.getElementById('noDataMessage');
  
  if (requestData.length === 0) {
    showNoDataMessage();
    return;
  }
  
  noDataMessage.style.display = 'none';
  
  tbody.innerHTML = requestData.map(request => {
    const timeRemaining = calculateTimeRemaining(request.SubmissionDate);
    const timeRemainingClass = getTimeRemainingClass(timeRemaining);
    
    return `
      <tr>
        <td>${request.RequestID}</td>
        <td>${getTypeBadge(request.ComplaintType)}</td>
        <td>${request.Subject}</td>
        <td>${request.RequesterName || 'غير محدد'}</td>
        <td>${formatDate(request.SubmissionDate)}</td>
        <td>${getTimeRemainingBadge(timeRemaining, timeRemainingClass)}</td>
        <td>${getStatusBadge(request.Status)}</td>
        <td>
          <div class="assignee-selector">
            <div class="current-assignee" onclick="toggleAssigneeDropdown(${request.RequestID})">
              <span class="assignee-text">${request.AssignedTo || 'غير محدد'}</span>
              <span class="dropdown-arrow">▼</span>
            </div>
            <div id="assignee-dropdown-${request.RequestID}" class="assignee-dropdown" style="display: none;">
              <div class="dropdown-header">
                <select id="department-select-${request.RequestID}" onchange="loadEmployeesForDepartment(${request.RequestID})" class="department-select">
                  <option value="" data-ar="اختر القسم" data-en="Select Department">اختر القسم</option>
                </select>
              </div>
              <div class="dropdown-content">
                <select id="employee-select-${request.RequestID}" class="employee-select" disabled>
                  <option value="" data-ar="اختر الموظف" data-en="Select Employee">اختر الموظف</option>
                </select>
                <textarea id="assign-notes-${request.RequestID}" class="assign-notes" placeholder="ملاحظات (اختياري)..." rows="2"></textarea>
                <button onclick="assignEmployee(${request.RequestID})" class="assign-btn" data-ar="تعيين" data-en="Assign">تعيين</button>
              </div>
            </div>
          </div>
        </td>
        <td>
          <button onclick="viewWorkflow(${request.RequestID})" class="action-btn view-action" data-ar="خط السير" data-en="Workflow">خط السير</button>
          <button onclick="transferRequest(${request.RequestID})" class="action-btn edit-action" data-ar="تحويل" data-en="Transfer">تحويل</button>
        </td>
      </tr>
    `;
  }).join('');
  
  // تحميل الأقسام لجميع القوائم المنسدلة
  loadAllDepartments();
}

// حساب المدة المتبقية
function calculateTimeRemaining(submissionDate) {
  const submission = new Date(submissionDate);
  const now = new Date();
  const deadline = new Date(submission);
  deadline.setDate(deadline.getDate() + DEADLINE_DAYS);
  
  const timeDiff = deadline - now;
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return daysDiff;
}

// الحصول على فئة المدة المتبقية
function getTimeRemainingClass(daysRemaining) {
  if (daysRemaining <= 0) {
    return 'time-urgent';
  } else if (daysRemaining <= 1) {
    return 'time-warning';
  } else {
    return 'time-normal';
  }
}

// الحصول على شارة المدة المتبقية
function getTimeRemainingBadge(daysRemaining, className) {
  let text = '';
  if (daysRemaining <= 0) {
    text = 'منتهي';
  } else if (daysRemaining === 1) {
    text = 'يوم واحد';
  } else {
    text = `${daysRemaining} أيام`;
  }
  
  return `<span class="time-remaining ${className}">${text}</span>`;
}

// الحصول على شارة النوع
function getTypeBadge(type) {
  const typeConfig = {
    'medical': { name: 'شكوى طبية', class: 'type-medical' },
    'administrative': { name: 'شكوى إدارية', class: 'type-administrative' },
    'technical': { name: 'شكوى تقنية', class: 'type-technical' }
  };
  
  const config = typeConfig[type] || { name: 'غير محدد', class: 'type-administrative' };
  return `<span class="type-badge ${config.class}">${config.name}</span>`;
}

// الحصول على شارة الحالة
function getStatusBadge(status) {
  const statusConfig = {
    'pending': { name: 'معلق', class: 'status-pending' },
    'in_progress': { name: 'قيد المعالجة', class: 'status-in_progress' },
    'completed': { name: 'مكتمل', class: 'status-completed' },
    'rejected': { name: 'مرفوض', class: 'status-rejected' }
  };
  
  const config = statusConfig[status] || { name: 'غير محدد', class: 'status-pending' };
  return `<span class="status-badge ${config.class}">${config.name}</span>`;
}

// تنسيق التاريخ
function formatDate(dateString) {
  if (!dateString) return 'غير محدد';
  return new Date(dateString).toLocaleDateString('ar-SA');
}

// إظهار رسالة عدم وجود بيانات
function showNoDataMessage() {
  const tbody = document.getElementById('requestTableBody');
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
  const status = document.getElementById('statusFilter').value;
  const type = document.getElementById('typeFilter').value;
  const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
  
  let filteredData = requests;
  
  // فلتر الحالة
  if (status) {
    filteredData = filteredData.filter(req => req.Status === status);
  }
  
  // فلتر النوع
  if (type) {
    filteredData = filteredData.filter(req => req.ComplaintType === type);
  }
  
  // فلتر البحث
  if (searchTerm) {
    filteredData = filteredData.filter(req => 
      req.Subject.toLowerCase().includes(searchTerm) ||
      req.RequesterName.toLowerCase().includes(searchTerm) ||
      req.RequestID.toString().includes(searchTerm)
    );
  }
  
  displayRequests(filteredData);
}

// مسح الفلاتر
function clearFilters() {
  document.getElementById('statusFilter').value = '';
  document.getElementById('typeFilter').value = '';
  document.getElementById('searchFilter').value = '';
  
  displayRequests(requests);
}

// تحديث البيانات
function refreshData() {
  loadRequests();
  loadStats();
}

// عرض تفاصيل الطلب
function viewRequest(requestId) {
  const request = requests.find(req => req.RequestID === requestId);
  
  if (request) {
    const timeRemaining = calculateTimeRemaining(request.SubmissionDate);
    const details = `
      رقم الطلب: ${request.RequestID}
      نوع الشكوى: ${getTypeName(request.ComplaintType)}
      الموضوع: ${request.Subject}
      الوصف: ${request.Description || 'غير محدد'}
      مقدم الطلب: ${request.RequesterName}
      تاريخ التقديم: ${formatDate(request.SubmissionDate)}
      المدة المتبقية: ${timeRemaining > 0 ? timeRemaining + ' أيام' : 'منتهي'}
      الحالة: ${getStatusName(request.Status)}
      المسؤول: ${request.AssignedTo || 'غير محدد'}
      آخر تحديث: ${formatDate(request.LastUpdated)}
    `;
    
    alert(details);
  }
}

// الحصول على اسم النوع
function getTypeName(type) {
  const typeNames = {
    'medical': 'شكوى طبية',
    'administrative': 'شكوى إدارية',
    'technical': 'شكوى تقنية'
  };
  return typeNames[type] || 'غير محدد';
}

// الحصول على اسم الحالة
function getStatusName(status) {
  const statusNames = {
    'pending': 'معلق',
    'in_progress': 'قيد المعالجة',
    'completed': 'مكتمل',
    'rejected': 'مرفوض'
  };
  return statusNames[status] || 'غير محدد';
}

// تعديل الطلب
function editRequest(requestId) {
  // يمكن إضافة وظيفة تعديل الطلب هنا
  alert('سيتم إضافة وظيفة تعديل الطلب قريباً');
}

// عرض خط سير الشكوى
function viewWorkflow(requestId) {
  const request = requests.find(req => req.RequestID === requestId);
  
  if (request) {
    // تعبئة معلومات الشكوى
    document.getElementById('workflowComplaintId').textContent = request.RequestID;
    document.getElementById('workflowComplaintSubject').textContent = request.Subject;
    document.getElementById('workflowCurrentStatus').textContent = getStatusName(request.Status);
    
    // تحميل خط سير الشكوى
    loadWorkflowHistory(requestId);
    
    // عرض الموديل
    document.getElementById('workflowModal').style.display = 'block';
  }
}

// تحميل خط سير الشكوى
async function loadWorkflowHistory(requestId) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/requests/${requestId}/workflow`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      displayWorkflowTimeline(data.data);
    } else {
      // إذا لم تكن هناك بيانات، عرض خط سير افتراضي
      displayDefaultWorkflow();
    }
  } catch (error) {
    console.error('خطأ في تحميل خط سير الشكوى:', error);
    displayDefaultWorkflow();
  }
}

// عرض خط سير افتراضي
function displayDefaultWorkflow() {
  const timeline = document.getElementById('workflowTimeline');
  const request = requests.find(req => req.RequestID === parseInt(document.getElementById('workflowComplaintId').textContent));
  
  const workflowSteps = [
    {
      title: 'تقديم الشكوى',
      description: 'تم تقديم الشكوى بنجاح',
      date: request.SubmissionDate,
      user: request.RequesterName,
      status: 'completed'
    },
    {
      title: 'استلام الشكوى',
      description: 'تم استلام الشكوى من قبل الإدارة',
      date: request.SubmissionDate,
      user: 'النظام',
      status: 'completed'
    },
    {
      title: 'قيد المعالجة',
      description: 'الشكوى قيد المعالجة حالياً',
      date: request.LastUpdated || request.SubmissionDate,
      user: request.AssignedTo || 'غير محدد',
      status: request.Status === 'completed' ? 'completed' : 'pending'
    }
  ];
  
  if (request.Status === 'completed') {
    workflowSteps.push({
      title: 'إكمال المعالجة',
      description: 'تم إكمال معالجة الشكوى بنجاح',
      date: request.LastUpdated || request.SubmissionDate,
      user: request.AssignedTo || 'غير محدد',
      status: 'completed'
    });
  }
  
  timeline.innerHTML = workflowSteps.map(step => `
    <div class="timeline-item ${step.status}">
      <div class="timeline-header">
        <span class="timeline-title">${step.title}</span>
        <span class="timeline-date">${formatDate(step.date)}</span>
      </div>
      <div class="timeline-description">${step.description}</div>
      <div class="timeline-user">بواسطة: ${step.user}</div>
    </div>
  `).join('');
}

// عرض خط سير الشكوى من قاعدة البيانات
function displayWorkflowTimeline(workflowData) {
  const timeline = document.getElementById('workflowTimeline');
  
  timeline.innerHTML = workflowData.map(step => `
    <div class="timeline-item ${step.status}">
      <div class="timeline-header">
        <span class="timeline-title">${step.action}</span>
        <span class="timeline-date">${formatDate(step.createdAt)}</span>
      </div>
      <div class="timeline-description">${step.description}</div>
      <div class="timeline-user">بواسطة: ${step.userName}</div>
    </div>
  `).join('');
}

// تحويل الشكوى
function transferRequest(requestId) {
  const request = requests.find(req => req.RequestID === requestId);
  
  if (request) {
    // تعبئة معلومات الشكوى
    document.getElementById('transferComplaintId').textContent = request.RequestID;
    document.getElementById('transferComplaintSubject').textContent = request.Subject;
    document.getElementById('transferComplaintType').textContent = getTypeName(request.ComplaintType);
    
    // تحميل الأقسام
    loadDepartments();
    
    // عرض الموديل
    document.getElementById('transferModal').style.display = 'block';
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
      const departmentSelect = document.getElementById('transferDepartment');
      departmentSelect.innerHTML = '<option value="" data-ar="اختر القسم" data-en="Select Department">اختر القسم</option>';
      
      data.data.forEach(dept => {
        departmentSelect.innerHTML += `
          <option value="${dept.DepartmentID}" data-ar="${dept.DepartmentName}" data-en="${dept.DepartmentName}">${dept.DepartmentName}</option>
        `;
      });
    }
  } catch (error) {
    console.error('خطأ في تحميل الأقسام:', error);
  }
}

// تحميل موظفي القسم
async function loadDepartmentEmployees() {
  const departmentId = document.getElementById('transferDepartment').value;
  const employeeSelect = document.getElementById('transferEmployee');
  
  if (!departmentId) {
    employeeSelect.innerHTML = '<option value="" data-ar="اختر الموظف" data-en="Select Employee">اختر الموظف</option>';
    employeeSelect.disabled = true;
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/departments/${departmentId}/employees`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      employeeSelect.innerHTML = '<option value="" data-ar="اختر الموظف" data-en="Select Employee">اختر الموظف</option>';
      
      data.data.forEach(emp => {
        employeeSelect.innerHTML += `
          <option value="${emp.EmployeeID}" data-ar="${emp.FullName}" data-en="${emp.FullName}">${emp.FullName}</option>
        `;
      });
      
      employeeSelect.disabled = false;
    }
  } catch (error) {
    console.error('خطأ في تحميل الموظفين:', error);
  }
}

// تأكيد التحويل
async function confirmTransfer() {
  const departmentId = document.getElementById('transferDepartment').value;
  const employeeId = document.getElementById('transferEmployee').value;
  const notes = document.getElementById('transferNotes').value;
  const requestId = document.getElementById('transferComplaintId').textContent;
  
  if (!departmentId || !employeeId) {
    alert('يرجى اختيار القسم والموظف');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/requests/${requestId}/transfer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        departmentId: departmentId,
        employeeId: employeeId,
        notes: notes
      })
    });

    const data = await response.json();
    
    if (data.success) {
      alert('تم تحويل الشكوى بنجاح');
      closeTransferModal();
      loadRequests(); // إعادة تحميل البيانات
    } else {
      alert('خطأ في تحويل الشكوى: ' + data.message);
    }
  } catch (error) {
    console.error('خطأ في تحويل الشكوى:', error);
    alert('خطأ في تحويل الشكوى');
  }
}

// إغلاق موديل التحويل
function closeTransferModal() {
  document.getElementById('transferModal').style.display = 'none';
  document.getElementById('transferNotes').value = '';
  document.getElementById('transferDepartment').value = '';
  document.getElementById('transferEmployee').value = '';
  document.getElementById('transferEmployee').disabled = true;
}

// إغلاق موديل خط السير
function closeWorkflowModal() {
  document.getElementById('workflowModal').style.display = 'none';
}

// تبديل عرض قائمة تعيين المسؤول
function toggleAssigneeDropdown(requestId) {
  const dropdown = document.getElementById(`assignee-dropdown-${requestId}`);
  const isVisible = dropdown.style.display !== 'none';
  
  // إغلاق جميع القوائم المنسدلة الأخرى
  document.querySelectorAll('.assignee-dropdown').forEach(dd => {
    dd.style.display = 'none';
  });
  
  // فتح/إغلاق القائمة المحددة
  dropdown.style.display = isVisible ? 'none' : 'block';
}

// تحميل جميع الأقسام
async function loadAllDepartments() {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      // تحديث جميع قوائم الأقسام
      document.querySelectorAll('.department-select').forEach(select => {
        if (select.options.length === 1) { // إذا كان يحتوي على الخيار الافتراضي فقط
          data.data.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.DepartmentID;
            option.textContent = dept.DepartmentName;
            select.appendChild(option);
          });
        }
      });
    }
  } catch (error) {
    console.error('خطأ في تحميل الأقسام:', error);
  }
}

// تحميل الموظفين لقسم معين
async function loadEmployeesForDepartment(requestId) {
  const departmentId = document.getElementById(`department-select-${requestId}`).value;
  const employeeSelect = document.getElementById(`employee-select-${requestId}`);
  
  if (!departmentId) {
    employeeSelect.innerHTML = '<option value="" data-ar="اختر الموظف" data-en="Select Employee">اختر الموظف</option>';
    employeeSelect.disabled = true;
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/departments/${departmentId}/employees`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      employeeSelect.innerHTML = '<option value="" data-ar="اختر الموظف" data-en="Select Employee">اختر الموظف</option>';
      
      data.data.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.EmployeeID;
        option.textContent = emp.FullName;
        employeeSelect.appendChild(option);
      });
      
      employeeSelect.disabled = false;
    }
  } catch (error) {
    console.error('خطأ في تحميل الموظفين:', error);
  }
}

// تعيين موظف كمسؤول على الطلب
async function assignEmployee(requestId) {
  const employeeId = document.getElementById(`employee-select-${requestId}`).value;
  const notes = document.getElementById(`assign-notes-${requestId}`).value;
  
  if (!employeeId) {
    alert('يرجى اختيار موظف');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/admin/requests/${requestId}/assign`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employeeId: employeeId,
        notes: notes
      })
    });

    const data = await response.json();
    
    if (data.success) {
      alert('تم تعيين المسؤول بنجاح');
      
      // إغلاق القائمة المنسدلة
      document.getElementById(`assignee-dropdown-${requestId}`).style.display = 'none';
      
      // تحديث النص المعروض
      const employeeSelect = document.getElementById(`employee-select-${requestId}`);
      const selectedOption = employeeSelect.options[employeeSelect.selectedIndex];
      const assigneeText = document.querySelector(`#assignee-dropdown-${requestId}`).parentElement.querySelector('.assignee-text');
      assigneeText.textContent = selectedOption.textContent;
      
      // إعادة تحميل البيانات
      loadRequests();
    } else {
      alert('خطأ في تعيين المسؤول: ' + data.message);
    }
  } catch (error) {
    console.error('خطأ في تعيين المسؤول:', error);
    alert('خطأ في تعيين المسؤول');
  }
}

// إغلاق القوائم المنسدلة عند النقر خارجها
document.addEventListener('click', function(event) {
  if (!event.target.closest('.assignee-selector')) {
    document.querySelectorAll('.assignee-dropdown').forEach(dd => {
      dd.style.display = 'none';
    });
  }
});



// تحديث تلقائي كل دقيقة
setInterval(() => {
  // تحديث المدة المتبقية فقط دون إعادة تحميل البيانات
  const tbody = document.getElementById('requestTableBody');
  if (tbody && requests.length > 0) {
    displayRequests(requests);
  }
}, 60000); // كل دقيقة
