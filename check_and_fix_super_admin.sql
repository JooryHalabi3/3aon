-- سكريبت فحص وإصلاح بيانات المستخدمين
-- هذا السكريبت يفحص المستخدمين الحاليين ويحدثهم ليكونوا سوبر أدمن

-- عرض جميع المستخدمين الحاليين مع أدوارهم
SELECT
    e.EmployeeID,
    e.FullName,
    e.Username,
    e.Email,
    r.RoleName,
    e.RoleID,
    d.DepartmentName,
    e.DepartmentID
FROM employees e
JOIN roles r ON e.RoleID = r.RoleID
LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
ORDER BY e.EmployeeID;

-- عرض الأدوار المتاحة
SELECT * FROM roles;

-- عرض الأقسام المتاحة
SELECT * FROM departments;

-- تحديث المستخدم "محمود" ليكون سوبر أدمن (RoleID = 1)
UPDATE employees
SET RoleID = 1
WHERE Username = '1333' AND FullName = 'محمود';

-- تحديث المستخدم "محمود حامد" ليكون أدمن قسم (RoleID = 3)
UPDATE employees
SET RoleID = 3, DepartmentID = 1
WHERE Username = '11' AND FullName = 'محمود حامد';

-- إضافة موظف جديد كسوبر أدمن للاختبار
INSERT INTO employees (FullName, Username, PasswordHash, Email, PhoneNumber, RoleID, DepartmentID, Specialty)
VALUES
('أحمد محمد', 'superadmin', '$2b$10$VODCmMhKpziOmCsnn2lhF..an7g827NjFmXng5AtNjwKngPQyRpjS', 'superadmin@test.com', '0500000000', 1, 1, 'مدير النظام');

-- عرض المستخدمين بعد التحديث
SELECT
    e.EmployeeID,
    e.FullName,
    e.Username,
    r.RoleName,
    e.RoleID,
    d.DepartmentName,
    e.DepartmentID
FROM employees e
JOIN roles r ON e.RoleID = r.RoleID
LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
WHERE e.Username IN ('1333', '11', 'superadmin')
ORDER BY e.EmployeeID;
