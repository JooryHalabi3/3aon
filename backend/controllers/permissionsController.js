const db = require('../config/database');

// جلب جميع الأدوار
const getRoles = async (req, res) => {
    try {
        const roles = [
            {
                name: 'SUPER_ADMIN',
                displayName: 'سوبر أدمن',
                description: 'صلاحيات كاملة على النظام',
                user_count: 1
            },
            {
                name: 'ADMIN',
                displayName: 'أدمن',
                description: 'إدارة القسم والموظفين',
                user_count: 3
            },
            {
                name: 'EMPLOYEE',
                displayName: 'موظف',
                description: 'الصلاحيات الأساسية',
                user_count: 24
            }
        ];
        
        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        console.error('Error getting roles:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الأدوار'
        });
    }
};

// جلب صلاحيات دور معين
const getRolePermissions = async (req, res) => {
    try {
        const { roleName } = req.params;
        
        const query = `
            SELECT 
                permission_name as name,
                has_permission
            FROM RolePermissions 
            WHERE role_name = ?
            ORDER BY permission_name
        `;
        
        const [permissions] = await db.execute(query, [roleName]);
        
        res.json({
            success: true,
            data: permissions
        });
    } catch (error) {
        console.error('Error getting role permissions:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب صلاحيات الدور'
        });
    }
};

// تحديث صلاحيات دور معين
const updateRolePermissions = async (req, res) => {
    try {
        const { roleName } = req.params;
        const { permissions } = req.body;
        
        // التحقق من أن المستخدم مدير (RoleID = 1 أو اسم المستخدم admin)
        const user = req.user;
        if (user.RoleID !== 1 && user.Username.toLowerCase() !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية تحديث الصلاحيات'
            });
        }
        
        // تحديث جميع الصلاحيات إلى 0 أولاً
        const allPermissions = [
            'submit_complaint', 'follow_own_complaint', 'view_public_complaints',
            'reply_complaints', 'change_complaint_status', 'export_reports',
            'access_dashboard', 'full_system_access', 'user_management',
            'roles_management', 'performance_reports', 'export_data',
            'audit_logs', 'system_config', 'backup_restore'
        ];
        
        for (const permissionName of allPermissions) {
            const updateQuery = `
                INSERT INTO RolePermissions (role_name, permission_name, has_permission) 
                VALUES (?, ?, 0)
                ON DUPLICATE KEY UPDATE has_permission = 0
            `;
            await db.execute(updateQuery, [roleName, permissionName]);
        }
        
        // تفعيل الصلاحيات المحددة
        for (const permission of permissions) {
            const query = `
                UPDATE RolePermissions 
                SET has_permission = 1 
                WHERE role_name = ? AND permission_name = ?
            `;
            await db.execute(query, [roleName, permission.name]);
        }
        
        res.json({
            success: true,
            message: 'تم تحديث الصلاحيات بنجاح'
        });
    } catch (error) {
        console.error('Error updating role permissions:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث الصلاحيات'
        });
    }
};

// تحديث جميع الصلاحيات في النظام
const updateAllPermissions = async (req, res) => {
    try {
        // التحقق من أن المستخدم سوبر أدمن
        const user = req.user;
        if (user.RoleID !== 1) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية تحديث الصلاحيات'
            });
        }

        // حذف جميع الصلاحيات الحالية
        await db.execute('DELETE FROM RolePermissions');

        // إدخال الصلاحيات الجديدة
        const newPermissions = [
            // صلاحيات سوبر أدمن
            ['SUPER_ADMIN', 'full_system_access', 1],
            ['SUPER_ADMIN', 'user_management', 1],
            ['SUPER_ADMIN', 'department_management', 1],
            ['SUPER_ADMIN', 'assign_complaints', 1],
            ['SUPER_ADMIN', 'transfer_complaints', 1],
            ['SUPER_ADMIN', 'view_all_complaints', 1],
            ['SUPER_ADMIN', 'view_reports', 1],
            
            // صلاحيات أدمن
            ['ADMIN', 'assign_complaints', 1],
            ['ADMIN', 'transfer_complaints', 1],
            ['ADMIN', 'view_department_complaints', 1],
            ['ADMIN', 'view_reports', 1],
            ['ADMIN', 'update_complaint_status', 1],
            ['ADMIN', 'add_comments', 1],
            
            // صلاحيات موظف
            ['EMPLOYEE', 'view_assigned_complaints', 1],
            ['EMPLOYEE', 'update_complaint_status', 1],
            ['EMPLOYEE', 'add_comments', 1],
            ['EMPLOYEE', 'submit_complaint', 1],
            ['EMPLOYEE', 'follow_own_complaint', 1],
            ['EMPLOYEE', 'view_public_complaints', 1]
        ];

        for (const [role, permission, hasPermission] of newPermissions) {
            await db.execute(
                'INSERT INTO RolePermissions (role_name, permission_name, has_permission) VALUES (?, ?, ?)',
                [role, permission, hasPermission]
            );
        }

        res.json({
            success: true,
            message: 'تم تحديث جميع الصلاحيات بنجاح'
        });
    } catch (error) {
        console.error('Error updating all permissions:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث الصلاحيات'
        });
    }
};

module.exports = {
    getRoles,
    getRolePermissions,
    updateRolePermissions,
    updateAllPermissions
};
