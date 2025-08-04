
        let currentLang = localStorage.getItem('lang') || 'ar';
        let generalRequestsChart;
        let activeFilter = null;

        // البيانات الحقيقية من الباك إند
        let chartData = {
            executed: [],
            notExecuted: []
        };

        // سيتم ملؤها ديناميكياً من قاعدة البيانات
        let labelsByLang = {
            ar: [],
            en: []
        };

        const filterLabels = {
            executed: { ar: 'مغلقة', en: 'Closed', color: 'green' },
            notExecuted: { ar: 'مفتوحة (جميع الحالات ما عدا مغلقة)', en: 'Open (All except Closed)', color: 'red' }
        };

        function getFont() {
            return currentLang === 'ar' ? 'Tajawal' : 'Merriweather';
        }

        // جلب أنواع الطلبات المتاحة من قاعدة البيانات
        async function loadAvailableRequestTypes() {
            try {
                console.log('🔄 جلب الأقسام المتاحة من قاعدة البيانات...');
                
                const response = await fetch('http://localhost:3001/api/general-requests/request-types');
                const result = await response.json();

                if (result.success) {
                    console.log('✅ تم جلب الأقسام بنجاح:', result.data);
                    
                    if (result.data.length === 0) {
                        // لا توجد أقسام تحتوي على شكاوى
                        console.log('📝 لا توجد أقسام تحتوي على شكاوى');
                        showNotification('لا توجد شكاوى في قاعدة البيانات. يرجى إضافة شكاوى جديدة.', 'info');
                        
                        // عرض رسالة في الصفحة
                        const chartContainer = document.querySelector('.relative.w-full.h-80');
                        if (chartContainer) {
                            chartContainer.innerHTML = `
                                <div class="flex items-center justify-center h-full">
                                    <div class="text-center">
                                        <div class="text-gray-500 text-6xl mb-4">📋</div>
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
                        }
                        return;
                    }
                    
                    // تحديث labelsByLang بالبيانات من قاعدة البيانات
                    console.log('🔍 البيانات المستلمة من الباك إند:', result.data);
                    labelsByLang.ar = result.data.map(dept => dept.name);
                    labelsByLang.en = result.data.map(dept => getEnglishDepartmentName(dept.name));
                    
                    console.log('📊 الأقسام العربية:', labelsByLang.ar);
                    console.log('📊 الأقسام الإنجليزية:', labelsByLang.en);
                    
                    // إعادة تعيين chartData
                    chartData.executed = new Array(result.data.length).fill(0);
                    chartData.notExecuted = new Array(result.data.length).fill(0);
                    
                    console.log('📊 تم تحديث الأقسام:', labelsByLang);
                    
                    // جلب البيانات الإحصائية بعد تحديث الأقسام
                    await loadGeneralRequestData();
                } else {
                    console.error('❌ خطأ في جلب الأقسام:', result.message);
                    showNotification('خطأ في جلب الأقسام: ' + result.message, 'error');
                }
            } catch (error) {
                console.error('💥 خطأ في الاتصال بالخادم:', error);
                showNotification('خطأ في الاتصال بالخادم: ' + error.message, 'error');
                
                // عرض رسالة خطأ في الصفحة
                const chartContainer = document.querySelector('.relative.w-full.h-80');
                if (chartContainer) {
                    chartContainer.innerHTML = `
                        <div class="flex items-center justify-center h-full">
                            <div class="text-center text-red-600">
                                <div class="text-4xl mb-4">⚠️</div>
                                <h3 class="text-xl font-semibold mb-2">خطأ في الاتصال</h3>
                                <p>تأكد من تشغيل الباك إند</p>
                                <p class="text-sm mt-2">${error.message}</p>
                            </div>
                        </div>
                    `;
                }
            }
        }

        // دالة لترجمة أسماء الأقسام إلى الإنجليزية
        function getEnglishDepartmentName(arabicName) {
            const translations = {
                'قسم المدير التنفيذي للمستشفى': 'Hospital Executive Director',
                'قسم المشرحة': 'Morgue',
                'قسم التنسيق الطبي وأهلية العلاج': 'Medical Coordination and Eligibility',
                'قسم خدمات الضيف': 'Guest Services',
                'قسم المراجعة الداخلية': 'Internal Audit',
                'قسم الشؤون القانونية': 'Legal Affairs',
                'قسم سلاسل الإمداد': 'Supply Chain',
                'قسم الوقاية ومكافحة العدوى': 'Infection Prevention and Control',
                'قسم الجودة والتميز المؤسسي': 'Quality and Institutional Excellence',
                'قسم التواصل والعلاقات العامة': 'Communications and Public Relations',
                'قسم وحدة التخطيط والاستعداد للطوارئ': 'Hospital Emergency Planning and Preparedness Unit',
                'قسم الشؤون المالية والإدارية': 'Finance and Administration',
                'قسم الموارد البشرية': 'Human Resources',
                'قسم الشؤون الأكاديمية والتدريب': 'Academic Affairs and Training',
                'قسم المرافق والشؤون الهندسية': 'Facilities and Engineering',
                'قسم الإدارة الإستراتيجية': 'Strategic Management',
                'قسم مكتب الخدمات التمريضية': 'Nursing Services Office',
                'قسم الطب الباطني العام': 'General Internal Medicine',
                'قسم الجراحة العامة': 'General Surgery',
                'قسم المسالك البولية': 'Urology',
                'قسم جراحة اليوم الواحد': 'Same-Day Surgery',
                'قسم الأنف والأذن والحنجرة': 'Otorhinolaryngology',
                'قسم العظام': 'Orthopaedics',
                'قسم جراحة المخ والأعصاب': 'Neurosurgery',
                'قسم العمليات الجراحية': 'Surgical Procedures',
                'قسم الطوارئ': 'Emergency',
                'قسم العناية المركزة': 'Intensive Care',
                'قسم الرعاية التنفسية': 'Respiratory Care',
                'قسم التخدير': 'Anaesthesia',
                'قسم الصيدلية': 'Pharmacy',
                'قسم الخدمة الاجتماعية': 'Social Services',
                'قسم المختبرات الطبية': 'Medical Laboratories',
                'قسم بنك الدم': 'Blood Bank',
                'قسم الرعاية المنزلية': 'Home Care',
                'قسم الأشعة': 'Radiology',
                'قسم التغذية العامة': 'General Nutrition',
                'قسم التغذية العلاجية': 'Therapeutic Nutrition',
                'قسم التأهيل الطبي': 'Medical Rehabilitation',
                'قسم التعقيم المركزي': 'Central Sterilization',
                'قسم البصريات': 'Optometry',
                'قسم العيادات الخارجية': 'Outpatient Clinics',
                'قسم التوعية الدينية والدعم الروحي': 'Religious Awareness and Spiritual Support',
                'قسم التثقيف والتوعية الصحية': 'Health Education and Awareness',
                'قسم الصحة العامة': 'Public Health',
                'قسم الصحة المهنية': 'Occupational Health',
                'قسم مركز الأسنان': 'Dental Centre',
                'قسم مركز حساسية القمح': 'Wheat Allergy Centre',
                'قسم مركز الشيخوخة': 'Geriatric Centre',
                'قسم مركز الجلدية': 'Dermatology Centre',
                'قسم مكتب الخدمات الطبية': 'Medical Services Office',
                'قسم شؤون المرضى': 'Patient Affairs',
                'قسم المعلومات الصحية': 'Health Informatics',
                'قسم مكتب الدخول': 'Admissions Office',
                'قسم الأمن السيبراني': 'Cybersecurity',
                'قسم تجربة المريض': 'Patient Experience',
                'قسم الصحة الرقمية': 'Digital Health',
                'قسم الباطنة – أمراض الدم': 'Internal Medicine – Hematology',
                'قسم الباطنة – القلب': 'Internal Medicine – Cardiology',
                'قسم الباطنة – الصدرية': 'Internal Medicine – Pulmonary',
                'قسم الباطنة – الأمراض المعدية': 'Internal Medicine – Infectious Diseases',
                'قسم الباطنة – أمراض الكلية': 'Internal Medicine – Nephrology',
                'قسم الباطنة – العصبية': 'Internal Medicine – Neurology',
                'قسم الباطنة – الرعاية التلطيفية': 'Internal Medicine – Palliative Care',
                'قسم الباطنة – الغدد الصماء': 'Internal Medicine – Endocrinology',
                'قسم الباطنة – الروماتيزم': 'Internal Medicine – Rheumatology',
                'قسم جراحة الأوعية الدموية': 'Vascular Surgery',
                'قسم وحدة العيون': 'Ophthalmology Unit',
                'قسم جراحة الوجه والفكين': 'Oral and Maxillofacial Surgery',
                'قسم إدارة القبول ودعم الوصول': 'Admissions Management and Access Support',
                'قسم إدارة الأسرة': 'Family Management'
            };
            
            return translations[arabicName] || arabicName;
        }

        // جلب البيانات من الباك إند
        async function loadGeneralRequestData() {
            try {
                console.log('🔄 بدء جلب بيانات الطلبات العامة من الباك إند...');
                
                // إظهار مؤشر التحميل في الصفحة
                const chartContainer = document.querySelector('.relative.w-full.h-80');
                if (chartContainer) {
                    chartContainer.innerHTML = '<div class="flex items-center justify-center h-full"><div class="text-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p class="mt-4 text-gray-600">جاري تحميل البيانات...</p></div></div>';
                }
                
                // تحديد الفترة الزمنية (آخر 30 يوم)
                const toDate = new Date().toISOString().split('T')[0];
                const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                
                console.log('📅 الفترة الزمنية:', { fromDate, toDate });
                
                const params = new URLSearchParams({
                    fromDate,
                    toDate
                });

                console.log('🌐 إرسال طلب إلى:', `http://localhost:3001/api/general-requests/stats?${params}`);

                const response = await fetch(`http://localhost:3001/api/general-requests/stats?${params}`);
                const result = await response.json();

                console.log('📊 استجابة الباك إند:', result);

                if (result.success) {
                    console.log('✅ تم جلب البيانات بنجاح!');
                    console.log('📈 البيانات المستلمة:', result.data);
                    
                    // إظهار رسالة نجاح في الصفحة
                    if (chartContainer) {
                        chartContainer.innerHTML = '<canvas id="generalRequestsChart"></canvas>';
                        console.log('🔄 إعادة إنشاء الرسم البياني...');
                        // إعادة إنشاء الرسم البياني
                        const ctx = document.getElementById('generalRequestsChart');
                        if (ctx) {
                            generalRequestsChart = new Chart(ctx, {
                                type: 'bar',
                                data: {
                                    labels: labelsByLang[currentLang],
                                    datasets: []
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
                                            color: '#4a5568',
                                            font: {
                                                weight: 'bold',
                                                size: 14,
                                                family: getFont()
                                            },
                                            formatter: value => (value > 0 ? value : '')
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            max: Math.max(...chartData.executed, ...chartData.notExecuted, 5),
                                            ticks: {
                                                stepSize: 1,
                                                font: { family: getFont() }
                                            },
                                            grid: {
                                                drawBorder: false,
                                                color: 'rgba(0, 0, 0, 0.08)'
                                            },
                                            position: currentLang === 'ar' ? 'right' : 'left'
                                        },
                                        x: {
                                            ticks: {
                                                font: { family: getFont() }
                                            },
                                            grid: { display: false },
                                            barPercentage: 0.8,
                                            categoryPercentage: 0.8
                                        }
                                    }
                                },
                                plugins: [ChartDataLabels]
                            });
                        }
                    }
                    
                    updateChartDataFromBackend(result.data);
                    
                    // إظهار إشعار نجاح
                    showNotification('تم جلب بيانات الطلبات العامة بنجاح!', 'success');
                    
                } else {
                    console.error('❌ خطأ في جلب البيانات:', result.message);
                    showNotification('خطأ في جلب البيانات: ' + result.message, 'error');
                }
            } catch (error) {
                console.error('💥 خطأ في الاتصال بالخادم:', error);
                showNotification('خطأ في الاتصال بالخادم: ' + error.message, 'error');
                
                // إظهار رسالة خطأ في الصفحة
                const chartContainer = document.querySelector('.relative.w-full.h-80');
                if (chartContainer) {
                    chartContainer.innerHTML = '<div class="flex items-center justify-center h-full"><div class="text-center text-red-600"><div class="text-4xl mb-4">⚠️</div><p>خطأ في الاتصال بالخادم</p><p class="text-sm mt-2">تأكد من تشغيل الباك إند</p></div></div>';
                }
            }
        }

        // تحديث بيانات الرسم البياني من الباك إند
        function updateChartDataFromBackend(data) {
            console.log('🔄 تحديث بيانات الرسم البياني من الباك إند...');
            
            // إعادة تعيين البيانات
            chartData.executed = new Array(labelsByLang.ar.length).fill(0);
            chartData.notExecuted = new Array(labelsByLang.ar.length).fill(0);

            console.log('📊 البيانات المستلمة من الباك إند:', data);

            // إضافة تصحيح إضافي للتأكد من البيانات
            if (data.byDepartment && data.byDepartment.length > 0) {
                console.log('🔍 تفاصيل الأقسام المستلمة من الباك إند:');
                data.byDepartment.forEach((dept, index) => {
                    console.log(`${index + 1}. ${dept.DepartmentName}: ${dept.complaintCount} شكوى (مغلقة: ${dept.closedCount}, مفتوحة: ${dept.openCount})`);
                });
            } else {
                console.log('⚠️ لا توجد أقسام في البيانات المستلمة من الباك إند!');
            }

            // ملء البيانات من الباك إند حسب الأقسام
            if (data.byDepartment && data.byDepartment.length > 0) {
                console.log('📈 معالجة البيانات حسب الأقسام:', data.byDepartment);
                
                // تحديث labelsByLang بالبيانات الفعلية من الباك إند
                console.log('🔍 تحديث الأقسام من بيانات الباك إند:', data.byDepartment);
                labelsByLang.ar = data.byDepartment.map(dept => dept.DepartmentName);
                labelsByLang.en = data.byDepartment.map(dept => getEnglishDepartmentName(dept.DepartmentName));
                
                console.log('📊 الأقسام المحدثة من الباك إند:', labelsByLang.ar);
                
                console.log('🔄 تم تحديث الأقسام:', labelsByLang.ar);
                
                // إعادة تعيين chartData بالحجم الصحيح
                chartData.executed = new Array(data.byDepartment.length).fill(0);
                chartData.notExecuted = new Array(data.byDepartment.length).fill(0);
                
                data.byDepartment.forEach((dept, index) => {
                    chartData.executed[index] = dept.closedCount || 0;
                    chartData.notExecuted[index] = dept.openCount || 0;
                    console.log(`📊 ${dept.DepartmentName}: مغلقة=${dept.closedCount}, مفتوحة=${dept.openCount}`);
                    
                    // التحقق من أن القسم لا يظهر إذا كان عدد الشكاوى صفر
                    if (dept.complaintCount === 0) {
                        console.log(`⚠️ تحذير: قسم ${dept.DepartmentName} لديه 0 شكاوى ولكن يظهر في البيانات!`);
                    }
                    
                    // التحقق من أن البيانات صحيحة
                    if (dept.closedCount > 0) {
                        console.log(`✅ قسم ${dept.DepartmentName} لديه ${dept.closedCount} شكوى مغلقة`);
                    }
                    if (dept.openCount > 0) {
                        console.log(`✅ قسم ${dept.DepartmentName} لديه ${dept.openCount} شكوى مفتوحة`);
                    }
                });
                
                            console.log('🔄 تم تحديث البيانات:', {
                executed: chartData.executed,
                notExecuted: chartData.notExecuted
            });
            
            // التحقق من وجود شكاوى مغلقة
            const totalClosed = chartData.executed.reduce((sum, count) => sum + count, 0);
            const totalOpen = chartData.notExecuted.reduce((sum, count) => sum + count, 0);
            console.log(`📊 إجمالي الشكاوى المغلقة: ${totalClosed}`);
            console.log(`📊 إجمالي الشكاوى المفتوحة: ${totalOpen}`);
            
            if (totalClosed === 0) {
                console.log('⚠️ تحذير: لا توجد شكاوى مغلقة في البيانات!');
            }
            } else {
                console.log('📝 لا توجد بيانات حسب الأقسام');
                // إعادة تعيين البيانات الفارغة
                labelsByLang.ar = [];
                labelsByLang.en = [];
                chartData.executed = [];
                chartData.notExecuted = [];
                
                console.log('⚠️ تم إعادة تعيين البيانات إلى فارغة');
            }

            console.log('✅ البيانات النهائية للرسم البياني:', chartData);
            console.log('📊 الأقسام النهائية للعرض:', labelsByLang.ar);
            updateChartData();
        }

        function updateChartData() {
            const labels = labelsByLang[currentLang];
            const font = getFont();
            const datasets = [];

            console.log('🔄 تحديث الرسم البياني...');
            console.log('📊 الأقسام للعرض:', labels);
            console.log('📈 البيانات المغلقة:', chartData.executed);
            console.log('📈 البيانات المفتوحة:', chartData.notExecuted);

            // التحقق من وجود بيانات
            if (labels.length === 0) {
                console.log('📝 لا توجد بيانات للعرض');
                return;
            }

            // Add 'Open' (Red) dataset first - مفتوحة، جديدة، جاري المعالجة
            datasets.push({
                label: filterLabels.notExecuted[currentLang],
                data: chartData.notExecuted,
                backgroundColor: '#F44336', // Red for open complaints (مفتوحة، جديدة، جاري المعالجة)
                borderColor: '#cc3636',
                borderWidth: 1,
                borderRadius: 5,
                categoryPercentage: 0.5, // Adjust width of the bar category
                barPercentage: 0.8, // Adjust width of individual bars within category
            });

            // Add 'Closed' (Green) dataset - مغلقة
            datasets.push({
                label: filterLabels.executed[currentLang],
                data: chartData.executed,
                backgroundColor: '#4CAF50', // Green for closed complaints (مغلقة)
                borderColor: '#388e3c',
                borderWidth: 1,
                borderRadius: 5,
                categoryPercentage: 0.5,
                barPercentage: 0.8,
            });

            generalRequestsChart.data.labels = labels;
            generalRequestsChart.data.datasets = datasets;
            
            console.log('🔄 تم تحديث بيانات الرسم البياني:', {
                labels: generalRequestsChart.data.labels,
                datasets: generalRequestsChart.data.datasets.map(ds => ({
                    label: ds.label,
                    data: ds.data
                }))
            });

            // تحديث الحد الأقصى للرسم البياني بناءً على البيانات
            const maxValue = Math.max(...chartData.executed, ...chartData.notExecuted);
            const yAxisMax = Math.max(maxValue + 1, 5); // على الأقل 5، أو أكبر قيمة + 1

            // Update options for RTL and fonts
            generalRequestsChart.options.plugins.tooltip.rtl = currentLang === 'ar';
            generalRequestsChart.options.plugins.tooltip.bodyFont.family = font;
            generalRequestsChart.options.plugins.tooltip.titleFont.family = font;

            generalRequestsChart.options.plugins.datalabels.font.family = font;
            generalRequestsChart.options.scales.x.ticks.font.family = font;
            generalRequestsChart.options.scales.y.ticks.font.family = font;

            // تحديث الحد الأقصى للمحور Y
            generalRequestsChart.options.scales.y.max = yAxisMax;

            // Ensure Y-axis labels are on the right for RTL
            generalRequestsChart.options.scales.y.position = currentLang === 'ar' ? 'right' : 'left';

            // Ensure grid lines are visible and correctly styled
            generalRequestsChart.options.scales.y.grid.color = 'rgba(0, 0, 0, 0.08)'; // Make grid lines visible
            generalRequestsChart.options.scales.y.grid.drawBorder = false; // No border on the grid itself

            generalRequestsChart.update();
            console.log('✅ تم تحديث الرسم البياني بنجاح');
            console.log('📊 الأقسام النهائية في الرسم البياني:', generalRequestsChart.data.labels);
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

            updateChartData(); // Update chart data and redraw with new language settings
        }

        // تصدير التقرير
        async function exportGeneralRequestReport() {
            try {
                console.log('📊 بدء تصدير تقرير الطلبات العامة...');
                
                // تحديد الفترة الزمنية (آخر 30 يوم)
                const toDate = new Date().toISOString().split('T')[0];
                const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                
                const params = new URLSearchParams({
                    fromDate,
                    toDate,
                    includeEmployeeData: 'true'
                });

                console.log('🌐 إرسال طلب تصدير إلى:', `http://localhost:3001/api/general-requests/export-data?${params}`);

                const response = await fetch(`http://localhost:3001/api/general-requests/export-data?${params}`);
                const result = await response.json();

                console.log('📊 استجابة تصدير البيانات:', result);

                if (result.success && result.data && result.data.requests && result.data.requests.length > 0) {
                    console.log('✅ تم جلب بيانات التصدير بنجاح');
                    console.log('📈 عدد السجلات:', result.data.requests.length);
                    console.log('📋 البيانات المستلمة:', result.data.requests);
                    
                    // إنشاء ملف Excel
                    const fileName = `تقرير_الشكاوى_${new Date().toLocaleDateString('ar-EG')}`;
                    
                    // استخدام SheetJS لإنشاء ملف Excel
                    if (typeof XLSX !== 'undefined') {
                        const wb = XLSX.utils.book_new();
                        
                        // ورقة الشكاوى
                        const requestsData = result.data.requests.map(complaint => ({
                            'رقم الشكوى': complaint.ComplaintID,
                            'تاريخ الشكوى': complaint.ComplaintDate ? new Date(complaint.ComplaintDate).toLocaleDateString('ar-EG') : 'غير محدد',
                            'القسم': complaint.DepartmentName || 'غير محدد',
                            'نوع الشكوى': complaint.ComplaintTypeName || 'غير محدد',
                            'تفاصيل الشكوى': complaint.ComplaintDetails || 'غير محدد',
                            'الحالة': complaint.CurrentStatus || 'غير محدد',
                            'الأولوية': complaint.Priority || 'غير محدد',
                            'اسم المريض': complaint.PatientName || 'غير محدد',
                            'رقم الهوية': complaint.NationalID_Iqama || 'غير محدد'
                        }));
                        
                        console.log('📊 البيانات المحضرة للتصدير:', requestsData);
                        
                        const ws = XLSX.utils.json_to_sheet(requestsData);
                        XLSX.utils.book_append_sheet(wb, ws, 'الطلبات العامة');
                        XLSX.writeFile(wb, `${fileName}.xlsx`);
                        
                        showNotification('تم تصدير التقرير بنجاح!', 'success');
                    } else {
                        // إذا لم يكن SheetJS متوفر، استخدم الطباعة
                        window.print();
                        showNotification('تم فتح نافذة الطباعة', 'info');
                    }
                } else {
                    console.error('❌ لا توجد بيانات للتصدير أو خطأ في البيانات');
                    showNotification('لا توجد بيانات للتصدير في الفترة المحددة', 'error');
                }

            } catch (error) {
                console.error('💥 خطأ في تصدير التقرير:', error);
                showNotification('خطأ في تصدير التقرير: ' + error.message, 'error');
                
                // استخدام الطباعة كبديل
                window.print();
            }
        }

        // دالة لعرض الإشعارات
        function showNotification(message, type = 'info') {
            // إنشاء عنصر الإشعار
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
            
            // تحديد لون الإشعار حسب النوع
            if (type === 'success') {
                notification.className += ' bg-green-500 text-white';
            } else if (type === 'error') {
                notification.className += ' bg-red-500 text-white';
            } else {
                notification.className += ' bg-blue-500 text-white';
            }
            
            notification.innerHTML = `
                <div class="flex items-center">
                    <span class="mr-2">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                    <span>${message}</span>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // إظهار الإشعار
            setTimeout(() => {
                notification.classList.remove('translate-x-full');
            }, 100);
            
            // إخفاء الإشعار بعد 5 ثواني
            setTimeout(() => {
                notification.classList.add('translate-x-full');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 5000);
        }

        document.addEventListener('DOMContentLoaded', () => {
            const ctx = document.getElementById('generalRequestsChart');
            const langToggleBtn = document.getElementById('langToggle');
            const exportReportBtn = document.getElementById('exportReportBtn');

            // Register ChartDataLabels plugin
            Chart.register(ChartDataLabels);

            // إنشاء الرسم البياني مع بيانات فارغة أولاً
            generalRequestsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: []
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
                            color: '#4a5568',
                            font: {
                                weight: 'bold',
                                size: 14,
                                family: getFont()
                            },
                            formatter: value => (value > 0 ? value : '')
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 5,
                            ticks: {
                                stepSize: 1,
                                font: { family: getFont() }
                            },
                            grid: {
                                drawBorder: false,
                                color: 'rgba(0, 0, 0, 0.08)'
                            },
                            position: currentLang === 'ar' ? 'right' : 'left'
                        },
                        x: {
                            ticks: {
                                font: { family: getFont() }
                            },
                            grid: { display: false },
                            barPercentage: 0.8,
                            categoryPercentage: 0.8
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });

            // جلب أنواع الطلبات والبيانات الإحصائية
            loadAvailableRequestTypes();

            // Initial language setting and chart update
            applyLanguage(currentLang);

            // Language toggle functionality
            if (langToggleBtn) {
                langToggleBtn.addEventListener('click', () => {
                    const newLang = currentLang === 'ar' ? 'en' : 'ar';
                    applyLanguage(newLang);
                });
            }

            // Functionality for Export Report button
            if (exportReportBtn) {
                exportReportBtn.addEventListener('click', () => {
                    exportGeneralRequestReport();
                });
            }

            // Functionality for Add Request button
            const addRequestBtn = document.getElementById('addRequestBtn');
            if (addRequestBtn) {
                addRequestBtn.addEventListener('click', () => {
                    showAddRequestModal();
                });
            }

            // Set active sidebar link
            const sidebarLinks = document.querySelectorAll('.sidebar-menu .menu-link');
            sidebarLinks.forEach(link => {
                link.parentElement.classList.remove('active');
                if (link.getAttribute('href') === 'general-requests.html') {
                    link.parentElement.classList.add('active');
                }
            });
        });

        // دالة لعرض نافذة إضافة شكوى جديدة
        function showAddRequestModal() {
            // التوجيه إلى صفحة إضافة شكوى جديدة
            window.location.href = '/New complaint/Newcomplaint.html';
        }