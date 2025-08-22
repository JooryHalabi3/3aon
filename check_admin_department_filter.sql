-- سكريبت فحص فلترة الشكاوى حسب قسم الأدمن
-- هذا السكريبت يفحص البيانات في جداول الموظفين والأقسام والشكاوى

-- عرض جميع الموظفين مع أقسامهم وأدوارهم
SELECT 
    e.EmployeeID,
    e.FullName,
    e.Username,
    e.Email,
    e.DepartmentID,
    d.DepartmentName,
    r.RoleID,
    r.RoleName
FROM Employees e
LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
LEFT JOIN Roles r ON e.RoleID = r.RoleID
ORDER BY e.EmployeeID;

-- عرض الأدمن فقط مع أقسامهم
SELECT 
    e.EmployeeID,
    e.FullName,
    e.Username,
    e.DepartmentID,
    d.DepartmentName,
    r.RoleName
FROM Employees e
LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
LEFT JOIN Roles r ON e.RoleID = r.RoleID
WHERE r.RoleID = 3 OR r.RoleName LIKE '%أدمن%'
ORDER BY e.DepartmentID;

-- عرض جميع الشكاوى مع أقسامها
SELECT 
    c.ComplaintID,
    c.ComplaintDate,
    c.CurrentStatus,
    c.DepartmentID,
    d.DepartmentName,
    p.FullName as PatientName
FROM Complaints c
LEFT JOIN Departments d ON c.DepartmentID = d.DepartmentID
LEFT JOIN Patients p ON c.PatientID = p.PatientID
ORDER BY c.ComplaintDate DESC
LIMIT 20;

-- إحصائيات الشكاوى حسب القسم
SELECT 
    d.DepartmentID,
    d.DepartmentName,
    COUNT(c.ComplaintID) as ComplaintCount,
    SUM(CASE WHEN c.CurrentStatus = 'جديدة' THEN 1 ELSE 0 END) as NewComplaints,
    SUM(CASE WHEN c.CurrentStatus = 'قيد المعالجة' THEN 1 ELSE 0 END) as InProgressComplaints,
    SUM(CASE WHEN c.CurrentStatus = 'تم الرد' THEN 1 ELSE 0 END) as RespondedComplaints
FROM Departments d
LEFT JOIN Complaints c ON d.DepartmentID = c.DepartmentID
GROUP BY d.DepartmentID, d.DepartmentName
ORDER BY ComplaintCount DESC;

-- فحص الشكاوى التي لا تحتوي على قسم
SELECT 
    c.ComplaintID,
    c.ComplaintDate,
    c.CurrentStatus,
    c.DepartmentID,
    p.FullName as PatientName
FROM Complaints c
LEFT JOIN Patients p ON c.PatientID = p.PatientID
WHERE c.DepartmentID IS NULL
ORDER BY c.ComplaintDate DESC;

-- فحص الموظفين الذين لا يحتويون على قسم
SELECT 
    e.EmployeeID,
    e.FullName,
    e.Username,
    e.DepartmentID,
    r.RoleName
FROM Employees e
LEFT JOIN Roles r ON e.RoleID = r.RoleID
WHERE e.DepartmentID IS NULL
ORDER BY e.EmployeeID;
