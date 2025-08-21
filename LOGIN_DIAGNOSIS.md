# تشخيص مشاكل تسجيل الدخول

## ✅ الحالة الحالية

### 1. الخادم (Backend)
- ✅ الخادم يعمل على المنفذ 3001
- ✅ جميع المكتبات مثبتة بشكل صحيح
- ✅ API Health Check يعمل
- ✅ قاعدة البيانات متصلة وتعمل

### 2. قاعدة البيانات
- ✅ الاتصال بقاعدة البيانات يعمل
- ✅ جدول الأقسام متاح
- ✅ API الأقسام يعمل

### 3. واجهة المستخدم (Frontend)
- ✅ ملفات HTML و CSS و JavaScript موجودة
- ✅ API endpoints معرفة بشكل صحيح

## 🔍 المشاكل المحتملة

### 1. مشاكل في قاعدة البيانات
```sql
-- التحقق من وجود المستخدمين
SELECT EmployeeID, FullName, Username, Email, RoleID 
FROM Employees 
LIMIT 5;

-- التحقق من وجود الأدوار
SELECT * FROM Roles;

-- التحقق من وجود الأقسام
SELECT * FROM Departments;
```

### 2. مشاكل في التشفير
- التأكد من أن كلمات المرور مشفرة بـ bcrypt
- التحقق من JWT_SECRET في ملف .env

### 3. مشاكل في CORS
- التأكد من إعدادات CORS في الخادم

### 4. مشاكل في التوكن
- التحقق من صلاحية التوكن
- التحقق من JWT_SECRET

## 🛠️ خطوات التشخيص

### الخطوة 1: اختبار الخادم
```bash
# تشغيل الخادم
cd backend
npm start

# اختبار API
curl http://localhost:3001/api/health
```

### الخطوة 2: اختبار قاعدة البيانات
```bash
# اختبار الأقسام
curl http://localhost:3001/api/complaints/departments
```

### الخطوة 3: اختبار تسجيل الدخول
استخدم ملف `test-login.html` لاختبار:
- الاتصال بالخادم
- قاعدة البيانات
- تسجيل الدخول

### الخطوة 4: فحص السجلات
```bash
# مراقبة سجلات الخادم
# ستظهر في terminal عند تشغيل npm start
```

## 🔧 الحلول المقترحة

### 1. إنشاء مستخدم تجريبي
```sql
INSERT INTO Employees (FullName, Username, PasswordHash, Email, RoleID, DepartmentID) 
VALUES (
    'مستخدم تجريبي', 
    'test123', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    'test@example.com', 
    2, 
    1
);
```

### 2. التحقق من ملف .env
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=aounak
JWT_SECRET=your-secret-key-here
PORT=3001
```

### 3. إصلاح مشاكل CORS
```javascript
// في app.js
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'file://'],
  credentials: true
}));
```

## 📋 قائمة التحقق

- [ ] الخادم يعمل على المنفذ 3001
- [ ] قاعدة البيانات متصلة
- [ ] جدول Employees موجود
- [ ] جدول Roles موجود
- [ ] جدول Departments موجود
- [ ] JWT_SECRET معرف
- [ ] CORS مكون بشكل صحيح
- [ ] API endpoints تعمل
- [ ] تشفير كلمات المرور يعمل
- [ ] التوكن يتم إنشاؤه بشكل صحيح

## 🚨 رسائل الخطأ الشائعة

### 1. "فشل الاتصال بالخادم"
- تأكد من تشغيل الخادم
- تأكد من المنفذ الصحيح
- تأكد من إعدادات CORS

### 2. "البريد الإلكتروني أو رقم الموظف أو كلمة المرور غير صحيحة"
- تأكد من وجود المستخدم في قاعدة البيانات
- تأكد من صحة كلمة المرور
- تأكد من تشفير كلمة المرور

### 3. "التوكن غير صالح"
- تأكد من JWT_SECRET
- تأكد من صلاحية التوكن
- تأكد من إرسال التوكن في headers

## 📞 للدعم

إذا استمرت المشكلة، يرجى:
1. فتح ملف `test-login.html` في المتصفح
2. تشغيل الاختبارات
3. إرسال نتائج الاختبارات
4. إرسال أي رسائل خطأ تظهر في console المتصفح
5. إرسال أي رسائل خطأ تظهر في terminal الخادم
