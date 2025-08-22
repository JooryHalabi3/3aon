const express = require('express');
const router = express.Router();
const permissionsController = require('../controllers/permissionsController');
const { authenticateToken } = require('../middleware/auth');

// جلب جميع الأدوار
router.get('/permissions/roles', authenticateToken, permissionsController.getRoles);

// جلب صلاحيات دور معين
router.get('/permissions/roles/:roleName/permissions', authenticateToken, permissionsController.getRolePermissions);

// تحديث صلاحيات دور معين
router.put('/permissions/roles/:roleName/permissions', authenticateToken, permissionsController.updateRolePermissions);

// تحديث جميع الصلاحيات في النظام
router.post('/permissions/update-all', authenticateToken, permissionsController.updateAllPermissions);

module.exports = router;
