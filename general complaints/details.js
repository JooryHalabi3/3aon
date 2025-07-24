// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let complaintData = null;

// تحميل بيانات الشكوى
async function loadComplaintDetails() {
  const selectedComplaint = localStorage.getItem("selectedComplaint");
  
  if (!selectedComplaint) {
    alert("لا توجد بيانات شكوى متاحة");
    goBack();
    return;
  }

  try {
    const complaintFromStorage = JSON.parse(selectedComplaint);
    console.log('بيانات الشكوى من localStorage:', complaintFromStorage);
    
    // جلب التفاصيل الكاملة من API
    const response = await fetch(`${API_BASE_URL}/complaints/details/${complaintFromStorage.ComplaintID}`);
    const data = await response.json();
    
    if (data.success) {
      complaintData = data.data.complaint;
      console.log('بيانات الشكوى من API:', complaintData);
      populateComplaintDetails();
    } else {
      // إذا فشل API، استخدم البيانات من localStorage
      console.log('فشل API، استخدام البيانات من localStorage');
      complaintData = complaintFromStorage;
      populateComplaintDetails();
    }
  } catch (error) {
    console.error('خطأ في تحميل بيانات الشكوى:', error);
    // استخدم البيانات من localStorage كبديل
    try {
      complaintData = JSON.parse(selectedComplaint);
      console.log('استخدام البيانات من localStorage كبديل');
      populateComplaintDetails();
    } catch (localError) {
      alert("خطأ في تحميل بيانات الشكوى");
      goBack();
    }
  }
}

// تعبئة تفاصيل الشكوى
function populateComplaintDetails() {
  if (!complaintData) return;

  // تحديث عنوان الشكوى
  const complaintTitle = document.querySelector('.complaint-title');
  if (complaintTitle) {
    complaintTitle.textContent = `تفاصيل الشكوى رقم ${complaintData.ComplaintID}`;
  }

  // تحديث تاريخ الشكوى
  const complaintDate = document.querySelector('.complaint-date');
  if (complaintDate) {
    const date = new Date(complaintData.ComplaintDate);
    const formattedDate = date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    complaintDate.textContent = formattedDate;
  }

  // تحديث حالة الشكوى
  const complaintStatus = document.querySelector('.complaint-status');
  if (complaintStatus) {
    complaintStatus.textContent = complaintData.CurrentStatus || 'جديدة';
  }

  // تحديث بيانات مقدم الشكوى
  updateComplainantInfo();

  // تحديث تفاصيل الشكوى
  updateComplaintInfo();

  // تحديث المرفقات
  updateAttachments();

  // تحديث الرد على الشكوى
  updateResponse();

  // تحديث سجل التاريخ
  updateHistory();

  // تحديث اللغة للعناصر الجديدة
  applyLanguage(currentLang);
}

// تحديث بيانات مقدم الشكوى
function updateComplainantInfo() {
  console.log('بيانات المريض:', complaintData);
  
  // تحديث الاسم الكامل
  const patientNameElement = document.getElementById('patientName');
  if (patientNameElement) {
    patientNameElement.textContent = complaintData.PatientName || 'غير محدد';
    console.log('تم تحديث الاسم:', complaintData.PatientName);
  }
  
  // تحديث رقم الهوية
  const nationalIdElement = document.getElementById('nationalId');
  if (nationalIdElement) {
    nationalIdElement.textContent = complaintData.NationalID_Iqama || 'غير محدد';
  }
  
  // تحديث رقم الملف الطبي (نفس رقم الهوية)
  const medicalFileElement = document.getElementById('medicalFileNumber');
  if (medicalFileElement) {
    medicalFileElement.textContent = complaintData.NationalID_Iqama || 'غير محدد';
  }
  
  // تحديث رقم الجوال
  const mobileElement = document.getElementById('mobileNumber');
  if (mobileElement) {
    mobileElement.textContent = complaintData.ContactNumber || 'غير محدد';
  }
}

// تحديث تفاصيل الشكوى
function updateComplaintInfo() {
  // تحديث القسم المرتبط
  const departmentElement = document.getElementById('departmentName');
  if (departmentElement) {
    departmentElement.textContent = complaintData.DepartmentName || 'غير محدد';
  }
  
  // تحديث تاريخ الزيارة
  const visitDateElement = document.getElementById('visitDate');
  if (visitDateElement) {
    const visitDate = new Date(complaintData.ComplaintDate);
    visitDateElement.textContent = visitDate.toLocaleDateString('ar-SA');
  }
  
  // تحديث نوع الشكوى الرئيسي
  const complaintTypeElement = document.getElementById('complaintTypeName');
  if (complaintTypeElement) {
    complaintTypeElement.textContent = complaintData.ComplaintTypeName || 'غير محدد';
  }
  
  // تحديث الشكوى الفرعية
  const subTypeElement = document.getElementById('subTypeName');
  if (subTypeElement) {
    subTypeElement.textContent = complaintData.SubTypeName || 'غير محدد';
  }

  // تحديث تفاصيل الشكوى
  const detailsElement = document.getElementById('complaintDetails');
  if (detailsElement) {
    detailsElement.textContent = complaintData.ComplaintDetails || 'لا توجد تفاصيل';
  }
}

// تحديث المرفقات
function updateAttachments() {
  const attachmentBox = document.querySelector('.attachment-box');
  if (attachmentBox) {
    // إذا كانت هناك مرفقات في البيانات
    if (complaintData.attachments && complaintData.attachments.length > 0) {
      const attachmentsHTML = complaintData.attachments.map(attachment => {
        const fileUrl = `http://localhost:3001/uploads/${attachment.path}`;
        const isImage = attachment.type && attachment.type.startsWith('image/');
        
        return `
          <div class="attachment-file">
            <i class="ri-${isImage ? 'image-line' : 'file-text-line'}"></i>
            <span>${attachment.name}</span>
            <small>(${(attachment.size / 1024 / 1024).toFixed(2)} MB)</small>
          </div>
          <div class="attachment-actions">
            <button onclick="previewAttachment('${fileUrl}', '${attachment.name}', '${attachment.type}')">
              <i class="ri-eye-line"></i>
              <span data-ar="معاينة" data-en="Preview">معاينة</span>
            </button>
            <button onclick="downloadFile('${fileUrl}', '${attachment.name}')">
              <i class="ri-download-2-line"></i>
              <span data-ar="تحميل" data-en="Download">تحميل</span>
            </button>
          </div>
        `;
      }).join('');
      
      attachmentBox.innerHTML = attachmentsHTML;
    } else {
      // رسالة إذا لم تكن هناك مرفقات
      attachmentBox.innerHTML = `
        <div class="attachment-file">
          <i class="ri-inbox-line"></i>
          <span data-ar="لا توجد مرفقات" data-en="No attachments">لا توجد مرفقات</span>
        </div>
      `;
    }
  }
}

// تحديث الرد على الشكوى
function updateResponse() {
  const replyBox = document.querySelector('.reply-box');
  if (replyBox) {
    // إذا كان هناك رد في البيانات
    if (complaintData.ResolutionDetails) {
      const replyDate = complaintData.ResolutionDate ? new Date(complaintData.ResolutionDate) : new Date();
      const formattedReplyDate = replyDate.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      replyBox.innerHTML = `
        <div class="reply-header">
          <span class="reply-from" data-ar="إدارة تجربة المريض" data-en="Patient Experience Department">إدارة تجربة المريض</span>
          <span class="reply-date">${formattedReplyDate}</span>
        </div>
        <div class="reply-text">${complaintData.ResolutionDetails}</div>
        <span class="reply-status" data-ar="تم الرد" data-en="Responded">تم الرد</span>
      `;
    } else {
      // إذا لم يكن هناك رد بعد
      replyBox.innerHTML = `
        <div class="reply-header">
          <span class="reply-from" data-ar="إدارة تجربة المريض" data-en="Patient Experience Department">إدارة تجربة المريض</span>
          <span class="reply-date" data-ar="قيد المعالجة" data-en="Under Processing">قيد المعالجة</span>
        </div>
        <div class="reply-text" data-ar="سيتم الرد على شكواك في أقرب وقت ممكن" data-en="Your complaint will be responded to as soon as possible">
          سيتم الرد على شكواك في أقرب وقت ممكن
        </div>
        <span class="reply-status" data-ar="قيد المعالجة" data-en="Under Processing">قيد المعالجة</span>
      `;
    }
  }
}

// تحديث سجل التاريخ
function updateHistory() {
  const historyContainer = document.getElementById('historyContainer');
  if (!historyContainer || !complaintData.history) return;

  if (complaintData.history.length === 0) {
    historyContainer.innerHTML = `
      <div class="history-item">
        <div class="history-text" data-ar="لا يوجد سجل تاريخ لهذه الشكوى" data-en="No history available for this complaint">
          لا يوجد سجل تاريخ لهذه الشكوى
        </div>
      </div>
    `;
    return;
  }

  const historyHTML = complaintData.history.map(item => {
    const timestamp = new Date(item.Timestamp);
    const formattedDate = timestamp.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="history-item">
        <div class="history-header">
          <span class="history-stage">${item.Stage}</span>
          <span class="history-date">${formattedDate}</span>
        </div>
        <div class="history-text">${item.Remarks}</div>
        ${item.EmployeeName ? `<div class="history-employee">بواسطة: ${item.EmployeeName}</div>` : ''}
        ${item.OldStatus && item.NewStatus ? `
          <div class="history-status-change">
            <span class="status-change">${item.OldStatus} → ${item.NewStatus}</span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  historyContainer.innerHTML = historyHTML;
}

// وظائف إضافية
function previewAttachment(url, filename, type) {
  if (url) {
    if (type && type.startsWith('image/')) {
      // فتح الصورة في نافذة جديدة
      window.open(url, '_blank');
    } else if (type === 'application/pdf') {
      // فتح PDF في نافذة جديدة
      window.open(url, '_blank');
    } else {
      alert("لا يمكن معاينة هذا النوع من الملفات. يرجى تحميله.");
    }
  } else {
    alert("لا يمكن معاينة المرفق في الوقت الحالي");
  }
}

function downloadFile(url, filename) {
  if (url) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'مرفق_الشكوى';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    alert("لا يمكن تحميل المرفق في الوقت الحالي");
  }
}

function reopenComplaint() {
  if (confirm("هل تريد إعادة فتح هذه الشكوى؟")) {
    // هنا يمكن إضافة منطق إعادة فتح الشكوى
    alert("تم إرسال طلب إعادة فتح الشكوى");
  }
}

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

  // تحميل تفاصيل الشكوى
  loadComplaintDetails();
});





