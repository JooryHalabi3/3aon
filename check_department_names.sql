-- سكريبت فحص أسماء الأقسام في قاعدة البيانات
-- هذا السكريبت يفحص البيانات في جداول الشكاوى والأقسام

-- عرض جميع الأقسام
SELECT 
    DepartmentID,
    DepartmentName,
    Description
FROM Departments
ORDER BY DepartmentID;

-- عرض عينة من الشكاوى مع أسماء الأقسام
SELECT 
    c.ComplaintID,
    c.DepartmentID,
    d.DepartmentName,
    c.ComplaintDate,
    c.CurrentStatus
FROM Complaints c
LEFT JOIN Departments d ON c.DepartmentID = d.DepartmentID
ORDER BY c.ComplaintDate DESC
LIMIT 10;

-- فحص الشكاوى التي لا تحتوي على اسم قسم
SELECT 
    c.ComplaintID,
    c.DepartmentID,
    d.DepartmentName,
    c.ComplaintDate
FROM Complaints c
LEFT JOIN Departments d ON c.DepartmentID = d.DepartmentID
WHERE d.DepartmentName IS NULL
ORDER BY c.ComplaintDate DESC;

-- إحصائيات الشكاوى حسب القسم
SELECT 
    d.DepartmentName,
    COUNT(c.ComplaintID) as ComplaintCount
FROM Departments d
LEFT JOIN Complaints c ON d.DepartmentID = c.DepartmentID
GROUP BY d.DepartmentID, d.DepartmentName
ORDER BY ComplaintCount DESC;
