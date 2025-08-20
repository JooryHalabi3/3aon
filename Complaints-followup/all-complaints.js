// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// التحقق من تسجيل الدخول
function checkAuthentication() {
  console.log('التحقق من تسجيل الدخول...');
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('Token موجود:', !!token);
  console.log('User موجود:', !!user);
  
  if (!token || !user) {
    console.log('لم يتم العثور على بيانات تسجيل الدخول - إعادة توجيه لصفحة تسجيل الدخول');
    alert('يجب تسجيل الدخول أولاً');
    window.location.href = '/login/login.html';
    return false;
  }
  
  console.log('تم التحقق من تسجيل الدخول بنجاح');
  return true;
}

// متغيرات عامة
let userData = null;
let complaintsData = [];

// جلب شكاوى المستخدم المسجل دخوله
async function loadUserComplaints() {
  console.log('بدء تحميل شكاوى المستخدم...');
  
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
      alert('يجب تسجيل الدخول أولاً');
      window.location.href = '/login/login.html';
      return;
    }
    
    if (!user.employeeID) {
      alert('بيانات المستخدم غير صحيحة. يرجى تسجيل الدخول مرة أخرى.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login/login.html';
      return;
    }
    
    console.log('بيانات المستخدم من localStorage:', user);
    
    // جلب شكاوى المستخدم المسجل دخوله
    const response = await fetch(`${API_BASE_URL}/complaints/my-complaints`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        alert('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login/login.html';
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('تم جلب البيانات بنجاح:', data);
      
      complaintsData = data.data || [];
      
      // استخراج معلومات المستخدم من أول شكوى (إذا وجدت)
      if (complaintsData.length > 0) {
        const firstComplaint = complaintsData[0];
        userData = {
          fullName: firstComplaint.EmployeeName || firstComplaint.SubmittedByEmployeeName || user.fullName || user.username,
          employeeID: user.employeeID,
          username: user.username,
          department: firstComplaint.DepartmentName
        };
        console.log('تم استخراج معلومات المستخدم من الشكاوى:', userData);
      } else {
        // إذا لم توجد شكاوى، نستخدم البيانات الأساسية
        userData = {
          fullName: user.fullName || user.username,
          employeeID: user.employeeID,
          username: user.username
        };
        console.log('لا توجد شكاوى - استخدام البيانات الأساسية:', userData);
      }
      
      console.log('بيانات المستخدم النهائية:', userData);
      console.log('عدد الشكاوى:', complaintsData.length);
      
      updateUserInfo();
      updateComplaintsTable();
      
    } else {
      console.log('لا توجد شكاوى للمستخدم:', data.message);
      complaintsData = [];
      
      // حتى لو لم توجد شكاوى، نعرض معلومات المستخدم الأساسية
      userData = {
        fullName: user.fullName || user.username,
        employeeID: user.employeeID,
        username: user.username
      };
      
      updateUserInfo();
      updateComplaintsTable();
      
      // عرض رسالة للمستخدم
      if (data.message) {
        console.log('رسالة من الخادم:', data.message);
      }
    }
  } catch (error) {
    console.error('خطأ في جلب شكاوى المستخدم:', error);
    
    if (error.message.includes('Failed to fetch')) {
      alert("لا يمكن الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.");
    } else {
      alert("حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
    }
    
    // حتى في حالة الخطأ، نعرض معلومات المستخدم الأساسية
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    userData = {
      fullName: user.fullName || user.username,
      employeeID: user.employeeID,
      username: user.username
    };
    complaintsData = [];
    updateUserInfo();
    updateComplaintsTable();
  }
}

// تحديث معلومات المستخدم
function updateUserInfo() {
  console.log('بدء تحديث معلومات المستخدم...');
  
  if (!userData) {
    console.log('لا توجد بيانات مستخدم لتحديثها');
    return;
  }

  // تحديث اسم المستخدم
  const userNameElement = document.getElementById('patientName');
  if (userNameElement) {
    // استخدام الاسم من الشكاوى إذا وجد، وإلا نستخدم البيانات الأساسية
    const displayName = userData.fullName || userData.username || 'غير محدد';
    userNameElement.textContent = displayName;
    console.log('اسم المستخدم المعروض:', displayName);
  }

  // تحديث رقم الموظف
  const employeeIdElement = document.getElementById('patientId');
  if (employeeIdElement) {
    employeeIdElement.textContent = userData.employeeID || 'غير محدد';
  }

  // تحديث عدد الشكاوى
  const complaintsCountElement = document.getElementById('complaintsCount');
  if (complaintsCountElement) {
    complaintsCountElement.textContent = complaintsData.length;
    
    // إضافة رسالة حالة
    if (complaintsData.length === 0) {
      console.log('لا توجد شكاوى للمستخدم');
    } else {
      console.log(`تم العثور على ${complaintsData.length} شكوى للمستخدم`);
      
      // عرض معلومات إضافية إذا وجدت
      if (userData.department) {
        console.log(`القسم: ${userData.department}`);
      }
    }
  }
  
  console.log('تم تحديث معلومات المستخدم بنجاح');
}

// تحديث جدول الشكاوى
function updateComplaintsTable() {
  console.log('بدء تحديث جدول الشكاوى...');
  
  const tbody = document.querySelector('.complaint-list table tbody');
  if (!tbody) {
    console.log('لم يتم العثور على جدول الشكاوى');
    return;
  }

  tbody.innerHTML = '';

  if (complaintsData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
          <div style="margin-bottom: 15px;">
            <i class="fas fa-inbox" style="font-size: 48px; color: #ddd;"></i>
          </div>
          <div style="font-size: 18px; margin-bottom: 10px;">
            <span data-ar="لا توجد شكاوى مسجلة" data-en="No complaints found">لا توجد شكاوى مسجلة</span>
          </div>
          <div style="font-size: 14px; color: #999;">
            <span data-ar="لم تقم بتسجيل أي شكاوى حتى الآن" data-en="You haven't registered any complaints yet">لم تقم بتسجيل أي شكاوى حتى الآن</span>
          </div>
          <div style="margin-top: 20px;">
            <a href="/New complaint/Newcomplaint.html" class="btn btn-primary" style="text-decoration: none; padding: 10px 20px; background: #007bff; color: white; border-radius: 5px;">
              <span data-ar="تسجيل شكوى جديدة" data-en="Register New Complaint">تسجيل شكوى جديدة</span>
            </a>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  complaintsData.forEach(complaint => {
    const row = document.createElement('tr');
    
    // تنسيق رقم الشكوى مع padding
    const complaintNumber = String(complaint.ComplaintID).padStart(6, '0');
    
    // تنسيق التاريخ والوقت
    const complaintDate = new Date(complaint.ComplaintDate);
    const formattedDate = complaintDate.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const formattedTime = complaintDate.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const fullDateTime = `${formattedDate}<br><small style="color: #666;">${formattedTime}</small>`;
    
    // تنسيق حالة الشكوى
    const statusClass = getStatusClass(complaint.CurrentStatus);
    const statusText = getStatusText(complaint.CurrentStatus);
    
    // عرض معلومات المريض في نوع الشكوى
    const complaintInfo = complaint.PatientName ? 
      `${complaint.ComplaintTypeName || 'غير محدد'}<br><small style="color: #666;">مريض: ${complaint.PatientName}</small>` : 
      complaint.ComplaintTypeName || 'غير محدد';
    
    row.innerHTML = `
      <td><strong>#${complaintNumber}</strong></td>
      <td>${complaintInfo}</td>
      <td>${complaint.DepartmentName || 'غير محدد'}</td>
      <td>${fullDateTime}</td>
      <td><span class="status-tag ${statusClass}" data-ar="${statusText}" data-en="${statusText}">${statusText}</span></td>
      <td>
        <a href="#" onclick="viewComplaintDetails(${complaint.ComplaintID})" class="details-link" data-ar="عرض التفاصيل" data-en="View Details">عرض التفاصيل</a>
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  console.log(`تم تحديث جدول الشكاوى بنجاح - ${complaintsData.length} شكوى`);
}

// الحصول على كلاس CSS للحالة
function getStatusClass(status) {
  switch (status) {
    case 'جديدة':
      return 'status-new';
    case 'قيد المراجعة':
    case 'قيد المعالجة':
      return 'status-under-review';
    case 'مغلقة':
    case 'تم الحل':
      return 'status-closed';
    default:
      return 'status-new';
  }
}

// الحصول على نص الحالة
function getStatusText(status) {
  return status || 'جديدة';
}

// عرض تفاصيل الشكوى
function viewComplaintDetails(complaintId) {
  console.log('عرض تفاصيل الشكوى رقم:', complaintId);
  
  const complaint = complaintsData.find(c => c.ComplaintID === complaintId);
  if (complaint) {
    console.log('بيانات الشكوى المحددة:', complaint);
    // حفظ بيانات الشكوى في localStorage للوصول إليها في صفحة التفاصيل
    localStorage.setItem("selectedComplaint", JSON.stringify(complaint));
    console.log('تم حفظ البيانات في localStorage');
    
    // إضافة رسالة نجاح
    console.log('الانتقال لصفحة التفاصيل...');
    window.location.href = "/general complaints/details.html";
  } else {
    console.log('لم يتم العثور على الشكوى:', complaintId);
    alert('لم يتم العثور على الشكوى المحددة. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
  }
}

// تطبيق التصفية
function applyFilters() {
  console.log('تطبيق التصفية...');
  
  const dateFilter = document.querySelector('input[type="date"]').value;
  const departmentFilter = document.querySelector('select').value;
  const complaintTypeFilter = document.querySelectorAll('select')[1].value;
  const searchFilter = document.getElementById('searchComplaint').value;
  
  console.log('فلاتر التطبيق:');
  console.log('- التاريخ:', dateFilter);
  console.log('- القسم:', departmentFilter);
  console.log('- نوع الشكوى:', complaintTypeFilter);
  console.log('- البحث:', searchFilter);

  let filteredComplaints = complaintsData;

  // تصفية حسب التاريخ
  if (dateFilter) {
    const filterDate = new Date(dateFilter);
    filteredComplaints = filteredComplaints.filter(complaint => {
      const complaintDate = new Date(complaint.ComplaintDate);
      return complaintDate.toDateString() === filterDate.toDateString();
    });
  }

  // تصفية حسب القسم
  if (departmentFilter && departmentFilter !== 'Department') {
    filteredComplaints = filteredComplaints.filter(complaint => 
      complaint.DepartmentName && complaint.DepartmentName.includes(departmentFilter)
    );
  }

  // تصفية حسب نوع الشكوى
  if (complaintTypeFilter && complaintTypeFilter !== 'Complaint Type') {
    filteredComplaints = filteredComplaints.filter(complaint => 
      complaint.ComplaintTypeName && complaint.ComplaintTypeName.includes(complaintTypeFilter)
    );
  }

  // تصفية حسب البحث
  if (searchFilter) {
    filteredComplaints = filteredComplaints.filter(complaint => 
      complaint.ComplaintID.toString().includes(searchFilter)
    );
  }

  // تحديث الجدول بالبيانات المصفاة
  console.log(`تم تطبيق التصفية - ${filteredComplaints.length} شكوى من أصل ${complaintsData.length}`);
  
  // رسالة للمستخدم
  if (filteredComplaints.length !== complaintsData.length) {
    console.log(`تم العثور على ${filteredComplaints.length} شكوى تطابق معايير البحث`);
  }
  
  updateComplaintsTableWithData(filteredComplaints);
}

// تحديث الجدول ببيانات محددة
function updateComplaintsTableWithData(complaints) {
  console.log('تحديث الجدول ببيانات محددة:', complaints.length, 'شكوى');
  
  const tbody = document.querySelector('.complaint-list table tbody');
  if (!tbody) {
    console.log('لم يتم العثور على جدول الشكاوى');
    return;
  }

  tbody.innerHTML = '';

  if (complaints.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
          <div style="margin-bottom: 15px;">
            <i class="fas fa-search" style="font-size: 48px; color: #ddd;"></i>
          </div>
          <div style="font-size: 18px; margin-bottom: 10px;">
            <span data-ar="لا توجد نتائج مطابقة للبحث" data-en="No matching results found">لا توجد نتائج مطابقة للبحث</span>
          </div>
          <div style="font-size: 14px; color: #999;">
            <span data-ar="جرب تغيير معايير البحث أو إزالة الفلاتر" data-en="Try changing search criteria or removing filters">جرب تغيير معايير البحث أو إزالة الفلاتر</span>
          </div>
          <div style="margin-top: 20px;">
            <button onclick="resetFilters()" class="btn btn-secondary" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
              <span data-ar="إعادة تعيين الفلاتر" data-en="Reset Filters">إعادة تعيين الفلاتر</span>
            </button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  complaints.forEach(complaint => {
    const row = document.createElement('tr');
    
    // تنسيق رقم الشكوى مع padding
    const complaintNumber = String(complaint.ComplaintID).padStart(6, '0');
    
    // تنسيق التاريخ والوقت
    const complaintDate = new Date(complaint.ComplaintDate);
    const formattedDate = complaintDate.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const formattedTime = complaintDate.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const fullDateTime = `${formattedDate}<br><small style="color: #666;">${formattedTime}</small>`;
    
    const statusClass = getStatusClass(complaint.CurrentStatus);
    const statusText = getStatusText(complaint.CurrentStatus);
    
    // عرض معلومات المريض في نوع الشكوى
    const complaintInfo = complaint.PatientName ? 
      `${complaint.ComplaintTypeName || 'غير محدد'}<br><small style="color: #666;">مريض: ${complaint.PatientName}</small>` : 
      complaint.ComplaintTypeName || 'غير محدد';
    
    row.innerHTML = `
      <td><strong>#${complaintNumber}</strong></td>
      <td>${complaintInfo}</td>
      <td>${complaint.DepartmentName || 'غير محدد'}</td>
      <td>${fullDateTime}</td>
      <td><span class="status-tag ${statusClass}" data-ar="${statusText}" data-en="${statusText}">${statusText}</span></td>
      <td>
        <a href="#" onclick="viewComplaintDetails(${complaint.ComplaintID})" class="details-link" data-ar="عرض التفاصيل" data-en="View Details">عرض التفاصيل</a>
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  console.log('تم تحديث الجدول بالبيانات المحددة بنجاح');
}

// إعادة تعيين الفلاتر
function resetFilters() {
  console.log('إعادة تعيين الفلاتر...');
  
  // إعادة تعيين حقول التصفية
  document.querySelector('input[type="date"]').value = '';
  document.querySelector('select').value = '';
  document.querySelectorAll('select')[1].value = '';
  document.getElementById('searchComplaint').value = '';
  
  // إعادة عرض جميع الشكاوى
  updateComplaintsTable();
  
  console.log('تم إعادة تعيين الفلاتر بنجاح');
}

// تصدير النتائج
function exportResults() {
  console.log('بدء تصدير النتائج...');
  
  if (complaintsData.length === 0) {
    console.log('لا توجد بيانات للتصدير');
    alert("لا توجد بيانات للتصدير");
    return;
  }

  // إنشاء ملف CSV
  let csvContent = "رقم الشكوى,نوع الشكوى,مريض,القسم,التاريخ,الوقت,الحالة\n";
  
  complaintsData.forEach(complaint => {
    // تنسيق رقم الشكوى
    const complaintNumber = String(complaint.ComplaintID).padStart(6, '0');
    
    // تنسيق التاريخ والوقت
    const complaintDate = new Date(complaint.ComplaintDate);
    const formattedDate = complaintDate.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const formattedTime = complaintDate.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // إضافة معلومات المريض
    const patientName = complaint.PatientName || 'غير محدد';
    
    csvContent += `#${complaintNumber},${complaint.ComplaintTypeName || 'غير محدد'},${patientName},${complaint.DepartmentName || 'غير محدد'},${formattedDate},${formattedTime},${complaint.CurrentStatus || 'جديدة'}\n`;
  });

  // تحميل الملف
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `شكاوى_الموظف_${userData?.fullName || userData?.username || 'غير_محدد'}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // رسالة نجاح
  console.log('تم تصدير النتائج بنجاح');
  alert(`تم تصدير ${complaintsData.length} شكوى بنجاح!`);
}

// العودة للصفحة السابقة
function goBack() {
  console.log('العودة للصفحة السابقة...');
  window.history.back();
}

// تطبيق اللغة
// مراقبة تحديثات حالة الشكاوى
function listenForStatusUpdates() {
  console.log('بدء مراقبة تحديثات حالة الشكاوى...');
  
  // مراقبة تغيير localStorage
  window.addEventListener('storage', (e) => {
    if (e.key === 'complaintStatusUpdated') {
      const updateData = JSON.parse(e.newValue);
      if (updateData && updateData.complaintId) {
        console.log('تم اكتشاف تحديث حالة الشكوى:', updateData);
        updateComplaintStatusInUI(updateData.complaintId, updateData.newStatus);
      }
    }
  });

  // مراقبة التحديثات في نفس النافذة
  setInterval(() => {
    const updateData = localStorage.getItem('complaintStatusUpdated');
    if (updateData) {
      const parsed = JSON.parse(updateData);
      const timeDiff = Date.now() - parsed.timestamp;
      
      // إذا كان التحديث حديث (أقل من 5 ثواني) وليس من نفس الصفحة
      if (timeDiff < 5000 && !window.complaintStatusUpdateProcessed) {
        console.log('تم اكتشاف تحديث حالة محلي:', parsed);
        updateComplaintStatusInUI(parsed.complaintId, parsed.newStatus);
        window.complaintStatusUpdateProcessed = true;
        
        // إزالة العلامة بعد 10 ثواني
        setTimeout(() => {
          window.complaintStatusUpdateProcessed = false;
        }, 10000);
      }
    }
  }, 1000);
  
  console.log('تم بدء مراقبة تحديثات حالة الشكاوى بنجاح');
}

// تحديث حالة الشكوى في الواجهة
function updateComplaintStatusInUI(complaintId, newStatus) {
  console.log('تحديث حالة الشكوى في الواجهة:', complaintId, 'إلى', newStatus);
  
  // البحث عن الشكوى في البيانات المحملة
  const complaintIndex = complaintsData.findIndex(c => c.ComplaintID === complaintId);
  if (complaintIndex !== -1) {
    // تحديث البيانات
    complaintsData[complaintIndex].CurrentStatus = newStatus;
    
    // إعادة عرض الشكاوى لتظهر التحديثات
    updateComplaintsTable();
    
    console.log(`تم تحديث حالة الشكوى ${complaintId} إلى ${newStatus} في صفحة المستخدم`);
    
    // رسالة للمستخدم
    console.log(`تم تحديث حالة الشكوى رقم #${String(complaintId).padStart(6, '0')} إلى: ${newStatus}`);
  } else {
    console.log(`لم يتم العثور على الشكوى ${complaintId} في البيانات المحملة`);
  }
}

let currentLang = localStorage.getItem('lang') || 'ar';

function applyLanguage(lang) {
  console.log('تطبيق اللغة:', lang);
  currentLang = lang;
  localStorage.setItem('lang', lang);

  // الاتجاه واللغة
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';

  // تغيير النصوص بناءً على اللغة
  document.querySelectorAll('[data-ar]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  // تغيير placeholder بناءً على اللغة
  document.querySelectorAll('[data-ar-placeholder]').forEach(el => {
    el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
  });

  // زر اللغة نفسه
  const langText = document.getElementById('langText');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  }

  // تغيير الخط
  document.body.style.fontFamily = lang === 'ar' ? "'Tajawal', sans-serif" : "serif";
  
  console.log('تم تطبيق اللغة بنجاح');
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  console.log('بدء تحميل صفحة جميع الشكاوى...');
  
  // التحقق من تسجيل الدخول أولاً
  if (!checkAuthentication()) {
    console.log('فشل في التحقق من تسجيل الدخول');
    return;
  }
  
  console.log('تم التحقق من تسجيل الدخول بنجاح - بدء تحميل الصفحة');
  
  applyLanguage(currentLang);

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }

  // إضافة مستمع لزر تطبيق التصفية
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', applyFilters);
  }

  // بدء مراقبة تحديثات الحالة
  listenForStatusUpdates();

  // تحميل شكاوى المستخدم
  console.log('بدء تحميل شكاوى المستخدم...');
  loadUserComplaints();
  
  console.log('تم تحميل صفحة جميع الشكاوى بنجاح');
  console.log('=== انتهى تحميل الصفحة ===');
});


