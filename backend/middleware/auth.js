const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token مطلوب للمصادقة'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // جلب بيانات المستخدم من قاعدة البيانات مع معلومات الدور والقسم
        const [users] = await db.execute(
            `SELECT e.*, r.RoleName, r.Description as RoleDescription, d.DepartmentName
             FROM employees e
             JOIN roles r ON e.RoleID = r.RoleID
             LEFT JOIN departments d ON e.DepartmentID = d.DepartmentID
             WHERE e.EmployeeID = ?`,
            [decoded.employeeID]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        const user = users[0];
        
        // إضافة معلومات إضافية للمستخدم
        req.user = {
            ...user,
            role: user.RoleName,
            roleId: user.RoleID,
            departmentId: user.DepartmentID,
            departmentName: user.DepartmentName,
            permissions: await getUserPermissions(user.RoleName)
        };
        
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({
            success: false,
            message: 'Token غير صالح'
        });
    }
};

// تحديد صلاحيات المستخدم حسب دوره
const getUserPermissions = async (role) => {
    try {
        // محاولة جلب الصلاحيات من قاعدة البيانات أولاً
        const [permissions] = await db.execute(
            `SELECT permission_name, has_permission 
             FROM RolePermissions 
             WHERE role_name = ?`,
            [role.toLowerCase()]
        );

        if (permissions.length > 0) {
            // تحويل البيانات من قاعدة البيانات إلى التنسيق المطلوب
            const dynamicPermissions = {
                canAccessAllDepartments: false,
                canAssignComplaints: false,
                canTransferComplaints: false,
                canViewAllComplaints: false,
                canViewDepartmentComplaints: false,
                canViewAssignedComplaints: false,
                canUpdateComplaintStatus: false,
                canAddNotes: false,
                canManageUsers: false,
                canManageDepartments: false,
                canViewReports: false,
                canManageSystem: false
            };

            // تطبيق الصلاحيات من قاعدة البيانات
            permissions.forEach(perm => {
                switch (perm.permission_name) {
                    case 'full_system_access':
                        dynamicPermissions.canAccessAllDepartments = !!perm.has_permission;
                        dynamicPermissions.canManageSystem = !!perm.has_permission;
                        break;
                    case 'assign_complaints':
                        dynamicPermissions.canAssignComplaints = !!perm.has_permission;
                        break;
                    case 'transfer_complaints':
                        dynamicPermissions.canTransferComplaints = !!perm.has_permission;
                        break;
                    case 'view_all_complaints':
                        dynamicPermissions.canViewAllComplaints = !!perm.has_permission;
                        break;
                    case 'view_department_complaints':
                        dynamicPermissions.canViewDepartmentComplaints = !!perm.has_permission;
                        break;
                    case 'view_assigned_complaints':
                        dynamicPermissions.canViewAssignedComplaints = !!perm.has_permission;
                        break;
                    case 'update_complaint_status':
                        dynamicPermissions.canUpdateComplaintStatus = !!perm.has_permission;
                        break;
                    case 'add_comments':
                        dynamicPermissions.canAddNotes = !!perm.has_permission;
                        break;
                    case 'user_management':
                        dynamicPermissions.canManageUsers = !!perm.has_permission;
                        break;
                    case 'department_management':
                        dynamicPermissions.canManageDepartments = !!perm.has_permission;
                        break;
                    case 'view_reports':
                        dynamicPermissions.canViewReports = !!perm.has_permission;
                        break;
                }
            });

            console.log(`✅ تم تحميل الصلاحيات الديناميكية لـ ${role}:`, dynamicPermissions);
            return dynamicPermissions;
        }
    } catch (error) {
        console.error('❌ خطأ في جلب الصلاحيات من قاعدة البيانات:', error);
    }

    // إذا فشل في جلب الصلاحيات من قاعدة البيانات، استخدم الصلاحيات الافتراضية
    console.log(`⚠️ استخدام الصلاحيات الافتراضية لـ ${role}`);
    const defaultPermissions = {
        SUPER_ADMIN: {
            canAccessAllDepartments: true,
            canAssignComplaints: true,
            canTransferComplaints: true,
            canViewAllComplaints: true,
            canManageUsers: true,
            canManageDepartments: true,
            canViewReports: true,
            canManageSystem: true
        },
        ADMIN: {
            canAccessAllDepartments: false,
            canAssignComplaints: true,
            canTransferComplaints: true,
            canViewAllComplaints: false,
            canViewDepartmentComplaints: true,
            canManageUsers: false,
            canManageDepartments: false,
            canViewReports: true,
            canManageSystem: false
        },
        EMPLOYEE: {
            canAccessAllDepartments: false,
            canAssignComplaints: false,
            canTransferComplaints: false,
            canViewAllComplaints: false,
            canViewAssignedComplaints: true,
            canUpdateComplaintStatus: true,
            canAddNotes: true,
            canViewReports: false,
            canManageSystem: false
        }
    };
    
    return defaultPermissions[role] || defaultPermissions.EMPLOYEE;
};

// middleware للتحقق من الصلاحيات
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'يجب تسجيل الدخول أولاً'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية للوصول لهذا المورد'
            });
        }

        next();
    };
};

// middleware للتحقق من صلاحية الوصول للشكوى
const canAccessComplaint = async (req, res, next) => {
    try {
        const complaintId = req.params.complaintId || req.params.id;
        
        if (!complaintId) {
            return res.status(400).json({
                success: false,
                message: 'معرف الشكوى مطلوب'
            });
        }

        // جلب معلومات الشكوى
        const [complaints] = await db.execute(
            'SELECT DepartmentID, assignee_id FROM complaints WHERE ComplaintID = ?',
            [complaintId]
        );

        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الشكوى غير موجودة'
            });
        }

        const complaint = complaints[0];
        const user = req.user;

        // التحقق من الصلاحيات
        let canAccess = false;

        if (user.role === 'SUPER_ADMIN') {
            canAccess = true;
        } else if (user.role === 'ADMIN' && user.departmentId === complaint.DepartmentID) {
            canAccess = true;
        } else if (user.role === 'EMPLOYEE' && user.EmployeeID === complaint.assignee_id) {
            canAccess = true;
        }

        if (!canAccess) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية للوصول لهذه الشكوى'
            });
        }

        // إضافة معلومات الشكوى للطلب
        req.complaint = complaint;
        next();
    } catch (error) {
        console.error('Error checking complaint access:', error);
        return res.status(500).json({
            success: false,
            message: 'حدث خطأ في التحقق من الصلاحيات'
        });
    }
};

// middleware للتحقق من صلاحية تعيين الشكاوى
const canAssignComplaints = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'يجب تسجيل الدخول أولاً'
        });
    }

    if (!req.user.permissions.canAssignComplaints) {
        return res.status(403).json({
            success: false,
            message: 'ليس لديك صلاحية لتعيين الشكاوى'
        });
    }

    next();
};

// middleware للتحقق من صلاحية الوصول للقسم
const canAccessDepartment = async (req, res, next) => {
    try {
        const departmentId = req.params.departmentId || req.params.deptId;
        
        if (!departmentId) {
            return res.status(400).json({
                success: false,
                message: 'معرف القسم مطلوب'
            });
        }

        const user = req.user;

        // التحقق من الصلاحيات
        let canAccess = false;

        if (user.role === 'SUPER_ADMIN') {
            canAccess = true;
        } else if (user.role === 'ADMIN' && user.departmentId === parseInt(departmentId)) {
            canAccess = true;
        }

        if (!canAccess) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية للوصول لهذا القسم'
            });
        }

        next();
    } catch (error) {
        console.error('Error checking department access:', error);
        return res.status(500).json({
            success: false,
            message: 'حدث خطأ في التحقق من الصلاحيات'
        });
    }
};

module.exports = {
    authenticateToken,
    requireRole,
    canAccessComplaint,
    canAssignComplaints,
    canAccessDepartment,
    getUserPermissions
};
