# تقرير إصلاح عرض أسماء الأقسام في ملخص الشكاوى

## المشكلة
كان المستخدم يريد أن تظهر أسماء الأقسام بدلاً من أرقام الأقسام (ID) في جدول ملخص الشكاوى.

## التحليل
بعد فحص الكود، وجدت أن:
1. **Backend API** يستخدم بالفعل `d.DepartmentName` في استعلامات SQL
2. **Frontend** يستخدم `c.DepartmentName` لعرض اسم القسم
3. المشكلة قد تكون في البيانات نفسها أو في عدم وجود `DepartmentID` كبديل

## الحلول المطبقة

### 1. تحسين Frontend (`login/home.js`)
**الملف:** `login/home.js`
- تم إضافة fallback لعرض رقم القسم إذا لم يكن اسم القسم متوفراً:
```javascript
<td>${c.DepartmentName || `قسم رقم ${c.DepartmentID || 'غير محدد'}`}</td>
```

- تم إضافة console.log لفحص البيانات المستلمة:
```javascript
console.log('📋 بيانات الشكاوى المستلمة:', complaints.slice(0, 3));
```

### 2. تحسين Backend API
**الملف:** `backend/controllers/complaintController.js`

#### أ. دالة `getAllComplaints`
- تم إضافة `c.DepartmentID` إلى الاستعلام:
```sql
SELECT 
  c.ComplaintID,
  c.ComplaintDate,
  c.ComplaintDetails,
  c.CurrentStatus,
  c.Priority,
  p.FullName as PatientName,
  p.NationalID_Iqama,
  p.ContactNumber,
  d.DepartmentName,
  c.DepartmentID,  -- تم إضافته
  ct.TypeName as ComplaintTypeName,
  cst.SubTypeName,
  e.FullName as EmployeeName
```

#### ب. دالة `getDepartmentComplaints`
- تم إضافة `c.DepartmentID` إلى الاستعلام أيضاً:
```sql
SELECT 
  c.ComplaintID,
  c.ComplaintDate,
  c.ComplaintDetails,
  c.CurrentStatus,
  c.Priority,
  c.ResponseDeadline,
  p.FullName as PatientName,
  p.NationalID_Iqama,
  p.ContactNumber,
  d.DepartmentName,
  c.DepartmentID,  -- تم إضافته
  ct.TypeName as ComplaintTypeName,
  cst.SubTypeName,
  e.FullName as EmployeeName
```

### 3. سكريبت فحص قاعدة البيانات
**الملف:** `check_department_names.sql`
تم إنشاء سكريبت SQL لفحص:
- جميع الأقسام الموجودة
- عينة من الشكاوى مع أسماء الأقسام
- الشكاوى التي لا تحتوي على اسم قسم
- إحصائيات الشكاوى حسب القسم

## النتيجة المتوقعة

### قبل الإصلاح:
- إذا لم يكن `DepartmentName` متوفراً، كان يظهر `—`

### بعد الإصلاح:
- إذا كان `DepartmentName` متوفراً، يظهر اسم القسم
- إذا لم يكن `DepartmentName` متوفراً، يظهر `قسم رقم X`
- إذا لم يكن `DepartmentID` متوفراً، يظهر `غير محدد`

## اختبار الإصلاحات

### 1. فحص البيانات في قاعدة البيانات:
```sql
-- نفذ السكريبت check_department_names.sql
-- تأكد من وجود أسماء الأقسام في جدول Departments
-- تأكد من أن الشكاوى مرتبطة بأقسام صحيحة
```

### 2. اختبار Frontend:
1. افتح صفحة `login/home.html`
2. افتح Developer Tools (F12)
3. انتقل إلى Console
4. تحقق من رسائل console.log لرؤية البيانات المستلمة
5. تحقق من جدول ملخص الشكاوى

### 3. اختبار API مباشرة:
```bash
# اختبار جلب جميع الشكاوى
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/complaints/all

# اختبار جلب شكاوى قسم محدد
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/complaints/department/1
```

## الملفات المعدلة
1. `login/home.js` - تحسين عرض أسماء الأقسام وإضافة debugging
2. `backend/controllers/complaintController.js` - إضافة DepartmentID إلى API responses
3. `check_department_names.sql` - سكريبت فحص قاعدة البيانات (جديد)

## ملاحظات إضافية
- تم إضافة debugging logs لسهولة تتبع المشاكل
- النظام يدعم fallback لعرض رقم القسم إذا لم يكن الاسم متوفراً
- يمكن استخدام سكريبت SQL لفحص البيانات في قاعدة البيانات
