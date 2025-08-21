# إصلاح مشكلة عرض تفاصيل الشكوى المحددة

## 🎯 المشكلة
النظام لا يعرض تفاصيل الشكوى المحددة بشكل صحيح، بل يعرض شكوى واحدة فقط.

## 🔧 الحلول المطبقة

### 1. تحسين الانتقال من الإشعارات

#### **في ملف `login/home.js`:**
```javascript
// حفظ معرف الشكوى في localStorage كنسخة احتياطية
localStorage.setItem('selectedComplaintId', id);

// إغلاق نافذة الإشعارات
document.getElementById('notifModal').style.display = 'none';

// الانتقال لصفحة التفاصيل مع معرف الشكوى المحددة
window.location.href = `/general complaints/details.html?id=${id}`;
```

### 2. تحسين تحميل البيانات

#### **في ملف `general complaints/details.js`:**
```javascript
// جلب معرف الشكوى من الرابط أو localStorage
const complaintIdFromUrl = getQueryParam('id');
console.log('معرف الشكوى من الرابط:', complaintIdFromUrl);

// إذا لم يوجد id في الرابط، جرب localStorage
let complaintId = complaintIdFromUrl;
if (!complaintId) {
  complaintId = localStorage.getItem('selectedComplaintId');
  console.log('معرف الشكوى من localStorage:', complaintId);
}

// إضافة token للمصادقة
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
const headers = {
  'Content-Type': 'application/json'
};

if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}

// جلب البيانات مع المصادقة
const response = await fetch(`${API_BASE_URL}/complaints/details/${complaintId}`, {
  method: 'GET',
  headers: headers
});

console.log('استجابة API:', response.status, response.statusText);
console.log('بيانات API:', data);
```

### 3. تحسين معالجة البيانات

#### **أ. التحقق من البيانات:**
```javascript
// التحقق من وجود معرف الشكوى
if (!complaintData.ComplaintID) {
  console.error('معرف الشكوى غير موجود في البيانات:', complaintData);
  alert('معرف الشكوى غير موجود في البيانات');
  return;
}
```

#### **ب. دعم أسماء متعددة للحقول:**
```javascript
// الاسم الكامل
const patientName = complaintData.PatientName || complaintData.FullName || complaintData.Name || 'غير محدد';

// رقم الهوية
const nationalId = complaintData.NationalID_Iqama || complaintData.NationalID || complaintData.IDNumber || 'غير محدد';

// رقم الجوال
const mobileNumber = complaintData.ContactNumber || complaintData.PhoneNumber || complaintData.MobileNumber || 'غير محدد';
```

### 4. تحسين رسائل التصحيح

#### **رسائل تحميل واضحة:**
```javascript
// إظهار رسالة تحميل مع رقم الشكوى
complaintTitle.textContent = `جاري تحميل تفاصيل الشكوى رقم #${complaintId}...`;

// رسائل تصحيح مفصلة
console.log('معرف الشكوى من الرابط:', complaintIdFromUrl);
console.log('معرف الشكوى من localStorage:', complaintId);
console.log('استجابة API:', response.status, response.statusText);
console.log('بيانات API:', data);
console.log('تم جلب بيانات الشكوى بنجاح:', complaintData);
```

## 🚨 معالجة الأخطاء المحسنة

### 1. أخطاء التحميل:
```javascript
if (!complaintData) {
  console.error('لا توجد بيانات شكوى متاحة');
  alert('لا توجد بيانات شكوى متاحة');
  return;
}
```

### 2. أخطاء API:
```javascript
if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
```

### 3. أخطاء البيانات:
```javascript
if (!complaintData.ComplaintID) {
  console.error('معرف الشكوى غير موجود في البيانات:', complaintData);
  alert('معرف الشكوى غير موجود في البيانات');
  return;
}
```

## 📱 كيفية الاختبار

### 1. اختبار الانتقال من الإشعارات:
1. افتح الصفحة الرئيسية
2. اضغط على زر الإشعارات (الجرس)
3. اختر شكوى من القائمة
4. اضغط على زر "التفاصيل"
5. تأكد من الانتقال لصفحة التفاصيل مع معرف الشكوى الصحيح

### 2. اختبار عرض البيانات:
1. افتح Developer Tools (F12)
2. انتقل إلى Console
3. تأكد من ظهور رسائل التصحيح
4. تحقق من أن البيانات تظهر بشكل صحيح

### 3. اختبار معالجة الأخطاء:
1. جرب الانتقال بدون معرف شكوى
2. جرب الانتقال مع معرف شكوى غير صحيح
3. تأكد من ظهور رسائل الخطأ المناسبة

## 🌐 API Endpoints المستخدمة

### جلب تفاصيل الشكوى:
```
GET /api/complaints/details/:complaintId
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
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

## 📋 قائمة الملفات المحدثة

1. **`login/home.js`** - تحسين الانتقال من الإشعارات
2. **`general complaints/details.js`** - تحسين تحميل وعرض البيانات

## ✅ النتائج المتوقعة

- **عرض تفاصيل الشكوى المحددة فقط** عند الضغط على "التفاصيل"
- **رسائل تصحيح مفصلة** لتتبع عملية التحميل
- **معالجة أفضل للأخطاء** والقيم الفارغة
- **دعم أسماء متعددة للحقول** لضمان التوافق
- **مصادقة محسنة** مع إضافة token
- **نسخة احتياطية** من معرف الشكوى في localStorage

## 🔍 خطوات التشخيص

### 1. فتح Developer Tools:
- اضغط F12
- انتقل إلى Console
- ابحث عن رسائل التصحيح

### 2. فحص Network:
- انتقل إلى Network tab
- اضغط على "التفاصيل"
- تحقق من طلب API
- تحقق من الاستجابة

### 3. فحص localStorage:
- انتقل إلى Application tab
- ابحث عن `selectedComplaintId`
- تحقق من القيمة المخزنة

### 4. فحص URL:
- تحقق من وجود `?id=123` في الرابط
- تأكد من صحة معرف الشكوى
