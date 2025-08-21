// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { checkAdminPermissions } = require('../middleware/adminAuth');
const jwt = require('jsonwebtoken');

// ✅ طبّق صلاحيات Admin/Super Admin على جميع المسارات
router.use(checkAdminPermissions);

/* =========================
   Requests (الطلبات العامة)
   ========================= */

// الحصول على جميع الطلبات
router.get('/requests', async (req, res) => {
  try {
    // التحقق من وجود جدول complaints
    const [tableCheck] = await pool.execute(`
      SELECT COUNT(*) as tableExists 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = 'complaints'
    `);
    
    if (tableCheck[0].tableExists === 0) {
      return res.json({ success: true, data: [] });
    }

    const [rows] = await pool.execute(`
      SELECT 
        c.ComplaintID as RequestID,
        c.ComplaintDetails as Subject,
        c.ComplaintDetails as Description,
        CASE 
          WHEN ct.TypeName LIKE '%طبي%' THEN 'medical'
          WHEN ct.TypeName LIKE '%إداري%' THEN 'administrative'
          ELSE 'technical'
        END as ComplaintType,
        CASE 
          WHEN c.CurrentStatus = 'جديدة' THEN 'pending'
          WHEN c.CurrentStatus = 'قيد المعالجة' THEN 'in_progress'
          WHEN c.CurrentStatus = 'مغلقة' THEN 'completed'
          ELSE 'pending'
        END as Status,
        c.ComplaintDate as SubmissionDate,
        c.ComplaintDate as LastUpdated,
        COALESCE(e.FullName, 'غير محدد') AS RequesterName,
        COALESCE(CONCAT(ae.FullName, ' (', d.DepartmentName, ')'), 'غير محدد') AS AssignedTo
      FROM complaints c
      LEFT JOIN employees e ON c.EmployeeID = e.EmployeeID
      LEFT JOIN employees ae ON c.EmployeeID = ae.EmployeeID
      LEFT JOIN departments d ON c.DepartmentID = d.DepartmentID
      LEFT JOIN complainttypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
      ORDER BY c.ComplaintDate DESC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('خطأ في جلب الطلبات:', error);
    console.error('تفاصيل الخطأ:', error.message);
    console.error('Stack trace:', error.stack);
    
    // إرجاع قائمة فارغة في حالة الخطأ
    res.json({ success: true, data: [] });
  }
});

// الحصول على إحصائيات الطلبات
router.get('/requests/stats', async (req, res) => {
  try {
    // التحقق من وجود جدول complaints
    const [tableCheck] = await pool.execute(`
      SELECT COUNT(*) as tableExists 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = 'complaints'
    `);
    
    if (tableCheck[0].tableExists === 0) {
      return res.json({ 
        success: true, 
        data: {
          totalRequests: 0,
          pendingRequests: 0,
          inProgressRequests: 0,
          completedRequests: 0,
          rejectedRequests: 0,
          urgentRequests: 0
        }
      });
    }

    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) AS totalRequests,
        SUM(CASE WHEN c.CurrentStatus = 'جديدة' THEN 1 ELSE 0 END) AS pendingRequests,
        SUM(CASE WHEN c.CurrentStatus = 'قيد المعالجة' THEN 1 ELSE 0 END) AS inProgressRequests,
        SUM(CASE WHEN c.CurrentStatus = 'مغلقة' THEN 1 ELSE 0 END) AS completedRequests,
        SUM(CASE WHEN c.CurrentStatus = 'مرفوض' THEN 1 ELSE 0 END) AS rejectedRequests,
        SUM(CASE WHEN DATEDIFF(NOW(), c.ComplaintDate) >= 3 THEN 1 ELSE 0 END) AS urgentRequests
      FROM complaints c
    `);

    const stats = rows[0];
    // معالجة القيم null
    Object.keys(stats).forEach(k => { 
      if (stats[k] == null) stats[k] = 0; 
    });

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات الطلبات:', error);
    console.error('تفاصيل الخطأ:', error.message);
    console.error('Stack trace:', error.stack);
    
    // إرجاع إحصائيات فارغة في حالة الخطأ
    res.json({ 
      success: true, 
      data: {
        totalRequests: 0,
        pendingRequests: 0,
        inProgressRequests: 0,
        completedRequests: 0,
        rejectedRequests: 0,
        urgentRequests: 0
      }
    });
  }
});

// الحصول على خط سير الطلب (workflow)
router.get('/requests/:id/workflow', async (req, res) => {
  try {
    const requestId = req.params.id;

    const [rows] = await pool.execute(`
      SELECT 
        ch.HistoryID as WorkflowID,
        ch.Stage as Action,
        ch.Remarks as Description,
        ch.Timestamp as CreatedAt,
        COALESCE(e.FullName, 'النظام') AS UserName
      FROM complainthistory ch
      LEFT JOIN employees e ON ch.EmployeeID = e.EmployeeID
      WHERE ch.ComplaintID = ?
      ORDER BY ch.Timestamp ASC
    `, [requestId]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('خطأ في جلب خط سير الطلب:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// تحويل الطلب لقسم/موظف آخر + إرسال إشعار
router.post('/requests/:id/transfer', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { departmentId, employeeId, notes } = req.body;
    const userId = req.user.employeeID;

    const [requestRows] = await pool.execute(
      'SELECT * FROM complaints WHERE ComplaintID = ?',
      [requestId]
    );
    if (requestRows.length === 0) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    const [employeeRows] = await pool.execute(
      'SELECT * FROM employees WHERE EmployeeID = ? AND DepartmentID = ?',
      [employeeId, departmentId]
    );
    if (employeeRows.length === 0) {
      return res.status(400).json({ success: false, message: 'الموظف غير موجود في القسم المحدد' });
    }

    // تحديث الشكوى
    await pool.execute(
      'UPDATE complaints SET EmployeeID = ?, DepartmentID = ?, CurrentStatus = ? WHERE ComplaintID = ?',
      [employeeId, departmentId, 'قيد المعالجة', requestId]
    );

    // إضافة سجل في التاريخ
    await pool.execute(
      'INSERT INTO complainthistory (ComplaintID, EmployeeID, Stage, Remarks, OldStatus, NewStatus, Timestamp) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [requestId, userId, 'تحويل الشكوى', `تم تحويل الشكوى إلى ${employeeRows[0].FullName} في القسم المحدد.${notes ? ' ملاحظات: ' + notes : ''}`, requestRows[0].CurrentStatus, 'قيد المعالجة']
    );

    // ✅ إشعار متسق بالأعمدة + رابط التفاصيل عبر RelatedType/RelatedID
    await pool.execute(
      `INSERT INTO notifications 
       (RecipientEmployeeID, Title, Body, Type, RelatedType, RelatedID, CreatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [employeeId, 'شكوى جديدة محوّلة', `تم تحويل شكوى/طلب جديد إليك. رقم الطلب: ${requestId}`, 'transfer', 'complaint', requestId]
    );

    res.json({ success: true, message: 'تم تحويل الشكوى بنجاح' });
  } catch (error) {
    console.error('خطأ في تحويل الشكوى:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

/* =========================
   Departments & Employees
   ========================= */

// الحصول على الأقسام
router.get('/departments', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT DepartmentID, DepartmentName, Description
      FROM departments
      ORDER BY DepartmentName
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('خطأ في جلب الأقسام:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// الحصول على موظفي قسم محدد
router.get('/departments/:id/employees', async (req, res) => {
  try {
    const departmentId = req.params.id;

    const [rows] = await pool.execute(`
      SELECT EmployeeID, FullName, Email, RoleID
      FROM employees
      WHERE DepartmentID = ? AND Status = 'active'
      ORDER BY FullName
    `, [departmentId]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('خطأ في جلب موظفي القسم:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

/* =========================
   Notifications (الإشعارات)
   ========================= */

// جلب الإشعارات غير المقروءة (تعيد RelatedType/RelatedID لزر التفاصيل)
router.get('/notifications/unread', async (req, res) => {
  try {
    const userId = req.user.employeeID;

    const [rows] = await pool.execute(`
      SELECT 
        NotificationID, 
        Title, 
        Body AS Message, 
        Type, 
        CreatedAt, 
        RelatedType, 
        RelatedID
      FROM notifications
      WHERE RecipientEmployeeID = ? AND IsRead = FALSE
      ORDER BY CreatedAt DESC
      LIMIT 10
    `, [userId]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('خطأ في جلب الإشعارات:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// تحديد إشعار كمقروء
router.put('/notifications/:id/mark-read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.employeeID;

    const [result] = await pool.execute(
      'UPDATE notifications SET IsRead = TRUE WHERE NotificationID = ? AND RecipientEmployeeID = ?',
      [notificationId, userId]
    );

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'تم تحديد الإشعار كمقروء' });
    } else {
      res.status(404).json({ success: false, message: 'الإشعار غير موجود' });
    }
  } catch (error) {
    console.error('خطأ في تحديث الإشعار:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// إنشاء إشعار جديد يدويًا (أداة مساعدة)
router.post('/notifications', async (req, res) => {
  try {
    const { recipientEmployeeID, title, body, type = 'info', relatedType = null, relatedID = null } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO notifications 
       (RecipientEmployeeID, Title, Body, Type, RelatedType, RelatedID, CreatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [recipientEmployeeID, title, body, type, relatedType, relatedID]
    );

    res.json({ success: true, message: 'تم إنشاء الإشعار بنجاح', notificationID: result.insertId });
  } catch (error) {
    console.error('خطأ في إنشاء الإشعار:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// إنشاء إشعارات تجريبية للمستخدم الحالي
router.post('/notifications/test', async (req, res) => {
  try {
    const userId = req.user.employeeID;

    const tests = [
      { title: 'شكوى جديدة', body: 'تم استلام شكوى جديدة من قسم الطوارئ', type: 'complaint', relatedType: 'complaint', relatedID: 1 },
      { title: 'تذكير مهم',  body: 'يوجد شكاوى تحتاج متابعة عاجلة',      type: 'urgent',    relatedType: null,         relatedID: null },
      { title: 'تحديث النظام', body: 'تم تحديث النظام بنجاح',            type: 'info',      relatedType: null,         relatedID: null },
    ];

    for (const n of tests) {
      await pool.execute(
        `INSERT INTO notifications 
         (RecipientEmployeeID, Title, Body, Type, RelatedType, RelatedID, CreatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [userId, n.title, n.body, n.type, n.relatedType, n.relatedID]
      );
    }

    res.json({ success: true, message: 'تم إنشاء الإشعارات التجريبية بنجاح' });
  } catch (error) {
    console.error('خطأ في إنشاء الإشعارات التجريبية:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

/* =========================
   Employees (إدارة الموظفين)
   ========================= */

// جميع الموظفين
router.get('/employees', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        e.EmployeeID,
        e.FullName,
        e.Email,
        e.NationalID_Iqama AS NationalID,
        e.PhoneNumber,
        e.JoinDate AS HireDate,
        'active' AS Status,
        e.RoleID,
        e.Username,
        e.EmployeeNumber,
        e.Specialty,
        d.DepartmentName,
        r.RoleName
      FROM employees e
      LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
      LEFT JOIN roles r       ON e.RoleID = r.RoleID
      ORDER BY e.FullName
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('خطأ في جلب الموظفين:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// إحصائيات الموظفين
router.get('/employees/stats', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) AS totalEmployees,
        COUNT(*) AS activeEmployees,
        SUM(CASE WHEN RoleID = 1 THEN 1 ELSE 0 END) AS superAdmins,
        SUM(CASE WHEN RoleID = 2 THEN 1 ELSE 0 END) AS admins,
        SUM(CASE WHEN RoleID = 3 THEN 1 ELSE 0 END) AS employees,
        (SELECT COUNT(*) FROM departments) AS totalDepartments
      FROM employees
    `);

    const stats = rows[0];
    Object.keys(stats).forEach(k => { if (stats[k] == null) stats[k] = 0; });

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات الموظفين:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// الدخول كموظف (Login as Employee) — مسموح لـ Admin/Super Admin
router.post('/employees/:id/login-as', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const adminId = req.user.employeeID;

    const [employeeRows] = await pool.execute(
      'SELECT * FROM employees WHERE EmployeeID = ? AND Status = "active"',
      [employeeId]
    );
    if (employeeRows.length === 0) {
      return res.status(404).json({ success: false, message: 'الموظف غير موجود أو غير نشط' });
    }

    const [adminRows] = await pool.execute(
      'SELECT RoleID FROM employees WHERE EmployeeID = ?',
      [adminId]
    );
    if (adminRows.length === 0 || (adminRows[0].RoleID !== 1 && adminRows[0].RoleID !== 2)) {
      return res.status(403).json({ success: false, message: 'ليس لديك صلاحية للدخول كموظف آخر' });
    }

    const employeeToken = jwt.sign(
      {
        employeeID: employeeId,
        email: employeeRows[0].Email,
        roleID: employeeRows[0].RoleID,
        fullName: employeeRows[0].FullName
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    await pool.execute(
      'INSERT INTO system_logs (UserID, Action, Description, IPAddress, CreatedAt) VALUES (?, ?, ?, ?, NOW())',
      [adminId, 'Login As Employee', `تم الدخول كموظف: ${employeeRows[0].FullName} (ID: ${employeeId})`, req.ip || 'unknown']
    );

    res.json({
      success: true,
      message: 'تم الدخول بنجاح',
      data: {
        token: employeeToken,
        employee: {
          id: employeeId,
          name: employeeRows[0].FullName,
          email: employeeRows[0].Email,
          roleID: employeeRows[0].RoleID
        }
      }
    });
  } catch (error) {
    console.error('خطأ في الدخول كموظف:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// تحديث بيانات موظف
router.put('/employees/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const { FullName, Email, PhoneNumber, DepartmentID, RoleID, Status } = req.body;
    const adminId = req.user.employeeID;

    const [employeeRows] = await pool.execute(
      'SELECT * FROM employees WHERE EmployeeID = ?',
      [employeeId]
    );
    if (employeeRows.length === 0) {
      return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    }

    await pool.execute(
      'UPDATE employees SET FullName = ?, Email = ?, PhoneNumber = ?, DepartmentID = ?, RoleID = ?, Status = ?, LastUpdated = NOW() WHERE EmployeeID = ?',
      [FullName, Email, PhoneNumber, DepartmentID, RoleID, Status, employeeId]
    );

    await pool.execute(
      'INSERT INTO system_logs (UserID, Action, Description, IPAddress, CreatedAt) VALUES (?, ?, ?, ?, NOW())',
      [adminId, 'Update Employee', `تم تحديث بيانات الموظف: ${FullName} (ID: ${employeeId})`, req.ip || 'unknown']
    );

    res.json({ success: true, message: 'تم تحديث بيانات الموظف بنجاح' });
  } catch (error) {
    console.error('خطأ في تحديث بيانات الموظف:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// حذف موظف (حذف فعلي حسب الكود الحالي)
router.delete('/employees/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const adminId = req.user.employeeID;

    const [employeeRows] = await pool.execute(
      'SELECT * FROM employees WHERE EmployeeID = ?',
      [employeeId]
    );
    if (employeeRows.length === 0) {
      return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    }

    await pool.execute('DELETE FROM employees WHERE EmployeeID = ?', [employeeId]);

    await pool.execute(
      'INSERT INTO system_logs (UserID, Action, Description, IPAddress, CreatedAt) VALUES (?, ?, ?, ?, NOW())',
      [adminId, 'Delete Employee', `تم حذف الموظف: ${employeeRows[0].FullName} (ID: ${employeeId})`, req.ip || 'unknown']
    );

    res.json({ success: true, message: 'تم حذف الموظف بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف الموظف:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

/* ======================================
   Admin’s Department (قسم المدير الحالي)
   ====================================== */

// موظفو قسم المدير الحالي
router.get('/department/employees', async (req, res) => {
  try {
    const adminDepartmentId = req.user.departmentID;
    if (!adminDepartmentId) {
      return res.status(400).json({ success: false, message: 'المدير يجب أن يكون مرتبط بقسم معين' });
    }

    const [rows] = await pool.execute(`
      SELECT 
        e.EmployeeID,
        e.FullName,
        e.Email,
        e.PhoneNumber,
        e.RoleID,
        r.RoleName,
        e.JoinDate AS HireDate,
        'active' AS Status
      FROM employees e
      LEFT JOIN roles r ON e.RoleID = r.RoleID
      WHERE e.DepartmentID = ? AND e.Status = 'active'
      ORDER BY e.FullName
    `, [adminDepartmentId]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('خطأ في جلب موظفي القسم:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// شكاوى قسم المدير الحالي
router.get('/department/complaints', async (req, res) => {
  try {
    const adminDepartmentId = req.user.departmentID;
    if (!adminDepartmentId) {
      return res.status(400).json({ success: false, message: 'المدير يجب أن يكون مرتبط بقسم معين' });
    }

    const [rows] = await pool.execute(`
      SELECT 
        c.ComplaintID,
        c.ComplaintDate,
        c.ComplaintDetails,
        c.CurrentStatus,
        c.Priority,
        c.MedicalRecordNumber,
        p.FullName AS PatientName,
        p.NationalID AS PatientNationalID,
        e.FullName AS EmployeeName,
        ct.TypeName AS ComplaintType,
        cst.SubTypeName AS ComplaintSubType,
        d.DepartmentName,
        ca.AssignedTo,
        ca.AssignedAt,
        assigned_emp.FullName AS AssignedEmployeeName
      FROM complaints c
      LEFT JOIN patients p            ON c.PatientID = p.PatientID
      LEFT JOIN employees e           ON c.EmployeeID = e.EmployeeID
      LEFT JOIN complainttypes ct     ON c.ComplaintTypeID = ct.ComplaintTypeID
      LEFT JOIN complaintsubtypes cst ON c.SubTypeID = cst.SubTypeID
      LEFT JOIN departments d         ON c.DepartmentID = d.DepartmentID
      LEFT JOIN complaint_assignments ca 
        ON c.ComplaintID = ca.ComplaintID AND ca.Status = 'assigned'
      LEFT JOIN employees assigned_emp ON ca.AssignedTo = assigned_emp.EmployeeID
      WHERE c.DepartmentID = ?
      ORDER BY c.ComplaintDate DESC
    `, [adminDepartmentId]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('خطأ في جلب شكاوى القسم:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

/* =========================
   Complaints (التعيين وغيره)
   ========================= */

// تعيين شكوى لموظف في نفس القسم + سجل ورفع الحالة
router.post('/complaints/:complaintId/assign', async (req, res) => {
  try {
    const complaintId = req.params.complaintId;
    const { employeeId, reason } = req.body;
    const adminId = req.user.employeeID;
    const adminDepartmentId = req.user.departmentID;

    const [complaintRows] = await pool.execute(
      'SELECT * FROM complaints WHERE ComplaintID = ? AND DepartmentID = ?',
      [complaintId, adminDepartmentId]
    );
    if (complaintRows.length === 0) {
      return res.status(404).json({ success: false, message: 'الشكوى غير موجودة أو لا تنتمي لقسمك' });
    }

    const [employeeRows] = await pool.execute(
      'SELECT * FROM employees WHERE EmployeeID = ? AND DepartmentID = ? AND Status = "active"',
      [employeeId, adminDepartmentId]
    );
    if (employeeRows.length === 0) {
      return res.status(400).json({ success: false, message: 'الموظف غير موجود أو لا ينتمي لقسمك' });
    }

    await pool.execute(
      'UPDATE complaint_assignments SET Status = "reassigned" WHERE ComplaintID = ? AND Status = "assigned"',
      [complaintId]
    );

    await pool.execute(
      'INSERT INTO complaint_assignments (ComplaintID, AssignedBy, AssignedTo, Reason, Status, AssignedAt) VALUES (?, ?, ?, ?, "assigned", NOW())',
      [complaintId, adminId, employeeId, reason || null]
    );

    await pool.execute(
      'UPDATE complaints SET CurrentStatus = "قيد المعالجة" WHERE ComplaintID = ?',
      [complaintId]
    );

    await pool.execute(
      'INSERT INTO activitylogs (EmployeeID, ActivityType, Description, IPAddress, RelatedID, RelatedType, CreatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [adminId, 'assign_complaint', `تم تعيين الشكوى ${complaintId} إلى ${employeeRows[0].FullName}`, req.ip || 'unknown', complaintId, 'complaint']
    );

    // (اختياري) إرسال إشعار للمكلّف الجديد بالشكوى
    await pool.execute(
      `INSERT INTO notifications 
       (RecipientEmployeeID, Title, Body, Type, RelatedType, RelatedID, CreatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [employeeId, 'تعيين شكوى', `تم تعيين الشكوى #${complaintId} إليك.`, 'assignment', 'complaint', complaintId]
    );

    res.json({
      success: true,
      message: 'تم تعيين الشكوى بنجاح',
      data: {
        complaintId,
        assignedTo: employeeId,
        assignedEmployeeName: employeeRows[0].FullName,
        assignedAt: new Date()
      }
    });
  } catch (error) {
    console.error('خطأ في تعيين الشكوى:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// تفاصيل شكوى واحدة مع حالة التعيين
router.get('/complaints/:complaintId/details', async (req, res) => {
  try {
    const complaintId = req.params.complaintId;
    const adminDepartmentId = req.user.departmentID;

    const [rows] = await pool.execute(`
      SELECT 
        c.*,
        p.FullName  AS PatientName,
        p.NationalID AS PatientNationalID,
        e.FullName  AS EmployeeName,
        ct.TypeName AS ComplaintType,
        cst.SubTypeName AS ComplaintSubType,
        d.DepartmentName,
        ca.AssignedTo,
        ca.AssignedAt,
        ca.Reason AS AssignmentReason,
        assigned_emp.FullName AS AssignedEmployeeName,
        assigned_emp.Email AS AssignedEmployeeEmail
      FROM complaints c
      LEFT JOIN patients p            ON c.PatientID = p.PatientID
      LEFT JOIN employees e           ON c.EmployeeID = e.EmployeeID
      LEFT JOIN complainttypes ct     ON c.ComplaintTypeID = ct.ComplaintTypeID
      LEFT JOIN complaintsubtypes cst ON c.SubTypeID = cst.SubTypeID
      LEFT JOIN departments d         ON c.DepartmentID = d.DepartmentID
      LEFT JOIN complaint_assignments ca 
        ON c.ComplaintID = ca.ComplaintID AND ca.Status = 'assigned'
      LEFT JOIN employees assigned_emp ON ca.AssignedTo = assigned_emp.EmployeeID
      WHERE c.ComplaintID = ? AND c.DepartmentID = ?
    `, [complaintId, adminDepartmentId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'الشكوى غير موجودة أو لا تنتمي لقسمك' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('خطأ في جلب تفاصيل الشكوى:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// سجل التعيينات لشكوى معيّنة
router.get('/complaints/:complaintId/assignments', async (req, res) => {
  try {
    const complaintId = req.params.complaintId;
    const adminDepartmentId = req.user.departmentID;

    const [complaintCheck] = await pool.execute(
      'SELECT DepartmentID FROM complaints WHERE ComplaintID = ?',
      [complaintId]
    );
    if (complaintCheck.length === 0 || complaintCheck[0].DepartmentID !== adminDepartmentId) {
      return res.status(403).json({ success: false, message: 'لا يمكنك الوصول لهذه الشكوى' });
    }

    const [rows] = await pool.execute(`
      SELECT 
        ca.*,
        assigned_by.FullName AS AssignedByName,
        assigned_to.FullName AS AssignedToName
      FROM complaint_assignments ca
      LEFT JOIN employees assigned_by ON ca.AssignedBy = assigned_by.EmployeeID
      LEFT JOIN employees assigned_to ON ca.AssignedTo = assigned_to.EmployeeID
      WHERE ca.ComplaintID = ?
      ORDER BY ca.AssignedAt DESC
    `, [complaintId]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('خطأ في جلب سجل التعيينات:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// تعيين طلب لموظف
router.put('/requests/:id/assign', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { employeeId, notes } = req.body;
    const userId = req.user.employeeID;

    // التحقق من وجود الطلب
    const [requestRows] = await pool.execute(
      'SELECT * FROM complaints WHERE ComplaintID = ?',
      [requestId]
    );
    if (requestRows.length === 0) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    // التحقق من وجود الموظف
    const [employeeRows] = await pool.execute(
      'SELECT * FROM employees WHERE EmployeeID = ?',
      [employeeId]
    );
    if (employeeRows.length === 0) {
      return res.status(400).json({ success: false, message: 'الموظف غير موجود' });
    }

    // تحديث الشكوى
    await pool.execute(
      'UPDATE complaints SET EmployeeID = ?, CurrentStatus = ? WHERE ComplaintID = ?',
      [employeeId, 'قيد المعالجة', requestId]
    );

    // إضافة سجل في التاريخ
    await pool.execute(
      'INSERT INTO complainthistory (ComplaintID, EmployeeID, Stage, Remarks, OldStatus, NewStatus, Timestamp) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [requestId, userId, 'تعيين الشكوى', `تم تعيين الشكوى إلى ${employeeRows[0].FullName}.${notes ? ' ملاحظات: ' + notes : ''}`, requestRows[0].CurrentStatus, 'قيد المعالجة']
    );

    // إرسال إشعار للموظف
    await pool.execute(
      `INSERT INTO notifications 
       (RecipientEmployeeID, Title, Body, Type, RelatedType, RelatedID, CreatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [employeeId, 'شكوى جديدة معينة', `تم تعيين شكوى/طلب جديد إليك. رقم الطلب: ${requestId}`, 'assignment', 'complaint', requestId]
    );

    res.json({ success: true, message: 'تم تعيين الطلب بنجاح' });
  } catch (error) {
    console.error('خطأ في تعيين الطلب:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// DELETE /api/admin/notifications/:id
router.delete('/notifications/:id', async (req, res) => {
  const id = req.params.id;
  const userId = req.user.employeeID;
  const [r] = await pool.execute(
    'DELETE FROM notifications WHERE NotificationID = ? AND RecipientEmployeeID = ?',
    [id, userId]
  );
  if (r.affectedRows === 0) return res.status(404).json({ success:false, message:'الإشعار غير موجود' });
  res.json({ success:true, message:'تم حذف الإشعار' });
});



module.exports = router;
