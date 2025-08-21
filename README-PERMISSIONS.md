# نظام إدارة الصلاحيات والتحكم في الوصول

## نظرة عامة

تم إنشاء نظام شامل لإدارة الصلاحيات والتحكم في الوصول يطبق على جميع صفحات النظام. النظام يضمن الأمان والتحكم في البيانات حسب دور المستخدم.

## المكونات الرئيسية

### 1. نظام إدارة الصلاحيات (`js/common/permissions.js`)

#### الأدوار المتاحة
- **سوبر أدمن (RoleID = 1)**: وصول كامل لجميع البيانات والوظائف
- **أدمن (RoleID = 3)**: وصول لبيانات قسمه فقط
- **موظف (RoleID = 2)**: وصول لبياناته الخاصة والشكاوى العامة

#### الوظائف الرئيسية
- `canAccessPage(pageType)`: فحص إمكانية الوصول للصفحة
- `canAccessData(dataType, departmentID)`: فحص إمكانية الوصول للبيانات
- `canPerformOperation(operation)`: فحص إمكانية تنفيذ العملية
- `applyDataRestrictions(data, dataType)`: تطبيق قيود البيانات حسب الدور

#### أنواع العمليات
- `Create`: إنشاء بيانات جديدة
- `Update`: تحديث البيانات
- `Delete`: حذف البيانات
- `Assign`: تعيين مهام
- `StatusChange`: تغيير الحالة
- `PermissionChange`: تغيير الصلاحيات
- `AccessDenied`: رفض الوصول
- `Login/Logout`: تسجيل الدخول/الخروج

### 2. نظام التذكير والتصعيد (`js/common/permissions.js`)

#### منطق التذكير
- **بعد 3 أيام**: تذكير أول للموظف المعني
- **بعد 6 أيام**: تذكير ثانٍ للموظف
- **بعد 9 أيام**: تصعيد للأدمن

#### الوظائف
- `checkReminderNeeded(complaint)`: فحص الحاجة للتذكير
- `createReminder(complaintID, employeeID, type)`: إنشاء تذكير
- `checkAllComplaints()`: فحص جميع الشكاوى

### 3. نظام التنبيهات (`js/common/notifications.js`)

#### أنواع التنبيهات
- `success`: نجاح العملية
- `error`: خطأ في العملية
- `warning`: تحذير
- `info`: معلومات
- `urgent`: عاجل
- `complaint`: شكوى
- `reminder`: تذكير
- `permission`: صلاحيات
- `system`: نظام
- `security`: أمان

#### الوظائف
- `show(type, title, message, options)`: عرض تنبيه
- `success/error/warning/info()`: تنبيهات سريعة
- `custom(config)`: تنبيه مخصص

### 4. صفحة الوصول المرفوض (`login/403.html`)

صفحة مخصصة لعرض رسالة خطأ 403 عند محاولة الوصول لصفحة محظورة.

## كيفية الاستخدام

### 1. استيراد النظام في الصفحة

```javascript
import { permissionManager, reminderSystem, OPERATION_TYPES } from '../js/common/permissions.js';
import { notificationManager } from '../js/common/notifications.js';
```

### 2. فحص الوصول للصفحة

```javascript
// فحص الوصول عند تحميل الصفحة
if (!permissionManager.checkPageAccess('admin-panel')) {
  return; // سيتم إعادة التوجيه تلقائياً
}
```

### 3. تطبيق قيود البيانات

```javascript
// جلب البيانات
const response = await fetch('/api/complaints');
const data = response.data;

// تطبيق القيود حسب الدور
const filteredData = permissionManager.applyDataRestrictions(data, 'complaints');
```

### 4. فحص الصلاحيات

```javascript
// فحص إمكانية حذف موظف
if (permissionManager.canPerformOperation('delete_employee')) {
  // تنفيذ العملية
} else {
  notificationManager.error('لا توجد صلاحية', 'لا يمكنك حذف الموظفين');
}
```

### 5. تسجيل النشاط

```javascript
// تسجيل نشاط إنشاء شكوى
await permissionManager.logActivity(
  OPERATION_TYPES.CREATE,
  'تم إنشاء شكوى جديدة',
  complaintID,
  'complaint'
);
```

### 6. إنشاء تنبيه

```javascript
// إنشاء تنبيه نجاح
notificationManager.success(
  'تم الحفظ بنجاح',
  'تم حفظ البيانات في قاعدة البيانات'
);

// إنشاء تنبيه عاجل
notificationManager.urgent(
  'تنبيه أمني',
  'تم اكتشاف محاولة وصول غير مصرح',
  { autoHide: false }
);
```

## قواعد الأمان

### 1. منع الوصول المباشر
- إخفاء الأيقونات/الروابط لا يكفي
- فحص الصلاحيات عند تحميل كل صفحة
- إعادة التوجيه لصفحة 403 عند رفض الوصول

### 2. قيود البيانات
- **السوبر أدمن**: وصول كامل
- **الأدمن**: بيانات قسمه فقط
- **الموظف**: بياناته الخاصة فقط

### 3. تسجيل جميع العمليات
- كل عملية تُسجل مع التفاصيل
- تسجيل محاولات الوصول المرفوض
- حفظ سجلات الأمان

### 4. التذكير والتصعيد
- نظام تلقائي للتذكير
- تصعيد تلقائي للأدمن
- إشعارات فورية للمستخدمين

## الصفحات المحمية

### السوبر أدمن فقط
- `admin-panel`: لوحة التحكم
- `employee-data`: بيانات الموظفين
- `permissions`: إدارة الصلاحيات
- `logs`: سجلات النظام
- `recycle-bin`: سلة المحذوفات

### الأدمن فقط
- `department-management`: إدارة القسم

### متاحة للجميع
- `home`: الصفحة الرئيسية
- `new-complaint`: إنشاء شكوى
- `followup`: متابعة الشكاوى
- `general-complaints`: الشكاوى العامة

## التخصيص

### إضافة نوع تنبيه جديد

```javascript
// في notifications.css
.notification-custom {
  background: linear-gradient(135deg, #your-color, #your-color-2);
}

// في notifications.js
getIcon(type) {
  const icons = {
    // ... الأنواع الموجودة
    custom: '🔧'
  };
  return icons[type] || icons.info;
}
```

### إضافة عملية جديدة

```javascript
// في permissions.js
const OPERATION_TYPES = {
  // ... العمليات الموجودة
  CUSTOM_OPERATION: 'CustomOperation'
};

// في canPerformOperation
case 'custom_operation':
  return this.isSuperAdmin() || this.isAdmin();
```

## استكشاف الأخطاء

### مشاكل شائعة

1. **خطأ في استيراد الملفات**
   - تأكد من صحة مسار الملفات
   - تأكد من استخدام `type="module"` في script tag

2. **خطأ في فك تشفير Token**
   - تأكد من صحة format الـ token
   - تأكد من وجود `roleID` و `departmentID` في payload

3. **عدم ظهور التنبيهات**
   - تأكد من تضمين ملف CSS
   - تأكد من تهيئة `notificationManager`

### رسائل التصحيح

```javascript
// تفعيل رسائل التصحيح
console.log('User Role:', permissionManager.currentRole);
console.log('User Department:', permissionManager.currentDepartment);
console.log('Can Access Admin:', permissionManager.canAccessPage('admin-panel'));
```

## التطوير المستقبلي

### الميزات المخطط لها
- نظام أدوار مخصصة
- صلاحيات ديناميكية
- تقارير أمان مفصلة
- نظام تنبيهات متقدم
- دعم متعدد اللغات

### التكامل مع أنظمة أخرى
- نظام المصادقة الثنائية
- نظام تسجيل الدخول الاجتماعي
- نظام إدارة الجلسات
- نظام النسخ الاحتياطي

## الدعم

للاستفسارات أو المشاكل، يرجى التواصل مع فريق التطوير أو مراجعة سجلات النظام للحصول على مزيد من التفاصيل.
