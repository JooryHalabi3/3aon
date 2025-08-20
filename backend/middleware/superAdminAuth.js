const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// التحقق من صلاحيات Super Admin
const checkSuperAdminPermissions = async (req, res, next) => {
  try {
    console.log('🔒 فحص صلاحيات Super Admin...');
    
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
    console.log('🔍 تم فك تشفير Token:', decoded.employeeId);
    
    // التحقق من قاعدة البيانات للتأكد من RoleID
    const [rows] = await pool.execute(
      `SELECT e.EmployeeID, e.FullName, e.Email, e.RoleID, r.RoleName 
       FROM employees e 
       LEFT JOIN roles r ON e.RoleID = r.RoleID 
       WHERE e.EmployeeID = ?`,
      [decoded.employeeId]
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
      RoleName: user.RoleName
    });
    
    // التحقق من أن المستخدم هو Super Admin (RoleID = 1)
    if (user.RoleID !== 1) {
      console.log('🚫 المستخدم ليس Super Admin. RoleID:', user.RoleID);
      return res.status(403).json({ 
        success: false, 
        message: 'ممنوع: هذه الصفحة مخصصة لـ Super Admin فقط',
        code: 'NOT_SUPER_ADMIN',
        userRole: user.RoleName,
        requiredRole: 'Super Admin'
      });
    }
    
    console.log('✅ تم التحقق بنجاح - المستخدم Super Admin');
    
    // إرفاق معلومات المستخدم للطلب
    req.user = {
      employeeID: user.EmployeeID,
      fullName: user.FullName,
      email: user.Email,
      roleID: user.RoleID,
      roleName: user.RoleName
    };
    
    next();
  } catch (error) {
    console.error('💥 خطأ في التحقق من صلاحيات Super Admin:', error);
    
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

// middleware إضافي للتحقق من الصفحات الثابتة
const checkSuperAdminPageAccess = async (req, res, next) => {
  try {
    // قائمة الصفحات المحمية
    const protectedPages = [
      'superAdmin.html',
      'complaint-tracking.html', 
      'logs.html',
      'organizational-directory.html',
      'permissions.html',
      'recycle-bin.html'
    ];
    
    const requestedFile = req.path.split('/').pop();
    
    if (protectedPages.includes(requestedFile)) {
      console.log('🔒 محاولة الوصول لصفحة محمية:', requestedFile);
      return checkSuperAdminPermissions(req, res, next);
    }
    
    next();
  } catch (error) {
    console.error('خطأ في فحص الصفحات:', error);
    next();
  }
};

module.exports = { 
  checkSuperAdminPermissions,
  checkSuperAdminPageAccess 
};
