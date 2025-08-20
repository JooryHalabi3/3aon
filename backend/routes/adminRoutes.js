const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { checkAdminPermissions } = require('../middleware/adminAuth');
const jwt = require('jsonwebtoken');

// تطبيق middleware للتحقق من صلاحيات Admin
router.use(checkAdminPermissions);

// الحصول على جميع الطلبات
router.get('/requests', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        r.RequestID,
        r.Subject,
        r.Description,
        r.ComplaintType,
        r.Status,
        r.SubmissionDate,
        r.LastUpdated,
        COALESCE(e.FullName, 'غير محدد') as RequesterName,
        COALESCE(CONCAT(ae.FullName, ' (', d.DepartmentName, ')'), 'غير محدد') as AssignedTo
      FROM requests r
      LEFT JOIN employees e ON r.RequesterID = e.EmployeeID
      LEFT JOIN employees ae ON r.AssignedTo = ae.EmployeeID
      LEFT JOIN departments d ON ae.DepartmentID = d.DepartmentID
      ORDER BY r.SubmissionDate DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('خطأ في جلب الطلبات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// الحصول على إحصائيات الطلبات
router.get('/requests/stats', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as totalRequests,
        SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) as pendingRequests,
        SUM(CASE WHEN Status = 'in_progress' THEN 1 ELSE 0 END) as inProgressRequests,
        SUM(CASE WHEN Status = 'completed' THEN 1 ELSE 0 END) as completedRequests,
        SUM(CASE WHEN Status = 'rejected' THEN 1 ELSE 0 END) as rejectedRequests,
        SUM(CASE WHEN DATEDIFF(NOW(), SubmissionDate) >= 3 THEN 1 ELSE 0 END) as urgentRequests
      FROM requests
    `);

    // تحويل القيم NULL إلى 0
    const stats = rows[0];
    Object.keys(stats).forEach(key => {
      if (stats[key] === null) {
        stats[key] = 0;
      }
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات الطلبات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// الحصول على خط سير الشكوى
router.get('/requests/:id/workflow', async (req, res) => {
  try {
    const requestId = req.params.id;
    
    const [rows] = await pool.execute(`
      SELECT 
        w.WorkflowID,
        w.Action,
        w.Description,
        w.CreatedAt,
        e.FullName as UserName
      FROM request_workflow w
      LEFT JOIN employees e ON w.UserID = e.EmployeeID
      WHERE w.RequestID = ?
      ORDER BY w.CreatedAt ASC
    `, [requestId]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('خطأ في جلب خط سير الشكوى:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// تحويل الشكوى
router.post('/requests/:id/transfer', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { departmentId, employeeId, notes } = req.body;
    const userId = req.user.employeeID;

    // التحقق من وجود الطلب
    const [requestRows] = await pool.execute(
      'SELECT * FROM requests WHERE RequestID = ?',
      [requestId]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    // التحقق من وجود الموظف
    const [employeeRows] = await pool.execute(
      'SELECT * FROM employees WHERE EmployeeID = ? AND DepartmentID = ?',
      [employeeId, departmentId]
    );

    if (employeeRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'الموظف غير موجود في القسم المحدد'
      });
    }

    // تحديث الطلب
    await pool.execute(
      'UPDATE requests SET AssignedTo = ?, Status = ?, LastUpdated = NOW() WHERE RequestID = ?',
      [employeeId, 'in_progress', requestId]
    );

    // إضافة سجل في خط السير
    await pool.execute(
      'INSERT INTO request_workflow (RequestID, UserID, Action, Description, CreatedAt) VALUES (?, ?, ?, ?, NOW())',
      [requestId, userId, 'تحويل الشكوى', `تم تحويل الشكوى إلى ${employeeRows[0].FullName} في القسم المحدد. ${notes ? 'ملاحظات: ' + notes : ''}`]
    );

    // إرسال إشعار للموظف
    await pool.execute(
      'INSERT INTO notifications (UserID, Title, Message, Type, CreatedAt) VALUES (?, ?, ?, ?, NOW())',
      [employeeId, 'شكوى جديدة محولة', `تم تحويل شكوى جديدة إليك. رقم الشكوى: ${requestId}`, 'transfer']
    );

    res.json({
      success: true,
      message: 'تم تحويل الشكوى بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تحويل الشكوى:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// الحصول على الأقسام
router.get('/departments', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT DepartmentID, DepartmentName, Description
      FROM departments
      ORDER BY DepartmentName
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('خطأ في جلب الأقسام:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// الحصول على موظفي القسم
router.get('/departments/:id/employees', async (req, res) => {
  try {
    const departmentId = req.params.id;
    
    const [rows] = await pool.execute(`
      SELECT EmployeeID, FullName, Email, RoleID
      FROM employees
      WHERE DepartmentID = ? AND Status = 'active'
      ORDER BY FullName
    `, [departmentId]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('خطأ في جلب موظفي القسم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// الحصول على الإشعارات غير المقروءة
router.get('/notifications/unread', async (req, res) => {
  try {
    const userId = req.user.employeeID;
    
    const [rows] = await pool.execute(`
      SELECT NotificationID, Title, Message, Type, CreatedAt
      FROM notifications
      WHERE UserID = ? AND IsRead = FALSE
      ORDER BY CreatedAt DESC
      LIMIT 10
    `, [userId]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('خطأ في جلب الإشعارات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// تحديد الإشعار كمقروء
router.put('/notifications/:id/mark-read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.employeeID;
    
    const [result] = await pool.execute(
      'UPDATE notifications SET IsRead = TRUE WHERE NotificationID = ? AND UserID = ?',
      [notificationId, userId]
    );

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: 'تم تحديد الإشعار كمقروء'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'الإشعار غير موجود'
      });
    }
  } catch (error) {
    console.error('خطأ في تحديث الإشعار:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// تحديث المسؤول على الطلب وإرسال إشعار
router.put('/requests/:id/assign', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { employeeId, notes } = req.body;
    const userId = req.user.employeeID;

    // التحقق من وجود الطلب
    const [requestRows] = await pool.execute(
      'SELECT * FROM requests WHERE RequestID = ?',
      [requestId]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    // التحقق من وجود الموظف
    const [employeeRows] = await pool.execute(
      'SELECT * FROM employees WHERE EmployeeID = ? AND Status = "active"',
      [employeeId]
    );

    if (employeeRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    // تحديث الطلب
    await pool.execute(
      'UPDATE requests SET AssignedTo = ?, LastUpdated = NOW() WHERE RequestID = ?',
      [employeeId, requestId]
    );

    // إضافة سجل في خط السير
    await pool.execute(
      'INSERT INTO request_workflow (RequestID, UserID, Action, Description, CreatedAt) VALUES (?, ?, ?, ?, NOW())',
      [requestId, userId, 'تعيين المسؤول', `تم تعيين ${employeeRows[0].FullName} كمسؤول على الطلب. ${notes ? 'ملاحظات: ' + notes : ''}`]
    );

    // إرسال إشعار للموظف
    await pool.execute(
      'INSERT INTO notifications (UserID, Title, Message, Type, CreatedAt) VALUES (?, ?, ?, ?, NOW())',
      [employeeId, 'طلب جديد محول إليك', `تم تعيينك كمسؤول على طلب جديد. رقم الطلب: ${requestId}`, 'assignment']
    );

    res.json({
      success: true,
      message: 'تم تعيين المسؤول بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تعيين المسؤول:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// الحصول على جميع الموظفين
router.get('/employees', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        e.EmployeeID,
        e.FullName,
        e.Email,
        e.NationalID_Iqama as NationalID,
        e.PhoneNumber,
        e.JoinDate as HireDate,
        'active' as Status,
        e.RoleID,
        e.Username,
        e.EmployeeNumber,
        e.Specialty,
        d.DepartmentName,
        r.RoleName
      FROM employees e
      LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
      LEFT JOIN roles r ON e.RoleID = r.RoleID
      ORDER BY e.FullName
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('خطأ في جلب الموظفين:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// الحصول على إحصائيات الموظفين
router.get('/employees/stats', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as totalEmployees,
        COUNT(*) as activeEmployees,
        SUM(CASE WHEN RoleID = 1 THEN 1 ELSE 0 END) as superAdmins,
        SUM(CASE WHEN RoleID = 2 THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN RoleID = 3 THEN 1 ELSE 0 END) as employees,
        (SELECT COUNT(*) FROM departments) as totalDepartments
      FROM employees
    `);

    // تحويل القيم NULL إلى 0
    const stats = rows[0];
    Object.keys(stats).forEach(key => {
      if (stats[key] === null) {
        stats[key] = 0;
      }
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات الموظفين:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// الدخول كموظف (Login as Employee)
router.post('/employees/:id/login-as', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const adminId = req.user.employeeID;

    // التحقق من وجود الموظف
    const [employeeRows] = await pool.execute(
      'SELECT * FROM employees WHERE EmployeeID = ? AND Status = "active"',
      [employeeId]
    );

    if (employeeRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود أو غير نشط'
      });
    }

    // التحقق من صلاحيات المدير
    const [adminRows] = await pool.execute(
      'SELECT RoleID FROM employees WHERE EmployeeID = ?',
      [adminId]
    );

    if (adminRows.length === 0 || (adminRows[0].RoleID !== 1 && adminRows[0].RoleID !== 2)) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية للدخول كموظف آخر'
      });
    }

    // إنشاء token للموظف
    const jwt = require('jsonwebtoken');
    const employeeToken = jwt.sign(
      {
        employeeID: employeeId,
        email: employeeRows[0].Email,
        roleID: employeeRows[0].RoleID,
        fullName: employeeRows[0].FullName
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // إضافة سجل في السجل
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
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// تحديث بيانات الموظف
router.put('/employees/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const { FullName, Email, PhoneNumber, DepartmentID, RoleID, Status } = req.body;
    const adminId = req.user.employeeID;

    // التحقق من وجود الموظف
    const [employeeRows] = await pool.execute(
      'SELECT * FROM employees WHERE EmployeeID = ?',
      [employeeId]
    );

    if (employeeRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    // تحديث بيانات الموظف
    await pool.execute(
      'UPDATE employees SET FullName = ?, Email = ?, PhoneNumber = ?, DepartmentID = ?, RoleID = ?, Status = ?, LastUpdated = NOW() WHERE EmployeeID = ?',
      [FullName, Email, PhoneNumber, DepartmentID, RoleID, Status, employeeId]
    );

    // إضافة سجل في السجل
    await pool.execute(
      'INSERT INTO system_logs (UserID, Action, Description, IPAddress, CreatedAt) VALUES (?, ?, ?, ?, NOW())',
      [adminId, 'Update Employee', `تم تحديث بيانات الموظف: ${FullName} (ID: ${employeeId})`, req.ip || 'unknown']
    );

    res.json({
      success: true,
      message: 'تم تحديث بيانات الموظف بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تحديث بيانات الموظف:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// حذف موظف (تحديث الحالة إلى inactive)
router.delete('/employees/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const adminId = req.user.employeeID;

    // التحقق من وجود الموظف
    const [employeeRows] = await pool.execute(
      'SELECT * FROM employees WHERE EmployeeID = ?',
      [employeeId]
    );

    if (employeeRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    // حذف الموظف من قاعدة البيانات
    await pool.execute(
      'DELETE FROM employees WHERE EmployeeID = ?',
      [employeeId]
    );

    // إضافة سجل في السجل
    await pool.execute(
      'INSERT INTO system_logs (UserID, Action, Description, IPAddress, CreatedAt) VALUES (?, ?, ?, ?, NOW())',
      [adminId, 'Delete Employee', `تم حذف الموظف: ${employeeRows[0].FullName} (ID: ${employeeId})`, req.ip || 'unknown']
    );

    res.json({
      success: true,
      message: 'تم حذف الموظف بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف الموظف:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

module.exports = router;
