const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// التحقق من صلاحيات Admin
const checkAdminPermissions = async (req, res, next) => {
  try {
    console.log('🔒 فحص صلاحيات Admin...');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      console.log('❌ لا يوجد token');
      return res.status(401).json({ 
        success: false, 
        message: 'التوكن مطلوب', 
        code: 'NO_TOKEN' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('🔍 تم فك تشفير Token:', decoded.employeeID);

    const [rows] = await pool.execute(
      `SELECT e.EmployeeID, e.FullName, e.Email, e.RoleID, e.DepartmentID, r.RoleName, d.DepartmentName
       FROM employees e 
       LEFT JOIN roles r ON e.RoleID = r.RoleID 
       LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
       WHERE e.EmployeeID = ?`,
      [decoded.employeeID]
    );

    if (rows.length === 0) {
      console.log('❌ المستخدم غير موجود في قاعدة البيانات');
      return res.status(401).json({ 
        success: false, 
        message: 'المستخدم غير موجود', 
        code: 'USER_NOT_FOUND' 
      });
    }

    const user = rows[0];
    console.log('👤 بيانات المستخدم:', { 
      EmployeeID: user.EmployeeID, 
      FullName: user.FullName, 
      RoleID: user.RoleID, 
      RoleName: user.RoleName,
      DepartmentID: user.DepartmentID,
      DepartmentName: user.DepartmentName
    });

    // السماح لـ Super Admin (RoleID = 1) و Admin (RoleID = 3)
    if (user.RoleID !== 1 && user.RoleID !== 3) {
      console.log('🚫 المستخدم ليس Admin. RoleID:', user.RoleID);
      return res.status(403).json({ 
        success: false, 
        message: 'ممنوع: هذه الصفحة مخصصة لـ Admin فقط', 
        code: 'NOT_ADMIN', 
        userRole: user.RoleName, 
        requiredRole: 'Admin' 
      });
    }

    console.log('✅ تم التحقق بنجاح - المستخدم Admin أو Super Admin');
    req.user = { 
      employeeID: user.EmployeeID, 
      fullName: user.FullName, 
      email: user.Email, 
      roleID: user.RoleID, 
      roleName: user.RoleName,
      departmentID: user.DepartmentID,
      departmentName: user.DepartmentName
    };
    next();
  } catch (error) {
    console.error('💥 خطأ في التحقق من صلاحيات Admin:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'التوكن غير صالح', 
        code: 'INVALID_TOKEN' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'التوكن منتهي الصلاحية', 
        code: 'TOKEN_EXPIRED' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'خطأ في الخادم', 
      code: 'SERVER_ERROR' 
    });
  }
};

module.exports = { checkAdminPermissions };
