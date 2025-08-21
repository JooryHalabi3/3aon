-- إضافة جداول جديدة لصفحة تتبع الطلبات

-- جدول الطلبات
CREATE TABLE IF NOT EXISTS requests (
    RequestID INT AUTO_INCREMENT PRIMARY KEY,
    Subject VARCHAR(255) NOT NULL,
    Description TEXT,
    ComplaintType ENUM('medical', 'administrative', 'technical') NOT NULL,
    Status ENUM('pending', 'in_progress', 'completed', 'rejected') DEFAULT 'pending',
    RequesterID INT,
    AssignedTo INT,
    SubmissionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (RequesterID) REFERENCES employees(EmployeeID) ON DELETE SET NULL,
    FOREIGN KEY (AssignedTo) REFERENCES employees(EmployeeID) ON DELETE SET NULL
);

-- جدول خط سير الطلبات
CREATE TABLE IF NOT EXISTS request_workflow (
    WorkflowID INT AUTO_INCREMENT PRIMARY KEY,
    RequestID INT NOT NULL,
    UserID INT,
    Action VARCHAR(100) NOT NULL,
    Description TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (RequestID) REFERENCES requests(RequestID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES employees(EmployeeID) ON DELETE SET NULL
);

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
    NotificationID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Message TEXT NOT NULL,
    Type ENUM('info', 'warning', 'error', 'success', 'transfer') DEFAULT 'info',
    IsRead BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES employees(EmployeeID) ON DELETE CASCADE
);

-- إضافة جدول system_logs لتتبع إجراءات النظام
CREATE TABLE IF NOT EXISTS system_logs (
  LogID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT,
  Action VARCHAR(100) NOT NULL,
  Description TEXT,
  IPAddress VARCHAR(45),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (UserID) REFERENCES employees(EmployeeID) ON DELETE SET NULL
);

-- إضافة بيانات الأقسام
INSERT INTO departments (DepartmentName, Description) VALUES
('قسم الطوارئ', 'قسم الطوارئ والرعاية العاجلة'),
('قسم الجراحة', 'قسم الجراحة العامة والخاصة'),
('قسم الباطنية', 'قسم الأمراض الباطنية'),
('قسم الأطفال', 'قسم طب الأطفال'),
('قسم النساء والولادة', 'قسم النساء والولادة'),
('قسم الأشعة', 'قسم الأشعة والتصوير الطبي'),
('قسم المختبر', 'قسم المختبر والتحاليل'),
('قسم الصيدلة', 'قسم الصيدلة والأدوية'),
('قسم التمريض', 'قسم التمريض والرعاية'),
('قسم الإدارة', 'قسم الإدارة والموارد البشرية'),
('قسم تقنية المعلومات', 'قسم تقنية المعلومات والدعم الفني'),
('قسم النظافة', 'قسم النظافة والصيانة');

-- إضافة بيانات الموظفين (إذا لم تكن موجودة)
INSERT INTO employees (FullName, Email, NationalID, DepartmentID, RoleID, Status, HireDate) VALUES
('أحمد محمد علي', 'ahmed.ali@hospital.com', '1234567890', 1, 3, 'active', '2023-01-15'),
('فاطمة أحمد حسن', 'fatima.hassan@hospital.com', '1234567891', 2, 3, 'active', '2023-02-20'),
('محمد عبدالله سالم', 'mohammed.salem@hospital.com', '1234567892', 3, 3, 'active', '2023-03-10'),
('عائشة محمد أحمد', 'aisha.ahmed@hospital.com', '1234567893', 4, 3, 'active', '2023-04-05'),
('علي حسن محمد', 'ali.hassan@hospital.com', '1234567894', 5, 3, 'active', '2023-05-12'),
('خديجة عبدالرحمن', 'khadija.abdulrahman@hospital.com', '1234567895', 6, 3, 'active', '2023-06-18'),
('عبدالله محمد علي', 'abdullah.ali@hospital.com', '1234567896', 7, 3, 'active', '2023-07-22'),
('نورا أحمد حسن', 'nora.hassan@hospital.com', '1234567897', 8, 3, 'active', '2023-08-30'),
('يوسف محمد سالم', 'youssef.salem@hospital.com', '1234567898', 9, 3, 'active', '2023-09-14'),
('مريم عبدالله', 'maryam.abdullah@hospital.com', '1234567899', 10, 2, 'active', '2023-10-08'),
('خالد أحمد محمد', 'khalid.ahmed@hospital.com', '1234567900', 11, 2, 'active', '2023-11-25'),
('سارة محمد علي', 'sara.ali@hospital.com', '1234567901', 12, 3, 'active', '2023-12-03');

-- إضافة بيانات تجريبية للطلبات
INSERT INTO requests (Subject, Description, ComplaintType, RequesterID, Status) VALUES
('مشكلة في النظام الطبي', 'لا يمكن الوصول إلى السجلات الطبية للمرضى', 'technical', 1, 'pending'),
('شكوى في الخدمة الطبية', 'تأخير في موعد الطبيب', 'medical', 2, 'in_progress'),
('مشكلة إدارية', 'طلب تعديل في الجدول الزمني', 'administrative', 3, 'completed'),
('عطل في الأجهزة الطبية', 'جهاز الأشعة لا يعمل بشكل صحيح', 'technical', 4, 'pending'),
('شكوى في النظافة', 'عدم نظافة الغرف الطبية', 'administrative', 5, 'in_progress');

-- إضافة بيانات تجريبية لخط سير الطلبات
INSERT INTO request_workflow (RequestID, UserID, Action, Description) VALUES
(1, 1, 'تقديم الشكوى', 'تم تقديم شكوى تقنية جديدة'),
(1, 2, 'استلام الشكوى', 'تم استلام الشكوى من قبل الإدارة'),
(2, 2, 'تقديم الشكوى', 'تم تقديم شكوى طبية جديدة'),
(2, 3, 'تحويل الشكوى', 'تم تحويل الشكوى إلى قسم الطوارئ'),
(3, 3, 'تقديم الشكوى', 'تم تقديم شكوى إدارية جديدة'),
(3, 4, 'إكمال المعالجة', 'تم حل المشكلة الإدارية بنجاح'),
(4, 4, 'تقديم الشكوى', 'تم تقديم شكوى تقنية جديدة'),
(5, 5, 'تقديم الشكوى', 'تم تقديم شكوى إدارية جديدة'),
(5, 1, 'تحويل الشكوى', 'تم تحويل الشكوى إلى قسم النظافة');

-- إضافة بيانات تجريبية للإشعارات
INSERT INTO notifications (UserID, Title, Message, Type) VALUES
(2, 'شكوى جديدة محولة', 'تم تحويل شكوى تقنية جديدة إليك', 'transfer'),
(3, 'شكوى جديدة محولة', 'تم تحويل شكوى طبية جديدة إليك', 'transfer'),
(1, 'شكوى جديدة محولة', 'تم تحويل شكوى إدارية جديدة إليك', 'transfer'),
(4, 'تحديث حالة الشكوى', 'تم تحديث حالة الشكوى رقم 3', 'info'),
(5, 'شكوى جديدة محولة', 'تم تحويل شكوى إدارية جديدة إليك', 'transfer');

-- إضافة بيانات تجريبية لجدول system_logs
INSERT IGNORE INTO system_logs (UserID, Action, Description, IPAddress, CreatedAt) VALUES
(1, 'Login', 'تم تسجيل الدخول بنجاح', '192.168.1.100', NOW() - INTERVAL 1 HOUR),
(2, 'Update Employee', 'تم تحديث بيانات الموظف: أحمد محمد (ID: 3)', '192.168.1.101', NOW() - INTERVAL 30 MINUTE),
(1, 'Login As Employee', 'تم الدخول كموظف: سارة أحمد (ID: 4)', '192.168.1.100', NOW() - INTERVAL 15 MINUTE),
(2, 'Delete Employee', 'تم حذف الموظف: محمد علي (ID: 5)', '192.168.1.101', NOW() - INTERVAL 10 MINUTE);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_requests_status ON requests(Status);
CREATE INDEX idx_requests_type ON requests(ComplaintType);
CREATE INDEX idx_requests_submission_date ON requests(SubmissionDate);
CREATE INDEX idx_workflow_request_id ON request_workflow(RequestID);
CREATE INDEX idx_notifications_user_id ON notifications(UserID);
CREATE INDEX idx_notifications_is_read ON notifications(IsRead);

-- تحديث جدول employees لإضافة حقل LastUpdated
ALTER TABLE employees ADD COLUMN IF NOT EXISTS LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- تحديث جدول employees لإضافة حقل ManagerID إذا لم يكن موجوداً
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ManagerID INT NULL;
ALTER TABLE employees ADD CONSTRAINT fk_employees_manager FOREIGN KEY (ManagerID) REFERENCES employees(EmployeeID) ON DELETE SET NULL;

-- تحديث بعض الموظفين ليكون لديهم مديرين
UPDATE employees SET ManagerID = 1 WHERE EmployeeID IN (2, 3, 4, 5) AND ManagerID IS NULL;
UPDATE employees SET ManagerID = 2 WHERE EmployeeID IN (6, 7, 8) AND ManagerID IS NULL;

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX idx_system_logs_userid ON system_logs(UserID);
CREATE INDEX idx_system_logs_action ON system_logs(Action);
CREATE INDEX idx_system_logs_createdat ON system_logs(CreatedAt);
