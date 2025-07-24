// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let currentComplaint = null;
let complaintHistory = [];

// تحميل بيانات الشكوى والتاريخ
async function loadComplaintData() {
  try {
    console.log('بدء تحميل بيانات الشكوى...'); // إضافة رسالة تصحيح
    
    const selectedComplaint = localStorage.getItem("selectedComplaint");
    if (!selectedComplaint) {
      alert("لا توجد بيانات شكوى متاحة");
      goBack();
      return;
    }

    currentComplaint = JSON.parse(selectedComplaint);
    console.log('بيانات الشكوى:', currentComplaint);

    // تحميل سجل التاريخ
    console.log('بدء تحميل سجل التاريخ...'); // إضافة رسالة تصحيح
    await loadComplaintHistory();

    // عرض بيانات الشكوى
    console.log('بدء عرض بيانات الشكوى...'); // إضافة رسالة تصحيح
    displayComplaintInfo();

    console.log('تم تحميل البيانات بنجاح'); // إضافة رسالة تصحيح

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
    complaintNumberElement.textContent = `#${currentComplaint.ComplaintID}`;
  }

  const complaintNumber2Element = document.getElementById('complaintNumber2');
  if (complaintNumber2Element) {
    complaintNumber2Element.textContent = `#${currentComplaint.ComplaintID}`;
  }

  // عرض حالة الشكوى
  const statusElement = document.getElementById('complaintStatus');
  if (statusElement) {
    statusElement.textContent = currentComplaint.CurrentStatus || 'جديدة';
    statusElement.className = `status-badge ${getStatusClass(currentComplaint.CurrentStatus)}`;
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

  const medicalFileElement = document.getElementById('medicalFileNumber');
  if (medicalFileElement) {
    medicalFileElement.textContent = currentComplaint.NationalID_Iqama || 'غير محدد';
  }

  const mobileElement = document.getElementById('mobileNumber');
  if (mobileElement) {
    mobileElement.textContent = currentComplaint.ContactNumber || 'غير محدد';
  }

  const departmentElement = document.getElementById('departmentName');
  if (departmentElement) {
    departmentElement.textContent = currentComplaint.DepartmentName || 'غير محدد';
  }

  // عرض تاريخ إنشاء الشكوى
  const creationDateElement = document.getElementById('creationDate');
  if (creationDateElement && currentComplaint.ComplaintDate) {
    const creationDate = new Date(currentComplaint.ComplaintDate);
    creationDateElement.textContent = creationDate.toLocaleDateString('ar-SA') + ' - ' + 
                                     creationDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  }
}

// تحميل سجل التاريخ
async function loadComplaintHistory() {
  try {
    console.log('جلب التاريخ للشكوى:', currentComplaint.ComplaintID); // إضافة رسالة تصحيح
    
    const response = await fetch(`${API_BASE_URL}/responses/history/${currentComplaint.ComplaintID}`);
    const data = await response.json();
    
    console.log('استجابة التاريخ:', data); // إضافة رسالة تصحيح
    
    if (data.success) {
      complaintHistory = data.data;
      console.log('عدد سجلات التاريخ:', complaintHistory.length); // إضافة رسالة تصحيح
      displayComplaintHistory();
    } else {
      console.error('خطأ في جلب التاريخ:', data.message);
    }
  } catch (error) {
    console.error('خطأ في تحميل سجل التاريخ:', error);
  }
}

// عرض سجل التاريخ
function displayComplaintHistory() {
  console.log('بدء عرض سجل التاريخ...'); // إضافة رسالة تصحيح
  
  const historyContainer = document.getElementById('historyContainer');
  if (!historyContainer) {
    console.error('لم يتم العثور على حاوية التاريخ'); // إضافة رسالة تصحيح
    return;
  }

  console.log('عدد سجلات التاريخ للعرض:', complaintHistory.length); // إضافة رسالة تصحيح

  if (complaintHistory.length === 0) {
    console.log('لا توجد سجلات تاريخ للعرض'); // إضافة رسالة تصحيح
    historyContainer.innerHTML = '<tr><td colspan="4" class="no-history">لا يوجد سجل تاريخ لهذه الشكوى</td></tr>';
    return;
  }

  const historyHTML = complaintHistory.map(history => {
    const actionDate = new Date(history.ActionDate);
    const formattedDate = actionDate.toLocaleDateString('ar-SA') + ' - ' + 
                         actionDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    console.log('إنشاء صف للتاريخ:', history.Action); // إضافة رسالة تصحيح

    return `
      <tr>
        <td>${history.Details || 'لا توجد تفاصيل إضافية'}</td>
        <td>${history.EmployeeName}</td>
        <td>${formattedDate}</td>
        <td>${history.Action}</td>
      </tr>
    `;
  }).join('');

  console.log('تم إنشاء HTML للتاريخ'); // إضافة رسالة تصحيح
  historyContainer.innerHTML = historyHTML;
  console.log('تم عرض سجل التاريخ بنجاح'); // إضافة رسالة تصحيح
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

// طباعة الصفحة
function printPage() {
  window.print();
}

// تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  loadComplaintData();
});





