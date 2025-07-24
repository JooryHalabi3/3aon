// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let currentComplaint = null;
let availableStatuses = [];

// تحميل بيانات الشكوى
async function loadComplaintData() {
  try {
    const selectedComplaint = localStorage.getItem("selectedComplaint");
    if (!selectedComplaint) {
      alert("لا توجد بيانات شكوى متاحة");
      goBack();
      return;
    }

    currentComplaint = JSON.parse(selectedComplaint);
    console.log('بيانات الشكوى:', currentComplaint);

    // تحميل الحالات المتاحة
    const statusesResponse = await fetch(`${API_BASE_URL}/responses/statuses`);
    const statusesData = await statusesResponse.json();
    
    if (statusesData.success) {
      availableStatuses = statusesData.data;
      populateStatuses();
    }

    // عرض بيانات الشكوى
    displayComplaintInfo();

  } catch (error) {
    console.error('خطأ في تحميل بيانات الشكوى:', error);
    alert("خطأ في تحميل بيانات الشكوى");
  }
}

// عرض معلومات الشكوى
function displayComplaintInfo() {
  if (!currentComplaint) return;

  // عرض رقم الشكوى
  const complaintNumberElement = document.getElementById('complaintNumber');
  if (complaintNumberElement) {
    complaintNumberElement.textContent = `شكوى #${currentComplaint.ComplaintID}`;
  }

  // عرض الحالة الحالية
  const currentStatusElement = document.getElementById('currentStatus');
  if (currentStatusElement) {
    currentStatusElement.textContent = currentComplaint.CurrentStatus || 'جديدة';
    currentStatusElement.className = `status-badge ${getStatusClass(currentComplaint.CurrentStatus)}`;
  }

  // عرض تفاصيل الشكوى
  const detailsElement = document.getElementById('complaintDetails');
  if (detailsElement) {
    detailsElement.textContent = currentComplaint.ComplaintDetails || 'لا توجد تفاصيل';
  }

  // عرض معلومات المريض
  const patientNameElement = document.getElementById('patientName');
  if (patientNameElement) {
    patientNameElement.textContent = currentComplaint.PatientName || 'غير محدد';
  }

  const patientIdElement = document.getElementById('patientId');
  if (patientIdElement) {
    patientIdElement.textContent = currentComplaint.NationalID_Iqama || 'غير محدد';
  }
}

// ملء الحالات المتاحة
function populateStatuses() {
  const statusSelect = document.getElementById('newStatus');
  if (statusSelect) {
    statusSelect.innerHTML = '<option value="">اختر الحالة الجديدة</option>';
    
    availableStatuses.forEach(status => {
      const option = document.createElement('option');
      option.value = status.id;
      option.textContent = status.name;
      option.className = `status-${status.color}`;
      
      // إزالة الحالة الحالية من القائمة
      if (status.id !== currentComplaint.CurrentStatus) {
        statusSelect.appendChild(option);
      }
    });
  }
}

// تحديث حالة الشكوى
async function updateComplaintStatus() {
  try {
    const newStatus = document.getElementById('newStatus').value;
    const notes = document.getElementById('notes').value.trim();

    if (!newStatus) {
      alert('يرجى اختيار الحالة الجديدة');
      return;
    }

    if (newStatus === currentComplaint.CurrentStatus) {
      alert('الحالة المختارة هي نفس الحالة الحالية');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/responses/status/${currentComplaint.ComplaintID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newStatus: newStatus,
        notes: notes,
        employeeId: 1 // سيتم تحديثه لاحقاً حسب المستخدم المسجل دخوله
      })
    });

    const data = await response.json();

    if (data.success) {
      alert('تم تحديث حالة الشكوى بنجاح');
      
      // تحديث الحالة في الواجهة
      currentComplaint.CurrentStatus = newStatus;
      if (document.getElementById('currentStatus')) {
        document.getElementById('currentStatus').textContent = newStatus;
        document.getElementById('currentStatus').className = `status-badge ${getStatusClass(newStatus)}`;
      }
      
      // مسح النموذج
      document.getElementById('newStatus').value = '';
      document.getElementById('notes').value = '';
      
      // إعادة ملء الحالات المتاحة
      populateStatuses();
      
    } else {
      alert('خطأ في تحديث الحالة: ' + data.message);
    }

  } catch (error) {
    console.error('خطأ في تحديث الحالة:', error);
    alert('حدث خطأ في الخادم');
  }
}

// الحصول على كلاس CSS للحالة
function getStatusClass(status) {
  switch (status) {
    case 'جديدة':
      return 'blue';
    case 'قيد المراجعة':
    case 'قيد المعالجة':
      return 'yellow';
    case 'تم الرد':
    case 'تم الحل':
      return 'green';
    case 'مغلقة':
      return 'gray';
    default:
      return 'blue';
  }
}

// الذهاب للخلف
function goBack() {
  window.history.back();
}

// تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  loadComplaintData();
});







function goBack() {
  window.history.back();
}
