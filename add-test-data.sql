-- إضافة بيانات تجريبية للطلبات
-- تأكد من وجود بيانات في جدول complaints

-- إضافة شكاوى تجريبية إذا لم تكن موجودة
INSERT IGNORE INTO complaints (ComplaintID, PatientID, EmployeeID, ComplaintTypeID, SubTypeID, DepartmentID, ComplaintDate, ComplaintDetails, CurrentStatus, Priority, MedicalRecordNumber, ResponsibleEntity, IsSensitive, IsSuggestion, PatientSatisfactionRating, ResolutionDetails, ResolutionDate) VALUES
(13, 1, 1, 1, 1, 1, '2025-08-21 10:00:00', 'شكوى تجريبية 1 - مشكلة في الخدمة الطبية', 'جديدة', 'متوسطة', 'MRN001', NULL, 0, 0, NULL, NULL, NULL),
(14, 2, 2, 2, 11, 2, '2025-08-21 11:00:00', 'شكوى تجريبية 2 - مشكلة في المواعيد', 'قيد المعالجة', 'عالية', 'MRN002', NULL, 0, 0, NULL, NULL, NULL),
(15, 3, 3, 3, 17, 3, '2025-08-21 12:00:00', 'شكوى تجريبية 3 - مشكلة في الصيدلية', 'مغلقة', 'متوسطة', 'MRN003', NULL, 0, 0, NULL, 'تم حل المشكلة', '2025-08-21 14:00:00'),
(16, 4, 1, 4, 22, 4, '2025-08-21 13:00:00', 'شكوى تجريبية 4 - مشكلة في الكوادر الصحية', 'جديدة', 'عالية', 'MRN004', NULL, 0, 0, NULL, NULL, NULL),
(17, 5, 2, 5, 27, 5, '2025-08-21 14:00:00', 'شكوى تجريبية 5 - مشكلة في الإجراءات الإدارية', 'قيد المعالجة', 'متوسطة', 'MRN005', NULL, 0, 0, NULL, NULL, NULL);

-- إضافة سجلات في تاريخ الشكاوى
INSERT IGNORE INTO complainthistory (HistoryID, ComplaintID, EmployeeID, Timestamp, Stage, Remarks, OldStatus, NewStatus) VALUES
(16, 13, 1, '2025-08-21 10:00:00', 'تم تقديم الشكوى', 'تم استلام الشكوى بنجاح', '', 'جديدة'),
(17, 14, 2, '2025-08-21 11:00:00', 'تم تقديم الشكوى', 'تم استلام الشكوى بنجاح', '', 'جديدة'),
(18, 14, 1, '2025-08-21 11:30:00', 'تحديث الحالة', 'تم تحديث حالة الشكوى من "جديدة" إلى "قيد المعالجة"', 'جديدة', 'قيد المعالجة'),
(19, 15, 3, '2025-08-21 12:00:00', 'تم تقديم الشكوى', 'تم استلام الشكوى بنجاح', '', 'جديدة'),
(20, 15, 1, '2025-08-21 12:30:00', 'تحديث الحالة', 'تم تحديث حالة الشكوى من "جديدة" إلى "قيد المعالجة"', 'جديدة', 'قيد المعالجة'),
(21, 15, 1, '2025-08-21 14:00:00', 'تحديث الحالة', 'تم تحديث حالة الشكوى من "قيد المعالجة" إلى "مغلقة"', 'قيد المعالجة', 'مغلقة'),
(22, 16, 1, '2025-08-21 13:00:00', 'تم تقديم الشكوى', 'تم استلام الشكوى بنجاح', '', 'جديدة'),
(23, 17, 2, '2025-08-21 14:00:00', 'تم تقديم الشكوى', 'تم استلام الشكوى بنجاح', '', 'جديدة'),
(24, 17, 1, '2025-08-21 14:30:00', 'تحديث الحالة', 'تم تحديث حالة الشكوى من "جديدة" إلى "قيد المعالجة"', 'جديدة', 'قيد المعالجة');

-- عرض عدد الشكاوى الموجودة
SELECT 
    COUNT(*) as total_complaints,
    SUM(CASE WHEN CurrentStatus = 'جديدة' THEN 1 ELSE 0 END) as new_complaints,
    SUM(CASE WHEN CurrentStatus = 'قيد المعالجة' THEN 1 ELSE 0 END) as in_progress_complaints,
    SUM(CASE WHEN CurrentStatus = 'مغلقة' THEN 1 ELSE 0 END) as closed_complaints
FROM complaints;

-- عرض الشكاوى مع تفاصيلها
SELECT 
    c.ComplaintID,
    c.ComplaintDetails,
    c.CurrentStatus,
    c.ComplaintDate,
    ct.TypeName as ComplaintType,
    d.DepartmentName,
    e.FullName as EmployeeName
FROM complaints c
LEFT JOIN complainttypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
LEFT JOIN employees e ON c.EmployeeID = e.EmployeeID
ORDER BY c.ComplaintDate DESC;
