const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// التحقق من صلاحيات Super Admin فقط
const checkSuperAdminPermissions = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'التوكن مطلوب', 
        code: 'NO_TOKEN' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const [rows] = await pool.execute(
      `SELECT e.EmployeeID, e.FullName, e.Email, e.RoleID, e.DepartmentID, r.RoleName, d.DepartmentName
       FROM employees e 
       LEFT JOIN roles r ON e.RoleID = r.RoleID 
       LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
       WHERE e.EmployeeID = ?`,
      [decoded.employeeID]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'المستخدم غير موجود', 
        code: 'USER_NOT_FOUND' 
      });
    }

    const user = rows[0];

    // السماح لـ Super Admin فقط (RoleID = 1)
    if (user.RoleID !== 1) {
      return res.status(403).json({ 
        success: false, 
        message: 'ممنوع: هذه الصفحة مخصصة لـ Super Admin فقط', 
        code: 'NOT_SUPER_ADMIN', 
        userRole: user.RoleName, 
        requiredRole: 'Super Admin' 
      });
    }

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
    console.error('خطأ في التحقق من صلاحيات Super Admin:', error);
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

// التحقق من صلاحيات Admin قسم فقط
const checkDepartmentAdminPermissions = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'التوكن مطلوب', 
        code: 'NO_TOKEN' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const [rows] = await pool.execute(
      `SELECT e.EmployeeID, e.FullName, e.Email, e.RoleID, e.DepartmentID, r.RoleName, d.DepartmentName
       FROM employees e 
       LEFT JOIN roles r ON e.RoleID = r.RoleID 
       LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
       WHERE e.EmployeeID = ?`,
      [decoded.employeeID]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'المستخدم غير موجود', 
        code: 'USER_NOT_FOUND' 
      });
    }

    const user = rows[0];

    // السماح لـ Admin قسم فقط (RoleID = 3) أو Super Admin (RoleID = 1)
    if (user.RoleID !== 1 && user.RoleID !== 3) {
      return res.status(403).json({ 
        success: false, 
        message: 'ممنوع: هذه الصفحة مخصصة لـ Admin القسم فقط', 
        code: 'NOT_DEPARTMENT_ADMIN', 
        userRole: user.RoleName, 
        requiredRole: 'Department Admin' 
      });
    }

    // التحقق من وجود DepartmentID للمدير
    if (user.RoleID === 3 && !user.DepartmentID) {
      return res.status(403).json({ 
        success: false, 
        message: 'المدير يجب أن يكون مرتبط بقسم معين', 
        code: 'NO_DEPARTMENT_ASSIGNED' 
      });
    }

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
    console.error('خطأ في التحقق من صلاحيات Admin القسم:', error);
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

// التحقق من صلاحيات الموظف العادي
const checkEmployeePermissions = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'التوكن مطلوب', 
        code: 'NO_TOKEN' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const [rows] = await pool.execute(
      `SELECT e.EmployeeID, e.FullName, e.Email, e.RoleID, e.DepartmentID, r.RoleName, d.DepartmentName
       FROM employees e 
       LEFT JOIN roles r ON e.RoleID = r.RoleID 
       LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
       WHERE e.EmployeeID = ?`,
      [decoded.employeeID]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'المستخدم غير موجود', 
        code: 'USER_NOT_FOUND' 
      });
    }

    const user = rows[0];

    // السماح لجميع الأدوار (1, 2, 3)
    if (![1, 2, 3].includes(user.RoleID)) {
      return res.status(403).json({ 
        success: false, 
        message: 'ممنوع: ليس لديك صلاحية للوصول', 
        code: 'NO_PERMISSION', 
        userRole: user.RoleName
      });
    }

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
    console.error('خطأ في التحقق من صلاحيات الموظف:', error);
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

module.exports = { 
  checkSuperAdminPermissions,
  checkDepartmentAdminPermissions,
  checkEmployeePermissions
};
