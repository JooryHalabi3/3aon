// نظام الحماية المشترك لصفحات السوبر أدمن
class SuperAdminProtection {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3001/api';
        this.isChecking = false;
        this.checkInterval = null;
    }

    // التحقق من صلاحيات السوبر أدمن
    async checkSuperAdminAccess() {
        if (this.isChecking) return false;
        this.isChecking = true;

        try {
            console.log('🔒 فحص صلاحيات السوبر أدمن...');
            
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            // فحص وجود التوكن
            if (!token) {
                console.log('❌ لا يوجد توكن، عرض رسالة رفض الوصول');
                this.showAccessDenied('لا يوجد توكن صالح');
                return false;
            }
            
            // فحص RoleID من localStorage أولاً (للسرعة)
            if (user.RoleID !== 1) {
                console.log('❌ المستخدم ليس السوبر أدمن (localStorage)، RoleID:', user.RoleID);
                this.showAccessDenied(`دورك الحالي: ${user.RoleName || 'غير محدد'}`);
                return false;
            }
            
            // التحقق من صحة التوكن مع الخادم
            const response = await fetch(`${this.API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                console.log('❌ التوكن غير صالح، توجيه لصفحة تسجيل الدخول');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                this.redirectToLogin();
                return false;
            }
            
            const data = await response.json();
            
            if (!data.success || data.data.RoleID !== 1) {
                console.log('❌ المستخدم ليس السوبر أدمن (خادم)، RoleID:', data.data?.RoleID);
                this.showAccessDenied(`دورك الحالي: ${data.data?.RoleName || 'غير محدد'}`);
                return false;
            }
            
            console.log('✅ المستخدم السوبر أدمن، يمكن الوصول للصفحة');
            this.hideAccessDenied();
            return true;
            
        } catch (error) {
            console.error('💥 خطأ في التحقق من الصلاحيات:', error);
            this.showAccessDenied('خطأ في الاتصال بالخادم');
            return false;
        } finally {
            this.isChecking = false;
        }
    }

    // عرض رسالة رفض الوصول
    showAccessDenied(reason = '') {
        const accessDeniedDiv = document.getElementById('accessDenied');
        if (accessDeniedDiv) {
            // تحديث سبب المنع
            const reasonElement = accessDeniedDiv.querySelector('.access-reason');
            if (reasonElement && reason) {
                reasonElement.textContent = reason;
            }
            
            accessDeniedDiv.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    // إخفاء رسالة رفض الوصول
    hideAccessDenied() {
        const accessDeniedDiv = document.getElementById('accessDenied');
        if (accessDeniedDiv) {
            accessDeniedDiv.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // توجيه لصفحة تسجيل الدخول
    redirectToLogin() {
        setTimeout(() => {
            window.location.href = '/login/login.html';
        }, 2000);
    }

    // توجيه لصفحة رفض الوصول
    redirectToAccessDenied() {
        window.location.href = '/superAdmin/access-denied.html';
    }

    // إنشاء عنصر رسالة رفض الوصول
    createAccessDeniedElement() {
        if (document.getElementById('accessDenied')) return;

        const accessDeniedHTML = `
            <div id="accessDenied" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 40px; border-radius: 15px; text-align: center; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <div style="font-size: 80px; margin-bottom: 20px;">🚫</div>
                    <h1 style="color: #e74c3c; margin-bottom: 15px; font-family: 'Tajawal', sans-serif;">رفض الوصول</h1>
                    <p style="color: #666; margin-bottom: 25px; line-height: 1.6;">عذراً، لا يمكنك الوصول لهذه الصفحة.<br>هذه الصفحة مخصصة لـ <strong>السوبر أدمن</strong> فقط.</p>
                    <div class="access-reason" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace; color: #e74c3c; font-weight: bold; border-left: 4px solid #e74c3c;">
                        خطأ 403: Forbidden
                    </div>
                    <p style="color: #666; margin-bottom: 25px;">إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع مدير النظام.</p>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <a href="/login/login.html" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 25px; border: none; border-radius: 25px; cursor: pointer; font-size: 16px; text-decoration: none; display: inline-block;">
                            🔐 تسجيل الدخول
                        </a>
                        <button onclick="window.history.back()" style="background: #6c757d; color: white; padding: 12px 25px; border: none; border-radius: 25px; cursor: pointer; font-size: 16px;">
                            ↩️ العودة
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', accessDeniedHTML);
    }

    // بدء نظام الحماية
    async init() {
        console.log('🛡️ تشغيل نظام حماية السوبر أدمن...');
        
        // إنشاء عنصر رسالة رفض الوصول
        this.createAccessDeniedElement();
        
        // فحص أولي
        const hasAccess = await this.checkSuperAdminAccess();
        
        if (hasAccess) {
            // فحص دوري كل 30 ثانية
            this.checkInterval = setInterval(() => {
                this.checkSuperAdminAccess();
            }, 30000);
        }
        
        return hasAccess;
    }

    // إيقاف نظام الحماية
    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}

// إنشاء instance عامة
window.superAdminProtection = new SuperAdminProtection();

// تشغيل النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    window.superAdminProtection.init();
});

// تشغيل النظام عند تحميل النافذة (في حالة تأخر DOMContentLoaded)
window.addEventListener('load', function() {
    if (!window.superAdminProtection.checkInterval) {
        window.superAdminProtection.init();
    }
});

// تنظيف عند مغادرة الصفحة
window.addEventListener('beforeunload', function() {
    window.superAdminProtection.destroy();
});
