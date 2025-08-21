# حل خطأ 500 في صفحة تتبع الطلبات

## المشكلة
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
localhost:3001/api/admin/requests/stats:1
```

## الحلول المطبقة

### 1. إصلاح API Endpoints
تم تحديث `backend/routes/adminRoutes.js` لمعالجة الأخطاء بشكل أفضل:
- إضافة فحص وجود الجداول قبل الاستعلام
- معالجة القيم null
- إرجاع بيانات فارغة بدلاً من خطأ 500

### 2. إنشاء الجداول المطلوبة
تم إنشاء ملف `create-tables-if-missing.sql` لإنشاء جميع الجداول المطلوبة.

## خطوات الحل

### الخطوة 1: إنشاء الجداول
```sql
-- في MySQL Workbench أو phpMyAdmin
source create-tables-if-missing.sql;
```

### الخطوة 2: إعادة تشغيل الخادم
```bash
cd backend
npm start
```

### الخطوة 3: اختبار API
افتح `debug-request-tracking.html` واختبر:
1. اختبار الاتصال بالخادم
2. اختبار API بدون Token
3. اختبار API مع Token

## التحقق من الحل

### 1. فحص قاعدة البيانات
```sql
-- التحقق من وجود الجداول
SHOW TABLES LIKE 'complaints';
SHOW TABLES LIKE 'complainthistory';

-- التحقق من وجود بيانات
SELECT COUNT(*) FROM complaints;
SELECT COUNT(*) FROM complainthistory;
```

### 2. فحص الخادم
```bash
# التحقق من أن الخادم يعمل
netstat -an | findstr :3001
```

### 3. اختبار API مباشرة
```bash
# اختبار بدون token
curl http://localhost:3001/api/admin/requests/stats

# اختبار مع token (إذا كان لديك)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/admin/requests/stats
```

## الأسباب المحتملة للخطأ 500

### 1. عدم وجود جداول
**السبب**: الجداول المطلوبة غير موجودة في قاعدة البيانات
**الحل**: تنفيذ `create-tables-if-missing.sql`

### 2. مشكلة في الاتصال بقاعدة البيانات
**السبب**: إعدادات قاعدة البيانات غير صحيحة
**الحل**: فحص `backend/config/database.js`

### 3. مشكلة في الاستعلام SQL
**السبب**: استعلام SQL غير صحيح
**الحل**: تم إصلاح الاستعلامات في الكود

### 4. مشكلة في الصلاحيات
**السبب**: المستخدم لا يملك صلاحيات كافية
**الحل**: التحقق من إعدادات قاعدة البيانات

## الملفات المحدثة

1. **`backend/routes/adminRoutes.js`** - إصلاح معالجة الأخطاء
2. **`create-tables-if-missing.sql`** - إنشاء الجداول المطلوبة
3. **`debug-request-tracking.html`** - صفحة التصحيح
4. **`test-request-tracking.html`** - صفحة اختبار API

## اختبار سريع

### 1. فتح صفحة التصحيح
```
http://localhost:5500/debug-request-tracking.html
```

### 2. تشغيل الاختبارات
- اضغط على "اختبار الاتصال بالخادم"
- اضغط على "اختبار API بدون Token"
- اضغط على "اختبار API مع Token"

### 3. فحص النتائج
- إذا كانت جميع الاختبارات ناجحة، المشكلة محلولة
- إذا كان هناك خطأ، اتبع التعليمات في النتائج

## إذا لم تحل المشكلة

### 1. فحص console الخادم
```bash
cd backend
npm start
# راقب الأخطاء في console
```

### 2. فحص قاعدة البيانات
```sql
-- التحقق من الاتصال
SELECT 1;

-- التحقق من الجداول
SHOW TABLES;

-- التحقق من البيانات
SELECT * FROM complaints LIMIT 5;
```

### 3. إعادة إنشاء الجداول
```sql
-- حذف وإعادة إنشاء الجداول
DROP TABLE IF EXISTS complainthistory;
DROP TABLE IF EXISTS complaints;
source create-tables-if-missing.sql;
```

## ملاحظات مهمة

1. **تأكد من تسجيل الدخول** بحساب admin قبل اختبار API
2. **تأكد من أن الخادم يعمل** على المنفذ 3001
3. **تأكد من وجود بيانات** في قاعدة البيانات
4. **استخدم صفحة التصحيح** لتشخيص المشكلة بدقة

## الاتصال بالدعم

إذا لم تحل المشكلة:
1. فتح `debug-request-tracking.html`
2. تشغيل جميع الاختبارات
3. التقاط screenshot للنتائج
4. إرسال النتائج مع تفاصيل المشكلة
