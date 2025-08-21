-- إنشاء الجداول المطلوبة إذا لم تكن موجودة
-- هذا الملف يضمن وجود جميع الجداول المطلوبة لصفحة تتبع الطلبات

-- إنشاء جدول complaints إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS complaints (
    ComplaintID INT PRIMARY KEY AUTO_INCREMENT,
    PatientID INT,
    EmployeeID INT,
    ComplaintTypeID INT,
    SubTypeID INT,
    DepartmentID INT,
    ComplaintDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    ComplaintDetails TEXT,
    CurrentStatus VARCHAR(50) DEFAULT 'جديدة',
    Priority VARCHAR(20) DEFAULT 'متوسطة',
    MedicalRecordNumber VARCHAR(50),
    ResponsibleEntity VARCHAR(100),
    IsSensitive BOOLEAN DEFAULT FALSE,
    IsSuggestion BOOLEAN DEFAULT FALSE,
    PatientSatisfactionRating INT,
    ResolutionDetails TEXT,
    ResolutionDate DATETIME
);

-- إنشاء جدول complainthistory إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS complainthistory (
    HistoryID INT PRIMARY KEY AUTO_INCREMENT,
    ComplaintID INT,
    EmployeeID INT,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    Stage VARCHAR(100),
    Remarks TEXT,
    OldStatus VARCHAR(50),
    NewStatus VARCHAR(50),
    FOREIGN KEY (ComplaintID) REFERENCES complaints(ComplaintID) ON DELETE CASCADE
);

-- إنشاء جدول complainttypes إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS complainttypes (
    ComplaintTypeID INT PRIMARY KEY AUTO_INCREMENT,
    TypeName VARCHAR(100) NOT NULL,
    Description TEXT
);

-- إنشاء جدول departments إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS departments (
    DepartmentID INT PRIMARY KEY AUTO_INCREMENT,
    DepartmentName VARCHAR(100) NOT NULL,
    Description TEXT
);

-- إنشاء جدول employees إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS employees (
    EmployeeID INT PRIMARY KEY AUTO_INCREMENT,
    FullName VARCHAR(100) NOT NULL,
    DepartmentID INT,
    RoleID INT,
    Email VARCHAR(100),
    Phone VARCHAR(20),
    FOREIGN KEY (DepartmentID) REFERENCES departments(DepartmentID)
);

-- إدخال بيانات تجريبية أساسية إذا لم تكن موجودة

-- إدخال أنواع الشكاوى
INSERT IGNORE INTO complainttypes (ComplaintTypeID, TypeName, Description) VALUES
(1, 'شكوى طبية', 'شكاوى متعلقة بالخدمات الطبية'),
(2, 'شكوى إدارية', 'شكاوى متعلقة بالإجراءات الإدارية'),
(3, 'شكوى تقنية', 'شكاوى متعلقة بالخدمات التقنية');

-- إدخال الأقسام
INSERT IGNORE INTO departments (DepartmentID, DepartmentName, Description) VALUES
(1, 'قسم الطوارئ', 'قسم الطوارئ الطبية'),
(2, 'قسم العيادات الخارجية', 'قسم العيادات الخارجية'),
(3, 'قسم الصيدلية', 'قسم الصيدلية'),
(4, 'قسم المختبر', 'قسم المختبر'),
(5, 'قسم الأشعة', 'قسم الأشعة');

-- إدخال الموظفين
INSERT IGNORE INTO employees (EmployeeID, FullName, DepartmentID, RoleID, Email, Phone) VALUES
(1, 'أحمد محمد', 1, 3, 'ahmed@hospital.com', '0501234567'),
(2, 'فاطمة علي', 2, 3, 'fatima@hospital.com', '0502345678'),
(3, 'محمد حسن', 3, 3, 'mohammed@hospital.com', '0503456789'),
(4, 'عائشة أحمد', 4, 3, 'aisha@hospital.com', '0504567890'),
(5, 'علي محمود', 5, 3, 'ali@hospital.com', '0505678901');

-- إدخال شكاوى تجريبية
INSERT IGNORE INTO complaints (ComplaintID, PatientID, EmployeeID, ComplaintTypeID, SubTypeID, DepartmentID, ComplaintDate, ComplaintDetails, CurrentStatus, Priority, MedicalRecordNumber, ResponsibleEntity, IsSensitive, IsSuggestion, PatientSatisfactionRating, ResolutionDetails, ResolutionDate) VALUES
(1, 1, 1, 1, 1, 1, '2025-01-21 10:00:00', 'شكوى تجريبية 1 - مشكلة في الخدمة الطبية', 'جديدة', 'متوسطة', 'MRN001', NULL, 0, 0, NULL, NULL, NULL),
(2, 2, 2, 2, 11, 2, '2025-01-21 11:00:00', 'شكوى تجريبية 2 - مشكلة في المواعيد', 'قيد المعالجة', 'عالية', 'MRN002', NULL, 0, 0, NULL, NULL, NULL),
(3, 3, 3, 3, 17, 3, '2025-01-21 12:00:00', 'شكوى تجريبية 3 - مشكلة في الصيدلية', 'مغلقة', 'متوسطة', 'MRN003', NULL, 0, 0, NULL, 'تم حل المشكلة', '2025-01-21 14:00:00'),
(4, 4, 1, 4, 22, 4, '2025-01-21 13:00:00', 'شكوى تجريبية 4 - مشكلة في الكوادر الصحية', 'جديدة', 'عالية', 'MRN004', NULL, 0, 0, NULL, NULL, NULL),
(5, 5, 2, 5, 27, 5, '2025-01-21 14:00:00', 'شكوى تجريبية 5 - مشكلة في الإجراءات الإدارية', 'قيد المعالجة', 'متوسطة', 'MRN005', NULL, 0, 0, NULL, NULL, NULL);

-- إدخال سجلات في تاريخ الشكاوى
INSERT IGNORE INTO complainthistory (HistoryID, ComplaintID, EmployeeID, Timestamp, Stage, Remarks, OldStatus, NewStatus) VALUES
(1, 1, 1, '2025-01-21 10:00:00', 'تم تقديم الشكوى', 'تم استلام الشكوى بنجاح', '', 'جديدة'),
(2, 2, 2, '2025-01-21 11:00:00', 'تم تقديم الشكوى', 'تم استلام الشكوى بنجاح', '', 'جديدة'),
(3, 2, 1, '2025-01-21 11:30:00', 'تحديث الحالة', 'تم تحديث حالة الشكوى من "جديدة" إلى "قيد المعالجة"', 'جديدة', 'قيد المعالجة'),
(4, 3, 3, '2025-01-21 12:00:00', 'تم تقديم الشكوى', 'تم استلام الشكوى بنجاح', '', 'جديدة'),
(5, 3, 1, '2025-01-21 12:30:00', 'تحديث الحالة', 'تم تحديث حالة الشكوى من "جديدة" إلى "قيد المعالجة"', 'جديدة', 'قيد المعالجة'),
(6, 3, 1, '2025-01-21 14:00:00', 'تحديث الحالة', 'تم تحديث حالة الشكوى من "قيد المعالجة" إلى "مغلقة"', 'قيد المعالجة', 'مغلقة'),
(7, 4, 1, '2025-01-21 13:00:00', 'تم تقديم الشكوى', 'تم استلام الشكوى بنجاح', '', 'جديدة'),
(8, 5, 2, '2025-01-21 14:00:00', 'تم تقديم الشكوى', 'تم استلام الشكوى بنجاح', '', 'جديدة'),
(9, 5, 1, '2025-01-21 14:30:00', 'تحديث الحالة', 'تم تحديث حالة الشكوى من "جديدة" إلى "قيد المعالجة"', 'جديدة', 'قيد المعالجة');

-- عرض عدد الشكاوى الموجودة
SELECT 
    COUNT(*) as total_complaints,
    SUM(CASE WHEN CurrentStatus = 'جديدة' THEN 1 ELSE 0 END) as new_complaints,
    SUM(CASE WHEN CurrentStatus = 'قيد المعالجة' THEN 1 ELSE 0 END) as in_progress_complaints,
    SUM(CASE WHEN CurrentStatus = 'مغلقة' THEN 1 ELSE 0 END) as closed_complaints
FROM complaints;
