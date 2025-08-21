
function goBack() {
  window.history.back();
}

// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

async function handleSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('patientName').value;
  const id = document.getElementById('fileNumber').value;
  
  console.log('بيانات النموذج المدخلة:');
  console.log('- الاسم:', name);
  console.log('- رقم الملف:', id);

  if (!name || !id) {
    alert("يرجى تعبئة جميع الحقول المطلوبة");
    return;
  }

  // إظهار رسالة تحميل
  const submitBtn = document.querySelector('.submit-btn');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "جاري التحقق...";
  submitBtn.disabled = true;

  try {
    // التحقق من هوية المريض عبر API الجديد
    const verifyResponse = await fetch(`${API_BASE_URL}/complaints/verify-patient/${id}`);
    const verifyData = await verifyResponse.json();
    
    console.log('استجابة API التحقق من المريض:', verifyData);

    if (verifyData.success) {
      // التحقق من تطابق الاسم
      const patientName = verifyData.data.patient.name.toLowerCase().trim();
      const enteredName = name.toLowerCase().trim();
      
      console.log('اسم المريض من قاعدة البيانات:', verifyData.data.patient.name);
      console.log('الاسم المدخل من المستخدم:', name);
      console.log('اسم المريض بعد المعالجة:', patientName);
      console.log('الاسم المدخل بعد المعالجة:', enteredName);
      
      // تحقق أكثر دقة من تطابق الاسم
      // أولاً: التحقق من التطابق الكامل
      if (patientName === enteredName) {
        // تطابق كامل - متابعة
      } else {
        // التحقق من التطابق الجزئي مع شروط أكثر صرامة
        const patientWords = patientName.split(' ').filter(word => word.length > 2);
        const enteredWords = enteredName.split(' ').filter(word => word.length > 2);
        
        // التحقق من أن 70% على الأقل من الكلمات متطابقة
        const matchingWords = patientWords.filter(word => 
          enteredWords.some(enteredWord => 
            enteredWord.includes(word) || word.includes(enteredWord)
          )
        );
        
        const matchPercentage = matchingWords.length / Math.max(patientWords.length, enteredWords.length);
        
        console.log('كلمات المريض:', patientWords);
        console.log('كلمات المستخدم:', enteredWords);
        console.log('الكلمات المتطابقة:', matchingWords);
        console.log('نسبة التطابق:', matchPercentage);
        
        if (matchPercentage < 0.7) {
          alert("الاسم المدخل لا يتطابق مع البيانات المسجلة. يرجى التأكد من صحة الاسم ورقم الهوية.");
          return;
        }
      }
      
      console.log('تم التحقق من الاسم بنجاح - الانتقال لصفحة الشكاوى');
      
      // تخزين البيانات في localStorage
      // حفظ الاسم المدخل من المستخدم بدلاً من الاسم من قاعدة البيانات
      localStorage.setItem('patientName', name);
      localStorage.setItem('patientId', id);
      localStorage.setItem('patientNationalId', id);
        
      // التحقق من وجود شكاوى
      console.log('عدد الشكاوى للمريض:', verifyData.data.totalComplaints);
        
      if (verifyData.data.totalComplaints > 0) {
        console.log('تم العثور على شكاوى - الانتقال لصفحة الشكاوى');
        // الانتقال إلى صفحة الشكاوى
        window.location.href = "/Complaints-followup/all-complaints.html";
      } else {
        alert("لا توجد شكاوى مسجلة لهذا المريض حتى الآن.");
      }
    } else {
      alert("لا يوجد مريض مسجل بهذا الرقم أو البيانات غير صحيحة");
    }
  } catch (error) {
    console.error('خطأ في التحقق من هوية المريض:', error);
    alert("حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
  } finally {
    // إعادة تفعيل الزر
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    console.log('تم إعادة تفعيل زر الإرسال');
  }
  
  console.log('=== انتهت معالجة النموذج ===');
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
  
  console.log('تم تطبيق اللغة في صفحة المتابعة بنجاح');
}

document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }
  
  console.log('تم تحميل صفحة متابعة الشكاوى بنجاح');
  console.log('=== انتهى تحميل صفحة المتابعة ===');
});

