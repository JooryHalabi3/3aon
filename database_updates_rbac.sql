-- تحديث قاعدة البيانات لدعم نظام RBAC وتحويل الشكاوى
-- تاريخ الإنشاء: 2025-01-19

-- 1. تحديث جدول الموظفين لإضافة حقل department_id
ALTER TABLE employees ADD COLUMN department_id INT NULL AFTER RoleID;
ALTER TABLE employees ADD CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments(DepartmentID) ON DELETE SET NULL;

-- 2. تحديث جدول الشكاوى لإضافة حقل assignee_id
ALTER TABLE complaints ADD COLUMN assignee_id INT NULL AFTER DepartmentID;
ALTER TABLE complaints ADD CONSTRAINT fk_complaints_assignee FOREIGN KEY (assignee_id) REFERENCES employees(EmployeeID) ON DELETE SET NULL;

-- 3. إنشاء جدول سجل التدقيق (AuditLogs)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  old_value JSON NULL,
  new_value JSON NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  PRIMARY KEY (id),
  KEY idx_user_id (user_id),
  KEY idx_entity (entity_type, entity_id),
  KEY idx_timestamp (timestamp),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES employees(EmployeeID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. تحديث الأدوار الحالية لتتوافق مع نظام RBAC
UPDATE roles SET RoleName = 'SUPER_ADMIN', Description = 'مدير النظام مع جميع الصلاحيات' WHERE RoleID = 1;
UPDATE roles SET RoleName = 'EMPLOYEE', Description = 'موظف عادي - يرى الشكاوى المعينة له فقط' WHERE RoleID = 2;
UPDATE roles SET RoleName = 'ADMIN', Description = 'مسؤول قسم - يرى شكاوى قسمه فقط' WHERE RoleID = 3;

-- 5. إضافة أدوار جديدة إذا لم تكن موجودة
INSERT IGNORE INTO roles (RoleID, RoleName, Description) VALUES 
(4, 'SUPER_ADMIN', 'مدير النظام مع جميع الصلاحيات'),
(5, 'ADMIN', 'مسؤول قسم - يرى شكاوى قسمه فقط'),
(6, 'EMPLOYEE', 'موظف عادي - يرى الشكاوى المعينة له فقط');

-- 6. إضافة فهارس لتحسين الأداء
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_role ON employees(RoleID);
CREATE INDEX idx_complaints_assignee ON complaints(assignee_id);
CREATE INDEX idx_complaints_department_assignee ON complaints(DepartmentID, assignee_id);

-- 7. تحديث بعض الموظفين الحاليين لتوضيح النظام
-- Super Admin (لا يحتاج department_id)
UPDATE employees SET RoleID = 1, department_id = NULL WHERE EmployeeID = 1;

-- Admin (يحتاج department_id)
UPDATE employees SET RoleID = 3, department_id = 43 WHERE EmployeeID = 2;

-- Employee (يحتاج department_id)
UPDATE employees SET RoleID = 2, department_id = 40 WHERE EmployeeID = 3;

-- 8. إنشاء إجراء مخزن لتحديث حالة الشكوى عند التعيين
DELIMITER //
CREATE PROCEDURE UpdateComplaintAssignment(
    IN p_complaint_id INT,
    IN p_department_id INT,
    IN p_assignee_id INT,
    IN p_user_id INT
)
BEGIN
    DECLARE old_department_id INT;
    DECLARE old_assignee_id INT;
    DECLARE old_status VARCHAR(50);
    
    -- الحصول على القيم القديمة
    SELECT DepartmentID, assignee_id, CurrentStatus 
    INTO old_department_id, old_assignee_id, old_status
    FROM complaints 
    WHERE ComplaintID = p_complaint_id;
    
    -- تحديث الشكوى
    UPDATE complaints 
    SET DepartmentID = p_department_id,
        assignee_id = p_assignee_id,
        CurrentStatus = 'قيد المعالجة'
    WHERE ComplaintID = p_complaint_id;
    
    -- إضافة سجل في التدقيق
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
    VALUES (
        p_user_id,
        'COMPLAINT_ASSIGNMENT',
        'complaint',
        p_complaint_id,
        JSON_OBJECT(
            'department_id', old_department_id,
            'assignee_id', old_assignee_id,
            'status', old_status
        ),
        JSON_OBJECT(
            'department_id', p_department_id,
            'assignee_id', p_assignee_id,
            'status', 'قيد المعالجة'
        )
    );
    
    -- إضافة سجل في تاريخ الشكوى
    INSERT INTO complainthistory (ComplaintID, EmployeeID, Stage, Remarks, OldStatus, NewStatus)
    VALUES (
        p_complaint_id,
        p_user_id,
        'تحويل الشكوى',
        CONCAT('تم تحويل الشكوى من قسم (ID: ', old_department_id, ') إلى قسم (ID: ', p_department_id, ') وتعيينها لموظف (ID: ', p_assignee_id, ')'),
        old_status,
        'قيد المعالجة'
    );
END //
DELIMITER ;

-- 9. إنشاء إجراء مخزن لجلب موظفي قسم معين
DELIMITER //
CREATE PROCEDURE GetDepartmentEmployees(IN p_department_id INT)
BEGIN
    SELECT 
        e.EmployeeID as id,
        e.FullName as full_name,
        e.Username,
        e.Email,
        e.PhoneNumber,
        r.RoleName as role
    FROM employees e
    JOIN roles r ON e.RoleID = r.RoleID
    WHERE e.department_id = p_department_id
    AND e.EmployeeID IS NOT NULL
    ORDER BY e.FullName;
END //
DELIMITER ;

-- 10. إنشاء إجراء مخزن للتحقق من صلاحيات المستخدم
DELIMITER //
CREATE PROCEDURE CheckUserPermissions(
    IN p_user_id INT,
    IN p_complaint_id INT,
    OUT p_can_access BOOLEAN,
    OUT p_can_assign BOOLEAN
)
BEGIN
    DECLARE user_role VARCHAR(50);
    DECLARE user_department_id INT;
    DECLARE complaint_department_id INT;
    DECLARE complaint_assignee_id INT;
    
    -- الحصول على معلومات المستخدم
    SELECT r.RoleName, e.department_id
    INTO user_role, user_department_id
    FROM employees e
    JOIN roles r ON e.RoleID = r.RoleID
    WHERE e.EmployeeID = p_user_id;
    
    -- الحصول على معلومات الشكوى
    SELECT DepartmentID, assignee_id
    INTO complaint_department_id, complaint_assignee_id
    FROM complaints
    WHERE ComplaintID = p_complaint_id;
    
    -- تحديد الصلاحيات
    SET p_can_access = FALSE;
    SET p_can_assign = FALSE;
    
    -- SUPER_ADMIN: صلاحيات كاملة
    IF user_role = 'SUPER_ADMIN' THEN
        SET p_can_access = TRUE;
        SET p_can_assign = TRUE;
    -- ADMIN: صلاحيات على قسمه فقط
    ELSEIF user_role = 'ADMIN' AND user_department_id = complaint_department_id THEN
        SET p_can_access = TRUE;
        SET p_can_assign = TRUE;
    -- EMPLOYEE: صلاحيات على الشكاوى المعينة له فقط
    ELSEIF user_role = 'EMPLOYEE' AND complaint_assignee_id = p_user_id THEN
        SET p_can_access = TRUE;
        SET p_can_assign = FALSE;
    END IF;
END //
DELIMITER ;

-- 11. إنشاء إجراء مخزن لجلب الشكاوى حسب الصلاحيات
DELIMITER //
CREATE PROCEDURE GetComplaintsByPermissions(
    IN p_user_id INT,
    IN p_date_filter VARCHAR(10),
    IN p_search VARCHAR(255),
    IN p_status VARCHAR(50),
    IN p_department VARCHAR(100),
    IN p_complaint_type VARCHAR(100)
)
BEGIN
    DECLARE user_role VARCHAR(50);
    DECLARE user_department_id INT;
    
    -- الحصول على معلومات المستخدم
    SELECT r.RoleName, e.department_id
    INTO user_role, user_department_id
    FROM employees e
    JOIN roles r ON e.RoleID = r.RoleID
    WHERE e.EmployeeID = p_user_id;
    
    -- بناء الاستعلام حسب الصلاحيات
    SET @sql = 'SELECT 
        c.*,
        p.PatientName,
        p.NationalID_Iqama,
        p.ContactNumber,
        d.DepartmentName,
        ct.TypeName as ComplaintTypeName,
        cst.SubTypeName,
        e.FullName as EmployeeName,
        assignee.FullName as AssigneeName
    FROM complaints c
    JOIN patients p ON c.PatientID = p.PatientID
    JOIN departments d ON c.DepartmentID = d.DepartmentID
    JOIN complainttypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
    LEFT JOIN complaintsubtypes cst ON c.SubTypeID = cst.SubTypeID
    JOIN employees e ON c.EmployeeID = e.EmployeeID
    LEFT JOIN employees assignee ON c.assignee_id = assignee.EmployeeID
    WHERE 1=1';
    
    -- تطبيق فلاتر حسب الصلاحيات
    IF user_role = 'SUPER_ADMIN' THEN
        -- لا توجد قيود إضافية
    ELSEIF user_role = 'ADMIN' THEN
        SET @sql = CONCAT(@sql, ' AND c.DepartmentID = ', user_department_id);
    ELSEIF user_role = 'EMPLOYEE' THEN
        SET @sql = CONCAT(@sql, ' AND c.assignee_id = ', p_user_id);
    END IF;
    
    -- تطبيق الفلاتر الإضافية
    IF p_date_filter IS NOT NULL AND p_date_filter != 'all' THEN
        SET @sql = CONCAT(@sql, ' AND c.ComplaintDate >= DATE_SUB(NOW(), INTERVAL ', p_date_filter, ' DAY)');
    END IF;
    
    IF p_search IS NOT NULL AND p_search != '' THEN
        SET @sql = CONCAT(@sql, ' AND (c.ComplaintID LIKE ''%', p_search, '%'' OR p.PatientName LIKE ''%', p_search, '%'')');
    END IF;
    
    IF p_status IS NOT NULL AND p_status != 'الحالة' THEN
        SET @sql = CONCAT(@sql, ' AND c.CurrentStatus = ''', p_status, '''');
    END IF;
    
    IF p_department IS NOT NULL AND p_department != 'القسم' THEN
        SET @sql = CONCAT(@sql, ' AND d.DepartmentName = ''', p_department, '''');
    END IF;
    
    IF p_complaint_type IS NOT NULL AND p_complaint_type != 'نوع الشكوى' THEN
        SET @sql = CONCAT(@sql, ' AND ct.TypeName = ''', p_complaint_type, '''');
    END IF;
    
    SET @sql = CONCAT(@sql, ' ORDER BY c.ComplaintDate DESC');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //
DELIMITER ;

-- 12. إضافة بيانات تجريبية للأقسام إذا لم تكن موجودة
INSERT IGNORE INTO departments (DepartmentID, DepartmentName) VALUES 
(1, 'قسم الطوارئ'),
(2, 'قسم الجراحة'),
(3, 'قسم الباطنية'),
(4, 'قسم الأطفال'),
(5, 'قسم النساء والولادة'),
(6, 'قسم العظام'),
(7, 'قسم القلب'),
(8, 'قسم المخ والأعصاب'),
(9, 'قسم العيون'),
(10, 'قسم الأنف والأذن والحنجرة');

-- 13. تحديث الموظفين الحاليين بتعيين أقسام لهم
UPDATE employees SET department_id = 1 WHERE EmployeeID = 1; -- Super Admin
UPDATE employees SET department_id = 2 WHERE EmployeeID = 2; -- Admin
UPDATE employees SET department_id = 3 WHERE EmployeeID = 3; -- Employee

-- 14. تعيين بعض الشكاوى لموظفين محددين
UPDATE complaints SET assignee_id = 2 WHERE ComplaintID = 1;
UPDATE complaints SET assignee_id = 3 WHERE ComplaintID = 2;
UPDATE complaints SET assignee_id = 2 WHERE ComplaintID = 3;
UPDATE complaints SET assignee_id = 3 WHERE ComplaintID = 4;
UPDATE complaints SET assignee_id = 2 WHERE ComplaintID = 5;
UPDATE complaints SET assignee_id = 3 WHERE ComplaintID = 6;

-- 15. إنشاء فهارس إضافية لتحسين الأداء
CREATE INDEX idx_complaints_status_date ON complaints(CurrentStatus, ComplaintDate);
CREATE INDEX idx_complaints_type ON complaints(ComplaintTypeID);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- رسالة نجاح
SELECT 'تم تحديث قاعدة البيانات بنجاح لدعم نظام RBAC وتحويل الشكاوى' as message;
