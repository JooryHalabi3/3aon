let currentLang = localStorage.getItem('lang') || 'ar';
let topComplaintsChart;

// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let overviewData = {
    mainStats: {
        transparencyRate: '0%',
        underReview: 0,
        newComplaint: 0,
        repeatedComplaints: 0,
        totalComplaints: 0
    },
    topComplaints: {
        labels: { ar: [], en: [] },
        values: []
    }
};

function getFont() {
    return currentLang === 'ar' ? 'Tajawal' : 'Merriweather';
}

// اختبار الاتصال بالباك إند
async function testBackendConnection() {
    try {
        console.log('🔍 اختبار الاتصال بالباك إند...');
        const response = await fetch(`${API_BASE_URL}/health`);
        console.log('📡 استجابة اختبار الاتصال:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ الباك إند يعمل بشكل صحيح:', data);
            return true;
        } else {
            console.log('❌ الباك إند لا يستجيب بشكل صحيح - Status:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ لا يمكن الاتصال بالباك إند:', error.message);
        return false;
    }
}

// إنشاء Canvas ديناميكياً للرسم البياني
function createChartDynamically() {
    const chartContainer = document.querySelector('.relative.w-full');
    if (!chartContainer) {
        console.error('❌ لم يتم العثور على حاوية الرسم البياني');
        return null;
    }
    
    // إزالة Canvas الموجود إن وجد
    const existingCanvas = chartContainer.querySelector('canvas');
    if (existingCanvas) {
        existingCanvas.remove();
    }
    
    // إنشاء Canvas جديد
    const canvas = document.createElement('canvas');
    canvas.id = 'topComplaintsChart';
    chartContainer.appendChild(canvas);
    
    console.log('✅ تم إنشاء Canvas جديد للرسم البياني');
    return canvas;
}

// جلب بيانات النظرة العامة من الباك إند
async function loadOverviewData() {
    try {
        console.log('🔄 بدء جلب بيانات النظرة العامة من الباك إند...');
        
        // اختبار الاتصال بالباك إند أولاً
        const isBackendRunning = await testBackendConnection();
        if (!isBackendRunning) {
            throw new Error('الباك إند غير متاح. تأكد من تشغيل الخادم على المنفذ 3001.');
        }
        
        // تحديد الفترة الزمنية (آخر 30 يوم افتراضياً)
        const toDate = new Date().toISOString().split('T')[0];
        const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        console.log('📅 الفترة الزمنية:', { fromDate, toDate });
        
        const params = new URLSearchParams({
            fromDate,
            toDate
        });

        console.log('🌐 إرسال طلب إلى:', `${API_BASE_URL}/overview/stats?${params}`);

        const response = await fetch(`${API_BASE_URL}/overview/stats?${params}`);
        console.log('📡 استجابة الخادم:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();

        console.log('📊 استجابة الباك إند:', result);

        if (result.success) {
            console.log('✅ تم جلب البيانات بنجاح من الباك إند');
            console.log('📊 البيانات المستلمة:', result.data);
            
            // معالجة البيانات من الباك إند
            processOverviewData(result.data);
            
            // إعادة إنشاء الرسم البياني
            if (topComplaintsChart) {
                topComplaintsChart.destroy();
            }
            
            // إنشاء Canvas ديناميكياً
            const canvas = createChartDynamically();
            if (canvas) {
                // إذا لم توجد بيانات، عرض رسالة
                if (overviewData.topComplaints.values.length === 0 || overviewData.topComplaints.values.every(v => v === 0)) {
                    canvas.parentElement.innerHTML = `
                        <div class="flex items-center justify-center h-full">
                            <div class="text-center">
                                <div class="text-gray-500 text-6xl mb-4">📊</div>
                                <h3 class="text-xl font-semibold text-gray-700 mb-2">لا توجد شكاوى</h3>
                                <p class="text-gray-500 mb-4">لم يتم العثور على أي شكاوى في قاعدة البيانات</p>
                                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p class="text-blue-800 text-sm">
                                        💡 <strong>نصيحة:</strong> قم بإضافة شكاوى جديدة من خلال صفحة "إضافة شكوى جديدة"
                                    </p>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    console.log('📊 إنشاء الرسم البياني لأكثر الشكاوى تكراراً');
                    topComplaintsChart = createBarChart(
                        canvas,
                        overviewData.topComplaints.labels,
                        overviewData.topComplaints.values,
                        'Most Frequent Complaints'
                    );
                }
            }
            
            console.log('✅ تم تحميل بيانات النظرة العامة بنجاح');
        } else {
            console.error('❌ خطأ في جلب البيانات:', result.message);
            
            // إظهار رسالة خطأ في الصفحة
            const chartContainer = document.querySelector('.relative.w-full');
            if (chartContainer) {
                chartContainer.innerHTML = `
                    <div class="flex items-center justify-center h-full">
                        <div class="text-center text-red-600">
                            <div class="text-4xl mb-4">❌</div>
                            <h3 class="text-xl font-semibold mb-2">خطأ في جلب البيانات</h3>
                            <p>${result.message || 'فشل في تحميل البيانات من الخادم'}</p>
                            <button onclick="loadOverviewData()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                                إعادة المحاولة
                            </button>
                        </div>
                    </div>
                `;
            }
            
            showError('فشل في تحميل البيانات من الخادم');
        }
    } catch (error) {
        console.error('❌ خطأ في الاتصال بالخادم:', error);
        
        // إظهار رسالة خطأ في الصفحة بدلاً من alert
        const chartContainer = document.querySelector('.relative.w-full');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center text-red-600">
                        <div class="text-4xl mb-4">⚠️</div>
                        <h3 class="text-xl font-semibold mb-2">خطأ في الاتصال</h3>
                        <p>تأكد من تشغيل الباك إند</p>
                        <p class="text-sm mt-2">${error.message}</p>
                        <button onclick="loadOverviewData()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            إعادة المحاولة
                        </button>
                    </div>
                </div>
            `;
        }
        
        showError('خطأ في الاتصال بالخادم');
    }
}

// معالجة البيانات من الباك إند
function processOverviewData(data) {
    console.log('🔍 معالجة البيانات من الباك إند:', data);
    
    // معالجة الإحصائيات الرئيسية
    overviewData.mainStats = {
        transparencyRate: data.transparencyRate || '0%',
        underReview: data.underReview || 0,
        newComplaint: data.newComplaint || 0,
        repeatedComplaints: data.repeatedComplaints || 0,
        totalComplaints: data.totalComplaints || 0
    };
    
    console.log('📊 الإحصائيات الرئيسية:', overviewData.mainStats);
    
    // معالجة أكثر الشكاوى تكراراً
    const topComplaints = data.topComplaints || [];
    console.log('📈 أكثر الشكاوى تكراراً:', topComplaints);
    
    overviewData.topComplaints.labels.ar = topComplaints.map(item => item.complaintType || 'شكوى عامة');
    overviewData.topComplaints.labels.en = topComplaints.map(item => getEnglishComplaintType(item.complaintType) || 'General Complaint');
    overviewData.topComplaints.values = topComplaints.map(item => item.count || 0);
    
    console.log('📊 بيانات أكثر الشكاوى تكراراً:', {
        labels: overviewData.topComplaints.labels,
        values: overviewData.topComplaints.values
    });
    
    // معالجة تفاصيل الشكاوى المتكررة
    const repeatedDetails = data.repeatedComplaintsDetails || [];
    console.log('🔄 تفاصيل الشكاوى المتكررة:', repeatedDetails);
    
    // تحديث واجهة المستخدم
    updateMainStatsCards();
    updateRepeatedComplaintsAlert(repeatedDetails);
}

// حساب نسبة الشفافية
function calculateTransparencyRate(general) {
    if (!general.totalComplaints || general.totalComplaints === 0) return 0;
    
    const resolvedComplaints = general.closedComplaints || 0;
    const transparencyRate = Math.round((resolvedComplaints / general.totalComplaints) * 100);
    return Math.min(transparencyRate, 100); // لا تتجاوز 100%
}

// الحصول على اسم نوع الشكوى بالإنجليزية
function getEnglishComplaintType(arabicType) {
    const typeMap = {
        'تأخير في دخول العيادة': 'Delay in Clinic Entry',
        'تعامل غير لائق من موظف': 'Improper Staff Conduct',
        'نقص علاج / أدوية': 'Lack of Treatment / Medication',
        'نظافة غرف المرضى': 'Patient Room Cleanliness',
        'سوء التنسيق في المواعيد': 'Poor Appointment Coordination',
        'شكوى عامة': 'General Complaint'
    };
    
    return typeMap[arabicType] || arabicType;
}

// إظهار رسالة خطأ
function showError(message) {
    alert(message);
}

// تصدير التقرير
async function exportOverviewReport() {
    try {
        console.log('📤 بدء تصدير تقرير النظرة العامة...');
        
        const toDate = new Date().toISOString().split('T')[0];
        const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const params = new URLSearchParams({
            fromDate,
            toDate
        });
        
        console.log('🌐 إرسال طلب تصدير إلى:', `${API_BASE_URL}/overview/export-data?${params}`);
        
        const response = await fetch(`${API_BASE_URL}/overview/export-data?${params}`);
        const blob = await response.blob();
        
        // إنشاء رابط تحميل
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `overview-report-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ تم تصدير التقرير بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تصدير التقرير:', error);
        showError('فشل في تصدير التقرير');
    }
}

function updateMainStatsCards() {
    document.getElementById('transparencyRate').textContent = overviewData.mainStats.transparencyRate;
    document.getElementById('underReview').textContent = overviewData.mainStats.underReview;
    document.getElementById('newComplaint').textContent = overviewData.mainStats.newComplaint;
    document.getElementById('repeatedComplaints').textContent = overviewData.mainStats.repeatedComplaints;
    document.getElementById('totalComplaints').textContent = overviewData.mainStats.totalComplaints;
}

function updateRepeatedComplaintsAlert(repeatedDetails) {
    const repeatedCountElement = document.getElementById('repeatedComplaintsCount');
    if (repeatedCountElement) {
        repeatedCountElement.textContent = overviewData.mainStats.repeatedComplaints;
    }
    
    // تحديث تفاصيل الشكاوى المتكررة
    const alertSection = document.querySelector('.bg-yellow-50');
    if (alertSection && repeatedDetails.length > 0) {
        // إنشاء قائمة بالشكاوى المتكررة
        let detailsHtml = '<div class="mt-4 space-y-2">';
        repeatedDetails.forEach(item => {
            detailsHtml += `
                <div class="bg-yellow-100 p-3 rounded-lg">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-semibold text-yellow-800">${item.ComplaintType}</p>
                            <p class="text-sm text-yellow-700">القسم: ${item.DepartmentName}</p>
                            <p class="text-sm text-yellow-700">عدد التكرارات: ${item.ComplaintCount}</p>
                        </div>
                        <span class="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                            ${item.ComplaintCount} مرات
                        </span>
                    </div>
                </div>
            `;
        });
        detailsHtml += '</div>';
        
        // إضافة التفاصيل إلى التنبيه
        const existingDetails = alertSection.querySelector('.mt-4.space-y-2');
        if (existingDetails) {
            existingDetails.remove();
        }
        alertSection.querySelector('.mr-3').insertAdjacentHTML('beforeend', detailsHtml);
    }
}

function createBarChart(ctx, dataLabels, dataValues, chartTitle) {
    console.log('🎨 إنشاء الرسم البياني مع البيانات:', {
        labels: dataLabels[currentLang],
        values: dataValues
    });
    
    console.log('🎨 Canvas element:', ctx);
    console.log('🎨 Canvas width:', ctx.width);
    console.log('🎨 Canvas height:', ctx.height);
    
    const datasets = [{
        label: chartTitle,
        data: dataValues,
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
        borderRadius: 5,
    }];
    
    console.log('🎨 Datasets:', datasets);
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dataLabels[currentLang],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    rtl: currentLang === 'ar',
                    bodyFont: { family: getFont() },
                    titleFont: { family: getFont() }
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
                        }
                    },
                    grid: { display: false },
                    barPercentage: 0.9,
                    categoryPercentage: 0.9
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
                        color: 'rgba(0, 0, 0, 0.2)',
                    },
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function updateAllContent() {
    const font = getFont();

    // Update Main Stats Cards
    updateMainStatsCards();
    updateRepeatedComplaintsAlert();

    // Update Top Complaints Chart
    if (topComplaintsChart) {
        topComplaintsChart.data.labels = overviewData.topComplaints.labels[currentLang];
        topComplaintsChart.data.datasets[0].data = overviewData.topComplaints.values;
        topComplaintsChart.options.plugins.tooltip.rtl = currentLang === 'ar';
        topComplaintsChart.options.plugins.tooltip.bodyFont.family = font;
        topComplaintsChart.options.plugins.tooltip.titleFont.family = font;
        topComplaintsChart.options.plugins.datalabels.font.family = font;
        topComplaintsChart.options.scales.x.ticks.font.family = font;
        topComplaintsChart.options.scales.y.ticks.font.family = font;
        topComplaintsChart.update();
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

    // Update dropdown selected texts
    const dropdowns = ['day', 'month', 'quarter', 'customDate'];
    dropdowns.forEach(id => {
        const span = document.getElementById(`selected${id.charAt(0).toUpperCase() + id.slice(1)}`);
        if (span) {
            const selectedValue = span.dataset.value;
            const optionElement = document.querySelector(`#${id}Options .custom-select-option[data-value="${selectedValue}"]`);
            if (optionElement) {
                span.textContent = optionElement.getAttribute(`data-${lang}`);
            } else {
                // Set default text if no value is selected or found
                if (id === 'day') span.textContent = lang === 'ar' ? 'اختر اليوم' : 'Choose Day';
                else if (id === 'month') span.textContent = lang === 'ar' ? 'اختر الشهر' : 'Choose Month';
                else if (id === 'quarter') span.textContent = lang === 'ar' ? 'ربع سنوي' : 'Quarterly';
                else if (id === 'customDate') span.textContent = lang === 'ar' ? 'تخصيص التاريخ' : 'Custom Date';
            }
        }
    });

    updateAllContent();
}

document.addEventListener('DOMContentLoaded', () => {
    const langToggleBtn = document.getElementById('langToggle');
    const exportReportBtn = document.getElementById('exportReportBtn');
    const refreshBtn = document.getElementById('refreshBtn');

    // Register ChartDataLabels plugin
    Chart.register(ChartDataLabels);

    // تحميل البيانات من الباك إند
    loadOverviewData();

    // Now, call applyLanguage to set initial language and update all content
    applyLanguage(currentLang);

    // Set active sidebar link based on current page
    const sidebarLinks = document.querySelectorAll('.sidebar-menu .menu-link');
    sidebarLinks.forEach(link => {
        link.parentElement.classList.remove('active');
        if (link.getAttribute('href') === 'overview.html') {
            link.parentElement.classList.add('active');
        }
    });

    // Dropdown functionality - Generic function for all dropdowns
    function setupDropdown(selectId, optionsId) {
        const select = document.getElementById(selectId);
        const options = document.getElementById(optionsId);

        if (select && options) {
            select.addEventListener('click', () => {
                options.classList.toggle('open');
                const icon = select.querySelector('.fas');
                if (options.classList.contains('open')) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                } else {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            });

            options.addEventListener('click', (event) => {
                if (event.target.classList.contains('custom-select-option')) {
                    const selectedValue = event.target.dataset.value;
                    const selectedText = event.target.textContent;
                    select.querySelector('span').textContent = selectedText;
                    select.querySelector('span').dataset.value = selectedValue;
                    options.classList.remove('open');
                    select.querySelector('.fas').classList.remove('fa-chevron-up');
                    select.querySelector('.fas').classList.add('fa-chevron-down');
                    
                    // إعادة تحميل البيانات بناءً على الفلتر المحدد
                    console.log(`Filter selected for ${selectId}: ${selectedValue}`);
                    loadOverviewData();
                }
            });
        }
    }

    // Setup all dropdowns
    setupDropdown('daySelect', 'dayOptions');
    setupDropdown('monthSelect', 'monthOptions');
    setupDropdown('quarterSelect', 'quarterOptions');
    setupDropdown('customDateSelect', 'customDateOptions');

    // Functionality for Export Report button
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', () => {
            exportOverviewReport();
        });
    }

    // Functionality for Refresh Data button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadOverviewData();
        });
    }

    // Language toggle button event listener
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            applyLanguage(newLang);
        });
    }
});
