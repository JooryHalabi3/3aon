// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let complaintsData = [];
let departments = [];
let complaintTypes = [];

// جلب جميع الشكاوى
async function loadComplaints() {
  try {
    console.log('بدء جلب الشكاوى...'); // إضافة رسالة تصحيح
    
    const dateFilter = document.getElementById('dateFilter').value;
    const searchTerm = document.querySelector('.search-box').value;
    const statusFilter = document.querySelectorAll('.dropdown')[1].value;
    const departmentFilter = document.querySelectorAll('.dropdown')[2].value;
    const complaintTypeFilter = document.querySelectorAll('.dropdown')[3].value;

    // إنشاء معاملات البحث مع تجاهل القيم الافتراضية
    const params = new URLSearchParams();
    
    if (dateFilter && dateFilter !== 'all') {
      params.append('dateFilter', dateFilter);
    }
    
    if (searchTerm && searchTerm.trim() !== '') {
      params.append('search', searchTerm.trim());
    }
    
    if (statusFilter && statusFilter !== 'الحالة') {
      params.append('status', statusFilter);
    }
    
    if (departmentFilter && departmentFilter !== 'القسم') {
      params.append('department', departmentFilter);
    }
    
    if (complaintTypeFilter && complaintTypeFilter !== 'نوع الشكوى') {
      params.append('complaintType', complaintTypeFilter);
    }

    console.log('معاملات البحث:', params.toString()); // إضافة رسالة تصحيح

    const response = await fetch(`${API_BASE_URL}/complaints/all?${params}`);
    const data = await response.json();
    
    console.log('استجابة الخادم:', data); // إضافة رسالة تصحيح
    
    if (data.success) {
      complaintsData = data.data;
      console.log('عدد الشكاوى المحملة:', complaintsData.length); // إضافة رسالة تصحيح
      updateComplaintsDisplay();
    } else {
      console.error('خطأ في جلب الشكاوى:', data.message);
    }
  } catch (error) {
    console.error('خطأ في الاتصال بالخادم:', error);
  }
}

// جلب الأقسام وأنواع الشكاوى للفلاتر
async function loadFilters() {
  try {
    // جلب الأقسام
    const deptResponse = await fetch(`${API_BASE_URL}/complaints/departments`);
    const deptData = await deptResponse.json();
    
    if (deptData.success) {
      departments = deptData.data;
      populateDepartmentFilter();
    }

    // جلب أنواع الشكاوى
    const typeResponse = await fetch(`${API_BASE_URL}/complaints/types`);
    const typeData = await typeResponse.json();
    
    if (typeData.success) {
      complaintTypes = typeData.data;
      populateComplaintTypeFilter();
    }
  } catch (error) {
    console.error('خطأ في جلب الفلاتر:', error);
  }
}

// ملء فلتر الأقسام
function populateDepartmentFilter() {
  const departmentSelect = document.querySelectorAll('.dropdown')[2];
  if (departmentSelect) {
    departmentSelect.innerHTML = '<option data-ar="القسم" data-en="Department">القسم</option>';
    
    departments.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept.DepartmentName;
      option.textContent = dept.DepartmentName;
      departmentSelect.appendChild(option);
    });
  }
}

// ملء فلتر أنواع الشكاوى
function populateComplaintTypeFilter() {
  const typeSelect = document.querySelectorAll('.dropdown')[3];
  if (typeSelect) {
    typeSelect.innerHTML = '<option data-ar="نوع الشكوى" data-en="Complaint Type">نوع الشكوى</option>';
    
    complaintTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type.TypeName;
      option.textContent = type.TypeName;
      typeSelect.appendChild(option);
    });
  }
}

// تحديث عرض الشكاوى
function updateComplaintsDisplay() {
  console.log('بدء تحديث عرض الشكاوى...'); // إضافة رسالة تصحيح
  
  const complaintsSection = document.querySelector('.complaints');
  if (!complaintsSection) {
    console.error('لم يتم العثور على قسم الشكاوى'); // إضافة رسالة تصحيح
    return;
  }

  console.log('عدد الشكاوى للعرض:', complaintsData.length); // إضافة رسالة تصحيح

  if (complaintsData.length === 0) {
    console.log('لا توجد شكاوى للعرض'); // إضافة رسالة تصحيح
    complaintsSection.innerHTML = `
      <div class="no-complaints">
        <p data-ar="لا توجد شكاوى" data-en="No complaints found">لا توجد شكاوى</p>
      </div>
    `;
    return;
  }

  const complaintsHTML = complaintsData.map(complaint => {
    const complaintDate = new Date(complaint.ComplaintDate);
    const formattedDate = complaintDate.toLocaleDateString('ar-SA') + ' - ' + 
                         complaintDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    
    const statusClass = getStatusClass(complaint.CurrentStatus);
    const statusText = getStatusText(complaint.CurrentStatus);
    
    // تقصير تفاصيل الشكوى
    const shortDetails = complaint.ComplaintDetails.length > 100 
      ? complaint.ComplaintDetails.substring(0, 100) + '...'
      : complaint.ComplaintDetails;

    console.log('إنشاء HTML للشكوى:', complaint.ComplaintID); // إضافة رسالة تصحيح

    return `
      <div class="complaint">
        <div class="complaint-header">
          <span data-ar="شكوى #${complaint.ComplaintID}" data-en="Complaint #${complaint.ComplaintID}">شكوى #${complaint.ComplaintID}</span>
          <span class="badge ${statusClass}" data-ar="${statusText}" data-en="${statusText}">${statusText}</span>
          <span class="date">${formattedDate}</span>
        </div>
        <div class="complaint-body">
          <div class="details">
            <h3 data-ar="تفاصيل الشكوى" data-en="Complaint Details">تفاصيل الشكوى</h3>
            <p data-ar="القسم: ${complaint.DepartmentName}" data-en="Department: ${complaint.DepartmentName}">القسم: ${complaint.DepartmentName}</p>
            <p data-ar="نوع الشكوى: ${complaint.ComplaintTypeName}" data-en="Complaint Type: ${complaint.ComplaintTypeName}">نوع الشكوى: ${complaint.ComplaintTypeName}</p>
            ${complaint.SubTypeName ? `<p data-ar="التصنيف الفرعي: ${complaint.SubTypeName}" data-en="Subcategory: ${complaint.SubTypeName}">التصنيف الفرعي: ${complaint.SubTypeName}</p>` : ''}
            <p data-ar="${shortDetails}" data-en="${shortDetails}">${shortDetails}</p>
          </div>
          <div class="info">
            <h3 data-ar="معلومات المريض" data-en="Patient Info">معلومات المريض</h3>
            <p data-ar="اسم المريض: ${complaint.PatientName}" data-en="Patient Name: ${complaint.PatientName}">اسم المريض: ${complaint.PatientName}</p>
            <p data-ar="رقم الملف: ${complaint.NationalID_Iqama}" data-en="File Number: ${complaint.NationalID_Iqama}">رقم الملف: ${complaint.NationalID_Iqama}</p>
            <p data-ar="رقم الهوية: ${complaint.NationalID_Iqama}" data-en="ID Number: ${complaint.NationalID_Iqama}">رقم الهوية: ${complaint.NationalID_Iqama}</p>
          </div>
        </div>
        <div class="actions">
          <a href="#" onclick="viewComplaintDetails(${complaint.ComplaintID})" class="btn blue" data-ar="عرض التفاصيل" data-en="View Details">عرض التفاصيل</a>
          <a href="/general complaints/reply.html" class="btn green" data-ar="الرد على الشكوى" data-en="Reply to Complaint">الرد على الشكوى</a>
          <a href="/general complaints/status.html" class="btn gray" data-ar="تغيير الحالة" data-en="Change Status">تغيير الحالة</a>
          <a href="/general complaints/track.html" class="btn track" data-ar="تتبع حالة الشكوى" data-en="Track Complaint">تتبع حالة الشكوى</a>
        </div>
      </div>
    `;
  }).join('');

  console.log('تم إنشاء HTML للشكاوى'); // إضافة رسالة تصحيح
  complaintsSection.innerHTML = complaintsHTML;
  console.log('تم تحديث عرض الشكاوى بنجاح'); // إضافة رسالة تصحيح
}

// الحصول على كلاس CSS للحالة
function getStatusClass(status) {
  switch (status) {
    case 'جديدة':
      return 'blue';
    case 'قيد المراجعة':
    case 'قيد المعالجة':
      return 'yellow';
    case 'مغلقة':
    case 'تم الحل':
      return 'green';
    default:
      return 'blue';
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
    // حفظ بيانات الشكوى في localStorage للوصول إليها في صفحة التفاصيل
    localStorage.setItem("selectedComplaint", JSON.stringify(complaint));
    window.location.href = "/general complaints/details.html";
  }
}

// تطبيق الفلاتر
function applyFilters() {
  loadComplaints();
}

function goBack() {
  window.history.back();
}

function printPage() {
  window.print();
}

document.getElementById("exportBtn").addEventListener("click", function () {
  // التوجيه إلى صفحة export.html داخل مجلد dashboard
  window.location.href = "/dashboard/export.html";
});

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

document.addEventListener('DOMContentLoaded', () => {
  console.log('تم تحميل صفحة الشكاوى العامة'); // إضافة رسالة تصحيح
  
  applyLanguage(currentLang);

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }

  // تحميل الفلاتر والشكاوى
  console.log('بدء تحميل الفلاتر...'); // إضافة رسالة تصحيح
  loadFilters();
  
  console.log('بدء تحميل الشكاوى...'); // إضافة رسالة تصحيح
  loadComplaints();

  // إضافة مستمعي الأحداث للفلاتر
  const dateFilter = document.getElementById('dateFilter');
  if (dateFilter) {
    dateFilter.addEventListener('change', applyFilters);
  }

  const searchBox = document.querySelector('.search-box');
  if (searchBox) {
    searchBox.addEventListener('input', applyFilters);
  }

  const dropdowns = document.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    dropdown.addEventListener('change', applyFilters);
  });
  
  console.log('تم إعداد جميع الأحداث بنجاح'); // إضافة رسالة تصحيح
});






