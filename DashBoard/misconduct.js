let currentLang = localStorage.getItem('lang') || 'ar';
let misconductChart;
let dateFromPicker;
let dateToPicker;

// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let misconductData = {
    labels: { ar: [], en: [] },
    datasets: []
};

function getFont() {
    return currentLang === 'ar' ? 'Tajawal' : 'Merriweather';
}

// جلب بيانات بلاغات سوء التعامل من الباك إند
async function loadMisconductData() {
    try {
        console.log('🔄 بدء جلب بيانات بلاغات سوء التعامل من الباك إند...');
        
        // فحص وجود canvas قبل البدء
        const canvas = document.getElementById('misconductChart');
        console.log('🔍 فحص canvas في بداية loadMisconductData:', canvas);
        
        // إظهار مؤشر التحميل
        const chartContainer = document.querySelector('.relative.w-full');
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="flex items-center justify-center h-full"><div class="text-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p class="mt-4 text-gray-600">جاري تحميل البيانات...</p><p class="text-sm text-gray-500 mt-2">يرجى الانتظار...</p></div></div>';
        }
        
        // تحديد الفترة الزمنية من التواريخ المحددة أو آخر 30 يوم افتراضياً
        let toDate = new Date().toISOString().split('T')[0];
        let fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // استخدام التواريخ المحددة من المستخدم إذا كانت متوفرة
        if (dateFromPicker && dateFromPicker.selectedDates[0]) {
            fromDate = dateFromPicker.selectedDates[0].toISOString().split('T')[0];
        }
        if (dateToPicker && dateToPicker.selectedDates[0]) {
            toDate = dateToPicker.selectedDates[0].toISOString().split('T')[0];
        }
        
        console.log('📅 الفترة الزمنية:', { fromDate, toDate });
        
        const params = new URLSearchParams({
            fromDate,
            toDate
        });

        const url = `${API_BASE_URL}/misconduct/stats?${params}`;
        console.log('🌐 إرسال طلب إلى:', url);

        // إضافة timeout للطلب
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 ثواني timeout

        const response = await fetch(url, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('📡 استجابة الخادم:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const result = await response.json();

        console.log('📊 استجابة الباك إند:', result);

        if (result.success) {
            console.log('📊 البيانات المستلمة:', result.data);
            
            // معالجة البيانات من الباك إند
            processMisconductData(result.data);
            
            // إعادة إنشاء الرسم البياني
            if (misconductChart) {
                misconductChart.destroy();
            }
            
            // إنشاء canvas ديناميكياً
            createChartDynamically();
            
            function createChartDynamically() {
                // البحث عن container
                const chartContainer = document.querySelector('.relative.w-full');
                console.log('🔍 البحث عن chart container:', chartContainer);
                
                if (chartContainer) {
                    // إنشاء canvas جديد
                    const newCanvas = document.createElement('canvas');
                    newCanvas.id = 'misconductChart';
                    newCanvas.width = 800;
                    newCanvas.height = 400;
                    newCanvas.style.width = '100%';
                    newCanvas.style.height = '100%';
                    
                    // مسح المحتوى وإضافة canvas
                    chartContainer.innerHTML = '';
                    chartContainer.appendChild(newCanvas);
                    
                    console.log('✅ تم إنشاء canvas جديد:', newCanvas);
                    
                    try {
                        misconductChart = createMisconductBarChart(newCanvas, misconductData);
                        console.log('✅ تم إنشاء الرسم البياني بنجاح');
                    } catch (error) {
                        console.error('❌ خطأ في إنشاء الرسم البياني:', error);
                    }
                } else {
                    console.error('❌ لم يتم العثور على chart container');
                }
            }
            
            console.log('✅ تم تحميل بيانات بلاغات سوء التعامل بنجاح');
        } else {
            console.error('❌ خطأ في جلب البيانات:', result.message);
            showError('فشل في تحميل البيانات من الخادم: ' + result.message);
        }
    } catch (error) {
        console.error('❌ خطأ في الاتصال بالخادم:', error);
        
        let errorMessage = 'خطأ في الاتصال بالخادم';
        
        if (error.name === 'AbortError') {
            errorMessage = 'انتهت مهلة الاتصال بالخادم (timeout)';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'لا يمكن الاتصال بالخادم - تأكد من تشغيل الباك إند';
        } else {
            errorMessage = error.message;
        }
        
        // إظهار رسالة خطأ مفصلة
        const chartContainer = document.querySelector('.relative.w-full');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <div class="text-red-500 text-xl mb-4">⚠️</div>
                        <p class="text-red-600 text-lg">فشل في تحميل البيانات</p>
                        <p class="text-gray-500 text-sm mt-2">${errorMessage}</p>
                        <div class="mt-4 space-y-2">
                            <p class="text-xs text-gray-400">تأكد من:</p>
                            <ul class="text-xs text-gray-400 text-right">
                                <li>• تشغيل الباك إند على المنفذ 3001</li>
                                <li>• وجود بيانات في قاعدة البيانات</li>
                                <li>• صحة إعدادات قاعدة البيانات</li>
                                <li>• وجود نوع الشكوى "الكوادر الصحية وسلوكهم"</li>
                            </ul>
                        </div>
                        <button onclick="loadMisconductData()" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                            إعادة المحاولة
                        </button>
                    </div>
                </div>
            `;
        }
        
        showError(errorMessage);
    }
}

// معالجة البيانات من الباك إند
function processMisconductData(data) {
    console.log('🔧 معالجة البيانات المستلمة:', data);
    
    const departments = data.byDepartment || [];
    
    console.log('📋 البيانات الخام حسب القسم:', departments);
    
    // إذا لم توجد بيانات، عرض رسالة
    if (departments.length === 0) {
        const chartContainer = document.querySelector('.relative.w-full');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <div class="text-gray-500 text-xl mb-4">📊</div>
                        <p class="text-gray-600 text-lg">لا توجد بيانات بلاغات سوء التعامل في الفترة المحددة</p>
                        <p class="text-gray-500 text-sm mt-2">جرب تغيير الفترة الزمنية أو إضافة بلاغات جديدة</p>
                        <button onclick="loadMisconductData()" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                            إعادة المحاولة
                        </button>
                    </div>
                </div>
            `;
        }
        return;
    }
    
    console.log('📋 عدد الأقسام التي لديها بلاغات:', departments.length);
    
    // تحويل البيانات إلى التنسيق المطلوب للرسم البياني
    misconductData.labels.ar = departments.map(dept => dept.DepartmentName);
    misconductData.labels.en = departments.map(dept => getEnglishDepartmentName(dept.DepartmentName));
    
    misconductData.datasets = [{
        label: { ar: 'عدد البلاغات', en: 'Number of Reports' },
        data: departments.map(dept => dept.reportCount),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
        borderRadius: 5,
    }];
    
    console.log('📈 البيانات النهائية للرسم البياني:', misconductData);
}

// الحصول على اسم القسم بالإنجليزية
function getEnglishDepartmentName(arabicName) {
    const departmentMap = {
        'قسم الطوارئ': 'Emergency Department',
        'قسم الجراحة العامة': 'General Surgery Department',
        'قسم الصيدلية': 'Pharmacy Department',
        'قسم العناية المركزة': 'Intensive Care Unit',
        'قسم الجراحة نساء': 'Women\'s Surgery Department',
        'قسم الباطنية': 'Internal Medicine Department',
        'قسم الأطفال': 'Pediatrics Department',
        'قسم العظام': 'Orthopedics Department',
        'قسم القلب': 'Cardiology Department',
        'قسم المخ والأعصاب': 'Neurology Department',
        'قسم الأشعة': 'Radiology Department',
        'قسم المختبر': 'Laboratory Department',
        'قسم التمريض': 'Nursing Department',
        'قسم الإدارة': 'Administration Department'
    };
    
    return departmentMap[arabicName] || arabicName;
}

// الحصول على لون التخصص
function getSpecialtyColor(specialty) {
    const colors = {
        'طبيب': '#3B82F6',
        'ممارس صحي': '#60A5FA',
        'ممرضة': '#93C5FD',
        'تمريض': '#93C5FD',
        'غير محدد': '#CBD5E1'
    };
    return colors[specialty] || '#3B82F6';
}

// الحصول على لون حدود التخصص
function getSpecialtyBorderColor(specialty) {
    const colors = {
        'طبيب': '#2563EB',
        'ممارس صحي': '#3B82F6',
        'ممرضة': '#60A5FA',
        'تمريض': '#60A5FA',
        'غير محدد': '#94A3B8'
    };
    return colors[specialty] || '#2563EB';
}

// إظهار رسالة خطأ
function showError(message) {
    console.error('❌ خطأ:', message);
    alert(message);
}

// تصدير التقرير
async function exportMisconductReport() {
    try {
        console.log('📤 بدء تصدير تقرير بلاغات سوء التعامل...');
        
        const fromDate = dateFromPicker && dateFromPicker.selectedDates[0] ? dateFromPicker.selectedDates[0].toISOString().split('T')[0] : '';
        const toDate = dateToPicker && dateToPicker.selectedDates[0] ? dateToPicker.selectedDates[0].toISOString().split('T')[0] : '';
        
        const params = new URLSearchParams();
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        
        console.log('🌐 إرسال طلب تصدير إلى:', `${API_BASE_URL}/misconduct/export-data?${params}`);
        
        const response = await fetch(`${API_BASE_URL}/misconduct/export-data?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // إنشاء رابط تحميل
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `misconduct-report-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ تم تصدير التقرير بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تصدير التقرير:', error);
        showError('فشل في تصدير التقرير: ' + error.message);
    }
}

function createMisconductBarChart(ctx, chartData) {
    console.log('🎨 إنشاء الرسم البياني مع البيانات:', chartData);
    
    if (!ctx) {
        console.error('❌ Canvas context غير صالح');
        return null;
    }
    
    console.log('🎨 Canvas موجود، بدء إنشاء الرسم البياني...');
    console.log('🎨 Canvas element:', ctx);
    console.log('🎨 Canvas width:', ctx.width);
    console.log('🎨 Canvas height:', ctx.height);
    
    const datasets = chartData.datasets.map(dataset => ({
        label: dataset.label[currentLang],
        data: dataset.data,
        backgroundColor: dataset.backgroundColor,
        borderColor: dataset.borderColor,
        borderWidth: dataset.borderWidth,
        borderRadius: dataset.borderRadius,
    }));

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels[currentLang],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            family: getFont(),
                            size: 14
                        },
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    rtl: currentLang === 'ar',
                    bodyFont: { family: getFont() },
                    titleFont: { family: getFont() },
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    color: '#333',
                    font: {
                        weight: 'bold',
                        size: 14,
                        family: getFont()
                    },
                    formatter: value => (value > 0 ? value : '')
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            family: getFont(),
                            size: 12,
                            color: '#333'
                        },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: { display: false },
                    barPercentage: 0.8,
                    categoryPercentage: 0.7
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            family: getFont(),
                            size: 12,
                            color: '#333'
                        }
                    },
                    grid: {
                        drawBorder: false,
                        color: 'rgba(0, 0, 0, 0.1)',
                    },
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function updateAllContent() {
    const font = getFont();

    // Update Misconduct Chart
    if (misconductChart) {
        misconductChart.data.labels = misconductData.labels[currentLang];
        misconductChart.data.datasets.forEach((dataset, index) => {
            dataset.label = misconductData.datasets[index].label[currentLang]; 
        });
        misconductChart.options.plugins.legend.labels.font.family = font;
        misconductChart.options.plugins.tooltip.rtl = currentLang === 'ar';
        misconductChart.options.plugins.tooltip.bodyFont.family = font;
        misconductChart.options.plugins.tooltip.titleFont.family = font;
        misconductChart.options.plugins.datalabels.font.family = font;
        misconductChart.options.scales.x.ticks.font.family = font;
        misconductChart.options.scales.y.ticks.font.family = font;
        misconductChart.update();
    }

    // Update Flatpickr locale
    if (dateFromPicker) {
        dateFromPicker.set('locale', currentLang === 'ar' ? 'ar' : 'default');
        dateFromPicker.set('enableRtl', currentLang === 'ar');
        document.getElementById('dateFrom').placeholder = currentLang === 'ar' ? 'اختر التاريخ' : 'Select Date';
        document.getElementById('dateFrom').setAttribute('data-ar', 'اختر التاريخ');
        document.getElementById('dateFrom').setAttribute('data-en', 'Select Date');
    }
    if (dateToPicker) {
        dateToPicker.set('locale', currentLang === 'ar' ? 'ar' : 'default');
        dateToPicker.set('enableRtl', currentLang === 'ar');
        document.getElementById('dateTo').placeholder = currentLang === 'ar' ? 'اختر التاريخ' : 'Select Date';
        document.getElementById('dateTo').setAttribute('data-ar', 'اختر التاريخ');
        document.getElementById('dateTo').setAttribute('data-en', 'Select Date');
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
        if (textContent) {
            el.textContent = textContent;
        }
    });

    // Update language toggle text
    const langTextSpan = document.getElementById('langText');
    if (langTextSpan) {
        langTextSpan.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
    }

    updateAllContent();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 بدء تحميل صفحة بلاغات سوء التعامل...');
    
    // فحص وجود Chart.js
    console.log('🔍 فحص Chart.js:', typeof Chart);
    console.log('🔍 فحص ChartDataLabels:', typeof ChartDataLabels);
    
    // فحص وجود canvas
    const canvas = document.getElementById('misconductChart');
    console.log('🔍 فحص canvas عند التحميل:', canvas);
    
    // فحص جميع canvas الموجودة
    const allCanvas = document.querySelectorAll('canvas');
    console.log('🔍 جميع canvas الموجودة:', allCanvas);
    console.log('🔍 عدد canvas:', allCanvas.length);
    
    const langToggleBtn = document.getElementById('langToggle');
    const exportReportBtn = document.getElementById('exportReportBtn');
    const applyFilterBtn = document.getElementById('applyFilterBtn');

    // Register ChartDataLabels plugin
    Chart.register(ChartDataLabels);

    // Initialize Flatpickr
    dateFromPicker = flatpickr("#dateFrom", {
        dateFormat: "Y-m-d",
        locale: currentLang === 'ar' ? 'ar' : 'default',
        enableRtl: currentLang === 'ar',
        maxDate: 'today'
    });
    dateToPicker = flatpickr("#dateTo", {
        dateFormat: "Y-m-d",
        locale: currentLang === 'ar' ? 'ar' : 'default',
        enableRtl: currentLang === 'ar',
        maxDate: 'today'
    });

    // تحميل البيانات من الباك إند بعد انتظار تحميل DOM
    setTimeout(() => {
        loadMisconductData();
    }, 500);

    // Now, call applyLanguage to set initial language and update all content
    applyLanguage(currentLang);

    // Set active sidebar link based on current page
    const sidebarLinks = document.querySelectorAll('.sidebar-menu .menu-link');
    sidebarLinks.forEach(link => {
        link.parentElement.classList.remove('active');
        if (link.getAttribute('href') === 'misconduct.html') {
            link.parentElement.classList.add('active');
        }
    });

    // Apply Filter button functionality
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', () => {
            console.log('🔍 تطبيق الفلترة...');
            loadMisconductData(); // إعادة تحميل البيانات مع الفلترة الجديدة
        });
    }

    // Functionality for Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            console.log('🔄 تحديث البيانات...');
            loadMisconductData();
        });
    }

    // Functionality for Export Report button
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', () => {
            exportMisconductReport();
        });
    }

    // Language toggle functionality
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            applyLanguage(newLang);
        });
    }
    
    console.log('✅ تم تحميل صفحة بلاغات سوء التعامل بنجاح');
});
      