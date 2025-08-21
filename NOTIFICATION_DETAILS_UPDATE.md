# تحديث نظام الإشعارات وعرض التفاصيل

## 🎯 الهدف
تم تحديث نظام الإشعارات في `login/home.html` لضمان أن الضغط على زر "التفاصيل" في الإشعارات يعرض تفاصيل الشكوى المحددة فقط.

## 📝 التحديثات المنجزة

### 1. تحديث ملف `login/home.js`

#### **التغيير الرئيسي:**
```javascript
// قبل التحديث
window.open(`/general complaints/details.html?id=${id}`, '_blank');

// بعد التحديث
// إغلاق نافذة الإشعارات
document.getElementById('notifModal').style.display = 'none';
// الانتقال لصفحة التفاصيل مع معرف الشكوى
window.location.href = `/general complaints/details.html?id=${id}`;
```

#### **التحسينات:**
- إغلاق نافذة الإشعارات تلقائياً عند الضغط على التفاصيل
- الانتقال المباشر لصفحة التفاصيل بدلاً من فتح نافذة جديدة
- تمرير معرف الشكوى عبر URL parameter

### 2. تحسين ملف `general complaints/details.js`

#### **أ. تحسين دالة `loadComplaintDetails`:**
```javascript
// إضافة رسائل تصحيح مفصلة
console.log('جلب تفاصيل الشكوى رقم:', complaintIdFromUrl);
console.log('تم جلب بيانات الشكوى بنجاح:', complaintData);

// تحسين رسائل الخطأ
console.error('فشل في جلب بيانات الشكوى:', data.message);
alert('تعذر جلب بيانات الشكوى: ' + (data.message || 'خطأ غير معروف'));
```

#### **ب. تحسين دالة `updateComplainantInfo`:**
```javascript
// دعم أسماء متعددة للحقول
const patientName = complaintData.PatientName || complaintData.FullName || 'غير محدد';
const nationalId = complaintData.NationalID_Iqama || complaintData.NationalID || 'غير محدد';
```

#### **ج. تحسين دالة `updateComplaintInfo`:**
```javascript
// دعم أسماء متعددة للحقول
const complaintType = complaintData.ComplaintTypeName || complaintData.TypeName || 'غير محدد';
const subType = complaintData.SubTypeName || complaintData.SubcategoryName || 'غير محدد';
const details = complaintData.ComplaintDetails || complaintData.Details || 'لا توجد تفاصيل';
```

#### **د. تحسين دالة `updateAttachments`:**
```javascript
// دعم أسماء متعددة للحقول
const fileName = attachment.FileName || attachment.name || 'ملف غير معروف';
const fileType = attachment.FileType || attachment.type || 'application/octet-stream';
const fileSize = attachment.FileSize || attachment.size || 0;
const filePath = attachment.FilePath || attachment.path || '';

// التحقق من وجود URL قبل عرض أزرار الإجراءات
${fileUrl ? `
<div class="attachment-actions">
  <button onclick="previewAttachment('${fileUrl}', '${fileName}', '${fileType}')">
    <i class="ri-eye-line"></i>
    <span data-ar="معاينة" data-en="Preview">معاينة</span>
  </button>
  <button onclick="downloadFile('${fileUrl}', '${fileName}')">
    <i class="ri-download-2-line"></i>
    <span data-ar="تحميل" data-en="Download">تحميل</span>
  </button>
</div>
` : ''}
```

#### **ه. تحسين دالة `updateResponse`:**
```javascript
// دعم أسماء متعددة للحقول
const resolutionDetails = complaintData.ResolutionDetails || complaintData.ResponseDetails || complaintData.ReplyDetails;
```

#### **و. تحسين دالة `updateHistory`:**
```javascript
// دعم أسماء متعددة للحقول
const historyData = complaintData.history || complaintData.History || [];
const timestamp = new Date(item.Timestamp || item.CreatedAt || item.Date);
const stage = item.Stage || item.Status || 'تحديث';
const remarks = item.Remarks || item.Comment || item.Description || 'لا توجد ملاحظات';
const employeeName = item.EmployeeName || item.Employee || item.CreatedBy || '';
```

## 🔧 الميزات الجديدة

### 1. معالجة أفضل للبيانات
- دعم أسماء متعددة للحقول لضمان التوافق مع مختلف مصادر البيانات
- معالجة أفضل للقيم الفارغة أو غير المعرفة
- رسائل خطأ أكثر وضوحاً وتفصيلاً

### 2. تحسين تجربة المستخدم
- إغلاق تلقائي لنافذة الإشعارات عند الضغط على التفاصيل
- انتقال مباشر لصفحة التفاصيل
- عرض رسائل تصحيح مفصلة في console للمطورين

### 3. مرونة أكبر في عرض البيانات
- دعم تنسيقات مختلفة للتواريخ
- معالجة أفضل للمرفقات
- عرض التاريخ والوقت بتنسيق عربي

## 🌐 API Endpoints المستخدمة

### جلب تفاصيل الشكوى:
```
GET /api/complaints/details/:complaintId
```

### الاستجابة المتوقعة:
```json
{
  "success": true,
  "data": {
    "complaint": {
      "ComplaintID": 123,
      "ComplaintDate": "2024-01-01T10:00:00Z",
      "ComplaintDetails": "تفاصيل الشكوى",
      "CurrentStatus": "جديدة",
      "PatientName": "اسم المريض",
      "NationalID_Iqama": "1234567890",
      "ContactNumber": "0501234567",
      "DepartmentName": "قسم الطوارئ",
      "ComplaintTypeName": "شكوى طبية",
      "SubTypeName": "شكوى علاج",
      "attachments": [...],
      "history": [...]
    }
  }
}
```

## 📱 كيفية الاستخدام

### 1. في الصفحة الرئيسية:
1. الضغط على زر الإشعارات (الجرس)
2. اختيار شكوى من القائمة
3. الضغط على زر "التفاصيل"
4. الانتقال التلقائي لصفحة تفاصيل الشكوى

### 2. في صفحة التفاصيل:
- عرض جميع معلومات الشكوى
- عرض بيانات المريض
- عرض المرفقات (إن وجدت)
- عرض الرد على الشكوى (إن وجد)
- عرض سجل التاريخ

## 🚨 معالجة الأخطاء

### 1. أخطاء الاتصال:
```javascript
catch (error) {
  console.error('خطأ في الاتصال بالخادم:', error);
  alert('خطأ في الاتصال بالخادم: ' + error.message);
  goBack();
}
```

### 2. أخطاء البيانات:
```javascript
if (!data.success) {
  console.error('فشل في جلب بيانات الشكوى:', data.message);
  alert('تعذر جلب بيانات الشكوى: ' + (data.message || 'خطأ غير معروف'));
  goBack();
}
```

### 3. معالجة القيم الفارغة:
```javascript
const patientName = complaintData.PatientName || complaintData.FullName || 'غير محدد';
const details = complaintData.ComplaintDetails || complaintData.Details || 'لا توجد تفاصيل';
```

## 🔄 التحديثات المستقبلية

### 1. إضافة ميزات جديدة:
- إشعارات فورية (WebSocket)
- تحديث تلقائي للصفحة
- إمكانية الرد على الشكوى من صفحة التفاصيل

### 2. تحسينات الأداء:
- تخزين مؤقت للبيانات
- تحميل تدريجي للمرفقات
- تحسين سرعة التحميل

### 3. تحسينات الواجهة:
- تصميم متجاوب أفضل
- رسوم متحركة سلسة
- دعم أفضل للغات

## 📋 قائمة الملفات المحدثة

1. **`login/home.js`** - تحديث منطق الإشعارات
2. **`general complaints/details.js`** - تحسين عرض التفاصيل

## ✅ النتائج المتوقعة

- عرض تفاصيل الشكوى المحددة فقط عند الضغط على "التفاصيل"
- تجربة مستخدم أفضل مع إغلاق تلقائي لنافذة الإشعارات
- معالجة أفضل للأخطاء والقيم الفارغة
- دعم أكبر لتنسيقات البيانات المختلفة
