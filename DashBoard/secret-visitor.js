
let currentLang = localStorage.getItem('lang') || 'ar';
let horizontalBarChart;
let donutChart;

// ====== PERSISTENCE (LocalStorage) ======
const STORAGE_KEY = 'secret-visitor:data:v1';
let uploadedExcelData = []; // لتخزين البيانات المرفوعة من Excel



// ====== SAVE/LOAD FUNCTIONS ======
function saveToLocal() {
    try {
        const payload = {
            excelData: uploadedExcelData,
            cardData: cardData,
            horizontalChartRawData: horizontalChartRawData,
            donutChartRawData: donutChartRawData,
            lang: currentLang,
            reportDate: reportDate, // إضافة تاريخ التقرير
            ts: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

        // إحصائيات سريعة للتحقق من البيانات المحفوظة
        if (uploadedExcelData && uploadedExcelData.length > 0) {
            const executedCount = uploadedExcelData.filter(row => row.status === 'منفذ').length;
            const notExecutedCount = uploadedExcelData.filter(row => row.status === 'غير منفذ').length;
            console.log(`✅ Saved to localStorage: منفذ (${executedCount}), غير منفذ (${notExecutedCount}), Total (${uploadedExcelData.length})`);
        } else {
            console.log('✅ Saved to localStorage (no Excel data)');
        }
    } catch (err) {
        console.error('❌ Failed to save:', err);
    }
}

function loadFromLocal() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);

        if (data.excelData) {
            uploadedExcelData = data.excelData;

            // إحصائيات سريعة للتحقق من البيانات المحملة
            if (uploadedExcelData && uploadedExcelData.length > 0) {
                const executedCount = uploadedExcelData.filter(row => row.status === 'منفذ').length;
                const notExecutedCount = uploadedExcelData.filter(row => row.status === 'غير منفذ').length;
                console.log(`ℹ️ Loaded Excel data: منفذ (${executedCount}), غير منفذ (${notExecutedCount}), Total (${uploadedExcelData.length})`);
            }
        }
        if (data.cardData) {
            Object.assign(cardData, data.cardData);
        }
        if (data.horizontalChartRawData) {
            Object.assign(horizontalChartRawData, data.horizontalChartRawData);
        }
        if (data.donutChartRawData) {
            Object.assign(donutChartRawData, data.donutChartRawData);
        }
        if (data.lang) {
            currentLang = data.lang;
            localStorage.setItem('lang', currentLang);
        }
        if (data.reportDate) {
            reportDate = data.reportDate;
        }
        console.log('ℹ️ Loaded from localStorage.');
        return true;
    } catch (err) {
        console.warn('⚠️ Could not load saved data:', err);
        return false;
    }
}

// متغير لتخزين تاريخ التقرير
let reportDate = ''; // سيتم ملؤه من ملف الإكسل

// دالة استخراج التاريخ من أول سطر في ملف الإكسل
function extractDateFromFirstRow(rawData) {
    if (!rawData || rawData.length === 0) {
        return ''; // لا توجد قيمة افتراضية
    }

    const firstRow = rawData[0];
    if (!firstRow || !Array.isArray(firstRow)) {
        return '';
    }

    // البحث عن التاريخ في أول سطر
    for (let i = 0; i < firstRow.length; i++) {
        const cell = String(firstRow[i] || '').trim();
        
        // البحث عن أنماط التاريخ العربية
        const arabicDatePatterns = [
            /لسنة\s*(\d{4})\s*شهر\s*(\w+)/i,
            /سنة\s*(\d{4})\s*شهر\s*(\w+)/i,
            /(\d{4})\s*شهر\s*(\w+)/i,
            /شهر\s*(\w+)\s*سنة\s*(\d{4})/i,
            /شهر\s*(\w+)\s*(\d{4})/i
        ];

        // البحث عن أنماط التاريخ الإنجليزية
        const englishDatePatterns = [
            /for\s*(\w+)\s*(\d{4})/i,
            /(\w+)\s*(\d{4})/i,
            /year\s*(\d{4})\s*month\s*(\w+)/i,
            /month\s*(\w+)\s*year\s*(\d{4})/i
        ];

        // فحص الأنماط العربية
        for (const pattern of arabicDatePatterns) {
            const match = cell.match(pattern);
            if (match) {
                const year = match[1] || match[2];
                const month = match[2] || match[1];
                console.log(`Found Arabic date pattern: year=${year}, month=${month}`);
                return `لسنة ${year} شهر ${month}`;
            }
        }

        // فحص الأنماط الإنجليزية
        for (const pattern of englishDatePatterns) {
            const match = cell.match(pattern);
            if (match) {
                const year = match[1] || match[2];
                const month = match[2] || match[1];
                
                // تحويل أسماء الأشهر الإنجليزية إلى العربية
                const monthMap = {
                    'january': 'يناير', 'jan': 'يناير',
                    'february': 'فبراير', 'feb': 'فبراير',
                    'march': 'مارس', 'mar': 'مارس',
                    'april': 'أبريل', 'apr': 'أبريل',
                    'may': 'مايو',
                    'june': 'يونيو', 'jun': 'يونيو',
                    'july': 'يوليو', 'jul': 'يوليو',
                    'august': 'أغسطس', 'aug': 'أغسطس',
                    'september': 'سبتمبر', 'sep': 'سبتمبر',
                    'october': 'أكتوبر', 'oct': 'أكتوبر',
                    'november': 'نوفمبر', 'nov': 'نوفمبر',
                    'december': 'ديسمبر', 'dec': 'ديسمبر'
                };
                
                const arabicMonth = monthMap[month.toLowerCase()] || month;
                console.log(`Found English date pattern: year=${year}, month=${month} -> ${arabicMonth}`);
                return `لسنة ${year} شهر ${arabicMonth}`;
            }
        }

        // البحث عن أي نص يحتوي على سنة وأشهر
        if (cell.includes('2024') || cell.includes('2023') || cell.includes('2025')) {
            const yearMatch = cell.match(/(\d{4})/);
            const monthMatch = cell.match(/(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)/);
            
            if (yearMatch && monthMatch) {
                console.log(`Found date in cell: year=${yearMatch[1]}, month=${monthMatch[1]}`);
                return `لسنة ${yearMatch[1]} شهر ${monthMatch[1]}`;
            }
        }
    }

    console.log('No date pattern found in first row');
    return ''; // لا توجد قيمة افتراضية
}

// Data based on the provided audit table
let cardData = {
    totalObservationLocations: 5, // مركز الاسنان، الطوارئ، الممرات، العيادات الخارجية، التنويم
    totalResponsibleDepartments: 13, // عدد الإدارات المسؤولة المختلفة
    totalSecretVisitorNotes: 52 // إجمالي عدد الملاحظات في الجدول
};

// Data for Horizontal Bar Chart based on the audit table
let horizontalChartRawData = {
    'مركز الاسنان': { executed: 12, notExecuted: 3 },
    'الطوارئ': { executed: 8, notExecuted: 10 },
    'الممرات': { executed: 1, notExecuted: 0 },
    'العيادات الخارجية': { executed: 3, notExecuted: 8 },
    'التنويم': { executed: 1, notExecuted: 1 }
};

// إضافة بيانات تجريبية لاختبار عرض البيانات غير المنفذة
console.log('Initial chart data:', horizontalChartRawData);

const horizontalChartLabelsByLang = {
    ar: Object.keys(horizontalChartRawData),
    en: ['Dental Center', 'Emergency', 'Corridors', 'Outpatient Clinics', 'Inpatient']
};

// Data for Donut Chart based on the audit table observation locations
let donutChartRawData = {
    'مركز الاسنان': 15,
    'الطوارئ': 18,
    'الممرات': 1,
    'العيادات الخارجية': 11,
    'التنويم': 2
};

const donutChartLabelsByLang = {
    ar: Object.keys(donutChartRawData),
    en: ['Dental Center', 'Emergency', 'Corridors', 'Outpatient Clinics', 'Inpatient']
};

const filterLabels = {
    executed: { ar: 'منفذ', en: 'Executed' },
    notExecuted: { ar: 'غير منفذ', en: 'Not Executed' }
};

function getFont() {
    return currentLang === 'ar' ? 'Tajawal' : 'serif';
}

// ====== UPDATE FUNCTIONS ======
function updateCardData() {
    document.getElementById('totalObservationLocations').textContent = cardData.totalObservationLocations;
    document.getElementById('totalResponsibleDepartments').textContent = cardData.totalResponsibleDepartments;
    document.getElementById('totalSecretVisitorNotes').textContent = cardData.totalSecretVisitorNotes;
}

function updateHorizontalBarChart() {
    if (!horizontalBarChart) return;

    // استخدام البيانات الفعلية من Excel بدلاً من البيانات الثابتة
    const labels = Object.keys(horizontalChartRawData);
    const executedData = labels.map(label => horizontalChartRawData[label]?.executed || 0);
    const notExecutedData = labels.map(label => horizontalChartRawData[label]?.notExecuted || 0);

    // التحقق من وجود بيانات غير منفذة
    const hasNotExecuted = notExecutedData.some(value => value > 0);
    const totalExecuted = executedData.reduce((sum, val) => sum + val, 0);
    const totalNotExecuted = notExecutedData.reduce((sum, val) => sum + val, 0);

    console.log('Chart data check:', {
        labels,
        executedData,
        notExecutedData,
        hasNotExecuted,
        totalExecuted,
        totalNotExecuted,
        rawData: horizontalChartRawData
    });

    // التحقق من أن البيانات تحتوي على قيم صحيحة
    if (totalExecuted === 0 && totalNotExecuted === 0) {
        console.warn('⚠️ No data found for chart - both executed and not executed are 0');
    }

    if (!hasNotExecuted) {
        console.warn('⚠️ No "not executed" data found in chart');
    } else {
        console.log(`✅ Chart contains ${totalNotExecuted} "not executed" records`);
    }

    horizontalBarChart.data.labels = labels;
    horizontalBarChart.data.datasets = [
        {
            label: filterLabels.executed[currentLang],
            data: executedData,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
            borderRadius: 5,
            categoryPercentage: 0.8,
            barPercentage: 0.9
        },
        {
            label: filterLabels.notExecuted[currentLang],
            data: notExecutedData,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1,
            borderRadius: 5,
            categoryPercentage: 0.8,
            barPercentage: 0.9
        }
    ];

    // تحديث الحد الأقصى للمحور X بناءً على البيانات
    const maxValue = Math.max(...executedData, ...notExecutedData);
    horizontalBarChart.options.scales.x.max = Math.max(maxValue + 1, 10);

    horizontalBarChart.update();

    console.log('Horizontal chart updated with:', {
        labels,
        executedData,
        notExecutedData,
        maxValue,
        datasets: horizontalBarChart.data.datasets.map(ds => ({
            label: ds.label,
            data: ds.data,
            backgroundColor: ds.backgroundColor
        }))
    });
}

function updateDonutChart() {
    if (!donutChart) return;

    // استخدام البيانات الفعلية من Excel بدلاً من البيانات الثابتة
    const labels = Object.keys(donutChartRawData);
    const data = Object.values(donutChartRawData);

    donutChart.data.labels = labels;
    donutChart.data.datasets = [{
        data: data,
        backgroundColor: [
            'rgba(37, 99, 235, 0.8)',   // blue - مركز الاسنان
            'rgba(239, 68, 68, 0.8)',   // red - الطوارئ
            'rgba(107, 114, 128, 0.8)', // gray - الممرات
            'rgba(34, 197, 94, 0.8)',   // green - العيادات الخارجية
            'rgba(139, 92, 246, 0.8)',  // purple - التنويم
            'rgba(245, 158, 11, 0.8)',  // yellow
            'rgba(6, 182, 212, 0.8)',   // cyan
            'rgba(251, 113, 133, 0.8)'  // rose
        ],
        borderColor: [
            'rgba(37, 99, 235, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(107, 114, 128, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(6, 182, 212, 1)',
            'rgba(251, 113, 133, 1)'
        ],
        borderWidth: 2
    }];

    donutChart.update();

    // Update the legend with values
    updateDonutChartLegend(labels, data);

    console.log('Donut chart updated with:', {
        labels,
        data,
        dataset: {
            data: donutChart.data.datasets[0].data,
            backgroundColor: donutChart.data.datasets[0].backgroundColor
        }
    });
}

// Function to update the legend with values
function updateDonutChartLegend(labels, data) {
    // Map of department keys to legend element IDs
    const legendMap = {
        'مركز الاسنان': 'dental-center-legend',
        'الطوارئ': 'emergency-legend',
        'الممرات': 'corridors-legend',
        'العيادات الخارجية': 'outpatient-legend',
        'التنويم': 'inpatient-legend'
    };

    labels.forEach((label, index) => {
        const value = data[index] || 0;
        const legendElementId = legendMap[label];
        
        if (legendElementId) {
            const legendElement = document.getElementById(legendElementId);
            if (legendElement) {
                // Get the original text from data attributes
                const originalAr = legendElement.getAttribute('data-ar');
                const originalEn = legendElement.getAttribute('data-en');
                
                // Update the text with the value
                if (currentLang === 'ar') {
                    legendElement.textContent = `${originalAr}: ${value}`;
                } else {
                    legendElement.textContent = `${originalEn}: ${value}`;
                }
            }
        }
    });
}

// دالة تصفية البيانات حسب الإدارة المختارة
function filterDataByDepartment(selectedDepartment) {
    if (!uploadedExcelData || uploadedExcelData.length === 0) {
        console.log('لا توجد بيانات Excel لتصفيتها');
        return;
    }

    let filteredData;
    const tableContainer = document.getElementById('excelDataTableContainer');

    if (selectedDepartment === 'all') {
        // إخفاء الجدول عند اختيار "الكل"
        tableContainer.classList.add('hidden');
        console.log('إخفاء الجدول - تم اختيار "الكل"');

        // تحديث الرسوم البيانية بجميع البيانات
        updateChartsFromFilteredData(uploadedExcelData);
        return;
    } else {
        // تصفية البيانات حسب الإدارة المختارة
        filteredData = uploadedExcelData.filter(row => {
            const respDept = row.responsibleDepartment.toLowerCase();
            const loc = (row.observationLocation || row.location || '').toLowerCase();
            const selected = selectedDepartment.toLowerCase();

            // مطابقة الإدارة المختارة مع البيانات
            if (selected === 'dental-center') return respDept.includes('مركز الاسنان') || respDept.includes('اسنان') || respDept.includes('dental') || loc.includes('مركز الاسنان') || loc.includes('اسنان');
            if (selected === 'outpatient') return respDept.includes('عيادات خارجية') || respDept.includes('خارجية') || respDept.includes('outpatient') || loc.includes('عيادات خارجية') || loc.includes('خارجية');
            if (selected === 'emergency') return respDept.includes('طوارئ') || respDept.includes('emergency') || loc.includes('طوارئ');
            if (selected === 'inpatient') return respDept.includes('تنويم') || respDept.includes('inpatient') || loc.includes('تنويم');
            if (selected === 'corridors') return respDept.includes('ممرات') || respDept.includes('corridors') || loc.includes('ممرات');

            return false;
        });

        console.log(`تم تصفية البيانات للإدارة: ${selectedDepartment}`, filteredData);
    }

    // تحديث الجدول بالبيانات المصفاة
    updateExcelDataTable(filteredData);

    // تحديث الرسوم البيانية بالبيانات المصفاة
    updateChartsFromFilteredData(filteredData);
}

// دالة تحديث الرسوم البيانية بالبيانات المصفاة
function updateChartsFromFilteredData(filteredData) {
    if (!filteredData || filteredData.length === 0) {
        // إظهار رسالة "لا توجد بيانات" في الرسوم البيانية
        updateChartsWithNoData();
        return;
    }

    console.log('Processing filtered data for charts:', filteredData);

    // إحصائيات سريعة للتحقق من البيانات المصفاة
    const executedCount = filteredData.filter(row => row.status === 'منفذ').length;
    const notExecutedCount = filteredData.filter(row => row.status === 'غير منفذ').length;
    console.log(`Filtered data summary: منفذ (${executedCount}), غير منفذ (${notExecutedCount}), Total (${filteredData.length})`);

    // تجميع البيانات المصفاة حسب القسم والحالة
    const departmentStats = {};
    const locationStats = {};

    filteredData.forEach((row, index) => {
        const loc = row.observationLocation || row.location;
        const respDept = row.responsibleDepartment;
        const isExecuted = row.status === 'منفذ';

        console.log(`Filtered Row ${index + 1}: ObservationLocation="${loc}", ResponsibleDept="${respDept}", Status="${row.status}", IsExecuted=${isExecuted}`);

        // إحصائيات الإدارة المسؤولة
        if (!departmentStats[respDept]) {
            departmentStats[respDept] = { executed: 0, notExecuted: 0 };
        }
        if (isExecuted) {
            departmentStats[respDept].executed++;
        } else {
            departmentStats[respDept].notExecuted++;
        }

        // إحصائيات الموقع
        if (!locationStats[loc]) {
            locationStats[loc] = 0;
        }
        locationStats[loc]++;
    });

    // تحديث البيانات للرسوم البيانية
    horizontalChartRawData = { ...departmentStats };
    donutChartRawData = { ...locationStats };

    // التحقق من أن البيانات تحتوي على حالات غير منفذة
    const hasNotExecuted = Object.values(departmentStats).some(dept => dept.notExecuted > 0);
    console.log('Filtered data check - Has not executed cases:', hasNotExecuted);
    console.log('Filtered department stats:', departmentStats);

    // تحديث البطاقات العلوية
    cardData.totalResponsibleDepartments = Object.keys(departmentStats).length;
    cardData.totalObservationLocations = Object.keys(locationStats).length;
    cardData.totalSecretVisitorNotes = filteredData.length;

    // تحديث الرسوم البيانية
    updateCardData();
    updateHorizontalBarChart();
    updateDonutChart();

    console.log('Updated filtered charts with data:', {
        departmentStats,
        locationStats,
        horizontalChartRawData,
        donutChartRawData
    });
}

// دالة إظهار رسالة "لا توجد بيانات" في الرسوم البيانية
function updateChartsWithNoData() {
    // إعادة تعيين البيانات
    horizontalChartRawData = {};
    donutChartRawData = {};

    // تحديث البطاقات
    cardData.totalResponsibleDepartments = 0;
    cardData.totalObservationLocations = 0;
    cardData.totalSecretVisitorNotes = 0;

    // تحديث الرسوم البيانية
    updateCardData();
    updateHorizontalBarChart();
    updateDonutChart();

    console.log('Charts updated with no data message');
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
        if (textContent) {
            el.textContent = textContent;
        }
    });

    // Update dropdown selected text
    const selectedDepartmentSpan = document.getElementById('selectedDepartment');
    const selectedValue = selectedDepartmentSpan.dataset.value || 'all';
    const allOption = document.querySelector(`.custom-select-option[data-value="${selectedValue}"]`);
    if (allOption) {
        selectedDepartmentSpan.textContent = allOption.getAttribute(`data-${lang}`);
    }

    updateHorizontalBarChart();
    updateDonutChart();
    
    // Update legend text when language changes
    if (donutChart && donutChart.data && donutChart.data.labels && donutChart.data.datasets[0]) {
        updateDonutChartLegend(donutChart.data.labels, donutChart.data.datasets[0].data);
    }

    // Update table headers when language changes
    const tableHeaders = [
        { id: 'mainDeptHeader', baseClass: 'px-6 py-3 border-b border-gray-200 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider' },
        { id: 'mainNoteHeader', baseClass: 'px-6 py-3 border-b border-gray-200 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider' },
        { id: 'mainRespDeptHeader', baseClass: 'px-6 py-3 border-b border-gray-200 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider' },
        { id: 'mainStatusHeader', baseClass: 'px-6 py-3 border-b border-gray-200 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider' },
        { id: 'mainActionsHeader', baseClass: 'px-6 py-3 border-b border-gray-200 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider' }
    ];

    tableHeaders.forEach(header => {
        const element = document.getElementById(header.id);
        if (element) {
            element.textContent = lang === 'ar' ? element.getAttribute('data-ar') : element.getAttribute('data-en');
            element.className = header.baseClass + (lang === 'ar' ? ' text-right' : ' text-left');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Secret Visitor Dashboard loaded with all fixes applied!');
    console.log('✅ Excel data processing improved');
    console.log('✅ Chart data filtering fixed');
    console.log('✅ Both executed and not executed data will be displayed');

    const horizontalCtx = document.getElementById('horizontalBarChart');
    const donutCtx = document.getElementById('donutChart');
    const langToggleBtn = document.getElementById('langToggle');
    const aiInsightsBtn = document.getElementById('aiInsightsBtn');
    const aiInsightsModal = document.getElementById('aiInsightsModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const exportReportBtn = document.getElementById('exportReportBtn');
    const aiInsightsContent = document.getElementById('aiInsightsContent');
    const aiLoadingSpinner = document.getElementById('aiLoadingSpinner');
    const departmentSelect = document.getElementById('departmentSelect');
    const departmentOptions = document.getElementById('departmentOptions');
    
    // Debug: Check if dropdown elements are found
    console.log('Dropdown elements found:', {
        departmentSelect: !!departmentSelect,
        departmentOptions: !!departmentOptions
    });

    // تحميل البيانات المحفوظة
    const hasLoadedData = loadFromLocal();
    if (hasLoadedData && uploadedExcelData.length > 0) {
        console.log('Loaded saved data:', uploadedExcelData);

        // إحصائيات سريعة للتحقق من البيانات المحملة
        const executedCount = uploadedExcelData.filter(row => row.status === 'منفذ').length;
        const notExecutedCount = uploadedExcelData.filter(row => row.status === 'غير منفذ').length;
        console.log(`Loaded data summary: منفذ (${executedCount}), غير منفذ (${notExecutedCount}), Total (${uploadedExcelData.length})`);

        updateExcelDataTable(uploadedExcelData);
        updateChartsFromExcelData(uploadedExcelData);
    }

    // Initialize Cards
    updateCardData();

    // Initialize Horizontal Bar Chart
    horizontalBarChart = new Chart(horizontalCtx, {
        type: 'bar',
        data: {
            labels: horizontalChartLabelsByLang[currentLang],
            datasets: []
        },
        options: {
            indexAxis: 'y', // Make it a horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Use custom HTML legend
                },
                tooltip: {
                    rtl: currentLang === 'ar',
                    bodyFont: { family: getFont() },
                    titleFont: { family: getFont() }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'end', // Align labels at the end of the bar
                    color: '#4a5568',
                    font: {
                        weight: 'bold',
                        size: 12,
                        family: getFont()
                    },
                    formatter: value => (value > 0 ? value : '')
                }
            },
            scales: {
                x: { // This is the value axis for horizontal bar chart
                    beginAtZero: true,
                    max: 10, // Max value based on dummy data
                    ticks: {
                        stepSize: 1,
                        font: { family: getFont() }
                    },
                    grid: {
                        drawBorder: false,
                        color: 'rgba(0, 0, 0, 0.1)', // Visible grid lines
                    },
                    position: currentLang === 'ar' ? 'top' : 'bottom' // Position X-axis based on RTL/LTR
                },
                y: { // This is the category axis for horizontal bar chart
                    ticks: {
                        font: { family: getFont() }
                    },
                    grid: { display: false }, // No vertical grid lines
                    reverse: currentLang === 'ar' // Reverse for RTL to keep categories in order
                }
            }
        },
        plugins: []
    });

    // Initialize Donut Chart
    donutChart = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
            labels: donutChartLabelsByLang[currentLang],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Use custom HTML legend
                },
                tooltip: {
                    rtl: currentLang === 'ar',
                    bodyFont: { family: getFont() },
                    titleFont: { family: getFont() }
                },
                datalabels: {
                    color: '#fff', // White color for labels on segments
                    font: {
                        weight: 'bold',
                        size: 12,
                        family: getFont()
                    },
                    formatter: (value, ctx) => {
                        // Show the actual value instead of percentage
                        return value > 0 ? value : ''; // Only show if > 0
                    }
                }
            }
        },
        plugins: []
    });

    // Initial language setting and chart updates
    applyLanguage(currentLang);

    // Language toggle functionality
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            applyLanguage(newLang);
        });
    }

    // Dropdown functionality
    if (departmentSelect) {
        console.log('Adding click listener to departmentSelect');
        departmentSelect.addEventListener('click', () => {
            console.log('Department select clicked');
            departmentOptions.classList.toggle('open');
            const icon = departmentSelect.querySelector('.fas');
            if (departmentOptions.classList.contains('open')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        });
    } else {
        console.error('departmentSelect element not found!');
    }
    // الانتقال إلى صفحة التفاصيل عند اختيار قسم محدد
    if (departmentOptions) {
        departmentOptions.addEventListener('click', (event) => {
            const optionEl = event.target.closest('.custom-select-option');
            if (!optionEl) return;

            const selectedValue = optionEl.dataset.value || 'all';
            const selectedText  = optionEl.getAttribute(`data-${currentLang}`) || optionEl.textContent.trim();

            const sel = document.getElementById('selectedDepartment');
            if (sel) {
                sel.textContent = selectedText;
                sel.dataset.value = selectedValue;
            }

            departmentOptions.classList.remove('open');
            const icon = departmentSelect.querySelector('.fas');
            if (icon) { icon.classList.remove('fa-chevron-up'); icon.classList.add('fa-chevron-down'); }

            if (selectedValue === 'all') { filterDataByDepartment('all'); return; }

            if (!uploadedExcelData || uploadedExcelData.length === 0) {
                alert(currentLang === 'ar' ? 'فضلاً استورد ملف Excel أولاً قبل عرض التفاصيل.' : 'Please import the Excel file first before viewing details.');
                return;
            }

            try {
                localStorage.setItem('secretVisitor:rows:v1', JSON.stringify(uploadedExcelData));
                localStorage.setItem('secretVisitor:selectedDepartment', selectedText);
            } catch {}

            window.location.href = `secret-visitor-details.html?department=${encodeURIComponent(selectedText)}`;
        });
    }

    // Close dropdown if clicked outside
    document.addEventListener('click', (event) => {
        if (departmentSelect && !departmentSelect.contains(event.target) && departmentOptions && !departmentOptions.contains(event.target)) {
            departmentOptions.classList.remove('open');
            departmentSelect.querySelector('.fas').classList.remove('fa-chevron-up');
            departmentSelect.querySelector('.fas').classList.add('fa-chevron-down');
        }
    });

    // Function to collect chart data for AI insights (from horizontal bar chart)
    function getChartDataForAI() {
        const data = [];
        const labels = horizontalBarChart.data.labels;
        const executedData = horizontalBarChart.data.datasets.find(ds => ds.label === filterLabels.executed[currentLang])?.data || [];
        const notExecutedData = horizontalBarChart.data.datasets.find(ds => ds.label === filterLabels.notExecuted[currentLang])?.data || [];

        labels.forEach((label, index) => {
            data.push({
                nameAr: horizontalChartLabelsByLang.ar[index],
                nameEn: horizontalChartLabelsByLang.en[index],
                uncompleted: notExecutedData[index] !== undefined ? notExecutedData[index] : 0,
                completed: executedData[index] !== undefined ? executedData[index] : 0
            });
        });
        return data;
    }

    // Function to call Gemini API and generate insights
    async function generateInsights(data) {
        aiInsightsContent.innerHTML = ''; // Clear previous content
        aiLoadingSpinner.classList.remove('hidden'); // Show spinner

        let prompt = "Based on the following data for 'Secret Visitor Notes by Department and Execution Status', provide a concise analysis and key insights. The categories are:\n";
        data.forEach(cat => {
            prompt += `- ${cat.nameAr} (${cat.nameEn}): غير منفذ (Not Executed) ${cat.uncompleted}, منفذ (Executed) ${cat.completed}\n`;
        });
        prompt += "\nFocus on identifying departments with high 'Not Executed' counts and overall performance. The response should be in Arabic.";

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = ""; // If you want to use models other than gemini-2.0-flash or imagen-3.0-generate-002, provide an API key here. Otherwise, leave this as-is.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                aiInsightsContent.innerHTML = text.replace(/\n/g, '<br>');
            } else {
                aiInsightsContent.textContent = "لم يتمكن الذكاء الاصطناعي من توليد رؤى. هيكل الاستجابة غير متوقع.";
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            aiInsightsContent.textContent = `حدث خطأ أثناء الاتصال بالذكاء الاصطناعي: ${error.message}. يرجى التحقق من اتصالك بالإنترنت أو المحاولة لاحقًا.`;
        } finally {
            aiLoadingSpinner.classList.add('hidden');
        }
    }

    // Event listener for AI Insights button
    if (aiInsightsBtn) {
        aiInsightsBtn.addEventListener('click', () => {
            if (aiInsightsModal) {
                aiInsightsModal.classList.remove('hidden');
                const chartData = getChartDataForAI();
                generateInsights(chartData);
            }
        });
    }

    // Event listener for closing the modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            aiInsightsModal.classList.add('hidden');
        });
    }

    // Optional: Close modal if clicking outside the content
    if (aiInsightsModal) {
        aiInsightsModal.addEventListener('click', (event) => {
            if (event.target === aiInsightsModal) {
                aiInsightsModal.classList.add('hidden');
            }
        });
    }


    // ===== Export as PDF =====
    exportReportBtn?.addEventListener('click', () => {
        // نحدد الجزء اللي نبغى نحوله PDF
        const element = document.querySelector('.flex-1');

        const opt = {
            margin: 5,
            filename: 'pressganey-report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    });


    // ===== وظائف رفع ملفات Excel =====

    // دالة قراءة ملف Excel (خليها كما هي)
    function readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = function (e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = function (error) {
                reject(error);
            };

            reader.readAsArrayBuffer(file);
        });
    }

    // دوال المساعدة لتعريف الأعمدة (normalizeHeader و KEYS و findHeaderRow)
    function normalizeHeader(s) {
        if (s == null) return '';
        s = String(s).trim().toLowerCase();
        s = s.replace(/[\u064B-\u065F]/g, '');
        s = s.replace(/\u0640/g, '');
        s = s.replace(/[إأآٱ]/g, 'ا');
        s = s.replace(/ى/g, 'ي');
        s = s.replace(/ة/g, 'ه');
        s = s.replace(/[^\p{L}\p{N}\s\/_-]/gu, '');
        s = s.replace(/\s+/g, ' ').trim();
        return s;
    }
// === مفاتيح البحث للأعمدة بناءً على ملف Excel الحقيقي ===
const KEYS = {
  notes: [
    'الملاحظة','الملاحظه','ملاحظه','ملاحظة','الملاحظات','ملاحظات',
    'notes','note','comment','comments','description','تفاصيل','وصف',
    'e','e:','column e','عمود e','العمود e'
  ],
  observationLocation: [
    'مواقع الملاحظة','موقع الملاحظة','موقع الملاحظه','الموقع','موقع','مكان الملاحظه','مكان الملاحظة',
    'observation location','location','site','مكان'
  ],
  responsibleDepartment: [
    'الإدارة المسؤولة','الاداره المسؤوله','الادارة المسؤولة','الاداره المسئولة','الادارة المسئولة',
    'responsible department','responsible dept','department','dept','إدارة'
  ],
  executionStatus: [
    'حالة التنفيذ','حاله التنفيذ','الحالة','الحاله','status',
    'execution status','تنفيذ','منفذ','غير منفذ'
  ]
};


    function findHeaderRow(rows, maxScan = 10) {
        for (let r = 0; r < Math.min(rows.length, maxScan); r++) {
            const row = rows[r] || [];
            const normRow = row.map(normalizeHeader);

            const isLocationHeaderCell = (cell) => {
                return typeof cell === 'string' && (cell.includes('موقع') || cell.includes('location'));
            };

            const findIdx = (keys, excludeIndex = -1, excludeLocationLike = false) =>
                normRow.findIndex((cell, i) => {
                    if (excludeIndex !== -1 && i === excludeIndex) return false;
                    if (excludeLocationLike && isLocationHeaderCell(cell)) return false;
                    return keys.some(k => {
                        const nk = normalizeHeader(k);
                        return nk && typeof cell === 'string' && cell.includes(nk);
                    });
                });

            const mapping = {};
            // أولاً حدّد موقع الملاحظة بدقة
            const obsLocationIdx = findIdx(KEYS.observationLocation);
            // ثم ابحث عن عمود الملاحظة مع استثناء الأعمدة المشابهة لـ "موقع"
            let noteIdx = findIdx(KEYS.notes, obsLocationIdx, true);
            const respDeptIdx = findIdx(KEYS.responsibleDepartment);
            const execStatusIdx = findIdx(KEYS.executionStatus);

            if (noteIdx !== -1) mapping.notes = noteIdx;
            if (obsLocationIdx !== -1) mapping.observationLocation = obsLocationIdx;
            if (respDeptIdx !== -1) mapping.responsibleDepartment = respDeptIdx;
            if (execStatusIdx !== -1) mapping.executionStatus = execStatusIdx;

            // Fallback: if notes column not found, try to find it by searching for "ملاحظة"
            if (mapping.notes === undefined) {
                console.log('Notes column not found by header, searching for notes column...');
                // Search for any column containing "ملاحظة" or "notes"
                for (let i = 0; i < normRow.length; i++) {
                    const cell = normRow[i];
                    const originalCell = row[i];
                    if (i !== obsLocationIdx && cell && (cell.includes('ملاحظة') || cell.includes('ملاحظه') || cell.includes('notes') || 
                                cell.includes('note') || cell.includes('comment'))) {
                        mapping.notes = i;
                        console.log(`Found notes column at index ${i}: "${originalCell}"`);
                        break;
                    }
                }
                // If still not found, try to find by looking at the actual header text
                if (mapping.notes === undefined) {
                    for (let i = 0; i < row.length; i++) {
                        const originalCell = row[i];
                        if (i !== obsLocationIdx && originalCell && typeof originalCell === 'string' && 
                            (originalCell.includes('ملاحظة') || originalCell.includes('ملاحظه') || 
                             originalCell.includes('Notes') || originalCell.includes('Note'))) {
                            mapping.notes = i;
                            console.log(`Found notes column at index ${i} by original text: "${originalCell}"`);
                            break;
                        }
                    }
                }
                // If still not found, use column E (index 4) as fallback
                if (mapping.notes === undefined) {
                    mapping.notes = 4; // Column E
                    console.log('Notes column not found, using column E (index 4) as fallback');
                }
            } else {
                // إذا كان عمود الملاحظة مساوياً لعمود موقع الملاحظة، حاول إيجاد بديل
                if (mapping.observationLocation !== undefined && mapping.notes === mapping.observationLocation) {
                    const altIdx = findIdx(KEYS.notes, mapping.observationLocation, true);
                    if (altIdx !== -1) {
                        mapping.notes = altIdx;
                        console.log(`Adjusted notes column to index ${altIdx} to avoid location column`);
                    }
                }
                console.log(`Notes column found at index ${mapping.notes}: "${row[mapping.notes]}"`);
            }

            if (mapping.notes !== undefined && mapping.observationLocation !== undefined && mapping.responsibleDepartment !== undefined) {
                console.log(`Found header row at index ${r}:`, {
                    notes: mapping.notes,
                    observationLocation: mapping.observationLocation,
                    responsibleDepartment: mapping.responsibleDepartment,
                    executionStatus: mapping.executionStatus
                });
                return { rowIndex: r, map: mapping };
            }
        }
        throw new Error('تعذّر العثور على صف العناوين (مواقع الملاحظة/الإجابة/الملاحظة) ضمن أول 10 صفوف.');
    }


    // دالة معالجة بيانات Excel (استبدل دالتك القديمة بها)
    function processExcelData(rawData) {
        if (!rawData || rawData.length < 2) {
            throw new Error('الملف لا يحتوي على بيانات كافية');
        }

        const { rowIndex, map } = findHeaderRow(rawData);
        const dataRows = rawData.slice(rowIndex + 1);

        const out = [];
        for (const row of dataRows) {
            // Ensure we're reading from the correct column for notes
            let notes = '';
            
            // First, try to read from the mapped notes column
            if (map.notes !== undefined && row[map.notes] !== undefined) {
                notes = (row[map.notes] ?? '').toString().trim();
                console.log(`Reading notes from mapped column ${map.notes}: "${notes}"`);
            }
            
            // If notes is still empty, try to find the notes column by searching
            if (!notes || notes === '') {
                console.log('Notes is empty, searching for notes column in current row...');
                // Search for any column that might contain notes (longer text)
                for (let i = 0; i < row.length; i++) {
                    const cellValue = (row[i] ?? '').toString().trim();
                    // Check if this looks like notes (longer text, contains Arabic or English words)
                    if (cellValue && cellValue.length > 20 && 
                        (cellValue.includes(' ') || cellValue.includes('ا') || cellValue.includes('the'))) {
                        notes = cellValue;
                        console.log(`Found potential notes in column ${i}: "${notes.substring(0, 50)}..."`);
                        break;
                    }
                }
            }
            
            // If still empty, try column E (index 4) as final fallback
            if (!notes || notes === '') {
                notes = (row[4] ?? '').toString().trim();
                console.log(`Using column E (index 4) as final fallback for notes: "${notes}"`);
            }
            
            const observationLocation = (row[map.observationLocation] ?? '').toString().trim();
            const responsibleDepartment = (row[map.responsibleDepartment] ?? '').toString().trim();
            const executionStatusRaw = (row[map.executionStatus] ?? '').toString().trim();

            // Debug: Log the raw data being read
            console.log('Processing row:', {
                rawRow: row,
                notesIndex: map.notes,
                notesValue: notes,
                locationIndex: map.observationLocation,
                locationValue: observationLocation,
                deptIndex: map.responsibleDepartment,
                deptValue: responsibleDepartment,
                statusIndex: map.executionStatus,
                statusValue: executionStatusRaw
            });

            // معالجة الحالة - نستخدم القيمة مباشرة من عمود حالة التنفيذ
            let status = executionStatusRaw || 'غير محدد';





            // إضافة الصف فقط إذا كان يحتوي على بيانات صحيحة
            if (notes !== '' || observationLocation !== '') {
                const rowData = {
                    notes: notes || 'غير محدد',
                    observationLocation: observationLocation || 'غير محدد',
                    responsibleDepartment: responsibleDepartment || 'غير محدد',
                    executionStatus: status,
                    // للتوافق مع الكود القديم
                    status: status,
                    location: observationLocation || 'غير محدد'
                };
                out.push(rowData);
                console.log(`Added row ${out.length}: Notes="${rowData.notes}", Location="${rowData.observationLocation}", Department="${rowData.responsibleDepartment}", Status="${rowData.status}"`);
                
                // Additional validation for notes column
                if (!rowData.notes || rowData.notes === 'غير محدد') {
                    console.warn(`⚠️ Row ${out.length} has empty or default notes value: "${rowData.notes}"`);
                } else {
                    console.log(`✅ Row ${out.length} has valid notes from column E: "${rowData.notes}"`);
                }
            }
        }

        console.log('Processed Excel data:', out);

        // إحصائيات سريعة للتحقق
        const executedCount = out.filter(row => row.status === 'منفذ').length;
        const notExecutedCount = out.filter(row => row.status === 'غير منفذ').length;
        console.log(`Status summary: منفذ (${executedCount}), غير منفذ (${notExecutedCount})`);

        // التحقق من أن البيانات تحتوي على حالات غير منفذة
        if (notExecutedCount === 0) {
            console.warn('⚠️ No "not executed" data found in processed Excel data');
        } else {
            console.log(`✅ Found ${notExecutedCount} "not executed" records`);
        }

        return out;
    }


    // دالة لتحديث الجدول
    function updateExcelDataTable(data) {
        const tableBody = document.getElementById('excelDataTableBody');
        const tableContainer = document.getElementById('excelDataTableContainer');

        if (!data || data.length === 0) {
            tableBody.innerHTML = `
                        <tr>
                            <td colspan="5" class="px-6 py-4 text-center text-gray-500" data-ar="لا توجد بيانات" data-en="No data">لا توجد بيانات</td>
                        </tr>
                    `;
            return;
        }

        // إحصائيات سريعة للتحقق من البيانات
        const executedCount = data.filter(row => row.status === 'منفذ').length;
        const notExecutedCount = data.filter(row => row.status === 'غير منفذ').length;
        console.log(`Table data summary: منفذ (${executedCount}), غير منفذ (${notExecutedCount}), Total (${data.length})`);

        if (notExecutedCount === 0) {
            console.warn('⚠️ No "not executed" data found in table');
        } else {
            console.log(`✅ Table contains ${notExecutedCount} "not executed" records`);
        }

        // إظهار الجدول عند وجود بيانات
        tableContainer.classList.remove('hidden');

        const textAlign = currentLang === 'ar' ? 'text-right' : 'text-left';
        tableBody.innerHTML = data.map((row, index) => `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${textAlign}">${row.observationLocation || row.location || 'غير محدد'}</td>
                        <td class="px-6 py-4 text-sm text-gray-900 ${textAlign}">${row.notes || 'غير محدد'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${textAlign}">${row.responsibleDepartment || 'غير محدد'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm ${textAlign}">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.status === 'منفذ'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }">
                                ${row.status || 'غير محدد'}
                            </span>
                        </td>
                    </tr>
                `).join('');

        console.log(`Updated table with ${data.length} rows`);
        if (data.length > 0) {
            console.log(`First row status: "${data[0]?.status}", Last row status: "${data[data.length - 1]?.status}"`);
        }
    }

    // دالة لتحديث الرسوم البيانية بناءً على البيانات المرفوعة
    function updateChartsFromExcelData(data) {
        if (!data || data.length === 0) return;

        // إخفاء الجدول عند التحميل الأولي
        const tableContainer = document.getElementById('excelDataTableContainer');
        tableContainer.classList.add('hidden');

        // تجميع البيانات حسب القسم والحالة
        const departmentStats = {};
        const locationStats = {};

        console.log('Processing Excel data for charts:', data);

        data.forEach((row, index) => {
            const loc = row.observationLocation || row.location;
            const respDept = row.responsibleDepartment;
            const isExecuted = row.status === 'منفذ';

            console.log(`Row ${index + 1}: ObservationLocation="${loc}", ResponsibleDept="${respDept}", Status="${row.status}", IsExecuted=${isExecuted}`);

            // إحصائيات الإدارة المسؤولة
            if (!departmentStats[respDept]) {
                departmentStats[respDept] = { executed: 0, notExecuted: 0 };
            }
            if (isExecuted) {
                departmentStats[respDept].executed++;
            } else {
                departmentStats[respDept].notExecuted++;
            }

            // إحصائيات الموقع
            if (!locationStats[loc]) {
                locationStats[loc] = 0;
            }
            locationStats[loc]++;
        });

        // تحديث البيانات للرسوم البيانية
        horizontalChartRawData = { ...departmentStats };
        donutChartRawData = { ...locationStats };

        // التحقق من أن البيانات تحتوي على حالات غير منفذة
        const hasNotExecuted = Object.values(departmentStats).some(dept => dept.notExecuted > 0);
        const totalExecuted = Object.values(departmentStats).reduce((sum, dept) => sum + dept.executed, 0);
        const totalNotExecuted = Object.values(departmentStats).reduce((sum, dept) => sum + dept.notExecuted, 0);

        console.log('Data check - Has not executed cases:', hasNotExecuted);
        console.log('Department stats:', departmentStats);
        console.log('Chart data summary:', {
            totalExecuted,
            totalNotExecuted,
            departmentStats,
            locationStats
        });

        if (!hasNotExecuted) {
            console.warn('⚠️ No "not executed" data found in filtered chart data');
        } else {
            console.log(`✅ Filtered chart contains ${totalNotExecuted} "not executed" records`);
        }

        // تحديث البطاقات العلوية
        cardData.totalResponsibleDepartments = Object.keys(departmentStats).length;
        cardData.totalObservationLocations = Object.keys(locationStats).length;
        cardData.totalSecretVisitorNotes = data.length;

        // تحديث الرسوم البيانية
        updateCardData();
        updateHorizontalBarChart();
        updateDonutChart();

        console.log('Updated charts with data:', {
            departmentStats,
            locationStats,
            horizontalChartRawData,
            donutChartRawData
        });

        console.log(`Total status counts: منفذ (${totalExecuted}), غير منفذ (${totalNotExecuted})`);

        if (totalNotExecuted === 0) {
            console.warn('⚠️ No "not executed" data found in updated charts');
        } else {
            console.log(`✅ Updated charts contain ${totalNotExecuted} "not executed" records`);
        }

        // التحقق من أن البيانات تم تحديثها بشكل صحيح
        console.log('Final chart data check:', {
            horizontalChartRawData,
            donutChartRawData,
            cardData
        });

        // التحقق من أن البيانات تم تحديثها بشكل صحيح في الرسوم البيانية
        console.log('Chart datasets check:', {
            horizontalChartLabels: horizontalBarChart?.data?.labels,
            horizontalChartDatasets: horizontalBarChart?.data?.datasets?.map(ds => ({
                label: ds.label,
                data: ds.data
            })),
            donutChartLabels: donutChart?.data?.labels,
            donutChartData: donutChart?.data?.datasets?.[0]?.data
        });

        // التحقق من أن البيانات تم تحديثها بشكل صحيح في الرسوم البيانية
        if (horizontalBarChart?.data?.datasets) {
            const notExecutedDataset = horizontalBarChart.data.datasets.find(ds => ds.label === filterLabels.notExecuted[currentLang]);
            if (notExecutedDataset) {
                const notExecutedSum = notExecutedDataset.data.reduce((sum, val) => sum + val, 0);
                console.log(`✅ Horizontal chart "not executed" dataset sum: ${notExecutedSum}`);

                if (notExecutedSum === 0) {
                    console.warn('⚠️ Horizontal chart "not executed" dataset sum is 0');
                } else {
                    console.log(`✅ Horizontal chart "not executed" dataset contains data: ${notExecutedDataset.data.join(', ')}`);
                }
            } else {
                console.warn('⚠️ "Not executed" dataset not found in horizontal chart');
            }
        }

        // التحقق من أن البيانات تم تحديثها بشكل صحيح في الرسوم البيانية
        if (horizontalBarChart?.data?.datasets) {
            const executedDataset = horizontalBarChart.data.datasets.find(ds => ds.label === filterLabels.executed[currentLang]);
            if (executedDataset) {
                const executedSum = executedDataset.data.reduce((sum, val) => sum + val, 0);
                console.log(`✅ Horizontal chart "executed" dataset sum: ${executedSum}`);

                if (executedSum === 0) {
                    console.warn('⚠️ Horizontal chart "executed" dataset sum is 0');
                } else {
                    console.log(`✅ Horizontal chart "executed" dataset contains data: ${executedDataset.data.join(', ')}`);
                }
            } else {
                console.warn('⚠️ "Executed" dataset not found in horizontal chart');
            }
        }

        // التحقق من أن البيانات تم تحديثها بشكل صحيح في الرسوم البيانية
        if (horizontalBarChart?.data?.datasets) {
            console.log('All horizontal chart datasets:', horizontalBarChart.data.datasets.map(ds => ({
                label: ds.label,
                data: ds.data,
                backgroundColor: ds.backgroundColor
            })));
        }
    }

    // ===== EVENT LISTENERS =====
    const importExcelBtn = document.getElementById('importExcelBtn');
    const saveToServerBtn = document.getElementById('saveToServerBtn');
    const excelInput = document.getElementById('excelInput');

    // زر استيراد ملفات Excel
    if (importExcelBtn) {
        importExcelBtn.addEventListener('click', () => {
            excelInput.click();
        });
    }



    // معالجة اختيار الملفات
    if (excelInput) {
        excelInput.addEventListener('change', async (event) => {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            try {
                let allData = [];

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    console.log(`Processing file: ${file.name}`);

                    const rawData = await readExcelFile(file);
                    
                    // استخراج التاريخ من أول سطر في أول ملف
                    if (i === 0) {
                        const extractedDate = extractDateFromFirstRow(rawData);
                        reportDate = extractedDate;
                        console.log(`Extracted report date: ${reportDate}`);
                    }
                    
                    const processedData = processExcelData(rawData);
                    allData = allData.concat(processedData);
                }

                uploadedExcelData = allData;

                // إحصائيات سريعة للتحقق
                const executedCount = allData.filter(row => row.status === 'منفذ').length;
                const notExecutedCount = allData.filter(row => row.status === 'غير منفذ').length;
                console.log(`Excel import summary: منفذ (${executedCount}), غير منفذ (${notExecutedCount}), Total (${allData.length})`);

                updateExcelDataTable(allData);
                updateChartsFromExcelData(allData);

                // حفظ البيانات محلياً
                saveToLocal();

                // رسالة نجاح مع تفاصيل
                alert(`تم استيراد ${files.length} ملف بنجاح!\n\nإحصائيات البيانات:\n- إجمالي الصفوف: ${allData.length}\n- منفذ: ${executedCount}\n- غير منفذ: ${notExecutedCount}`);

            } catch (error) {
                console.error('خطأ في معالجة الملفات:', error);
                alert(`خطأ في معالجة الملفات: ${error.message}`);
            } finally {
                // إعادة تعيين input
                excelInput.value = '';
            }
        });
    }

    // زر حفظ البيانات
    if (saveToServerBtn) {
        saveToServerBtn.addEventListener('click', () => {
            saveToLocal();
            alert('تم حفظ البيانات محلياً بنجاح!');
        });
    }
});
const sidebarLinks = document.querySelectorAll('.sidebar-menu .menu-link');
sidebarLinks.forEach(link => {
    link.parentElement.classList.remove('active'); // Remove active from all
    if (link.getAttribute('href') === 'secret-visitor.html') { // Check for the specific page
        link.parentElement.classList.add('active'); // Add active to the correct one
    }
});