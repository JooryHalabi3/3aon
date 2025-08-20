const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth'); // Added this import
const pool = require('../config/database'); // Fixed import path

// تسجيل موظف جديد
router.post('/register', authController.register);

// تسجيل الدخول
router.post('/login', authController.login);

// الحصول على معلومات المستخدم الحالي (بدون middleware)
router.get('/me', auth.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.EmployeeID;
    
    const [rows] = await pool.execute(`
      SELECT 
        e.EmployeeID,
        e.FullName,
        e.Email,
        e.PhoneNumber,
        e.RoleID,
        e.DepartmentID,
        r.RoleName,
        d.DepartmentName
      FROM employees e
      LEFT JOIN roles r ON e.RoleID = r.RoleID
      LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
      WHERE e.EmployeeID = ?
    `, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// الحصول على بيانات البروفايل الكاملة للموظف
router.get('/profile', authController.getProfile);

// تحديث بيانات البروفايل
router.put('/profile', authController.updateProfile);

// الحصول على جميع الأدوار
router.get('/roles', authController.getRoles);

module.exports = router; 