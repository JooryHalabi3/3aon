const pool = require('../config/database');

// إنشاء جدول الطلبات العامة إذا لم يكن موجوداً
const createGeneralRequestsTable = async () => {
    try {
        console.log('🔧 التحقق من وجود جدول الطلبات العامة...');
        
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS GeneralRequests (
                RequestID INT AUTO_INCREMENT PRIMARY KEY,
                RequestType VARCHAR(100) NOT NULL,
                RequestDate DATETIME DEFAULT CURRENT_TIMESTAMP,
                RequestDetails TEXT,
                IsFulfilled TINYINT(1) DEFAULT 0,
                FulfillmentDate DATETIME NULL,
                ResponsibleEmployeeID INT NULL,
                CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (ResponsibleEmployeeID) REFERENCES Employees(EmployeeID) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        await pool.execute(createTableQuery);
        console.log('✅ جدول الطلبات العامة جاهز');
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء جدول الطلبات العامة:', error);
    }
};

// استدعاء إنشاء الجدول عند بدء التشغيل
createGeneralRequestsTable();

// إضافة بيانات تجريبية للطلبات العامة
const addSampleGeneralRequests = async () => {
    try {
        console.log('📝 إضافة بيانات تجريبية للطلبات العامة...');
        
        // التحقق من وجود بيانات
        const [existingData] = await pool.execute('SELECT COUNT(*) as count FROM GeneralRequests');
        
        if (existingData[0].count === 0) {
            console.log('📊 إضافة بيانات تجريبية للطلبات العامة...');
            
            // بيانات تجريبية للطلبات العامة
            const sampleRequests = [
                {
                    RequestType: 'قسم الطوارئ',
                    RequestDetails: 'طلب معدات طوارئ إضافية',
                    IsFulfilled: 1,
                    FulfillmentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
                },
                {
                    RequestType: 'قسم الطوارئ',
                    RequestDetails: 'طلب صيانة أجهزة الإنعاش',
                    IsFulfilled: 0,
                    FulfillmentDate: null
                },
                {
                    RequestType: 'قسم العيادات الخارجية',
                    RequestDetails: 'طلب زيادة عدد الكراسي في منطقة الانتظار',
                    IsFulfilled: 1,
                    FulfillmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
                },
                {
                    RequestType: 'قسم العيادات الخارجية',
                    RequestDetails: 'طلب تحسين نظام المواعيد',
                    IsFulfilled: 0,
                    FulfillmentDate: null
                },
                {
                    RequestType: 'قسم الصيدلية',
                    RequestDetails: 'طلب تحديث قائمة الأدوية المتوفرة',
                    IsFulfilled: 1,
                    FulfillmentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
                },
                {
                    RequestType: 'قسم الصيدلية',
                    RequestDetails: 'طلب تدريب إضافي للصيادلة',
                    IsFulfilled: 0,
                    FulfillmentDate: null
                },
                {
                    RequestType: 'قسم المختبرات الطبية',
                    RequestDetails: 'طلب معدات مختبر جديدة',
                    IsFulfilled: 1,
                    FulfillmentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
                },
                {
                    RequestType: 'قسم المختبرات الطبية',
                    RequestDetails: 'طلب تحسين نظام إدارة العينات',
                    IsFulfilled: 0,
                    FulfillmentDate: null
                },
                {
                    RequestType: 'قسم الأشعة',
                    RequestDetails: 'طلب صيانة أجهزة الأشعة',
                    IsFulfilled: 1,
                    FulfillmentDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
                },
                {
                    RequestType: 'قسم الأشعة',
                    RequestDetails: 'طلب تدريب فنيي الأشعة',
                    IsFulfilled: 0,
                    FulfillmentDate: null
                }
            ];
            
            for (const request of sampleRequests) {
                await pool.execute(`
                    INSERT INTO GeneralRequests 
                    (RequestType, RequestDetails, IsFulfilled, FulfillmentDate)
                    VALUES (?, ?, ?, ?)
                `, [
                    request.RequestType,
                    request.RequestDetails,
                    request.IsFulfilled,
                    request.FulfillmentDate
                ]);
            }
            
            console.log('✅ تم إضافة البيانات التجريبية بنجاح');
            console.log(`📊 تم إضافة ${sampleRequests.length} طلب تجريبي`);
        } else {
            console.log('📊 البيانات موجودة بالفعل في قاعدة البيانات');
        }
        
    } catch (error) {
        console.error('❌ خطأ في إضافة البيانات التجريبية:', error);
    }
};

// استدعاء إضافة البيانات التجريبية عند بدء التشغيل
addSampleGeneralRequests();

// جلب إحصائيات الطلبات العامة
const getGeneralRequestStats = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        console.log('📊 جلب إحصائيات الشكاوى (مغلقة ومفتوحة):', { fromDate, toDate });
        
        // التحقق من صحة التواريخ
        if (fromDate && toDate) {
            const fromDateObj = new Date(fromDate);
            const toDateObj = new Date(toDate);
            
            if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'تواريخ غير صحيحة' 
                });
            }
            
            if (fromDateObj > toDateObj) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية' 
                });
            }
        }
        
        let whereClause = '';
        let params = [];
        
        if (fromDate && toDate) {
            whereClause = 'WHERE c.ComplaintDate BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        // إحصائيات عامة للشكاوى
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalComplaints,
                SUM(CASE WHEN c.CurrentStatus = 'مغلقة' THEN 1 ELSE 0 END) as closedComplaints,
                SUM(CASE WHEN c.CurrentStatus != 'مغلقة' THEN 1 ELSE 0 END) as openComplaints
            FROM Complaints c
            INNER JOIN Departments d ON c.DepartmentID = d.DepartmentID
            ${whereClause}
        `, params);
        
        // إحصائيات حسب القسم - فقط الأقسام التي تحتوي على شكاوى
        const [departmentStats] = await pool.execute(`
            SELECT 
                d.DepartmentID,
                d.DepartmentName,
                COUNT(c.ComplaintID) as complaintCount,
                SUM(CASE WHEN c.CurrentStatus = 'مغلقة' THEN 1 ELSE 0 END) as closedCount,
                SUM(CASE WHEN c.CurrentStatus != 'مغلقة' THEN 1 ELSE 0 END) as openCount
            FROM Departments d
            INNER JOIN Complaints c ON d.DepartmentID = c.DepartmentID
            ${whereClause ? whereClause.replace('c.ComplaintDate', 'c.ComplaintDate') : ''}
            GROUP BY d.DepartmentID, d.DepartmentName
            HAVING complaintCount > 0
            ORDER BY complaintCount DESC
        `, params);
        
        // إحصائيات حسب نوع الشكوى
        const [typeStats] = await pool.execute(`
            SELECT 
                ct.ComplaintTypeID,
                ct.TypeName,
                COUNT(c.ComplaintID) as complaintCount,
                SUM(CASE WHEN c.CurrentStatus = 'مغلقة' THEN 1 ELSE 0 END) as closedCount,
                SUM(CASE WHEN c.CurrentStatus != 'مغلقة' THEN 1 ELSE 0 END) as openCount
            FROM ComplaintTypes ct
            INNER JOIN Complaints c ON ct.ComplaintTypeID = c.ComplaintTypeID
            ${whereClause ? whereClause.replace('c.ComplaintDate', 'c.ComplaintDate') : ''}
            GROUP BY ct.ComplaintTypeID, ct.TypeName
            HAVING complaintCount > 0
            ORDER BY complaintCount DESC
        `, params);
        
        // معالجة النتائج الفارغة
        const generalStats = stats[0] || {
            totalComplaints: 0,
            closedComplaints: 0,
            openComplaints: 0
        };
        
        console.log('📈 الإحصائيات العامة:', generalStats);
        console.log('📊 الإحصائيات حسب القسم:', departmentStats);
        console.log('👥 الإحصائيات حسب النوع:', typeStats);
        
        // إضافة تصحيح إضافي للتأكد من البيانات
        if (departmentStats && departmentStats.length > 0) {
            console.log('🔍 تفاصيل الأقسام التي لديها شكاوى:');
            departmentStats.forEach((dept, index) => {
                console.log(`${index + 1}. ${dept.DepartmentName}: ${dept.complaintCount} شكوى (مغلقة: ${dept.closedCount}, مفتوحة: ${dept.openCount})`);
            });
        } else {
            console.log('⚠️ لا توجد أقسام لديها شكاوى!');
        }
        
        // إضافة تصحيح لمعرفة جميع حالات الشكاوى في قاعدة البيانات
        console.log('🔍 التحقق من حالات الشكاوى في قاعدة البيانات...');
        const [statusCheck] = await pool.execute(`
            SELECT 
                c.CurrentStatus,
                COUNT(*) as count
            FROM Complaints c
            GROUP BY c.CurrentStatus
            ORDER BY count DESC
        `);
        console.log('📊 حالات الشكاوى في قاعدة البيانات:', statusCheck);
        
        // التحقق من أن الاستعلام يعمل بشكل صحيح
        console.log('🔍 التحقق من صحة الاستعلام...');
        const [testQuery] = await pool.execute(`
            SELECT 
                d.DepartmentName,
                c.CurrentStatus,
                COUNT(*) as count
            FROM Departments d
            INNER JOIN Complaints c ON d.DepartmentID = c.DepartmentID
            GROUP BY d.DepartmentName, c.CurrentStatus
            ORDER BY d.DepartmentName, c.CurrentStatus
        `);
        console.log('📊 نتائج الاستعلام التفصيلية:', testQuery);
        
        res.json({
            success: true,
            data: {
                general: generalStats,
                byDepartment: departmentStats || [],
                byType: typeStats || []
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات الشكاوى:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب الإحصائيات',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// جلب أنواع الطلبات المتاحة (الأقسام من جدول Departments)
const getAvailableRequestTypes = async (req, res) => {
    try {
        console.log('📋 جلب الأقسام المتاحة من قاعدة البيانات...');
        
        // جلب فقط الأقسام التي تحتوي على شكاوى
        const [departments] = await pool.execute(`
            SELECT DISTINCT d.DepartmentID, d.DepartmentName, d.Description
            FROM Departments d
            INNER JOIN Complaints c ON d.DepartmentID = c.DepartmentID
            GROUP BY d.DepartmentID, d.DepartmentName, d.Description
            HAVING COUNT(c.ComplaintID) > 0
            ORDER BY d.DepartmentName
        `);
        
        console.log('📊 الأقسام المتاحة:', departments);
        
        res.json({
            success: true,
            data: departments.map(dept => ({
                id: dept.DepartmentID,
                name: dept.DepartmentName,
                description: dept.Description
            }))
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب الأقسام:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب الأقسام',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// جلب بيانات الشكاوى للتصدير
const getGeneralRequestsForExport = async (req, res) => {
    try {
        const { fromDate, toDate, includeEmployeeData } = req.query;
        
        console.log('📊 جلب بيانات الشكاوى للتصدير:', { fromDate, toDate, includeEmployeeData });
        
        let whereClause = '';
        let params = [];
        
        if (fromDate && toDate) {
            whereClause = 'WHERE c.ComplaintDate BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        let selectClause = `
            c.ComplaintID,
            c.ComplaintDate,
            c.ComplaintDetails,
            c.CurrentStatus,
            c.Priority,
            d.DepartmentName,
            ct.TypeName as ComplaintTypeName,
            p.FullName as PatientName,
            p.NationalID_Iqama
        `;
        
        if (includeEmployeeData === 'true') {
            selectClause += `, e.FullName as EmployeeName`;
        }
        
        const [complaints] = await pool.execute(`
            SELECT ${selectClause}
            FROM Complaints c
            INNER JOIN Departments d ON c.DepartmentID = d.DepartmentID
            LEFT JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
            LEFT JOIN Patients p ON c.PatientID = p.PatientID
            LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
            ${whereClause}
            ORDER BY c.ComplaintDate DESC
        `, params);
        
        console.log('📈 عدد الشكاوى للتصدير:', complaints.length);
        
        res.json({
            success: true,
            data: {
                requests: complaints || []
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب بيانات التصدير:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب بيانات التصدير',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// جلب التحليل والاقتراحات
const getGeneralRequestAnalysis = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        
        console.log('📊 جلب تحليل الطلبات العامة:', { fromDate, toDate });
        
        let whereClause = '';
        let params = [];
        
        if (fromDate && toDate) {
            whereClause = 'WHERE gr.RequestDate BETWEEN ? AND ?';
            params = [fromDate, toDate];
        }
        
        // تحليل الأداء العام
        const [performanceStats] = await pool.execute(`
            SELECT 
                COUNT(*) as totalRequests,
                SUM(CASE WHEN gr.IsFulfilled = 1 THEN 1 ELSE 0 END) as fulfilledRequests,
                SUM(CASE WHEN gr.IsFulfilled = 0 THEN 1 ELSE 0 END) as unfulfilledRequests,
                ROUND((SUM(CASE WHEN gr.IsFulfilled = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as fulfillmentRate
            FROM GeneralRequests gr
            ${whereClause}
        `, params);
        
        // الأقسام الأكثر طلباً
        const [topDepartments] = await pool.execute(`
            SELECT 
                gr.RequestType,
                COUNT(*) as requestCount,
                SUM(CASE WHEN gr.IsFulfilled = 1 THEN 1 ELSE 0 END) as fulfilledCount,
                ROUND((SUM(CASE WHEN gr.IsFulfilled = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as fulfillmentRate
            FROM GeneralRequests gr
            ${whereClause}
            GROUP BY gr.RequestType
            ORDER BY requestCount DESC
            LIMIT 5
        `, params);
        
        // متوسط وقت الاستجابة
        const [responseTimeStats] = await pool.execute(`
            SELECT 
                AVG(DATEDIFF(gr.FulfillmentDate, gr.RequestDate)) as avgResponseDays
            FROM GeneralRequests gr
            WHERE gr.IsFulfilled = 1 AND gr.FulfillmentDate IS NOT NULL
            ${whereClause ? whereClause.replace('gr.RequestDate', 'gr.RequestDate') : ''}
        `, params);
        
        // اقتراحات التحسين
        const suggestions = [];
        
        if (performanceStats[0] && performanceStats[0].fulfillmentRate < 80) {
            suggestions.push({
                title: 'تحسين معدل التنفيذ',
                description: `معدل تنفيذ الطلبات ${performanceStats[0].fulfillmentRate}% أقل من المستهدف (80%). يجب تحسين سرعة الاستجابة للطلبات.`,
                priority: 'عالية',
                type: 'أداء'
            });
        }
        
        if (topDepartments.length > 0) {
            const slowestDepartment = topDepartments.find(dept => dept.fulfillmentRate < 70);
            if (slowestDepartment) {
                suggestions.push({
                    title: `تحسين أداء ${slowestDepartment.RequestType}`,
                    description: `قسم ${slowestDepartment.RequestType} لديه معدل تنفيذ ${slowestDepartment.fulfillmentRate}% فقط. يجب مراجعة إجراءات العمل.`,
                    priority: 'متوسطة',
                    type: 'قسم محدد'
                });
            }
        }
        
        if (responseTimeStats[0] && responseTimeStats[0].avgResponseDays > 7) {
            suggestions.push({
                title: 'تسريع الاستجابة للطلبات',
                description: `متوسط وقت الاستجابة ${responseTimeStats[0].avgResponseDays.toFixed(1)} أيام. يجب تقليل وقت الاستجابة.`,
                priority: 'عالية',
                type: 'وقت الاستجابة'
            });
        }
        
        res.json({
            success: true,
            data: {
                performance: performanceStats[0] || {},
                topDepartments: topDepartments || [],
                responseTime: responseTimeStats[0] || {},
                suggestions: suggestions
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في جلب التحليل:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في جلب التحليل',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// إضافة طلب جديد
const addGeneralRequest = async (req, res) => {
    try {
        const { RequestType, RequestDetails, ResponsibleEmployeeID } = req.body;
        
        console.log('📝 إضافة طلب جديد:', { RequestType, RequestDetails, ResponsibleEmployeeID });
        
        // التحقق من البيانات المطلوبة
        if (!RequestType || !RequestDetails) {
            return res.status(400).json({
                success: false,
                message: 'نوع الطلب وتفاصيل الطلب مطلوبان'
            });
        }
        
        // إضافة الطلب إلى قاعدة البيانات
        const [result] = await pool.execute(`
            INSERT INTO GeneralRequests (RequestType, RequestDetails, ResponsibleEmployeeID)
            VALUES (?, ?, ?)
        `, [RequestType, RequestDetails, ResponsibleEmployeeID || null]);
        
        console.log('✅ تم إضافة الطلب بنجاح، ID:', result.insertId);
        
        res.json({
            success: true,
            message: 'تم إضافة الطلب بنجاح',
            data: {
                RequestID: result.insertId,
                RequestType,
                RequestDetails,
                ResponsibleEmployeeID
            }
        });
        
    } catch (error) {
        console.error('❌ خطأ في إضافة الطلب:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إضافة الطلب',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// تحديث حالة الطلب
const updateRequestStatus = async (req, res) => {
    try {
        const { RequestID } = req.params;
        const { IsFulfilled, FulfillmentDate } = req.body;
        
        console.log('🔄 تحديث حالة الطلب:', { RequestID, IsFulfilled, FulfillmentDate });
        
        // التحقق من وجود الطلب
        const [existingRequest] = await pool.execute(
            'SELECT * FROM GeneralRequests WHERE RequestID = ?',
            [RequestID]
        );
        
        if (existingRequest.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }
        
        // تحديث حالة الطلب
        const updateQuery = `
            UPDATE GeneralRequests 
            SET IsFulfilled = ?, FulfillmentDate = ?
            WHERE RequestID = ?
        `;
        
        await pool.execute(updateQuery, [
            IsFulfilled ? 1 : 0,
            IsFulfilled ? (FulfillmentDate || new Date()) : null,
            RequestID
        ]);
        
        console.log('✅ تم تحديث حالة الطلب بنجاح');
        
        res.json({
            success: true,
            message: 'تم تحديث حالة الطلب بنجاح'
        });
        
    } catch (error) {
        console.error('❌ خطأ في تحديث حالة الطلب:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث حالة الطلب',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getGeneralRequestStats,
    getGeneralRequestsForExport,
    getGeneralRequestAnalysis,
    getAvailableRequestTypes,
    addGeneralRequest,
    updateRequestStatus
}; 