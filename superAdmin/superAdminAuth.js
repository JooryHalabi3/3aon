// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// التحقق من صلاحيات Super Admin
async function checkSuperAdminPermissions() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!token) {
            console.log('لا يوجد توكن، توجيه لصفحة تسجيل الدخول');
            redirectToLogin();
            return false;
        }
        
        // التحقق من أن المستخدم هو Super Admin (RoleID = 1)
        if (user.RoleID !== 1) {
            console.log('المستخدم ليس Super Admin، توجيه لصفحة رفض الوصول');
            redirectToAccessDenied();
            return false;
        }
        
        // التحقق من صحة التوكن مع الخادم
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.log('التوكن غير صالح، توجيه لصفحة تسجيل الدخول');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return false;
        }
        
        const data = await response.json();
        
        if (!data.success || data.data.RoleID !== 1) {
            console.log('المستخدم ليس Super Admin، توجيه لصفحة رفض الوصول');
            redirectToAccessDenied();
            return false;
        }
        
        console.log('✅ المستخدم Super Admin، يمكن الوصول للصفحة');
        return true;
        
    } catch (error) {
        console.error('خطأ في التحقق من الصلاحيات:', error);
        redirectToLogin();
        return false;
    }
}

// توجيه لصفحة تسجيل الدخول
function redirectToLogin() {
    window.location.href = '/login/login.html';
}

// توجيه لصفحة رفض الوصول
function redirectToAccessDenied() {
    const currentPage = window.location.pathname.split('/').pop();
    window.location.href = `/superAdmin/access-denied.html?page=${currentPage}`;
}

// دالة مساعدة لجلب البيانات مع التوكن
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, finalOptions);
        
        if (response.status === 401) {
            console.log('التوكن منتهي الصلاحية');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return null;
        }
        
        if (response.status === 403) {
            console.log('لا توجد صلاحيات كافية');
            redirectToAccessDenied();
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('خطأ في الاتصال:', error);
        return null;
    }
}

// دالة مساعدة لعرض الإشعارات
function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // إضافة الأنماط
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    // تحديد اللون حسب النوع
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#27ae60';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f39c12';
            break;
        default:
            notification.style.backgroundColor = '#3498db';
    }
    
    // إضافة CSS للحركة
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // إضافة الإشعار للصفحة
    document.body.appendChild(notification);
    
    // إزالة الإشعار بعد 3 ثوان
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// دالة مساعدة للتحقق من الاتصال بالخادم
async function checkServerConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    } catch (error) {
        console.error('فشل الاتصال بالخادم:', error);
        return false;
    }
}

// تصدير الدوال للاستخدام في الملفات الأخرى
window.superAdminAuth = {
    checkSuperAdminPermissions,
    fetchWithAuth,
    showNotification,
    checkServerConnection,
    redirectToLogin,
    redirectToAccessDenied
};
