// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let patientData = null;
let complaintsData = [];

// جلب شكاوى المريض
async function loadPatientComplaints() {
  const nationalId = localStorage.getItem("patientNationalId");
  
  if (!nationalId) {
    alert("لا يوجد رقم هوية للمريض");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/complaints/patient/${nationalId}`);
    const data = await response.json();
    
    if (data.success) {
      patientData = data.data.patient;
      complaintsData = data.data.complaints;
      
      // تحديث معلومات المريض
      updatePatientInfo();
      
      // تحديث قائمة الشكاوى
      updateComplaintsTable();
      
    } else {
      alert("لا توجد شكاوى لهذا المريض");
    }
  } catch (error) {
    console.error('خطأ في جلب شكاوى المريض:', error);
    alert("حدث خطأ في الاتصال بالخادم");
  }
}

// تحديث معلومات المريض
function updatePatientInfo() {
  if (!patientData) return;

  // تحديث اسم المريض
  const patientNameElement = document.querySelector('.info-group .value');
  if (patientNameElement) {
    patientNameElement.textContent = patientData.name;
  }

  // تحديث رقم الملف (رقم الهوية)
  const fileNumberElement = document.querySelectorAll('.info-group .value')[1];
  if (fileNumberElement) {
    fileNumberElement.textContent = patientData.nationalId;
  }

  // تحديث عدد الشكاوى
  const complaintsCountElement = document.querySelectorAll('.info-group .value')[2];
  if (complaintsCountElement) {
    complaintsCountElement.textContent = complaintsData.length;
  }
}

// تحديث جدول الشكاوى
function updateComplaintsTable() {
  const tbody = document.querySelector('.complaint-list table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  complaintsData.forEach(complaint => {
    const row = document.createElement('tr');
    
    // تنسيق التاريخ
    const complaintDate = new Date(complaint.ComplaintDate);
    const formattedDate = complaintDate.toLocaleDateString('ar-SA');
    
    // تنسيق حالة الشكوى
    const statusClass = getStatusClass(complaint.CurrentStatus);
    const statusText = getStatusText(complaint.CurrentStatus);
    
    row.innerHTML = `
      <td>#${complaint.ComplaintID}</td>
      <td>${complaint.ComplaintTypeName}</td>
      <td>${complaint.DepartmentName}</td>
      <td>${formattedDate}</td>
      <td><span class="status-tag ${statusClass}" data-ar="${statusText}" data-en="${statusText}">${statusText}</span></td>
      <td>
        <a href="#" onclick="viewComplaintDetails(${complaint.ComplaintID})" class="details-link" data-ar="عرض التفاصيل" data-en="View Details">عرض التفاصيل</a>
      </td>
    `;
    
    tbody.appendChild(row);
  });
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
  const complaint = complaintsData.find(c => c.ComplaintID === complaintId);
  if (complaint) {
    console.log('بيانات الشكوى المحددة:', complaint);
    // حفظ بيانات الشكوى في localStorage للوصول إليها في صفحة التفاصيل
    localStorage.setItem("selectedComplaint", JSON.stringify(complaint));
    console.log('تم حفظ البيانات في localStorage');
    window.location.href = "/general complaints/details.html";
  } else {
    console.log('لم يتم العثور على الشكوى:', complaintId);
  }
}

// تطبيق التصفية
function applyFilters() {
  const dateFilter = document.querySelector('input[type="date"]').value;
  const departmentFilter = document.querySelector('select').value;
  const complaintTypeFilter = document.querySelectorAll('select')[1].value;
  const searchFilter = document.getElementById('searchComplaint').value;

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
      complaint.DepartmentName.includes(departmentFilter)
    );
  }

  // تصفية حسب نوع الشكوى
  if (complaintTypeFilter && complaintTypeFilter !== 'Complaint Type') {
    filteredComplaints = filteredComplaints.filter(complaint => 
      complaint.ComplaintTypeName.includes(complaintTypeFilter)
    );
  }

  // تصفية حسب البحث
  if (searchFilter) {
    filteredComplaints = filteredComplaints.filter(complaint => 
      complaint.ComplaintID.toString().includes(searchFilter)
    );
  }

  // تحديث الجدول بالبيانات المصفاة
  updateComplaintsTableWithData(filteredComplaints);
}

// تحديث الجدول ببيانات محددة
function updateComplaintsTableWithData(complaints) {
  const tbody = document.querySelector('.complaint-list table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  complaints.forEach(complaint => {
    const row = document.createElement('tr');
    
    const complaintDate = new Date(complaint.ComplaintDate);
    const formattedDate = complaintDate.toLocaleDateString('ar-SA');
    
    const statusClass = getStatusClass(complaint.CurrentStatus);
    const statusText = getStatusText(complaint.CurrentStatus);
    
    row.innerHTML = `
      <td>#${complaint.ComplaintID}</td>
      <td>${complaint.ComplaintTypeName}</td>
      <td>${complaint.DepartmentName}</td>
      <td>${formattedDate}</td>
      <td><span class="status-tag ${statusClass}" data-ar="${statusText}" data-en="${statusText}">${statusText}</span></td>
      <td>
        <a href="#" onclick="viewComplaintDetails(${complaint.ComplaintID})" class="details-link" data-ar="عرض التفاصيل" data-en="View Details">عرض التفاصيل</a>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// تصدير النتائج
function exportResults() {
  if (complaintsData.length === 0) {
    alert("لا توجد بيانات للتصدير");
    return;
  }

  // إنشاء ملف CSV
  let csvContent = "رقم الشكوى,نوع الشكوى,القسم,التاريخ,الحالة\n";
  
  complaintsData.forEach(complaint => {
    const complaintDate = new Date(complaint.ComplaintDate);
    const formattedDate = complaintDate.toLocaleDateString('ar-SA');
    
    csvContent += `${complaint.ComplaintID},${complaint.ComplaintTypeName},${complaint.DepartmentName},${formattedDate},${complaint.CurrentStatus}\n`;
  });

  // تحميل الملف
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `شكاوى_المريض_${patientData?.name || 'غير_محدد'}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// العودة للصفحة السابقة
function goBack() {
  window.history.back();
}

// تطبيق اللغة
let currentLang = localStorage.getItem('lang') || 'ar';

function applyLanguage(lang) {
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
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
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

  // تحميل شكاوى المريض
  loadPatientComplaints();
});

