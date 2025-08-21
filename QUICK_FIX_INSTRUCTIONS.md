# تعليمات سريعة لحل مشكلة صفحة تتبع الطلبات

## المشكلة
صفحة "تتبع الطلبات" لا تظهر أي بيانات.

## الحلول السريعة

### 1. فتح صفحة التصحيح
افتح الملف `debug-request-tracking.html` في المتصفح لفحص المشكلة:
```
http://localhost:5500/debug-request-tracking.html
```

### 2. التحقق من تسجيل الدخول
1. تأكد من تسجيل الدخول بحساب admin
2. افتح Developer Tools (F12)
3. اذهب إلى Application > Local Storage
4. تحقق من وجود `token` و `user` data

### 3. إضافة بيانات تجريبية
إذا لم تكن هناك بيانات في قاعدة البيانات، قم بتنفيذ:
```sql
-- في MySQL Workbench أو phpMyAdmin
source add-test-data.sql;
```

### 4. إعادة تشغيل الخادم
```bash
cd backend
npm start
```

### 5. اختبار API مباشرة
افتح `test-request-tracking.html` واختبر جميع endpoints.

## خطوات التشخيص

### الخطوة 1: فحص الخادم
- تأكد من أن الخادم يعمل على المنفذ 3001
- تحقق من عدم وجود أخطاء في console

### الخطوة 2: فحص قاعدة البيانات
- تأكد من وجود بيانات في جدول `complaints`
- تحقق من صحة العلاقات بين الجداول

### الخطوة 3: فحص الـ Token
- تأكد من صحة الـ token
- تحقق من انتهاء صلاحية الـ token

### الخطوة 4: فحص الصلاحيات
- تأكد من أن المستخدم لديه صلاحيات admin
- تحقق من middleware الصلاحيات

## الأخطاء الشائعة وحلولها

### خطأ 401 (Unauthorized)
**السبب**: عدم وجود token أو token غير صالح
**الحل**: 
1. تسجيل الدخول مرة أخرى
2. مسح localStorage وإعادة تسجيل الدخول

### خطأ 500 (Server Error)
**السبب**: خطأ في قاعدة البيانات أو الخادم
**الحل**:
1. فحص console الخادم للأخطاء
2. التحقق من صحة استعلامات SQL

### لا تظهر بيانات
**السبب**: عدم وجود بيانات في قاعدة البيانات
**الحل**:
1. تنفيذ `add-test-data.sql`
2. التحقق من وجود بيانات في جدول `complaints`

## اختبار سريع

### 1. اختبار الخادم
```bash
curl http://localhost:3001/api/auth/me
```

### 2. اختبار API مع token
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/admin/requests
```

### 3. فحص قاعدة البيانات
```sql
SELECT COUNT(*) FROM complaints;
SELECT * FROM complaints LIMIT 5;
```

## الملفات المهمة

1. `debug-request-tracking.html` - صفحة التصحيح
2. `test-request-tracking.html` - صفحة اختبار API
3. `add-test-data.sql` - إضافة بيانات تجريبية
4. `backend/routes/adminRoutes.js` - API endpoints

## الاتصال بالدعم

إذا لم تحل المشكلة:
1. فتح `debug-request-tracking.html`
2. تشغيل جميع الاختبارات
3. التقاط screenshot للنتائج
4. إرسال النتائج مع تفاصيل المشكلة
