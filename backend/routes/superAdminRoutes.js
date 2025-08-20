const express = require('express');
const router = express.Router();
const { checkSuperAdminPermissions } = require('../middleware/superAdminAuth');
const pool = require('../config/database');

// تطبيق middleware على جميع routes
router.use(checkSuperAdminPermissions);

// جلب جميع الموظفين
router.get('/employees', async (req, res) => {
  try {
    const [employees] = await pool.execute(`
      SELECT 
        e.EmployeeID,
        e.FullName,
        e.Username,
        e.Email,
        e.PhoneNumber,
        e.NationalID_Iqama,
        e.Specialty,
        d.DepartmentName,
        r.RoleName,
        m.FullName as ManagerName
      FROM Employees e
      LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
      LEFT JOIN Roles r ON e.RoleID = r.RoleID
      LEFT JOIN Employees m ON e.ManagerID = m.EmployeeID
      ORDER BY e.FullName
    `);

    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('خطأ في جلب الموظفين:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
});

// جلب سجل الملفات المحذوفة (Recycle Bin)
router.get('/recycle-bin', async (req, res) => {
  try {
    // جلب الشكاوى المحذوفة
    const [deletedComplaints] = await pool.execute(`
      SELECT 
        c.ComplaintID,
        c.ComplaintDate,
        c.ComplaintDetails,
        c.CurrentStatus,
        p.FullName as PatientName,
        p.NationalID_Iqama,
        d.DepartmentName,
        e.FullName as EmployeeName,
        c.DeletedAt,
        c.DeletedBy
      FROM Complaints c
      JOIN Patients p ON c.PatientID = p.PatientID
      JOIN Departments d ON c.DepartmentID = d.DepartmentID
      LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
      WHERE c.IsDeleted = 1
      ORDER BY c.DeletedAt DESC
    `);

    // جلب الموظفين المحذوفين
    const [deletedEmployees] = await pool.execute(`
      SELECT 
        EmployeeID,
        FullName,
        Username,
        Email,
        DeletedAt,
        DeletedBy
      FROM Employees
      WHERE IsDeleted = 1
      ORDER BY DeletedAt DESC
    `);

    res.json({
      success: true,
      data: {
        complaints: deletedComplaints,
        employees: deletedEmployees
      }
    });
  } catch (error) {
    console.error('خطأ في جلب الملفات المحذوفة:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
});

// استعادة ملف محذوف
router.post('/recycle-bin/restore/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    
    if (type === 'complaint') {
      await pool.execute(
        'UPDATE Complaints SET IsDeleted = 0, DeletedAt = NULL, DeletedBy = NULL WHERE ComplaintID = ?',
        [id]
      );
    } else if (type === 'employee') {
      await pool.execute(
        'UPDATE Employees SET IsDeleted = 0, DeletedAt = NULL, DeletedBy = NULL WHERE EmployeeID = ?',
        [id]
      );
    }

    res.json({
      success: true,
      message: 'تم استعادة الملف بنجاح'
    });
  } catch (error) {
    console.error('خطأ في استعادة الملف:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
});

// تتبع الطلبات والشكاوى
router.get('/request-tracking', async (req, res) => {
  try {
    const { complaintId } = req.query;
    
    let query = `
      SELECT 
        c.ComplaintID,
        c.ComplaintDate,
        c.ComplaintDetails,
        c.CurrentStatus,
        p.FullName as PatientName,
        p.NationalID_Iqama,
        d.DepartmentName,
        e.FullName as EmployeeName,
        ct.TypeName as ComplaintTypeName
      FROM Complaints c
      JOIN Patients p ON c.PatientID = p.PatientID
      JOIN Departments d ON c.DepartmentID = d.DepartmentID
      LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
      JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
    `;

    let params = [];
    
    if (complaintId) {
      query += ' WHERE c.ComplaintID = ?';
      params.push(complaintId);
    }
    
    query += ' ORDER BY c.ComplaintDate DESC';

    const [complaints] = await pool.execute(query, params);

    // جلب تاريخ كل شكوى
    const complaintsWithHistory = await Promise.all(
      complaints.map(async (complaint) => {
        let history = [];
        try {
          const [historyResults] = await pool.execute(`
            SELECT 
              ch.Stage,
              ch.Remarks,
              ch.Timestamp,
              ch.OldStatus,
              ch.NewStatus,
              e.FullName as EmployeeName
            FROM ComplaintHistory ch
            LEFT JOIN Employees e ON ch.EmployeeID = e.EmployeeID
            WHERE ch.ComplaintID = ?
            ORDER BY ch.Timestamp DESC
          `, [complaint.ComplaintID]);
          history = historyResults;
        } catch (historyError) {
          console.log('جدول التاريخ غير موجود:', historyError.message);
        }

        return {
          ...complaint,
          history: history
        };
      })
    );

    res.json({
      success: true,
      data: complaintsWithHistory
    });
  } catch (error) {
    console.error('خطأ في تتبع الطلبات:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
});

// جلب إحصائيات النظام
router.get('/system-stats', async (req, res) => {
  try {
    // إجمالي الشكاوى
    const [totalComplaints] = await pool.execute('SELECT COUNT(*) as count FROM Complaints');
    
    // الشكاوى الجديدة
    const [newComplaints] = await pool.execute("SELECT COUNT(*) as count FROM Complaints WHERE CurrentStatus = 'جديدة'");
    
    // إجمالي الموظفين
    const [totalEmployees] = await pool.execute('SELECT COUNT(*) as count FROM Employees WHERE IsDeleted = 0');
    
    // إجمالي المرضى
    const [totalPatients] = await pool.execute('SELECT COUNT(*) as count FROM Patients');

    res.json({
      success: true,
      data: {
        totalComplaints: totalComplaints[0].count,
        newComplaints: newComplaints[0].count,
        totalEmployees: totalEmployees[0].count,
        totalPatients: totalPatients[0].count
      }
    });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات النظام:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
});

module.exports = router;
