-- سكريبت تحديث بيانات الموظفين وربطهم بأقسام محددة
-- تاريخ الإنشاء: 2025-08-20

-- 1. تحديث السوبر أدمن (جود) - يبقى بدون قسم (يمكنه رؤية جميع الأقسام)
UPDATE employees 
SET DepartmentID = NULL 
WHERE EmployeeID = 1 AND Username = '12341';

-- 2. تحديث الموظف الأول (محمود) - ربطه بقسم البصريات (DepartmentID = 40)
UPDATE employees 
SET DepartmentID = 40 
WHERE EmployeeID = 2 AND Username = '1333';

-- 3. تحديث الموظف الثاني (محمود حامد) - ربطه بقسم الباطنة - القلب (DepartmentID = 58)
UPDATE employees 
SET DepartmentID = 58 
WHERE EmployeeID = 3 AND Username = '11';

-- 4. إنشاء أدمن جديد مرتبط بقسم البصريات
INSERT INTO employees (FullName, Username, PasswordHash, Email, PhoneNumber, RoleID, DepartmentID, Specialty) 
VALUES (
    'أحمد البصريات', 
    'admin_optometry', 
    '$2b$10$u0Ou1PIgix8HtncpfwGTXe4uDoresT5ywzXRMTT5rkq/3uHj8gUJO', -- نفس كلمة المرور: 123456
    'admin.optometry@hospital.com', 
    '0555555555', 
    3, -- RoleID = 3 (أدمن)
    40  -- DepartmentID = 40 (قسم البصريات)
);

-- 5. إنشاء أدمن آخر مرتبط بقسم الباطنة - القلب
INSERT INTO employees (FullName, Username, PasswordHash, Email, PhoneNumber, RoleID, DepartmentID, Specialty) 
VALUES (
    'سارة القلب', 
    'admin_cardiology', 
    '$2b$10$u0Ou1PIgix8HtncpfwGTXe4uDoresT5ywzXRMTT5rkq/3uHj8gUJO', -- نفس كلمة المرور: 123456
    'admin.cardiology@hospital.com', 
    '0544444444', 
    3, -- RoleID = 3 (أدمن)
    58  -- DepartmentID = 58 (قسم الباطنة - القلب)
);

-- 6. عرض النتائج للتحقق
SELECT 
    e.EmployeeID,
    e.FullName,
    e.Username,
    e.RoleID,
    r.RoleName,
    e.DepartmentID,
    d.DepartmentName
FROM employees e
LEFT JOIN roles r ON e.RoleID = r.RoleID
LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
ORDER BY e.EmployeeID;

-- 7. عرض الشكاوى حسب القسم للتحقق
SELECT 
    c.ComplaintID,
    c.ComplaintDate,
    c.CurrentStatus,
    d.DepartmentName,
    ct.TypeName as ComplaintType
FROM complaints c
JOIN departments d ON c.DepartmentID = d.DepartmentID
JOIN complainttypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
ORDER BY c.ComplaintDate DESC;
