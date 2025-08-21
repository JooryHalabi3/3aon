# إصلاح صفحة تتبع الطلبات

## المشكلة
كانت صفحة "تتبع الطلبات" لا تظهر أي طلبات لأن الكود كان يحاول الوصول إلى جدول `requests` الفارغ، بينما الطلبات محفوظة في جدول `complaints`.

## الحل المطبق

### 1. تعديل API Endpoints في `backend/routes/adminRoutes.js`

#### أ. تعديل جلب الطلبات (`GET /api/admin/requests`)
- **قبل**: كان يستخدم جدول `requests` الفارغ
- **بعد**: يستخدم جدول `complaints` مع تحويل البيانات
- **التغييرات**:
  - `ComplaintID` → `RequestID`
  - `ComplaintDetails` → `Subject` و `Description`
  - تحويل `ComplaintType` من العربية إلى الإنجليزية
  - تحويل `CurrentStatus` من العربية إلى الإنجليزية

#### ب. تعديل إحصائيات الطلبات (`GET /api/admin/requests/stats`)
- **قبل**: كان يستخدم جدول `requests` الفارغ
- **بعد**: يستخدم جدول `complaints` مع الحالات العربية
- **التغييرات**:
  - `'جديدة'` → `pendingRequests`
  - `'قيد المعالجة'` → `inProgressRequests`
  - `'مغلقة'` → `completedRequests`

#### ج. تعديل خط سير الطلب (`GET /api/admin/requests/:id/workflow`)
- **قبل**: كان يستخدم جدول `request_workflow` الفارغ
- **بعد**: يستخدم جدول `complainthistory`
- **التغييرات**:
  - `HistoryID` → `WorkflowID`
  - `Stage` → `Action`
  - `Remarks` → `Description`
  - `Timestamp` → `CreatedAt`

#### د. تعديل تحويل الطلب (`POST /api/admin/requests/:id/transfer`)
- **قبل**: كان يستخدم جدول `requests`
- **بعد**: يستخدم جدول `complaints`
- **التغييرات**:
  - تحديث `EmployeeID` و `DepartmentID` في جدول `complaints`
  - إضافة سجل في `complainthistory`
  - إرسال إشعار للموظف المحول إليه

#### ه. إضافة تعيين الطلب (`PUT /api/admin/requests/:id/assign`)
- **جديد**: endpoint لتعيين طلب لموظف معين
- **الوظائف**:
  - تحديث `EmployeeID` في جدول `complaints`
  - إضافة سجل في `complainthistory`
  - إرسال إشعار للموظف المعين

### 2. تحويل البيانات

#### تحويل أنواع الشكاوى
```sql
CASE 
  WHEN ct.TypeName LIKE '%طبي%' THEN 'medical'
  WHEN ct.TypeName LIKE '%إداري%' THEN 'administrative'
  ELSE 'technical'
END as ComplaintType
```

#### تحويل حالات الطلبات
```sql
CASE 
  WHEN c.CurrentStatus = 'جديدة' THEN 'pending'
  WHEN c.CurrentStatus = 'قيد المعالجة' THEN 'in_progress'
  WHEN c.CurrentStatus = 'مغلقة' THEN 'completed'
  ELSE 'pending'
END as Status
```

### 3. ملف الاختبار
تم إنشاء `test-request-tracking.html` لاختبار:
- جلب الطلبات
- إحصائيات الطلبات
- خط سير الطلب
- جلب الأقسام
- جلب موظفي القسم

## النتيجة

### ✅ ما تم إصلاحه
1. **عرض الطلبات**: الآن تظهر جميع الشكاوى من جدول `complaints`
2. **الإحصائيات**: تعرض الأرقام الصحيحة للطلبات
3. **خط السير**: يعرض تاريخ الشكوى من جدول `complainthistory`
4. **تحويل الطلبات**: يعمل مع جدول `complaints`
5. **تعيين الطلبات**: endpoint جديد لتعيين الطلبات

### 📊 البيانات المتاحة
- **12 شكوى** في قاعدة البيانات
- **حالات مختلفة**: جديدة، قيد المعالجة، مغلقة
- **أنواع مختلفة**: طبية، إدارية، تقنية
- **أقسام مختلفة**: موزعة على 70 قسم

### 🔧 الملفات المعدلة
1. `backend/routes/adminRoutes.js` - تعديل جميع API endpoints
2. `test-request-tracking.html` - ملف اختبار جديد

### 🧪 كيفية الاختبار
1. تسجيل الدخول بحساب admin
2. فتح `test-request-tracking.html`
3. اختبار جميع API endpoints
4. فتح صفحة تتبع الطلبات للتأكد من عرض البيانات

## ملاحظات تقنية

### التوافق مع النظام الحالي
- الحل يحافظ على التوافق مع باقي أجزاء النظام
- يستخدم نفس جداول قاعدة البيانات الموجودة
- يحافظ على نفس هيكل API responses

### الأمان
- جميع endpoints محمية بـ admin authentication
- التحقق من صلاحيات المستخدم
- تسجيل جميع العمليات في `complainthistory`

### الأداء
- استخدام JOINs محسنة
- فهارس مناسبة على الأعمدة المهمة
- استعلامات محسنة للإحصائيات
