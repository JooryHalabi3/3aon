# ملخص جميع الملفات المتعلقة بالإشعارات

## 📁 هيكل الملفات

### 1. ملفات الواجهة الأمامية (Frontend)

#### **أ. ملف الإشعارات المشترك:**
```
js/common/
└── notifications.js              # نظام التنبيهات المشترك لجميع الصفحات
```

#### **ب. ملفات Super Admin:**
```
superAdmin/
├── superAdmin.html               # يحتوي على مركز الإشعارات
├── superAdmin.css                # تنسيقات مركز الإشعارات
├── superAdmin.js                 # منطق الإشعارات للـ Super Admin
├── home.html                     # صفحة الرئيسية مع الإشعارات
├── home.css                      # تنسيقات إشعارات الصفحة الرئيسية
├── home.js                       # منطق الإشعارات في الصفحة الرئيسية
└── superAdminAuth.js             # دالة showNotification للتنبيهات
```

#### **ج. ملفات Admin:**
```
admin/
├── admin.html                    # يحتوي على مركز الإشعارات
├── admin.css                     # تنسيقات مركز الإشعارات
├── admin.js                      # منطق الإشعارات للـ Admin
└── permissions.css               # تنسيقات التنبيهات العائمة
```

#### **د. ملفات أخرى:**
```
New complaint/
└── Newcomplaint.js               # دالة showNotification للتنبيهات

login/
└── home.js                       # تحميل الإشعارات في الصفحة الرئيسية
```

### 2. ملفات الخادم الخلفي (Backend)

#### **أ. مسارات API:**
```
backend/routes/
└── adminRoutes.js                # مسارات إشعارات Admin
    ├── GET /notifications/unread     # جلب الإشعارات غير المقروءة
    └── PUT /notifications/:id/mark-read  # تحديد الإشعار كمقروء
```

#### **ب. قاعدة البيانات:**
```
database_updates.sql              # إنشاء جدول notifications
last_c.sql                        # هيكل جدول notifications
```

## 🔧 الوظائف الرئيسية

### 1. نظام التنبيهات المشترك (notifications.js)

#### **الوظائف الرئيسية:**
```javascript
- show(type, title, message, options)     // إنشاء تنبيه جديد
- hide(notification)                       // إخفاء تنبيه
- hideAll()                               // إخفاء جميع التنبيهات
- success(title, message, options)        // تنبيه نجاح
- error(title, message, options)          // تنبيه خطأ
- warning(title, message, options)        // تنبيه تحذير
- info(title, message, options)           // تنبيه معلومات
- urgent(title, message, options)         // تنبيه عاجل
- complaint(title, message, options)      // تنبيه شكوى
- reminder(title, message, options)       // تنبيه تذكير
- permission(title, message, options)     // تنبيه صلاحيات
- system(title, message, options)         // تنبيه نظام
- security(title, message, options)       // تنبيه أمان
- custom(config)                          // تنبيه مخصص
```

#### **الميزات:**
- دعم أنواع متعددة من التنبيهات
- إخفاء تلقائي
- أزرار إجراءات
- أيقونات مختلفة لكل نوع
- تخصيص كامل
- فحص تلقائي للإشعارات الجديدة

### 2. مركز الإشعارات (Super Admin & Admin)

#### **الوظائف المشتركة:**
```javascript
- loadNotifications()              // تحميل الإشعارات
- displayNotifications()           // عرض الإشعارات
- markAsRead(notificationId)       // تحديد كمقروء
- closeNotificationCenter()        // إغلاق مركز الإشعارات
- checkForNewNotifications()       // فحص الإشعارات الجديدة
- updateNotificationCount()        // تحديث عدد الإشعارات
```

#### **الميزات:**
- عرض عدد الإشعارات غير المقروءة
- قائمة الإشعارات مع التفاصيل
- إمكانية تحديد الإشعار كمقروء
- فحص تلقائي كل 30 ثانية
- تنبيهات للإشعارات الجديدة

## 🎨 التصميم والتنسيقات

### 1. مركز الإشعارات (CSS)
```css
/* المكونات الرئيسية */
.notification-center              # حاوية مركز الإشعارات
.notification-header              # رأس مركز الإشعارات
.notification-count               # عداد الإشعارات
.notification-list                # قائمة الإشعارات
.notification-item                # عنصر الإشعار
.notification-content             # محتوى الإشعار
```

### 2. التنبيهات العائمة (CSS)
```css
/* أنواع التنبيهات */
.notification.success             # تنبيه نجاح (أخضر)
.notification.error               # تنبيه خطأ (أحمر)
.notification.warning             # تنبيه تحذير (برتقالي)
.notification.info                # تنبيه معلومات (أزرق)
.floating-notification            # تنبيه عائم
```

## 🌐 API Endpoints

### 1. مسارات الإشعارات
```javascript
// جلب الإشعارات غير المقروءة
GET /api/admin/notifications/unread

// تحديد الإشعار كمقروء
PUT /api/admin/notifications/:id/mark-read

// إشعارات Super Admin
GET /api/notifications/super-admin

// فحص الإشعارات الجديدة
GET /api/notifications/check-new

// تحديد الإشعار كمقروء (Super Admin)
PUT /api/notifications/:id/read
```

## 📊 قاعدة البيانات

### 1. جدول notifications
```sql
CREATE TABLE notifications (
  NotificationID INT AUTO_INCREMENT PRIMARY KEY,
  RecipientEmployeeID INT NOT NULL,
  Title VARCHAR(150) NOT NULL,
  Body TEXT NOT NULL,
  Type VARCHAR(50) DEFAULT 'info',
  IsRead TINYINT(1) DEFAULT 0,
  CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  RelatedType VARCHAR(50) DEFAULT NULL,
  RelatedID INT DEFAULT NULL,
  FOREIGN KEY (RecipientEmployeeID) REFERENCES employees(EmployeeID)
);
```

### 2. الفهارس
```sql
CREATE INDEX idx_notifications_user_id ON notifications(UserID);
CREATE INDEX idx_notifications_is_read ON notifications(IsRead);
```

## 🔄 آلية العمل

### 1. إنشاء الإشعارات
```javascript
// إنشاء إشعار جديد
INSERT INTO notifications (UserID, Title, Message, Type, CreatedAt) 
VALUES (?, ?, ?, ?, NOW())
```

### 2. فحص الإشعارات
```javascript
// فحص تلقائي كل 30 ثانية
setInterval(checkForNewNotifications, 30000);
```

### 3. عرض الإشعارات
```javascript
// تحميل الإشعارات عند فتح الصفحة
loadNotifications();

// عرض الإشعارات في المركز
displayNotifications();
```

## 📱 التكامل مع الصفحات

### 1. Super Admin
- **superAdmin.html**: مركز إشعارات في الرأس
- **home.html**: إشعارات في الصفحة الرئيسية
- **superAdmin.js**: منطق الإشعارات
- **home.js**: إشعارات الشكاوى الجديدة

### 2. Admin
- **admin.html**: مركز إشعارات في الرأس
- **admin.js**: منطق الإشعارات
- **permissions.css**: تنبيهات عائمة

### 3. الصفحات الأخرى
- **Newcomplaint.js**: تنبيهات عند إرسال الشكوى
- **home.js**: إشعارات في الصفحة الرئيسية

## 🚨 أنواع الإشعارات

### 1. أنواع التنبيهات
- **success**: نجاح العملية
- **error**: خطأ في العملية
- **warning**: تحذير
- **info**: معلومات
- **urgent**: عاجل
- **complaint**: شكوى جديدة
- **reminder**: تذكير
- **permission**: صلاحيات
- **system**: نظام
- **security**: أمان

### 2. محتوى الإشعارات
- شكاوى جديدة
- شكاوى متأخرة
- تنبيهات للمدير
- تحديثات الحالة
- إشعارات النظام
- تنبيهات الأمان

## 🔧 للتطوير والتعديل

### إضافة إشعارات جديدة:
1. تعديل `notifications.js` لإضافة نوع جديد
2. إضافة التنسيقات في CSS
3. إضافة الأيقونة المناسبة
4. تحديث API endpoints إذا لزم الأمر

### تعديل مركز الإشعارات:
1. تعديل HTML للواجهة
2. تعديل CSS للتصميم
3. تعديل JavaScript للمنطق
4. تحديث قاعدة البيانات إذا لزم الأمر

### إضافة ميزات جديدة:
1. إشعارات صوتية
2. إشعارات متصفح (Browser Notifications)
3. إشعارات عبر البريد الإلكتروني
4. إشعارات فورية (WebSocket)
5. إشعارات مجدولة

## 📋 قائمة الملفات الكاملة

### ملفات الواجهة الأمامية:
1. `js/common/notifications.js` - نظام التنبيهات المشترك
2. `superAdmin/superAdmin.html` - مركز إشعارات Super Admin
3. `superAdmin/superAdmin.css` - تنسيقات إشعارات Super Admin
4. `superAdmin/superAdmin.js` - منطق إشعارات Super Admin
5. `superAdmin/home.html` - إشعارات الصفحة الرئيسية
6. `superAdmin/home.css` - تنسيقات إشعارات الصفحة الرئيسية
7. `superAdmin/home.js` - منطق إشعارات الصفحة الرئيسية
8. `superAdmin/superAdminAuth.js` - دالة التنبيهات
9. `admin/admin.html` - مركز إشعارات Admin
10. `admin/admin.css` - تنسيقات إشعارات Admin
11. `admin/admin.js` - منطق إشعارات Admin
12. `admin/permissions.css` - تنبيهات عائمة
13. `New complaint/Newcomplaint.js` - تنبيهات إرسال الشكوى
14. `login/home.js` - إشعارات الصفحة الرئيسية

### ملفات الخادم الخلفي:
1. `backend/routes/adminRoutes.js` - مسارات إشعارات Admin
2. `database_updates.sql` - إنشاء جدول الإشعارات
3. `last_c.sql` - هيكل جدول الإشعارات

### ملفات التوثيق:
1. `SUPER_ADMIN_UPDATES.md` - تحديثات نظام الإشعارات
2. `FEATURE_SUMMARY.md` - ملخص ميزات الإشعارات
