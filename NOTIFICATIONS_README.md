# نظام الإشعارات - عونك

## نظرة عامة

تم إصلاح نظام الإشعارات في تطبيق عونك ليعمل بشكل صحيح. النظام الآن يدعم أنواع مختلفة من الإشعارات مع واجهة مستخدم محسنة.

## المشاكل التي تم إصلاحها

### 1. عدم تطابق أسماء الأعمدة في قاعدة البيانات
- **المشكلة**: كان API يستخدم `UserID` بينما الجدول يستخدم `RecipientEmployeeID`
- **الحل**: تم تصحيح جميع queries لتستخدم `RecipientEmployeeID`

### 2. عدم وجود API endpoints للإشعارات
- **المشكلة**: لم يكن هناك routes للإشعارات في `app.js`
- **الحل**: تم إضافة `/api/notifications` route

### 3. مشاكل في زر الإشعارات
- **المشكلة**: زر الإشعارات في الصفحة الرئيسية للموظف لم يعمل بشكل صحيح
- **الحل**: تم تحسين معالجة الأخطاء وإضافة فحوصات إضافية

## الملفات المحدثة

### Backend
- `backend/routes/adminRoutes.js` - إضافة API endpoints للإشعارات
- `backend/app.js` - إضافة route للإشعارات

### Frontend
- `login/home.js` - تحسين معالجة الأخطاء في زر الإشعارات
- `js/common/notifications.js` - نظام إشعارات مشترك محسن
- `js/common/notifications.css` - تنسيقات CSS للإشعارات

### ملفات جديدة
- `test-notifications.html` - صفحة لاختبار نظام الإشعارات

## كيفية الاستخدام

### 1. إنشاء إشعار بسيط

```javascript
import { notificationManager } from './js/common/notifications.js';

// إشعار نجاح
notificationManager.success('تم بنجاح!', 'تم حفظ البيانات بنجاح');

// إشعار خطأ
notificationManager.error('خطأ في النظام', 'حدث خطأ أثناء حفظ البيانات');

// إشعار تحذير
notificationManager.warning('تحذير مهم', 'يوجد شكاوى تحتاج إلى متابعة');

// إشعار معلومات
notificationManager.info('معلومات جديدة', 'تم تحديث النظام بنجاح');
```

### 2. إنشاء إشعار مع إجراءات

```javascript
notificationManager.info(
    'شكوى جديدة محولة',
    'تم تحويل شكوى جديدة إليك من قسم آخر.',
    {
        duration: 0, // لا يختفي تلقائياً
        actions: [
            {
                name: 'view',
                label: 'عرض الشكوى',
                class: 'primary'
            },
            {
                name: 'assign',
                label: 'تعيين لموظف',
                class: 'success'
            },
            {
                name: 'dismiss',
                label: 'تجاهل',
                class: 'secondary'
            }
        ],
        onAction: (action, data, notificationElement) => {
            switch (action) {
                case 'view':
                    // فتح صفحة الشكوى
                    break;
                case 'assign':
                    // فتح نافذة تعيين الموظف
                    break;
                case 'dismiss':
                    notificationManager.hide(notificationElement);
                    break;
            }
        }
    }
);
```

### 3. إنشاء إشعار مخصص

```javascript
notificationManager.custom({
    type: 'system',
    title: 'تحديث النظام',
    message: 'سيتم إعادة تشغيل النظام في غضون 5 دقائق.',
    icon: '🔄',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    duration: 10000
});
```

## أنواع الإشعارات المدعومة

1. **success** - نجاح (أخضر)
2. **error** - خطأ (أحمر)
3. **warning** - تحذير (أصفر)
4. **info** - معلومات (أزرق)
5. **urgent** - عاجل (أحمر مع نبض)
6. **complaint** - شكوى (بنفسجي)
7. **reminder** - تذكير (أزرق فاتح)
8. **permission** - صلاحيات (أخضر)
9. **system** - نظام (رمادي)
10. **security** - أمان (أحمر)

## API Endpoints

### جلب الإشعارات غير المقروءة
```
GET /api/notifications/unread
```

### تحديد إشعار كمقروء
```
PUT /api/notifications/:id/mark-read
```

### إنشاء إشعار جديد
```
POST /api/notifications
Body: {
    recipientEmployeeID: 1,
    title: "عنوان الإشعار",
    body: "محتوى الإشعار",
    type: "info",
    relatedType: "complaint",
    relatedID: 123
}
```

### إنشاء إشعارات تجريبية
```
POST /api/notifications/test
```

## اختبار النظام

1. افتح ملف `test-notifications.html` في المتصفح
2. اضغط على الأزرار المختلفة لاختبار أنواع الإشعارات
3. جرب الإشعارات مع الإجراءات
4. اختبر الإشعارات المخصصة

## التنسيقات CSS

تم إنشاء ملف `js/common/notifications.css` يحتوي على جميع التنسيقات المطلوبة للإشعارات، بما في ذلك:

- تنسيقات أساسية للإشعارات
- أنواع مختلفة من الإشعارات
- تأثيرات بصرية (نبض، انزلاق)
- دعم الأجهزة المحمولة
- دعم الوضع المظلم
- تحسينات للوصول

## ملاحظات مهمة

1. **الأمان**: تأكد من أن المستخدم مسجل دخول قبل إنشاء إشعارات
2. **الأداء**: الإشعارات تختفي تلقائياً بعد المدة المحددة
3. **التوافق**: النظام يعمل على جميع المتصفحات الحديثة
4. **الوصول**: تم إضافة دعم للوحة المفاتيح والقراءات الشاشية

## استكشاف الأخطاء

### الإشعارات لا تظهر
1. تأكد من تضمين ملف CSS
2. تحقق من console للأخطاء
3. تأكد من أن notificationManager تم تهيئته

### API لا يعمل
1. تأكد من تشغيل الخادم
2. تحقق من صحة token المصادقة
3. راجع logs الخادم

### مشاكل في التصميم
1. تأكد من تضمين ملف CSS
2. تحقق من تداخل التنسيقات
3. اختبر على أجهزة مختلفة

## التطوير المستقبلي

- [ ] إضافة دعم للإشعارات الصوتية
- [ ] إضافة دعم للإشعارات في المتصفح (Push Notifications)
- [ ] إضافة إعدادات تخصيص للمستخدم
- [ ] دعم الإشعارات المجدولة
- [ ] إضافة إحصائيات الإشعارات
