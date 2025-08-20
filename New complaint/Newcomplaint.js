// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let departments = [];
let complaintTypes = [];
let subTypes = [];
let uploadedFiles = [];
let currentLang = localStorage.getItem('lang') || 'ar';

// يضيف ترويسة Authorization فقط إذا كان فيه توكن محفوظ
function authHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ثوابت الملفات
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 ميجابايت
const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// فئات الملفات
const FILE_CATEGORIES = {
  'image/jpeg': 'صورة',
  'image/jpg': 'صورة',
  'image/png': 'صورة',
  'image/gif': 'صورة',
  'image/webp': 'صورة',
  'application/pdf': 'PDF',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word'
};

// جلب الأقسام من الباك إند
async function loadDepartments() {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/departments`, {
      headers: authHeaders()
    });
    const data = await response.json();

    if (data.success) {
      departments = data.data;
      populateDepartmentSelect();
    } else {
      showNotification('خطأ في جلب الأقسام', 'error');
    }
  } catch (error) {
    console.error('خطأ في الاتصال بالخادم:', error);
    showNotification('خطأ في الاتصال بالخادم', 'error');
  }
}

// جلب أنواع الشكاوى من الباك إند
async function loadComplaintTypes() {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/types`, {
  headers: authHeaders()
});
    const data = await response.json();

    if (data.success) {
      complaintTypes = data.data;
      populateComplaintTypeSelect();
    } else {
      showNotification('خطأ في جلب أنواع الشكاوى', 'error');
    }
  } catch (error) {
    console.error('خطأ في الاتصال بالخادم:', error);
    showNotification('خطأ في الاتصال بالخادم', 'error');
  }
}

// جلب التصنيفات الفرعية
async function loadSubTypes(complaintTypeID) {
  try {
const response = await fetch(`${API_BASE_URL}/complaints/subtypes/${complaintTypeID}`, {
  headers: authHeaders()
});
    const data = await response.json();

    if (data.success) {
      subTypes = data.data;
      populateSubTypeSelect();
    } else {
      showNotification('خطأ في جلب التصنيفات الفرعية', 'error');
    }
  } catch (error) {
    console.error('خطأ في الاتصال بالخادم:', error);
    showNotification('خطأ في الاتصال بالخادم', 'error');
  }
}

// ملء قائمة الأقسام
function populateDepartmentSelect() {
  const departmentSelect = document.getElementById("department");
  departmentSelect.innerHTML = '<option disabled selected data-ar="اختر القسم" data-en="Select Department">اختر القسم</option>';

  departments.forEach(dept => {
    const option = document.createElement("option");
    option.value = dept.DepartmentID;
    option.textContent = dept.DepartmentName;
    departmentSelect.appendChild(option);
  });
}

// ملء قائمة أنواع الشكاوى
function populateComplaintTypeSelect() {
  const mainTypeSelect = document.getElementById("mainType");
  mainTypeSelect.innerHTML = '<option disabled selected data-ar="اختر نوع الشكوى" data-en="Select Complaint Type">اختر نوع الشكوى</option>';

  complaintTypes.forEach(type => {
    const option = document.createElement("option");
    option.value = type.ComplaintTypeID;
    option.textContent = type.TypeName;
    mainTypeSelect.appendChild(option);
  });
}

// ملء قائمة التصنيفات الفرعية
function populateSubTypeSelect() {
  const subTypeSelect = document.getElementById("subType");
  subTypeSelect.innerHTML = '<option disabled selected data-ar="اختر التصنيف الفرعي" data-en="Select Subcategory">اختر التصنيف الفرعي</option>';

  subTypes.forEach(subType => {
    const option = document.createElement("option");
    option.value = subType.SubTypeID;
    option.textContent = subType.SubTypeName;
    subTypeSelect.appendChild(option);
  });
}

// عند تغيير نوع الشكوى الرئيسي
function onMainTypeChange() {
  const mainTypeSelect = document.getElementById("mainType");
  const selectedTypeID = mainTypeSelect.value;

  if (selectedTypeID) {
    loadSubTypes(selectedTypeID);
  } else {
    // إعادة تعيين التصنيف الفرعي
    const subTypeSelect = document.getElementById("subType");
    subTypeSelect.innerHTML = '<option disabled selected data-ar="اختر التصنيف الفرعي" data-en="Select Subcategory">اختر التصنيف الفرعي</option>';
  }
}

// التحقق من صحة الملف
function validateFile(file) {
  // التحقق من نوع الملف
  if (!ALLOWED_TYPES.includes(file.type)) {
    showNotification(`نوع الملف غير مدعوم: ${file.name}`, 'error');
    return false;
  }

  // التحقق من حجم الملف
  if (file.size > MAX_FILE_SIZE) {
    showNotification(`حجم الملف كبير جداً: ${file.name}`, 'error');
    return false;
  }

  return true;
}

// تنسيق حجم الملف
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// الحصول على أيقونة الملف
function getFileIcon(fileType) {
  if (fileType.startsWith('image/')) {
    return '/icon/document1.png';
  } else if (fileType === 'application/pdf') {
    return '/icon/pdf.png';
  } else if (fileType.includes('word')) {
    return '/icon/doc.png';
  }
  return '/icon/document.png';
}

// معالجة رفع الملفات
function handleFileUpload(event) {
  const files = Array.from(event.target.files);
  const validFiles = files.filter(validateFile);

  if (validFiles.length !== files.length) {
    event.target.value = '';
    return;
  }

  validFiles.forEach(file => {
    addFileToList(file);
  });

  updateAttachmentsList();
  event.target.value = '';
}

// إضافة ملف إلى القائمة
function addFileToList(file) {
  const fileId = Date.now() + Math.random();
  const fileObj = {
    id: fileId,
    file: file,
    name: file.name,
    size: file.size,
    type: file.type,
    status: 'pending'
  };

  uploadedFiles.push(fileObj);
  createFilePreview(fileObj);
}

// إنشاء معاينة الملف
function createFilePreview(fileObj) {
  const filesGrid = document.getElementById('filesGrid');
  const fileItem = document.createElement('div');
  fileItem.className = 'file-item';
  fileItem.id = `file-${fileObj.id}`;

  let previewContent = '';

  if (fileObj.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = fileItem.querySelector('.file-preview');
      if (img) img.src = e.target.result;
    };
    reader.readAsDataURL(fileObj.file);
    previewContent = `<img src="" alt="معاينة" class="file-preview">`;
  } else {
    previewContent = `<img src="${getFileIcon(fileObj.type)}" alt="أيقونة الملف" class="file-preview">`;
  }

  fileItem.innerHTML = `
    <button class="remove-file" onclick="removeFile('${fileObj.id}')" title="حذف الملف">×</button>
    ${previewContent}
    <div class="file-info">
      <p class="file-name" title="${fileObj.name}">${fileObj.name}</p>
      <p class="file-size">${formatFileSize(fileObj.size)}</p>
    </div>
  `;

  filesGrid.appendChild(fileItem);
}

// حذف ملف
function removeFile(fileId) {
  uploadedFiles = uploadedFiles.filter(f => f.id !== fileId);
  const fileElement = document.getElementById(`file-${fileId}`);
  if (fileElement) {
    fileElement.remove();
  }
  updateAttachmentsList();
}

// تحديث قائمة المرفقات
function updateAttachmentsList() {
  const attachmentsList = document.getElementById('attachmentsList');
  const uploadZone = document.getElementById('uploadZone');

  if (uploadedFiles.length > 0) {
    attachmentsList.style.display = 'block';
    uploadZone.style.display = 'none';
  } else {
    attachmentsList.style.display = 'none';
    uploadZone.style.display = 'block';
  }
}

// إعداد Drag & Drop
function setupDragAndDrop() {
  const uploadZone = document.getElementById('uploadZone');

  uploadZone.addEventListener('click', () => {
    document.getElementById('attachments').click();
  });

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(validateFile);

    if (validFiles.length !== files.length) {
      showNotification('بعض الملفات غير مدعومة', 'error');
    }

    validFiles.forEach(file => {
      addFileToList(file);
    });

    updateAttachmentsList();
  });
}

// عرض الإشعارات
function showNotification(message, type = 'info') {
  // إنشاء عنصر الإشعار
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // إضافة الأنماط
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
  `;

  // تحديد اللون حسب النوع
  switch (type) {
    case 'success':
      notification.style.backgroundColor = '#48bb78';
      break;
    case 'error':
      notification.style.backgroundColor = '#f56565';
      break;
    case 'warning':
      notification.style.backgroundColor = '#ed8936';
      break;
    default:
      notification.style.backgroundColor = '#3182ce';
  }

  document.body.appendChild(notification);

  // عرض الإشعار
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

  // إخفاء الإشعار بعد 3 ثوان
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// التحقق من صحة النموذج
function validateForm() {
  const requiredFields = [
    { id: 'fullName', name: 'الاسم الكامل' },
    { id: 'nationalId', name: 'رقم الهوية' },
    { id: 'gender', name: 'الجنس' },
    { id: 'mobile', name: 'رقم الجوال' },
    { id: 'department', name: 'القسم' },
    { id: 'visitDate', name: 'تاريخ الزيارة' },
    { id: 'mainType', name: 'نوع الشكوى' },
    { id: 'subType', name: 'التصنيف الفرعي' },
    { id: 'details', name: 'تفاصيل الشكوى' }
  ];

  for (const field of requiredFields) {
    const element = document.getElementById(field.id);
    const value = element.value.trim();

    if (!value || value === 'اختر الجنس' || value === 'اختر القسم' ||
      value === 'اختر نوع الشكوى' || value === 'اختر التصنيف الفرعي') {
      showNotification(`يرجى تعبئة حقل: ${field.name}`, 'error');
      element.focus();
      return false;
    }
  }

  return true;
}

// إرسال الشكوى إلى الباك إند
async function submitComplaint() {
  if (!validateForm()) {
    return;
  }

  const submitButton = document.querySelector('.submit-btn button');
  const originalText = submitButton.textContent;

  // تعطيل الزر وإظهار حالة التحميل
  submitButton.disabled = true;
  submitButton.textContent = currentLang === 'ar' ? 'جاري الإرسال...' : 'Sending...';

  try {
    // إنشاء FormData لإرسال البيانات مع المرفقات
    const formData = new FormData();

    // إضافة البيانات النصية
    formData.append('patientName', document.getElementById("fullName").value.trim());
    formData.append('nationalId', document.getElementById("nationalId").value.trim());
    formData.append('gender', document.getElementById("gender").value);
    formData.append('contactNumber', document.getElementById("mobile").value.trim());
    formData.append('departmentID', document.getElementById("department").value);
    formData.append('visitDate', document.getElementById("visitDate").value);
    formData.append('complaintTypeID', document.getElementById("mainType").value);
    formData.append('subTypeID', document.getElementById("subType").value);
    formData.append('complaintDetails', document.getElementById("details").value.trim());

    // إضافة المرفقات
    uploadedFiles.forEach(fileObj => {
      formData.append('attachments', fileObj.file);
    });

    // إرسال البيانات إلى الباك إند
const response = await fetch(`${API_BASE_URL}/complaints/submit`, {
  method: 'POST',
  headers: authHeaders(),
  body: formData
});

    const data = await response.json();

    if (data.success) {
      // حفظ البيانات في localStorage
      const complaintData = {
        patientName: document.getElementById("fullName").value.trim(),
        nationalId: document.getElementById("nationalId").value.trim(),
        gender: document.getElementById("gender").value,
        contactNumber: document.getElementById("mobile").value.trim(),
        departmentID: document.getElementById("department").value,
        visitDate: document.getElementById("visitDate").value,
        complaintTypeID: document.getElementById("mainType").value,
        subTypeID: document.getElementById("subType").value,
        complaintDetails: document.getElementById("details").value.trim(),
        complaintID: data.data.complaintID,
        attachments: data.data.attachments || [],
        savedInDatabase: true,
        submittedAt: new Date().toISOString()
      };

      localStorage.setItem("complaint", JSON.stringify(complaintData));

      showNotification('تم إرسال الشكوى بنجاح!', 'success');

      // الانتقال إلى صفحة التأكيد بعد ثانيتين
      setTimeout(() => {
        window.location.href = "confirmation.html";
      }, 2000);
    } else {
      showNotification(`خطأ في إرسال الشكوى: ${data.message}`, 'error');
    }
  } catch (error) {
    console.error('خطأ في إرسال الشكوى:', error);
    showNotification('حدث خطأ في الاتصال بالخادم', 'error');
  } finally {
    // إعادة تفعيل الزر
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

// تطبيق اللغة
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  // الاتجاه واللغة
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';
  document.body.className = `lang-${lang}`;

  // تغيير النصوص بناءً على اللغة
  document.querySelectorAll('[data-ar]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  // تغيير placeholder بناءً على اللغة
  document.querySelectorAll('[data-ar-placeholder]').forEach(el => {
    el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
  });

  // تغيير نصوص الأزرار بناءً على اللغة
  document.querySelectorAll('span[data-ar]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  // زر اللغة نفسه
  const langText = document.getElementById('langText');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  }
}

// العودة للصفحة السابقة
function goBack() {
  window.history.back();
}

// تحميل البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);

  // إعداد زر تبديل اللغة
  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }

  // تحميل البيانات
  loadDepartments();
  loadComplaintTypes();

  // إعداد Drag & Drop
  setupDragAndDrop();

  // إضافة مستمع لتغيير نوع الشكوى الرئيسي
  const mainTypeSelect = document.getElementById("mainType");
  if (mainTypeSelect) {
    mainTypeSelect.addEventListener('change', onMainTypeChange);
  }

  // إضافة مستمع لتاريخ الزيارة (لا يمكن أن يكون في المستقبل)
  const visitDateInput = document.getElementById("visitDate");
  if (visitDateInput) {
    const today = new Date().toISOString().split('T')[0];
    visitDateInput.max = today;
  }
});
ئ