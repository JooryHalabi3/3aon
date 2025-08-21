/**
 * نظام التنبيهات المشترك
 * يطبق على جميع الصفحات
 */

import { permissionManager, NOTIFICATION_TYPES } from './permissions.js';

/**
 * مدير التنبيهات
 */
class NotificationManager {
  constructor() {
    this.notifications = [];
    this.container = null;
    this.init();
  }

  /**
   * تهيئة مدير التنبيهات
   */
  init() {
    // إنشاء حاوية التنبيهات
    this.createContainer();
    
    // بدء فحص التنبيهات الجديدة
    this.startPolling();
  }

  /**
   * إنشاء حاوية التنبيهات
   */
  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'notifications-container';
    this.container.id = 'notifications-container';
    document.body.appendChild(this.container);
  }

  /**
   * إنشاء تنبيه جديد
   */
  show(type, title, message, options = {}) {
    const notification = this.createNotification(type, title, message, options);
    
    // إضافة التنبيه للحاوية
    this.container.appendChild(notification);
    
    // إضافة التنبيه للمصفوفة
    this.notifications.push(notification);
    
    // عرض التنبيه
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    // إخفاء التنبيه تلقائياً بعد المدة المحددة
    if (options.autoHide !== false) {
      const duration = options.duration || 5000;
      setTimeout(() => {
        this.hide(notification);
      }, duration);
    }
    
    // تسجيل النشاط
    if (permissionManager.currentUser) {
      permissionManager.logActivity(
        'Notification',
        `تم إنشاء تنبيه: ${title}`,
        null,
        'notification'
      );
    }
    
    return notification;
  }

  /**
   * إنشاء عنصر التنبيه
   */
  createNotification(type, title, message, options = {}) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // إضافة فئات إضافية
    if (options.classes) {
      options.classes.forEach(cls => notification.classList.add(cls));
    }
    
    // إضافة معرف فريد
    notification.id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // محتوى التنبيه
    notification.innerHTML = `
      ${options.closable !== false ? '<button class="notification-close">&times;</button>' : ''}
      <div class="notification-content">
        <div class="notification-icon">${this.getIcon(type)}</div>
        <div class="notification-text">
          <div class="notification-title">${title}</div>
          <div class="notification-message">${message}</div>
          ${options.showTime !== false ? `<div class="notification-time">${this.getCurrentTime()}</div>` : ''}
        </div>
      </div>
      ${this.createActions(options.actions)}
    `;
    
    // إضافة مستمعي الأحداث
    this.addEventListeners(notification, options);
    
    return notification;
  }

  /**
   * الحصول على أيقونة التنبيه
   */
  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      urgent: '🚨',
      complaint: '📋',
      reminder: '⏰',
      permission: '🔐',
      system: '⚙️',
      security: '🔒'
    };
    
    return icons[type] || icons.info;
  }

  /**
   * الحصول على الوقت الحالي
   */
  getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * إنشاء أزرار الإجراءات
   */
  createActions(actions = []) {
    if (!actions || actions.length === 0) return '';
    
    const actionsHtml = actions.map(action => `
      <button class="notification-btn ${action.class || ''}" onclick="this.closest('.notification').dispatchEvent(new CustomEvent('notificationAction', { detail: { action: '${action.name}', data: ${JSON.stringify(action.data || {})} } }))">
        ${action.label}
      </button>
    `).join('');
    
    return `<div class="notification-actions">${actionsHtml}</div>`;
  }

  /**
   * إضافة مستمعي الأحداث
   */
  addEventListeners(notification, options) {
    // زر الإغلاق
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide(notification));
    }
    
    // النقر على التنبيه
    if (options.clickable) {
      notification.style.cursor = 'pointer';
      notification.addEventListener('click', (e) => {
        if (e.target !== closeBtn && !e.target.closest('.notification-actions')) {
          if (options.onClick) {
            options.onClick(notification, e);
          }
        }
      });
    }
    
    // إجراءات التنبيه
    notification.addEventListener('notificationAction', (e) => {
      const { action, data } = e.detail;
      if (options.onAction) {
        options.onAction(action, data, notification);
      }
    });
    
    // إخفاء تلقائي عند النقر خارج التنبيه
    if (options.autoHideOnClickOutside) {
      document.addEventListener('click', (e) => {
        if (!notification.contains(e.target)) {
          this.hide(notification);
        }
      });
    }
  }

  /**
   * إخفاء تنبيه
   */
  hide(notification) {
    if (!notification) return;
    
    notification.classList.remove('show');
    
    // إزالة التنبيه بعد انتهاء الرسوم المتحركة
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      
      // إزالة من المصفوفة
      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    }, 300);
  }

  /**
   * إخفاء جميع التنبيهات
   */
  hideAll() {
    this.notifications.forEach(notification => this.hide(notification));
  }

  /**
   * إنشاء تنبيه نجاح
   */
  success(title, message, options = {}) {
    return this.show('success', title, message, options);
  }

  /**
   * إنشاء تنبيه خطأ
   */
  error(title, message, options = {}) {
    return this.show('error', title, message, options);
  }

  /**
   * إنشاء تنبيه تحذير
   */
  warning(title, message, options = {}) {
    return this.show('warning', title, message, options);
  }

  /**
   * إنشاء تنبيه معلومات
   */
  info(title, message, options = {}) {
    return this.show('info', title, message, options);
  }

  /**
   * إنشاء تنبيه عاجل
   */
  urgent(title, message, options = {}) {
    return this.show('urgent', title, message, { ...options, autoHide: false });
  }

  /**
   * إنشاء تنبيه شكوى
   */
  complaint(title, message, options = {}) {
    return this.show('complaint', title, message, options);
  }

  /**
   * إنشاء تنبيه تذكير
   */
  reminder(title, message, options = {}) {
    return this.show('reminder', title, message, options);
  }

  /**
   * إنشاء تنبيه صلاحيات
   */
  permission(title, message, options = {}) {
    return this.show('permission', title, message, options);
  }

  /**
   * إنشاء تنبيه نظام
   */
  system(title, message, options = {}) {
    return this.show('system', title, message, options);
  }

  /**
   * إنشاء تنبيه أمان
   */
  security(title, message, options = {}) {
    return this.show('security', title, message, options);
  }

  /**
   * بدء فحص التنبيهات الجديدة
   */
  startPolling() {
    // فحص التنبيهات كل 30 ثانية
    setInterval(() => {
      this.checkNewNotifications();
    }, 30000);
  }

  /**
   * فحص التنبيهات الجديدة
   */
  async checkNewNotifications() {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/notifications/unread', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const notifications = await response.json();
        
        notifications.forEach(notification => {
          this.show(
            notification.type || 'info',
            notification.title,
            notification.body,
            {
              autoHide: false,
              actions: [
                {
                  name: 'markAsRead',
                  label: 'تحديد كمقروء',
                  class: 'primary'
                },
                {
                  name: 'view',
                  label: 'عرض',
                  class: 'success'
                }
              ],
              onAction: (action, data, notificationElement) => {
                this.handleNotificationAction(action, notification, notificationElement);
              }
            }
          );
        });
      }
    } catch (error) {
      console.error('خطأ في فحص التنبيهات الجديدة:', error);
    }
  }

  /**
   * معالجة إجراءات التنبيه
   */
  async handleNotificationAction(action, notificationData, notificationElement) {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      switch (action) {
        case 'markAsRead':
          await fetch(`/api/notifications/${notificationData.notificationID}/read`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          this.hide(notificationElement);
          this.success('تم تحديد التنبيه كمقروء');
          break;

        case 'view':
          if (notificationData.relatedType && notificationData.relatedID) {
            this.navigateToRelatedContent(notificationData.relatedType, notificationData.relatedID);
          }
          this.hide(notificationElement);
          break;
      }
    } catch (error) {
      console.error('خطأ في معالجة إجراء التنبيه:', error);
      this.error('خطأ في معالجة الإجراء');
    }
  }

  /**
   * الانتقال للمحتوى المرتبط
   */
  navigateToRelatedContent(type, id) {
    switch (type) {
      case 'complaint':
        window.location.href = `/general complaints/track.html?complaint=${id}`;
        break;
      case 'employee':
        window.location.href = `/admin/employee-data.html?id=${id}`;
        break;
      case 'department':
        window.location.href = `/admin/department-management.html?id=${id}`;
        break;
      default:
        console.warn('نوع محتوى غير معروف:', type);
    }
  }

  /**
   * إنشاء تنبيه مخصص
   */
  custom(config) {
    const {
      type = 'info',
      title,
      message,
      icon,
      background,
      color,
      actions,
      duration,
      autoHide = true,
      clickable = false,
      onClick,
      onAction
    } = config;

    const notification = this.createNotification(type, title, message, {
      actions,
      duration,
      autoHide,
      clickable,
      onClick,
      onAction
    });

    // تطبيق التخصيص
    if (background) {
      notification.style.setProperty('--custom-notification-bg', background);
    }
    if (color) {
      notification.style.setProperty('--custom-notification-title-color', color);
    }
    if (icon) {
      const iconElement = notification.querySelector('.notification-icon');
      if (iconElement) {
        iconElement.textContent = icon;
      }
    }

    return notification;
  }
}

// إنشاء نسخة عامة من مدير التنبيهات
const notificationManager = new NotificationManager();

// تصدير مدير التنبيهات
export { NotificationManager, notificationManager };
