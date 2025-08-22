-- سكريبت فحص أدوار المستخدمين الحاليين
-- استخدم هذا السكريبت لمعرفة دور المستخدم الحالي

-- عرض جميع الموظفين مع أدوارهم
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

-- البحث عن مستخدم محدد (استبدل 'username' باسم المستخدم)
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
WHERE e.Username = 'admin1' OR e.Username = '11' OR e.Username = '1333';
