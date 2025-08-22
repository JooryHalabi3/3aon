-- سكريبت إصلاح أدوار المستخدمين
-- هذا السكريبت يحدث دور المستخدم ليكون أدمن قسم

-- تحديث المستخدم "محمود" ليكون سوبر أدمن
UPDATE employees
SET RoleID = 1
WHERE Username = '1333' AND FullName = 'محمود';

-- تحديث المستخدم "محمود حامد" ليكون أدمن قسم
UPDATE employees
SET RoleID = 3, DepartmentID = 1
WHERE Username = '11' AND FullName = 'محمود حامد';

-- إضافة موظف جديد كأدمن للاختبار
INSERT INTO employees (FullName, Username, PasswordHash, Email, PhoneNumber, RoleID, DepartmentID, Specialty)
VALUES
('أحمد محمد', 'admin1', '$2b$10$VODCmMhKpziOmCsnn2lhF..an7g827NjFmXng5AtNjwKngPQyRpjS', 'admin1@test.com', '0500000001', 3, 1, 'مدير قسم'),
('فاطمة علي', 'admin2', '$2b$10$VODCmMhKpziOmCsnn2lhF..an7g827NjFmXng5AtNjwKngPQyRpjS', 'admin2@test.com', '0500000002', 3, 2, 'مدير قسم');

-- عرض الموظفين بعد التحديث
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
ORDER BY e.EmployeeID;
