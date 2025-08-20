const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// تسجيل موظف جديد
router.post('/register', authController.register);

// تسجيل الدخول
router.post('/login', authController.login);

// الحصول على معلومات المستخدم الحالي (بدون middleware)
router.get('/me', authController.getCurrentUser);

// الحصول على بيانات البروفايل الكاملة للموظف
router.get('/profile', authController.getProfile);

// الحصول على جميع الأدوار
router.get('/roles', authController.getRoles);

module.exports = router; 