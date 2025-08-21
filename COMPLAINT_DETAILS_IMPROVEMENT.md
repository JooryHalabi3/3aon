# تحسينات صفحة تفاصيل الشكوى

## 🎯 الهدف
تحسين عرض تفاصيل الشكوى المحددة في صفحة التفاصيل لضمان أن المستخدم يرى البيانات الخاصة بالشكوى المحددة فقط بشكل واضح ومفصل.

## 📝 التحسينات المنجزة

### 1. تحسين الانتقال من الإشعارات

#### **في ملف `login/home.js`:**
```javascript
// إضافة رسائل تصحيح مفصلة
console.log('الانتقال لتفاصيل الشكوى رقم:', id);

// إغلاق نافذة الإشعارات
document.getElementById('notifModal').style.display = 'none';

// الانتقال لصفحة التفاصيل مع معرف الشكوى المحددة
window.location.href = `/general complaints/details.html?id=${id}`;
```

### 2. تحسين تحميل البيانات

#### **في ملف `general complaints/details.js`:**
```javascript
// إظهار رسالة تحميل
const complaintTitle = document.querySelector('.complaint-title');
if (complaintTitle) {
  complaintTitle.textContent = 'جاري تحميل تفاصيل الشكوى...';
}

// تحديث عنوان الصفحة
document.title = `تفاصيل الشكوى رقم #${complaintData.ComplaintID} - نظام الشكاوى`;
```

### 3. تحسين عرض البيانات

#### **أ. تحسين عنوان الشكوى:**
```javascript
const complaintNumber = String(complaintData.ComplaintID).padStart(6, '0');
const titleText = `تفاصيل الشكوى رقم #${complaintNumber}`;
complaintTitle.textContent = titleText;
console.log('تم تحديث عنوان الشكوى:', titleText);
```

#### **ب. تحسين بيانات المريض:**
```javascript
// الاسم الكامل
const patientName = complaintData.PatientName || complaintData.FullName || 'غير محدد';
console.log('تم تحديث الاسم:', patientName);

// رقم الهوية
const nationalId = complaintData.NationalID_Iqama || complaintData.NationalID || 'غير محدد';
console.log('تم تحديث رقم الهوية:', nationalId);

// رقم الملف الطبي
const medicalFile = complaintData.NationalID_Iqama || complaintData.NationalID || 'غير محدد';
console.log('تم تحديث رقم الملف الطبي:', medicalFile);

// رقم الجوال
const mobileNumber = complaintData.ContactNumber || complaintData.PhoneNumber || 'غير محدد';
console.log('تم تحديث رقم الجوال:', mobileNumber);
```

#### **ج. تحسين تفاصيل الشكوى:**
```javascript
// القسم المرتبط
const departmentName = complaintData.DepartmentName || 'غير محدد';
console.log('تم تحديث القسم:', departmentName);

// تاريخ الزيارة
const fullVisitDateTime = `${formattedVisitDate}<br><small style="color: #666;">${formattedVisitTime}</small>`;
console.log('تم تحديث تاريخ الزيارة:', formattedVisitDate, formattedVisitTime);

// نوع الشكوى
const complaintType = complaintData.ComplaintTypeName || complaintData.TypeName || 'غير محدد';
console.log('تم تحديث نوع الشكوى:', complaintType);

// الشكوى الفرعية
const subType = complaintData.SubTypeName || complaintData.SubcategoryName || 'غير محدد';
console.log('تم تحديث الشكوى الفرعية:', subType);

// تفاصيل الشكوى
const details = complaintData.ComplaintDetails || complaintData.Details || 'لا توجد تفاصيل';
console.log('تم تحديث تفاصيل الشكوى:', details.substring(0, 50) + '...');
```

## 🔧 الميزات الجديدة

### 1. رسائل تصحيح مفصلة
- إضافة رسائل console.log مفصلة لتتبع عملية تحميل البيانات
- تسجيل كل خطوة في عملية تحديث البيانات
- تسجيل القيم المحدثة لكل حقل

### 2. رسائل تحميل واضحة
- إظهار رسالة "جاري تحميل تفاصيل الشكوى..." أثناء التحميل
- تحديث عنوان الصفحة ليعكس رقم الشكوى المحددة
- تحسين تجربة المستخدم أثناء الانتظار

### 3. معالجة أفضل للبيانات
- دعم أسماء متعددة للحقول لضمان التوافق
- معالجة القيم الفارغة بشكل أفضل
- عرض رسائل واضحة في حالة عدم وجود بيانات

### 4. تنسيق محسن للتواريخ
- عرض التاريخ والوقت بتنسيق عربي واضح
- تنسيق موحد لجميع التواريخ في الصفحة
- عرض الوقت بتنسيق 12 ساعة

## 📱 كيفية الاستخدام

### 1. من الإشعارات:
1. الضغط على زر الإشعارات (الجرس)
2. اختيار شكوى من القائمة
3. الضغط على زر "التفاصيل"
4. الانتقال التلقائي لصفحة تفاصيل الشكوى المحددة

### 2. في صفحة التفاصيل:
- عرض عنوان واضح مع رقم الشكوى
- عرض جميع بيانات المريض
- عرض تفاصيل الشكوى الكاملة
- عرض المرفقات (إن وجدت)
- عرض الرد على الشكوى (إن وجد)
- عرض سجل التاريخ

## 🚨 معالجة الأخطاء

### 1. أخطاء التحميل:
```javascript
if (!complaintData) {
  console.error('لا توجد بيانات شكوى متاحة');
  return;
}
```

### 2. أخطاء الاتصال:
```javascript
catch (error) {
  console.error('خطأ في الاتصال بالخادم:', error);
  alert('خطأ في الاتصال بالخادم: ' + error.message);
  goBack();
}
```

### 3. أخطاء البيانات:
```javascript
if (!data.success) {
  console.error('فشل في جلب بيانات الشكوى:', data.message);
  alert('تعذر جلب بيانات الشكوى: ' + (data.message || 'خطأ غير معروف'));
  goBack();
}
```

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

## 📋 قائمة الملفات المحدثة

1. **`login/home.js`** - تحسين الانتقال من الإشعارات
2. **`general complaints/details.js`** - تحسين عرض تفاصيل الشكوى

## ✅ النتائج المتوقعة

- عرض تفاصيل الشكوى المحددة فقط بشكل واضح
- رسائل تصحيح مفصلة لتتبع عملية التحميل
- معالجة أفضل للأخطاء والقيم الفارغة
- تجربة مستخدم محسنة مع رسائل تحميل واضحة
- تنسيق محسن للبيانات والتواريخ
