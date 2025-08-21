// =====================
// تأثير تحديد البطاقات
// =====================
function goToComplaintDetails(id) {
  try {
    console.log('جاري الانتقال إلى تفاصيل الشكوى رقم:', id);
    
    // مسار مطلق من الجذر حتى لو كنت داخل /login/
    const url = new URL('/general complaints/details.html', window.location.origin);
    url.searchParams.set('id', id);
    url.searchParams.set('t', Date.now()); // ضد الكاش
    console.log('الانتقال إلى:', url.toString());
    window.location.assign(url.toString());
  } catch (err) {
    console.error('خطأ في الانتقال إلى التفاصيل:', err);
    alert('خطأ في الانتقال إلى التفاصيل: ' + err.message);
  }
}
  
document.querySelectorAll(".service-box").forEach(service => {
    service.addEventListener("click", function() {
      document.querySelectorAll(".service-box").forEach(s => s.classList.remove("selected"));
      this.classList.add("selected");
      const url = this.getAttribute("data-url");
      if (url) window.location.href = url;
    });
  });
  
  // ==============
  // إعدادات API
  // ==============
  const API_BASE_URL = 'http://localhost:3001/api';
  
  // الحصول على token من storage
  function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }
  
  // دالة عامة للنداء على الباك-إند
  async function fetchFromAPI(endpoint, options = {}) {
    try {
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json', ...options.headers };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`خطأ في جلب البيانات من ${endpoint}:`, error);
      throw error;
    }
  }
  
  // ==============================
  // حساب الوقت المتبقي + SLA
  // ==============================
  function calculateTimeRemaining(deadline) {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeRemaining = deadlineDate.getTime() - now.getTime();
    if (timeRemaining <= 0) return { expired: true, text: 'انتهت المهلة', days: 0, hours: 0, minutes: 0 };
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    let text = days > 0 ? `${days} يوم` : hours > 0 ? `${hours} ساعة` : `${minutes} دقيقة`;
    return { expired: false, text: `باقي ${text}`, days, hours, minutes };
  }
  
  function getSLAStatus(deadline) {
    if (!deadline) return 'غير محدد';
    const t = calculateTimeRemaining(deadline);
    if (!t) return 'غير محدد';
    if (t.expired) return 'متأخرة';
    if (t.days === 0 && t.hours < 24) return 'قريب الانتهاء';
    return 'ضمن المهلة';
  }
  
  // ======================
  // KPIs
  // ======================
  async function loadKPIs() {
    try {
      const response = await fetchFromAPI('/complaints/all');
      const complaints = response.data || [];
  
      const total = complaints.length;
      const open = complaints.filter(c => c.CurrentStatus === 'جديدة' || c.CurrentStatus === 'قيد المعالجة').length;
      const responded = complaints.filter(c => c.CurrentStatus === 'تم الرد' || c.CurrentStatus === 'مغلقة').length;
      const respondedPercentage = total > 0 ? Math.round((responded / total) * 100) : 0;
  
      let dueSoon = 0, late = 0;
      complaints.forEach(c => {
        if (c.ResponseDeadline) {
          const t = calculateTimeRemaining(c.ResponseDeadline);
          if (t?.expired) late++;
          else if (t && t.days === 0 && t.hours < 24) dueSoon++;
        }
      });
  
      document.getElementById('kpiTotal').textContent = total;
      document.getElementById('kpiOpen').textContent = open;
      document.getElementById('kpiResponded').textContent = `${respondedPercentage}%`;
      document.getElementById('kpiDueSoon').textContent = dueSoon;
      document.getElementById('kpiLate').textContent = late;
    } catch (error) {
      console.error('خطأ في تحميل KPIs:', error);
      document.getElementById('kpiTotal').textContent = '—';
      document.getElementById('kpiOpen').textContent = '—';
      document.getElementById('kpiResponded').textContent = '—';
      document.getElementById('kpiDueSoon').textContent = '—';
      document.getElementById('kpiLate').textContent = '—';
    }
  }
  
  // =======================
  // جدول الشكاوى (بدون أزرار إضافية)
  // =======================
  async function loadComplaintsTable() {
    try {
      const tbody = document.getElementById('compBody');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#666;">جاري التحميل...</td></tr>';
  
      const response = await fetchFromAPI('/complaints/all');
      const complaints = response.data || [];
      if (complaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#666;">لا توجد شكاوى</td></tr>';
        return;
      }
  
      const rows = complaints.map(c => {
        const t = calculateTimeRemaining(c.ResponseDeadline);
        const createdDate = c.ComplaintDate ? new Date(c.ComplaintDate).toLocaleDateString('ar-SA') : '—';
        const deadlineDate = c.ResponseDeadline ? new Date(c.ResponseDeadline).toLocaleDateString('ar-SA') : '—';
        const timeRemainingText = t ? t.text : '—';
  
        let statusBadge = '';
        if (c.CurrentStatus === 'جديدة') statusBadge = '<span class="badge badge-open">جديدة</span>';
        else if (c.CurrentStatus === 'قيد المعالجة') statusBadge = '<span class="badge badge-progress">قيد المعالجة</span>';
        else if (c.CurrentStatus === 'تم الرد') statusBadge = '<span class="badge badge-responded">تم الرد</span>';
        else if (c.CurrentStatus === 'مغلقة') statusBadge = '<span class="badge badge-closed">مغلقة</span>';
        else statusBadge = `<span class="badge badge-neutral">${c.CurrentStatus || '—'}</span>`;
  
        return `
          <tr data-id="${c.ComplaintID}">
            <td>#${c.ComplaintID}</td>
            <td>${c.DepartmentName || '—'}</td>
            <td>${statusBadge}</td>
            <td>${c.ComplaintTypeName || '—'}</td>
            <td>${createdDate}</td>
            <td>${deadlineDate}</td>
            <td>${timeRemainingText}</td>
          </tr>
        `;
      });
  
      tbody.innerHTML = rows.join('');
    } catch (error) {
      console.error('خطأ في تحميل جدول الشكاوى:', error);
      const tbody = document.getElementById('compBody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#b22121;">تعذر جلب البيانات</td></tr>';
      }
    }
  }
  
  // ===========================================
  // إشعارات: الشكاوى الجديدة مع زر «التفصيل» + ×
  // ===========================================
  async function loadNotifications() {
    try {
      // الشكاوى في آخر 7 أيام (عدّل الفترة إن حبيت)
      const res = await fetchFromAPI('/complaints/all?dateFilter=7');
      const complaints = (res && res.data) || [];
  
      // تحديث شارة الجرس
      const badge = document.getElementById('notifCount') || document.getElementById('notif-count');
      if (badge) {
        badge.textContent = complaints.length;
        badge.style.display = complaints.length > 0 ? 'inline-block' : 'none';
      }
  
      // توليد القائمة في المودال
      const list = document.getElementById('notifList');
      if (!list) return;
  
      if (complaints.length === 0) {
        list.innerHTML = '<div class="notif-item">لا توجد شكاوى جديدة</div>';
        return;
      }
  
      list.innerHTML = complaints.slice(0, 20).map(c => `
        <div class="notif-item" data-id="${c.ComplaintID}">
          <div class="notif-main">
            <div class="notif-title">شكوى جديدة #${c.ComplaintID}</div>
            <div class="notif-body">
              ${c.DepartmentName || 'قسم غير محدد'} •
              ${c.ComplaintTypeName || 'نوع غير محدد'} •
              ${c.ComplaintDate ? new Date(c.ComplaintDate).toLocaleString('ar-SA') : '—'}
            </div>
          </div>
          <div class="notif-actions">
            <button class="btn-details" data-action="details" title="عرض التفاصيل">التفصيل</button>
            <button class="btn-dismiss" data-action="dismiss" title="إخفاء" aria-label="إخفاء">×</button>
          </div>
        </div>
      `).join('');
  
      // أحداث الأزرار لكل عنصر (تفصيل + إخفاء محلي)
      list.querySelectorAll('.notif-item').forEach(row => {
        const id = row.getAttribute('data-id');
  
        row.addEventListener('click', (e) => {
          const btn = e.target.closest('button[data-action]');
          if (!btn) return;
  
          const action = btn.getAttribute('data-action');
  
          if (action === 'details') {
            goToComplaintDetails(id);
          }
  
          if (action === 'dismiss') {
            row.remove();
            // تحديث العدّاد
            if (badge) {
              const current = parseInt(badge.textContent || '0', 10) || 0;
              const next = Math.max(current - 1, 0);
              badge.textContent = next;
              badge.style.display = next > 0 ? 'inline-block' : 'none';
            }
            if (!list.querySelector('.notif-item')) {
              list.innerHTML = '<div class="notif-item">لا توجد شكاوى جديدة</div>';
            }
          }
        });
      });
  
    } catch (err) {
      console.error('خطأ في تحميل الشكاوى الجديدة:', err);
      const list = document.getElementById('notifList');
      if (list) list.innerHTML = '<div class="notif-item" style="color:#b22121;">تعذر جلب الشكاوى الجديدة</div>';
    }
  }
  
  // ============================
  // تعدد اللغات + الصلاحيات
  // ============================
  let currentLang = localStorage.getItem('lang') || 'ar';
  
  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
  
    document.documentElement.lang = lang;
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';
  
    document.querySelectorAll('[data-ar]').forEach(el => {
      el.textContent = el.getAttribute(`data-${lang}`);
    });
    document.querySelectorAll('[data-ar-placeholder]').forEach(el => {
      el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
    });
  
    const langText = document.getElementById('langText');
    if (langText) langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  
    document.body.style.fontFamily = lang === 'ar' ? "'Tajawal', sans-serif" : "serif";
  }
  
  function checkUserPermissions() {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) { window.location.href = 'login.html'; return; }
  
      const userRole = user.RoleName || '';
      const roleID = user.RoleID || 2;
      const username = user.Username || '';
      const userPermissions = JSON.parse(localStorage.getItem('userPermissions')) || {};
  
      if (roleID === 1 || username.toLowerCase() === 'admin' || userRole.includes('مدير')) {
        document.querySelectorAll('.admin-only').forEach(card => { card.style.display = 'block'; });
        document.querySelectorAll('.card').forEach(card => { card.style.display = 'block'; });
      } else {
        applyEmployeePermissions(userPermissions);
      }
    } catch (error) {
      console.error('خطأ في فحص الصلاحيات:', error);
      window.location.href = 'login.html';
    }
  }
  
  function applyEmployeePermissions(permissions) {
    const submitComplaintCard = document.querySelector('.card a[href="/New complaint/Newcomplaint.html"]')?.closest('.card');
    if (submitComplaintCard) submitComplaintCard.style.display = permissions.submit_complaint ? 'block' : 'none';
  
    const followComplaintsCard = document.querySelector('.card a[href="/Complaints-followup/followup.html"]')?.closest('.card');
    if (followComplaintsCard) followComplaintsCard.style.display = permissions.follow_own_complaint ? 'block' : 'none';
  
    const publicComplaintsCard = document.querySelector('.card a[href="/general complaints/general-complaints.html"]')?.closest('.card');
    if (publicComplaintsCard) publicComplaintsCard.style.display = permissions.view_public_complaints ? 'block' : 'none';
  
    const dashboardCard = document.querySelector('.card a[href="/DashBoard/overview.html"]')?.closest('.card');
    if (dashboardCard) dashboardCard.style.display = permissions.access_dashboard ? 'block' : 'none';
  
    const adminPanelCard = document.querySelector('.card a[href="/admin/admin.html"]')?.closest('.card');
    if (adminPanelCard) adminPanelCard.style.display = 'none';
  }
  
  // =====================
  // تهيئة الصفحة
  // =====================
  document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);
    checkUserPermissions();
  
    const toggleBtn = document.getElementById('langToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const newLang = currentLang === 'ar' ? 'en' : 'ar';
        applyLanguage(newLang);
      });
    }
  
    // عناصر الجرس/المودال
    const notifBtn = document.getElementById('notifBtn');
    const notifModal = document.getElementById('notifModal');
    const closeNotif = document.getElementById('closeNotif');
  
    notifBtn?.addEventListener('click', async () => {
      await loadNotifications();                 // حمّل الشكاوى الجديدة
      if (notifModal) notifModal.style.display = 'flex'; // أظهر المودال
    });
  
    closeNotif?.addEventListener('click', () => { if (notifModal) notifModal.style.display = 'none'; });
    notifModal?.addEventListener('click', (e) => { if (e.target === notifModal) notifModal.style.display = 'none'; });
  
    // تحميل البيانات العامة
    loadKPIs();
    loadComplaintsTable();
  
    // تحديث دوري كل 5 دقائق
    setInterval(() => {
      loadKPIs();
      loadComplaintsTable();
      loadNotifications();
    }, 5 * 60 * 1000);
  });
  