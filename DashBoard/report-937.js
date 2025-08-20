// ===================== report-937.js (Excel-driven totals per department) =====================

// لغة
let currentLang = localStorage.getItem('lang') || 'ar';

// Charts
let complaintCategoriesChart;
let departmentComplaintsChart;

// Data for Main Card
const mainCardData = { totalReports: 804 };

// Complaint Categories (ثابتة إلى أن نوصلها بمصدر بيانات)
const complaintCategoriesData = {
  labels: {
    ar: [
      'مشكلات متعلقة بسحب الدم',
      'مشكلات التواصل مع الطبيب/الممرض',
      'حجز موعد',
      'نقص دواء',
      'إجراءات متعلقة بالتشخيص',
      'تحاليل تخصصية',
      'مشكلات صرف الوصفة الطبية',
      'طلب تغيير/تأجيل موعد',
      'مشكلات باستقبال الحالة',
      'انتقال في المبنى',
      'الرعاية الطبية دون الأوراق',
      'الأوراق المرضية'
    ],
    en: [
      'Issues Related to Blood Draw',
      'Communication Issues with Doctor/Nurse',
      'Appointment Booking',
      'Medication Shortage',
      'Diagnostic Procedures',
      'Specialized Lab Tests',
      'Prescription Dispensing Issues',
      'Appointment Change/Postponement Request',
      'Patient Reception Issues',
      'In-Building Transfer',
      'Medical Care without Documentation',
      'Medical Certificates (Sick Notes)'
    ]
  },
  values: [220, 110, 80, 60, 40, 30, 20, 15, 10, 5, 5, 5]
};

// Departments (المسميات ثابتة كما في صفحتك – لا نغيّرها)
const departmentComplaintsData = {
  labels: {
    ar: [
      'مركز المعلومات', 'قسم المواعيد', 'قسم الطوارئ', 'قسم العيادات',
      'قسم الأشعة', 'قسم المختبر', 'قسم الصيدلية', 'قسم التغذية',
      'قسم العلاج الطبيعي', 'قسم الأسنان'
    ],
    en: [
      'Information Center', 'Appointments Department', 'Emergency Department', 'Clinics Department',
      'Radiology Department', 'Lab Department', 'Pharmacy Department', 'Nutrition Department',
      'Physical Therapy Department', 'Dentistry Department'
    ]
  },
  values: [380, 280, 140, 90, 80, 70, 60, 50, 30, 20]
};

// ===================== Persistence (LocalStorage) =====================
const STORAGE_KEY = 'report937:state:v1';

function saveToLocal() {
  try {
    const payload = {
      departments: departmentComplaintsData.values.map(n => Number(n) || 0),
      totalReports: Number(mainCardData.totalReports) || 0,
      ts: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    console.log('✅ Saved to localStorage.');
    toast(currentLang === 'ar' ? 'تم الحفظ محليًا' : 'Saved locally');
  } catch (e) {
    console.error('❌ Failed to save:', e);
    toast(currentLang === 'ar' ? 'فشل الحفظ المحلي' : 'Local save failed', true);
  }
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);

    if (Array.isArray(data.departments)) {
      const fixedLen = departmentComplaintsData.labels.ar.length;
      const vals = data.departments.slice(0, fixedLen);
      while (vals.length < fixedLen) vals.push(0);
      departmentComplaintsData.values = vals.map(n => Number(n) || 0);
    }
    if (typeof data.totalReports !== 'undefined') {
      mainCardData.totalReports = Number(data.totalReports) || 0;
    }
    console.log('ℹ️ Loaded from localStorage.');
    return true;
  } catch (e) {
    console.warn('⚠️ Could not load saved data:', e);
    return false;
  }
}

// ===================== UI helpers =====================
function getFont() { return currentLang === 'ar' ? 'Tajawal' : 'Merriweather'; }

function updateMainCard() {
  document.getElementById('totalReports').textContent = mainCardData.totalReports;
}
// الخريطة الخاصة بمرادفات الأقسام
const deptAliasMap = {
  'مركز المعلومات': ['مركز المعلومات', 'Information Center', 'info center', 'information centre'],
  'قسم المواعيد': ['قسم المواعيد', 'Appointments Department', 'appointments'],
  'قسم الطوارئ': ['قسم الطوارئ', 'Emergency Department', 'emergency', 'ER'],
  'قسم العيادات': ['قسم العيادات', 'Clinics Department', 'outpatient', 'clinics'],
  'قسم الأشعة': ['قسم الأشعة', 'Radiology Department', 'radiology'],
  'قسم المختبر': ['قسم المختبر', 'Lab Department', 'laboratory', 'lab'],
  'قسم الصيدلية': ['قسم الصيدلية', 'Pharmacy Department', 'pharmacy'],
  'قسم التغذية': ['قسم التغذية', 'Nutrition Department', 'nutrition'],
  'قسم العلاج الطبيعي': ['قسم العلاج الطبيعي', 'Physical Therapy Department', 'physiotherapy', 'PT'],
  'قسم الأسنان': ['قسم الأسنان', 'Dentistry Department', 'dental', 'dentistry']
};

// مرادفات التصنيفات (مفاتيح عربية)
const categoryAliasMap = {
  'مشكلات متعلقة بسحب الدم': [
    'مشكلات متعلقة بسحب الدم', 'سحب الدم', 'مشاكل سحب الدم', 'blood draw', 'phlebotomy issues', 'withdrawal issues'
  ],
  'مشكلات التواصل مع الطبيب/الممرض': [
    'مشكلات التواصل مع الطبيب/الممرض', 'التواصل مع الطبيب', 'سوء التواصل', 'communication issues', 'doctor nurse communication'
  ],
  'حجز موعد': [
    'حجز موعد', 'الحجوزات', 'booking', 'appointment booking', 'appointment'
  ],
  'نقص دواء': [
    'نقص دواء', 'نفاد الدواء', 'انقطاع الدواء', 'medication shortage', 'drug shortage'
  ],
  'إجراءات متعلقة بالتشخيص': [
    'إجراءات متعلقة بالتشخيص', 'إجراءات التشخيص', 'فحوصات', 'diagnostic procedures', 'diagnostics'
  ],
  'تحاليل تخصصية': [
    'تحاليل تخصصية', 'تحاليل خاصة', 'اختبارات تخصصية', 'specialized tests', 'specialized lab tests'
  ],
  'مشكلات صرف الوصفة الطبية': [
    'مشكلات صرف الوصفة الطبية', 'مشاكل صرف الوصفة', 'صرف الوصفات', 'prescription dispensing issues', 'prescription problems'
  ],
  'طلب تغيير/تأجيل موعد': [
    'طلب تغيير/تأجيل موعد', 'تغيير موعد', 'تأجيل موعد', 'تعديل موعد', 'appointment change', 'postponement'
  ],
  'مشكلات باستقبال الحالة': [
    'مشكلات باستقبال الحالة', 'استقبال الحالة', 'استقبال المرضى', 'patient reception issues', 'reception issues'
  ],
  'انتقال في المبنى': [
    'انتقال في المبنى', 'نقل داخل المبنى', 'داخل المبنى', 'in-building transfer', 'internal transfer'
  ],
  'الرعاية الطبية دون الأوراق': [
    'الرعاية الطبية دون الأوراق', 'بدون أوراق', 'الرعاية الطبية بدون مستندات', 'medical care without documentation'
  ],
  'الأوراق المرضية': [
    'الأوراق المرضية', 'التقارير الطبية', 'إجازات مرضية', 'sick notes', 'medical certificates'
  ]
};

function createHorizontalBarChart(ctx, dataLabels, dataValues, chartName) {
  let maxX, stepSizeX;
  if (chartName === 'Complaint Categories by Scope') {
    maxX = 250; stepSizeX = 50;
  } else if (chartName === 'Total Registered Complaints in Departments - Sections') {
    maxX = 400; stepSizeX = 50;
  }

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dataLabels[currentLang],
      datasets: [{
        label: chartName,
        data: dataValues,
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        borderWidth: 1,
        borderRadius: 5
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: currentLang === 'ar',
          bodyFont: { family: getFont() },
          titleFont: { family: getFont() }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: maxX,
          ticks: {
            stepSize: stepSizeX,
            font: { family: getFont(), size: 12, color: '#333' }
          },
          grid: { drawBorder: false, color: 'rgba(0,0,0,0.1)' },
          position: currentLang === 'ar' ? 'top' : 'bottom'
        },
        y: {
          ticks: { font: { family: getFont(), size: 12, color: '#333' } },
          grid: { display: false },
          reverse: currentLang === 'ar'
        }
      },

      // 👇 تمت إضافة مرادفات التصنيفات + التخزين + التوجيه مع تمرير التصنيف
      onClick: function (evt, elements) {
        if (!elements.length) return;
        const index = elements[0].index;

        // ——— الرسمـة اليمين: التصنيفات ———
        if (chartName === 'Complaint Categories by Scope') {
          const canonicalAr = complaintCategoriesData.labels.ar[index];
          const displayName = dataLabels[currentLang][index];
          localStorage.setItem('selectedCategory', displayName);
          localStorage.setItem('report937:selectedCategory', displayName);
          localStorage.setItem('report937:selectedCategoryAliases', JSON.stringify(categoryAliasMap[canonicalAr] || []));
          window.location.href = 'report-937-details.html?category=' + encodeURIComponent(displayName);
          return;
        }

        // ——— الرسمـة اليسار: الأقسام ———
        if (chartName === 'Total Registered Complaints in Departments - Sections') {
          const department = dataLabels[currentLang][index];

          // مرادفات القسم المختار (لو ما لقينا، نحط الاسم نفسه فقط)
          const aliases = deptAliasMap[department] || [department];

          // خزّن الاختيار للصفحة التفصيلية
          localStorage.setItem('selectedDepartment', department); // اختياري للتوافق
          localStorage.setItem('report937:selectedDepartment', department);
          localStorage.setItem('report937:selectedDepartmentAliases', JSON.stringify(aliases));

          // افتح صفحة التفاصيل مع تمرير القسم في الرابط
          window.location.href = 'report-937-details.html?department=' + encodeURIComponent(department);
          return;
        }
      }
    }
  });
}

function updateAllCharts() {
  const font = getFont();

  if (complaintCategoriesChart) {
    complaintCategoriesChart.data.labels = complaintCategoriesData.labels[currentLang];
    complaintCategoriesChart.data.datasets[0].data = complaintCategoriesData.values;
    complaintCategoriesChart.options.plugins.tooltip.rtl = currentLang === 'ar';
    complaintCategoriesChart.options.plugins.tooltip.bodyFont.family = font;
    complaintCategoriesChart.options.plugins.tooltip.titleFont.family = font;
    complaintCategoriesChart.options.scales.x.ticks.font.family = font;
    complaintCategoriesChart.options.scales.y.ticks.font.family = font;
    complaintCategoriesChart.options.scales.x.position = currentLang === 'ar' ? 'top' : 'bottom';
    complaintCategoriesChart.options.scales.y.reverse = currentLang === 'ar';
    complaintCategoriesChart.update();
  }

  if (departmentComplaintsChart) {
    departmentComplaintsChart.data.labels = departmentComplaintsData.labels[currentLang];
    departmentComplaintsChart.data.datasets[0].data = departmentComplaintsData.values;
    departmentComplaintsChart.options.plugins.tooltip.rtl = currentLang === 'ar';
    departmentComplaintsChart.options.plugins.tooltip.bodyFont.family = font;
    departmentComplaintsChart.options.plugins.tooltip.titleFont.family = font;
    departmentComplaintsChart.options.scales.x.ticks.font.family = font;
    departmentComplaintsChart.options.scales.y.ticks.font.family = font;
    departmentComplaintsChart.options.scales.x.position = currentLang === 'ar' ? 'top' : 'bottom';
    departmentComplaintsChart.options.scales.y.reverse = currentLang === 'ar';
    departmentComplaintsChart.update();
  }
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.classList.remove('lang-ar', 'lang-en');
  document.body.classList.add(lang === 'ar' ? 'lang-ar' : 'lang-en');

  document.querySelectorAll('[data-ar], [data-en]').forEach(el => {
    const textContent = el.getAttribute(`data-${lang}`);
    if (textContent) el.textContent = textContent;
  });

  const langTextSpan = document.getElementById('langText');
  if (langTextSpan) langTextSpan.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';

  const dropdowns = ['day', 'week', 'month', 'quarter', 'department'];
  dropdowns.forEach(id => {
    const span = document.getElementById(`selected${id.charAt(0).toUpperCase() + id.slice(1)}`);
    if (span) {
      const selectedValue = span.dataset.value;
      const optionElement = document.querySelector(`#${id}Options .custom-select-option[data-value="${selectedValue}"]`);
      if (optionElement) {
        span.textContent = optionElement.getAttribute(`data-${lang}`);
      } else {
        if (id === 'day') span.textContent = lang === 'ar' ? 'اختر اليوم' : 'Choose Day';
        else if (id === 'week') span.textContent = lang === 'ar' ? 'اختر الأسبوع' : 'Choose Week';
        else if (id === 'month') span.textContent = lang === 'ar' ? 'اختر الشهر' : 'Choose Month';
        else if (id === 'quarter') span.textContent = lang === 'ar' ? 'اختر الربع' : 'Choose Quarter';
        else if (id === 'department') span.textContent = lang === 'ar' ? 'اختر الإدارة/القسم' : 'Choose Department/Section';
      }
    }
  });

  updateAllCharts();
}

// ===================== Excel: إجمالي البلاغات لكل قسم من الملفات =====================

// إشعار بسيط
function toast(msg, isError = false) {
  const old = document.querySelector('.toast-937'); if (old) old.remove();
  const t = document.createElement('div');
  t.className = `toast-937 fixed bottom-6 ${currentLang === 'ar' ? 'right-6' : 'left-6'} z-50 px-4 py-3 rounded-lg shadow-lg text-white`;
  t.style.background = isError ? '#dc2626' : '#16a34a';
  t.style.fontFamily = getFont();
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('opacity-0'), 2500);
  setTimeout(() => t.remove(), 3000);
}

// تطبيع نص عربي/إنجليزي خفيف
const AR_DIACRITICS = /[\u064B-\u0652]/g;
function normalize(s) {
  return String(s || '').replace(AR_DIACRITICS, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

// قاموس مرادفات الأقسام (ربط أسماء الملفات/التقارير بالأقسام المعروضة)
const deptSynonyms = [
  { keys: ['information center', 'info center', 'مركز المعلومات'], canonical: 'مركز المعلومات' },
  { keys: ['appointments', 'appointment', 'قسم المواعيد'], canonical: 'قسم المواعيد' },
  { keys: ['emergency', 'er', 'قسم الطوارئ'], canonical: 'قسم الطوارئ' },
  { keys: ['outpatient', 'clinics', 'قسم العيادات', 'العيادات'], canonical: 'قسم العيادات' },
  { keys: ['radiology', 'قسم الأشعة', 'الاشعة', 'radiology department'], canonical: 'قسم الأشعة' },
  { keys: ['lab', 'laboratory', 'قسم المختبر', 'المختبر'], canonical: 'قسم المختبر' },
  { keys: ['pharmacy', 'قسم الصيدلية', 'الصيدلية'], canonical: 'قسم الصيدلية' },
  { keys: ['nutrition', 'قسم التغذية', 'التغذية'], canonical: 'قسم التغذية' },
  { keys: ['physiotherapy', 'physical therapy', 'العلاج الطبيعي', 'قسم العلاج الطبيعي'], canonical: 'قسم العلاج الطبيعي' },
  { keys: ['dentistry', 'dental', 'الأسنان', 'قسم الأسنان'], canonical: 'قسم الأسنان' },

  // مرادفات لأسماء ملفاتك الشائعة
  { keys: ['hospitals-outpatient', 'outpatient department', 'hospitals outpatient'], canonical: 'قسم العيادات' },
  { keys: ['hospitals-emergency', 'emergency department', 'hospitals emergency'], canonical: 'قسم الطوارئ' },
  { keys: ['hospitals-inpatient', 'inpatient', 'ward', 'wards'], canonical: 'قسم العيادات' },        // تقريبي
  { keys: ['home health care', 'home health', 'home care'], canonical: 'قسم العلاج الطبيعي' },  // تقريبي
  { keys: ['blood bank', 'bloodbank'], canonical: 'قسم المختبر' }          // تقريبي
];

function fixedDeptList() {
  return departmentComplaintsData.labels.ar.slice();
}

function extractDeptFromReportFor(text) {
  if (!text) return '';
  const lower = String(text).toLowerCase();
  const idx = lower.indexOf('report for:');
  if (idx === -1) return '';
  const after = text.substring(idx + 'report for:'.length).trim();
  return after.split('/')[0].trim();
}

// إيجاد قيمة الإجمالي من خلايا الجدول
function findTotalFromAOA(aoa) {
  for (let r = 0; r < aoa.length; r++) {
    for (let c = 0; c < (aoa[r] || []).length; c++) {
      const cell = aoa[r][c];
      if (typeof cell === 'string' && cell.toLowerCase().includes('mean')) {
        const inSame = Number(String(cell).replace(/.*mean[^0-9.-]*([0-9.]+).*/i, '$1'));
        if (!isNaN(inSame) && isFinite(inSame)) return inSame;
        const right = aoa[r]?.[c + 1];
        const down = aoa[r + 1]?.[c];
        const diag = aoa[r + 1]?.[c + 1];
        for (const v of [right, down, diag]) {
          const num = Number(String(v).toString().replace(/[^\d.]/g, ''));
          if (!isNaN(num) && isFinite(num)) return num;
        }
      }
    }
  }
  for (let r = 0; r < Math.min(10, aoa.length); r++) {
    for (let c = 0; c < (aoa[r] || []).length; c++) {
      const num = Number(String(aoa[r][c]).toString().replace(/[^\d.]/g, ''));
      if (!isNaN(num) && isFinite(num)) return num;
    }
  }
  return null;
}

function mapDept(deptRaw) {
  const n = normalize(deptRaw);
  if (!n) return null;
  for (const entry of deptSynonyms) {
    for (const k of entry.keys) {
      if (n.includes(normalize(k))) return entry.canonical;
    }
  }
  return null;
}

// قراءة ملف إكسل واحد -> { deptCanon, totalVal }
function readExcelFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (typeof XLSX === 'undefined') {
          console.error('XLSX missing.');
          toast(currentLang === 'ar' ? 'مكتبة Excel غير محمّلة' : 'XLSX not loaded', true);
          return resolve({ deptCanon: null, totalVal: null, rows });

        }
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }); // ✅ كل الصفوف ككائنات


        let deptRaw = '';
        for (const row of aoa) {
          for (const cell of row) {
            if (typeof cell === 'string' && cell.toLowerCase().includes('report for:')) {
              deptRaw = extractDeptFromReportFor(cell);
              break;
            }
          }
          if (deptRaw) break;
        }
        if (!deptRaw) deptRaw = file.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim();

        const deptCanon = mapDept(deptRaw);
        const totalVal = findTotalFromAOA(aoa);

        if (!deptCanon || totalVal == null) {
          console.warn('تعذّر ربط القسم أو قراءة القيمة:', file.name, { deptRaw, deptCanon, totalVal });
          return resolve({ deptCanon: null, totalVal: null, rows });

        }
        resolve({ deptCanon, totalVal: Number(totalVal), rows });

      } catch (err) {
        console.error('فشل قراءة الملف:', file.name, err);
        resolve(null);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// نحاول اكتشاف اسم عمود القسم داخل الصفوف
function findDeptKeyFromRows(rows) {
  if (!rows || !rows.length) return null;
  const cands = ['القسم', 'الإدارة', 'الادارة', 'القسم/الإدارة', 'department', 'section', 'unit', 'dept'];
  const keys = Object.keys(rows[0] || {});
  for (const k of keys) {
    const nk = normalize(k);
    if (cands.some(c => nk.includes(normalize(c)))) return k;
  }
  return null;
}

// نجمع عدد الصفوف لكل قسم اعتماداً على عمود القسم
function aggregateByDeptFromRows(rows) {
  const out = new Map();
  const deptKey = findDeptKeyFromRows(rows);
  for (const r of rows) {
    let deptName = deptKey ? r[deptKey] : '';
    let canon = mapDept(deptName);
    if (!canon && deptName) { canon = deptName; } // لو ما قدرنا نطابق، خليه كما هو
    if (!canon) continue;
    out.set(canon, (out.get(canon) || 0) + 1);
  }
  return out; // Map(dept -> count)
}

// نحاول اكتشاف اسم عمود التصنيف داخل الصفوف
function findCategoryKeyFromRows(rows) {
  if (!rows || !rows.length) return null;
  const cands = ['تصنيف البلاغ', 'التصنيف', 'تصنيف', 'نوع البلاغ', 'category', 'complaint category', 'complaint type', 'type'];
  const keys = Object.keys(rows[0] || {});
  for (const k of keys) {
    const nk = normalize(k);
    if (cands.some(c => nk.includes(normalize(c)))) return k;
  }
  return null;
}

// مطابقة التصنيف إلى الاسم القانوني (Arabic key)
function mapCategory(catRaw) {
  const n = normalize(catRaw);
  if (!n) return null;
  for (const [canonicalAr, aliases] of Object.entries(categoryAliasMap)) {
    for (const a of aliases) {
      if (n.includes(normalize(a))) return canonicalAr;
    }
  }
  for (const ar of complaintCategoriesData.labels.ar) {
    if (n.includes(normalize(ar))) return ar;
  }
  for (const en of complaintCategoriesData.labels.en) {
    if (n.includes(normalize(en))) {
      const idx = complaintCategoriesData.labels.en.indexOf(en);
      return complaintCategoriesData.labels.ar[idx];
    }
  }
  return null;
}

function findCategoryInRow(row) {
  for (const v of Object.values(row)) {
    const m = mapCategory(v);
    if (m) return m;
  }
  return null;
}

// استيراد عدة ملفات وتجميع "قيمة الإجمالي" لكل قسم
async function importExcelFiles(files) {
  const agg = new Map(); // dept -> sum(totalVal)
  let totalSum = 0;
  const allRows = [];    // ✅ نخزن كل الصفوف لصفحة التفاصيل
  const catAgg = new Map(); // category(ar) -> count

  for (const f of files) {
    const rec = await readExcelFile(f);
    if (!rec) continue;

    // خزن الصفوف
    if (Array.isArray(rec.rows)) allRows.push(...rec.rows);

    if (rec.deptCanon && Number.isFinite(rec.totalVal)) {
      // السلوك القديم (لو لقينا report for/mean)
      agg.set(rec.deptCanon, (agg.get(rec.deptCanon) || 0) + rec.totalVal);
      totalSum += rec.totalVal;
    } else if (rec.rows && rec.rows.length) {
      // ✅ fallback: احسب من الصفوف لكل قسم
      const m = aggregateByDeptFromRows(rec.rows);
      if (m.size) {
        for (const [dept, cnt] of m.entries()) {
          agg.set(dept, (agg.get(dept) || 0) + cnt);
          totalSum += cnt;
        }
      } else if (rec.deptCanon) {
        // ما قدرنا نكتشف عمود القسم، انسب كامل الملف للقسم المستخرج من الاسم
        const cnt = rec.rows.length;
        agg.set(rec.deptCanon, (agg.get(rec.deptCanon) || 0) + cnt);
        totalSum += cnt;
      }
    }

    // تجميع حسب التصنيف من صفوف هذا الملف
    if (rec.rows && rec.rows.length) {
      const catKey = findCategoryKeyFromRows(rec.rows);
      for (const r of rec.rows) {
        const raw = catKey ? r[catKey] : null;
        let canon = mapCategory(raw);
        if (!canon && !catKey) {
          canon = findCategoryInRow(r);
        }
        if (canon) catAgg.set(canon, (catAgg.get(canon) || 0) + 1);
      }
    }
  }

  // تعبئة القيم وفق ترتيب الأقسام الثابت
  const fixed = fixedDeptList();
  departmentComplaintsData.values = fixed.map(name => {
    const v = agg.get(name) || 0;
    return Number.isFinite(v) ? Number(v) : 0;
  });

  // إجمالي البلاغات (مجموع كل الأقسام)
  mainCardData.totalReports = Number(totalSum || 0);

  // تعبئة قيم التصنيفات وفق الترتيب الثابت (بالعربية)
  const catOrder = complaintCategoriesData.labels.ar;
  complaintCategoriesData.values = catOrder.map(name => Number(catAgg.get(name) || 0));

  // ✅ حفظ الصفوف لصفحة التفاصيل
  try { localStorage.setItem('report937:rows:v1', JSON.stringify(allRows)); } catch { }

  updateMainCard();
  updateAllCharts();
  saveToLocal();
  toast(currentLang === 'ar' ? 'تم استيراد الملفات وتحديث البيانات' : 'Files imported and data updated');
}

// === تصدير إلى PDF مباشر (تحميل المكتبة تلقائياً عند الحاجة) ===
async function ensureHtml2Pdf() {
  if (window.html2pdf) return true;
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

async function exportAsPDF() {
  const exportRoot = document.getElementById('exportArea') || document.body;

  // انتظري تحميل مكتبة html2pdf
  const ok = await ensureHtml2Pdf();
  if (!ok) { toast('تعذّر تحميل مكتبة PDF — سنستخدم الطباعة.', true); window.print(); return; }

  // انتظري الخطوط والصور (عشان ما يطلع التصدير منظره مكسور)
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch { } }
  await new Promise(r => setTimeout(r, 100)); // مهلة صغيرة للرسم

  // اسم الملف
  const d = new Date(); const pad = n => String(n).padStart(2, '0');
  const fileName = `report-937_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}.pdf`;

  // عرض النافذة الفعلي (يمنع القص يمين/يسار)
  const fullWidth = Math.max(exportRoot.scrollWidth, exportRoot.offsetWidth, exportRoot.clientWidth, 1400);

  const opt = {
    margin: [10, 10, 10, 10],           // mm
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 3,                // حِدّة أعلى للرسوم
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: fullWidth   // يلتقط العرض كامل بدون قص
    },
    // لو كانت الرسوم طويلة، المناظر الأفقية A4 قد تقطع؛ نستخدم Legal أوسع قليلًا
    jsPDF: { unit: 'mm', format: 'legal', orientation: 'landscape' },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: '.no-break'
    }
  };

  try {
    // أخفِ عناصر التحكم أثناء الالتقاط
    exportRoot.classList.add('exporting');
    // انتظر إعادة التدفق لتطبيق الأنماط قبل الالتقاط
    await new Promise(r => setTimeout(r, 50));
    await html2pdf().set(opt).from(exportRoot).save();
    toast('تم تنزيل التقرير PDF');
  } catch (e) {
    console.error(e);
    toast('فشل إنشاء PDF — سنستخدم الطباعة.', true);
    window.print();
  } finally {
    exportRoot.classList.remove('exporting');
  }
}



// ===================== DOM Ready =====================
document.addEventListener('DOMContentLoaded', () => {
  const langToggleBtn = document.getElementById('langToggle');
  const exportReportBtn = document.getElementById('exportReportBtn');

  // حمّل إن وُجد حفظ سابق
  loadFromLocal();

  // Init card + charts
  updateMainCard();

  const complaintCategoriesCtx = document.getElementById('complaintCategoriesChart');
  if (complaintCategoriesCtx) {
    complaintCategoriesChart = createHorizontalBarChart(
      complaintCategoriesCtx,
      complaintCategoriesData.labels,
      complaintCategoriesData.values,
      'Complaint Categories by Scope'
    );
  }

  const departmentComplaintsCtx = document.getElementById('departmentComplaintsChart');
  if (departmentComplaintsCtx) {
    departmentComplaintsChart = createHorizontalBarChart(
  departmentComplaintsCtx,
  departmentComplaintsData.labels,
  departmentComplaintsData.values,
  'Total Registered Complaints in Departments - Sections'
);



  }

  applyLanguage(currentLang);

  // تفعيل الروابط الجانبية (اختياري)
  document.querySelectorAll('.sidebar-menu .menu-link').forEach(link => {
    link.parentElement.classList.remove('active');
    if (link.getAttribute('href') === 'report-937.html') link.parentElement.classList.add('active');
  });

  // قوائم منسدلة (شكل فقط)
  function setupDropdown(selectId, optionsId) {
    const select = document.getElementById(selectId);
    const options = document.getElementById(optionsId);
    if (select && options) {
      select.addEventListener('click', () => {
        options.classList.toggle('open');
        const icon = select.querySelector('.fas');
        icon.classList.toggle('fa-chevron-up');
        icon.classList.toggle('fa-chevron-down');
      });

      options.addEventListener('click', (event) => {
        if (event.target.classList.contains('custom-select-option')) {
          const selectedValue = event.target.dataset.value;
          const selectedText = event.target.textContent;
          select.querySelector('span').textContent = selectedText;
          select.querySelector('span').dataset.value = selectedValue;
          options.classList.remove('open');
          const icon = select.querySelector('.fas');
          icon.classList.remove('fa-chevron-up');
          icon.classList.add('fa-chevron-down');
        }
      });
    }
  }
  ['day', 'week', 'month', 'quarter', 'department'].forEach(k => setupDropdown(`${k}Select`, `${k}Options`));

  // لغة
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => applyLanguage(currentLang === 'ar' ? 'en' : 'ar'));
  }

  // تصدير
  if (exportReportBtn) exportReportBtn.addEventListener('click', exportAsPDF);

  // استيراد ملفات
  const importExcelBtn = document.getElementById('importExcelBtn');
  const excelInput = document.getElementById('excelInput');
  if (importExcelBtn && excelInput) {
    importExcelBtn.addEventListener('click', () => excelInput.click());
    excelInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      await importExcelFiles(files);
      e.target.value = '';
    });
  }

  // زر حفظ محلي
  const saveLocalBtn = document.getElementById('saveLocalBtn');
  if (saveLocalBtn) saveLocalBtn.addEventListener('click', saveToLocal);
});
