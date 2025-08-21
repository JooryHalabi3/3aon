// تأثير تحديد البطاقات عند الضغط
document.querySelectorAll(".service-box").forEach(service => {
    service.addEventListener("click", function() {
        document.querySelectorAll(".service-box").forEach(s => s.classList.remove("selected"));
        this.classList.add("selected");

        // التنقل إلى الصفحة المحددة في data-url
        const url = this.getAttribute("data-url"); // ✅ تصحيح الخطأ هنا
        if (url) {
            window.location.href = url;
        }
    });
});

// تقليل عدد الإشعارات عند الضغط
z

if (notifBtn && notifCount) {
    notifBtn.addEventListener("click", function() {
        let count = parseInt(notifCount.textContent) || 0;

        if (count > 0) {
            count--;
            notifCount.textContent = count;

            if (count === 0) {
                notifCount.style.display = "none";
            }
        }
    });
}

// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// الحصول على token من localStorage
function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// دالة لجلب البيانات من الباك اند
async function fetchFromAPI(endpoint, options = {}) {
    try {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`خطأ في جلب البيانات من ${endpoint}:`, error);
        throw error;
    }
}

// دالة لحساب الوقت المتبقي للرد
function calculateTimeRemaining(deadline) {
    if (!deadline) return null;
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeRemaining = deadlineDate.getTime() - now.getTime();
    
    if (timeRemaining <= 0) {
        return {
            expired: true,
            text: 'انتهت المهلة',
            days: 0,
            hours: 0,
            minutes: 0
        };
    }
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    let text = '';
    if (days > 0) {
        text = `${days} يوم`;
    } else if (hours > 0) {
        text = `${hours} ساعة`;
    } else {
        text = `${minutes} دقيقة`;
    }
    
    return {
        expired: false,
        text: `باقي ${text}`,
        days,
        hours,
        minutes
    };
}

// دالة لتحديث حالة SLA
function getSLAStatus(deadline) {
    if (!deadline) return 'غير محدد';
    
    const timeRemaining = calculateTimeRemaining(deadline);
    if (!timeRemaining) return 'غير محدد';
    
    if (timeRemaining.expired) {
        return 'متأخرة';
    } else if (timeRemaining.days === 0 && timeRemaining.hours < 24) {
        return 'قريب الانتهاء';
    } else {
        return 'ضمن المهلة';
    }
}

// دالة لجلب إحصائيات KPIs
async function loadKPIs() {
    try {
        // جلب جميع الشكاوى لحساب الإحصائيات
        const response = await fetchFromAPI('/complaints/all');
        const complaints = response.data || [];
        
        // حساب الإحصائيات
        const total = complaints.length;
        const open = complaints.filter(c => c.CurrentStatus === 'جديدة' || c.CurrentStatus === 'قيد المعالجة').length;
        const responded = complaints.filter(c => c.CurrentStatus === 'تم الرد' || c.CurrentStatus === 'مغلقة').length;
        const respondedPercentage = total > 0 ? Math.round((responded / total) * 100) : 0;
        
        // حساب الشكاوى المتأخرة والقريبة من الانتهاء
        let dueSoon = 0;
        let late = 0;
        
        complaints.forEach(complaint => {
            if (complaint.ResponseDeadline) {
                const timeRemaining = calculateTimeRemaining(complaint.ResponseDeadline);
                if (timeRemaining && timeRemaining.expired) {
                    late++;
                } else if (timeRemaining && timeRemaining.days === 0 && timeRemaining.hours < 24) {
                    dueSoon++;
                }
            }
        });
        
        // تحديث العناصر في الصفحة
        document.getElementById('kpiTotal').textContent = total;
        document.getElementById('kpiOpen').textContent = open;
        document.getElementById('kpiResponded').textContent = `${respondedPercentage}%`;
        document.getElementById('kpiDueSoon').textContent = dueSoon;
        document.getElementById('kpiLate').textContent = late;
        
    } catch (error) {
        console.error('خطأ في تحميل KPIs:', error);
        // إظهار قيم افتراضية في حالة الخطأ
        document.getElementById('kpiTotal').textContent = '—';
        document.getElementById('kpiOpen').textContent = '—';
        document.getElementById('kpiResponded').textContent = '—';
        document.getElementById('kpiDueSoon').textContent = '—';
        document.getElementById('kpiLate').textContent = '—';
    }
}

// دالة لجلب جدول الشكاوى
async function loadComplaintsTable() {
    try {
        const tbody = document.getElementById('compBody');
        if (!tbody) return;
        
        // إظهار رسالة التحميل
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#666;">جاري التحميل...</td></tr>';
        
        // جلب الشكاوى من الباك اند
        const response = await fetchFromAPI('/complaints/all');
        const complaints = response.data || [];
        
        if (complaints.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#666;">لا توجد شكاوى</td></tr>';
            return;
        }
        
        // إنشاء صفوف الجدول
        const rows = complaints.map(complaint => {
            const timeRemaining = calculateTimeRemaining(complaint.ResponseDeadline);
            
            // تنسيق تاريخ الإنشاء
            const createdDate = complaint.ComplaintDate ? 
                new Date(complaint.ComplaintDate).toLocaleDateString('ar-SA') : '—';
            
            // تنسيق تاريخ الموعد النهائي
            const deadlineDate = complaint.ResponseDeadline ? 
                new Date(complaint.ResponseDeadline).toLocaleDateString('ar-SA') : '—';
            
            // تنسيق الوقت المتبقي
            const timeRemainingText = timeRemaining ? timeRemaining.text : '—';
            
            // تنسيق حالة الشكوى
            let statusBadge = '';
            if (complaint.CurrentStatus === 'جديدة') {
                statusBadge = '<span class="badge badge-open">جديدة</span>';
            } else if (complaint.CurrentStatus === 'قيد المعالجة') {
                statusBadge = '<span class="badge badge-progress">قيد المعالجة</span>';
            } else if (complaint.CurrentStatus === 'تم الرد') {
                statusBadge = '<span class="badge badge-responded">تم الرد</span>';
            } else if (complaint.CurrentStatus === 'مغلقة') {
                statusBadge = '<span class="badge badge-closed">مغلقة</span>';
            } else {
                statusBadge = `<span class="badge badge-neutral">${complaint.CurrentStatus || '—'}</span>`;
            }
            
            return `
                <tr>
                    <td>#${complaint.ComplaintID}</td>
                    <td>${complaint.DepartmentName || '—'}</td>
                    <td>${statusBadge}</td>
                    <td>${complaint.ComplaintTypeName || '—'}</td>
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

// دالة لجلب الشكاوى الجديدة للإشعارات
async function loadNewComplaints() {
    try {
        console.log('جاري تحميل الإشعارات...');
        
        // جلب الشكاوى الجديدة (آخر 7 أيام)
        const response = await fetchFromAPI('/complaints/all?dateFilter=7');
        const complaints = response.data || [];
        
        console.log('عدد الشكاوى الجديدة:', complaints.length);
        
        // عدّاد الجرس
        const countEl = document.getElementById('notifCount');
        if (countEl) {
            countEl.textContent = complaints.length;
            countEl.style.display = complaints.length > 0 ? 'inline-block' : 'none';
            
            // إضافة تأثير بصري للعدّاد
            if (complaints.length > 0) {
                countEl.style.animation = 'pulse 1s infinite';
            } else {
                countEl.style.animation = 'none';
            }
        }
        
        // قائمة النافذة
        const notifList = document.getElementById('notifList');
        if (notifList) {
            if (complaints.length === 0) {
                notifList.innerHTML = `
                    <div class="notif-item empty-notif">
                        <div class="text">لا توجد شكاوى جديدة</div>
                        <small>آخر تحديث: ${new Date().toLocaleString('ar-SA')}</small>
                    </div>
                `;
            } else {
                // ترتيب الشكاوى حسب التاريخ (الأحدث أولاً)
                const sortedComplaints = complaints.sort((a, b) => 
                    new Date(b.ComplaintDate) - new Date(a.ComplaintDate)
                );
                
                notifList.innerHTML = sortedComplaints.slice(0, 10).map(complaint => {
                    // تنسيق التاريخ
                    const complaintDate = new Date(complaint.ComplaintDate);
                    const timeAgo = getTimeAgo(complaintDate);
                    
                    // تنسيق حالة الشكوى
                    const statusBadge = getStatusBadge(complaint.CurrentStatus);
                    
                    // تنسيق النص
                    const complaintText = complaint.ComplaintDetails ? 
                        complaint.ComplaintDetails.substring(0, 60) + (complaint.ComplaintDetails.length > 60 ? '...' : '') : 
                        'لا توجد تفاصيل';
                    
                    return `
                        <div class="notif-item" data-complaint-id="${complaint.ComplaintID}">
                            <div class="notif-header">
                                <div class="meta">
                                    <span class="time-ago">${timeAgo}</span>
                                    <span class="separator">•</span>
                                    <span class="department">${complaint.DepartmentName || 'غير محدد'}</span>
                                    <span class="separator">•</span>
                                    <span class="type">${complaint.ComplaintTypeName || 'غير محدد'}</span>
                                </div>
                                ${statusBadge}
                            </div>
                            <div class="text">
                                <strong>#${complaint.ComplaintID}</strong> - ${complaintText}
                            </div>
                            <div class="notif-actions">
                                <button class="go-details" data-id="${complaint.ComplaintID}" title="عرض تفاصيل الشكوى">
                                    <i class="ri-eye-line"></i>
                                    التفاصيل
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
                
                // إضافة حدث الضغط على زر التفاصيل
                notifList.querySelectorAll('.go-details').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const id = this.getAttribute('data-id');
                        if (id) {
                            console.log('الانتقال لتفاصيل الشكوى رقم:', id);
                            
                            // حفظ معرف الشكوى في localStorage كنسخة احتياطية
                            localStorage.setItem('selectedComplaintId', id);
                            
                            // حفظ بيانات الشكوى الكاملة للاستخدام في صفحة التفاصيل
                            const complaintItem = this.closest('.notif-item');
                            const complaintData = complaints.find(c => c.ComplaintID == id);
                            if (complaintData) {
                                localStorage.setItem('selectedComplaint', JSON.stringify(complaintData));
                            }
                            
                            // إغلاق نافذة الإشعارات
                            document.getElementById('notifModal').style.display = 'none';
                            
                            // الانتقال لصفحة التفاصيل مع معرف الشكوى المحددة
                            window.location.href = `/general complaints/details.html?id=${id}`;
                        }
                    });
                });
            }
        }
        
        console.log('تم تحميل الإشعارات بنجاح');
        
    } catch (error) {
        console.error('خطأ في تحميل الإشعارات:', error);
        
        // إظهار رسالة خطأ للمستخدم
        const notifList = document.getElementById('notifList');
        if (notifList) {
            notifList.innerHTML = `
                <div class="notif-item error-notif">
                    <div class="text">خطأ في تحميل الإشعارات</div>
                    <small>يرجى المحاولة مرة أخرى</small>
                </div>
            `;
        }
    }
}

// دالة لحساب الوقت المنقضي
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'الآن';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `منذ ${minutes} دقيقة`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `منذ ${hours} ساعة`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `منذ ${days} يوم`;
    }
}

// دالة لتنسيق حالة الشكوى
function getStatusBadge(status) {
    const statusMap = {
        'جديدة': '<span class="status-badge new">جديدة</span>',
        'قيد المعالجة': '<span class="status-badge processing">قيد المعالجة</span>',
        'تم الرد': '<span class="status-badge responded">تم الرد</span>',
        'مغلقة': '<span class="status-badge closed">مغلقة</span>'
    };
    
    return statusMap[status] || `<span class="status-badge unknown">${status || 'غير محدد'}</span>`;
}

let currentLang = localStorage.getItem('lang') || 'ar';

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  // الاتجاه واللغة
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';

  // تغيير النصوص بناءً على اللغة
  document.querySelectorAll('[data-ar]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  // تغيير placeholder بناءً على اللغة
  document.querySelectorAll('[data-ar-placeholder]').forEach(el => {
    el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
  });

  // زر اللغة نفسه
  const langText = document.getElementById('langText');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  }

  // تغيير الخط
  document.body.style.fontFamily = lang === 'ar' ? "'Tajawal', sans-serif" : "serif";
}

// فحص صلاحيات المستخدم وإظهار البطاقات المناسبة
function checkUserPermissions() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      // إذا لم يكن هناك مستخدم مسجل، توجيه إلى صفحة تسجيل الدخول
      window.location.href = 'login.html';
      return;
    }

    const userRole = user.RoleName || '';
    const roleID = user.RoleID || 2;
    const username = user.Username || '';
    
    // جلب صلاحيات المستخدم من localStorage أو من الباك إند
    const userPermissions = JSON.parse(localStorage.getItem('userPermissions')) || {};
    
    // إذا كان المستخدم أدمن (بالاسم أو الدور)
    if (roleID === 1 || username.toLowerCase() === 'admin' || userRole.includes('مدير')) {
      // المدير: إظهار جميع البطاقات
      const adminCards = document.querySelectorAll('.admin-only');
      adminCards.forEach(card => {
        card.style.display = 'block';
      });
      
      // إظهار جميع البطاقات العادية أيضاً
      const allCards = document.querySelectorAll('.card');
      allCards.forEach(card => {
        card.style.display = 'block';
      });
    } else {
      // الموظف العادي: تطبيق الصلاحيات
      applyEmployeePermissions(userPermissions);
    }
    
  } catch (error) {
    console.error('خطأ في فحص الصلاحيات:', error);
    // في حالة وجود خطأ، إعادة توجيه لصفحة تسجيل الدخول
    window.location.href = 'login.html';
  }
}

// دالة لتطبيق صلاحيات الموظف
function applyEmployeePermissions(permissions) {
  // بطاقة تقديم شكوى جديدة
  const submitComplaintCard = document.querySelector('.card a[href="/New complaint/Newcomplaint.html"]')?.closest('.card');
  if (submitComplaintCard) {
    submitComplaintCard.style.display = permissions.submit_complaint ? 'block' : 'none';
  }
  
  // بطاقة متابعة الشكاوى
  const followComplaintsCard = document.querySelector('.card a[href="/Complaints-followup/followup.html"]')?.closest('.card');
  if (followComplaintsCard) {
    followComplaintsCard.style.display = permissions.follow_own_complaint ? 'block' : 'none';
  }
  
  // بطاقة الشكاوى العامة
  const publicComplaintsCard = document.querySelector('.card a[href="/general complaints/general-complaints.html"]')?.closest('.card');
  if (publicComplaintsCard) {
    publicComplaintsCard.style.display = permissions.view_public_complaints ? 'block' : 'none';
  }
  
  // بطاقة لوحة المعلومات (الداش بورد) - تطبيق صلاحية الوصول للداش بورد
  const dashboardCard = document.querySelector('.card a[href="/DashBoard/overview.html"]')?.closest('.card');
  if (dashboardCard) {
    dashboardCard.style.display = permissions.access_dashboard ? 'block' : 'none';
  }
  
  // بطاقة لوحة تحكم المسؤول (إخفاء دائماً للموظفين العاديين)
  const adminPanelCard = document.querySelector('.card a[href="/admin/admin.html"]')?.closest('.card');
  if (adminPanelCard) {
    adminPanelCard.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);
  checkUserPermissions(); // فحص صلاحيات المستخدم عند تحميل الصفحة

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }

  // إشعارات الشكاوى الجديدة
  const notifBtn = document.getElementById('notifBtn');
  const notifModal = document.getElementById('notifModal');
  const closeNotif = document.getElementById('closeNotif');

  notifBtn?.addEventListener('click', async () => {
    await loadNewComplaints();
    notifModal.style.display = 'flex';
  });
  
  closeNotif?.addEventListener('click', () => { 
    notifModal.style.display = 'none'; 
  });
  
  notifModal?.addEventListener('click', (e) => { 
    if (e.target === notifModal) notifModal.style.display = 'none'; 
  });
  
  // تحميل البيانات عند تحميل الصفحة
  loadKPIs();
  loadComplaintsTable();
  loadNewComplaints();
  
  // تحديث البيانات كل دقيقة للإشعارات
  setInterval(() => {
    loadNewComplaints();
  }, 60 * 1000);
  
  // تحديث البيانات كل 5 دقائق للبيانات الأخرى
  setInterval(() => {
    loadKPIs();
    loadComplaintsTable();
  }, 5 * 60 * 1000);
  
  // تحديث الإشعارات عند التركيز على النافذة
  window.addEventListener('focus', () => {
    console.log('تم التركيز على النافذة، تحديث الإشعارات...');
    loadNewComplaints();
  });
  
  // تحديث الإشعارات عند العودة للصفحة
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('تم العودة للصفحة، تحديث الإشعارات...');
      loadNewComplaints();
    }
  });
});
