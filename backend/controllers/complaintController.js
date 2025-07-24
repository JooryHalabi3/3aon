const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// إعداد multer لرفع الملفات
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB
  },
  fileFilter: function (req, file, cb) {
    // السماح بالصور وملفات PDF
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مسموح به. يسمح فقط بالصور وملفات PDF.'), false);
    }
  }
});

// جلب جميع الأقسام
const getDepartments = async (req, res) => {
  try {
    const [departments] = await pool.execute(
      'SELECT DepartmentID, DepartmentName, Description FROM Departments ORDER BY DepartmentName'
    );
    
    res.json({
      success: true,
      data: departments
    });

  } catch (error) {
    console.error('خطأ في جلب الأقسام:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// جلب أنواع الشكاوى الرئيسية
const getComplaintTypes = async (req, res) => {
  try {
    const [types] = await pool.execute(
      'SELECT ComplaintTypeID, TypeName, Description FROM ComplaintTypes ORDER BY TypeName'
    );
    
    res.json({
      success: true,
      data: types
    });

  } catch (error) {
    console.error('خطأ في جلب أنواع الشكاوى:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// جلب التصنيفات الفرعية حسب النوع الرئيسي
const getSubTypes = async (req, res) => {
  try {
    const { complaintTypeID } = req.params;

    if (!complaintTypeID) {
      return res.status(400).json({ 
        success: false, 
        message: 'معرف نوع الشكوى مطلوب' 
      });
    }

    const [subTypes] = await pool.execute(
      `SELECT SubTypeID, SubTypeName, Description 
       FROM ComplaintSubTypes 
       WHERE ComplaintTypeID = ? 
       ORDER BY SubTypeName`,
      [complaintTypeID]
    );
    
    res.json({
      success: true,
      data: subTypes
    });

  } catch (error) {
    console.error('خطأ في جلب التصنيفات الفرعية:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// جلب جميع شكاوى المريض
const getPatientComplaints = async (req, res) => {
  try {
    const { nationalId } = req.params;

    if (!nationalId) {
      return res.status(400).json({ 
        success: false, 
        message: 'رقم الهوية مطلوب' 
      });
    }

    // جلب بيانات المريض وشكاويه
    const [complaints] = await pool.execute(
      `SELECT 
        c.ComplaintID,
        c.ComplaintDate,
        c.ComplaintDetails,
        c.CurrentStatus,
        c.Priority,
        c.ResolutionDetails,
        c.ResolutionDate,
        p.FullName as PatientName,
        p.NationalID_Iqama,
        p.ContactNumber,
        p.Gender,
        d.DepartmentName,
        ct.TypeName as ComplaintTypeName,
        cst.SubTypeName,
        e.FullName as EmployeeName
       FROM Complaints c
       JOIN Patients p ON c.PatientID = p.PatientID
       JOIN Departments d ON c.DepartmentID = d.DepartmentID
       JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
       LEFT JOIN ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
       LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
       WHERE p.NationalID_Iqama = ?
       ORDER BY c.ComplaintDate DESC`,
      [nationalId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'لا توجد شكاوى لهذا المريض' 
      });
    }

    // جلب سجل التاريخ لكل شكوى
    const complaintsWithHistory = await Promise.all(
      complaints.map(async (complaint) => {
        const [history] = await pool.execute(
          `SELECT 
            ch.Stage,
            ch.Remarks,
            ch.Timestamp,
            ch.OldStatus,
            ch.NewStatus,
            e.FullName as EmployeeName
           FROM ComplaintHistory ch
           LEFT JOIN Employees e ON ch.EmployeeID = e.EmployeeID
           WHERE ch.ComplaintID = ?
           ORDER BY ch.Timestamp DESC`,
          [complaint.ComplaintID]
        );

        return {
          ...complaint,
          history: history
        };
      })
    );

    res.json({
      success: true,
      data: {
        patient: {
          name: complaints[0].PatientName,
          nationalId: complaints[0].NationalID_Iqama,
          contactNumber: complaints[0].ContactNumber,
          gender: complaints[0].Gender
        },
        complaints: complaintsWithHistory
      }
    });

  } catch (error) {
    console.error('خطأ في جلب شكاوى المريض:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// جلب تفاصيل شكوى محددة مع المرفقات
const getComplaintDetails = async (req, res) => {
  try {
    const { complaintId } = req.params;

    if (!complaintId) {
      return res.status(400).json({ 
        success: false, 
        message: 'معرف الشكوى مطلوب' 
      });
    }

    // جلب تفاصيل الشكوى مع جميع البيانات المرتبطة
    const [complaints] = await pool.execute(
      `SELECT 
        c.ComplaintID,
        c.ComplaintDate,
        c.ComplaintDetails,
        c.CurrentStatus,
        c.Priority,
        c.ResolutionDetails,
        c.ResolutionDate,
        p.FullName as PatientName,
        p.NationalID_Iqama,
        p.ContactNumber,
        p.Gender,
        d.DepartmentName,
        ct.TypeName as ComplaintTypeName,
        cst.SubTypeName,
        e.FullName as EmployeeName
       FROM Complaints c
       JOIN Patients p ON c.PatientID = p.PatientID
       JOIN Departments d ON c.DepartmentID = d.DepartmentID
       JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
       LEFT JOIN ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
       LEFT JOIN Employees e ON c.EmployeeID = e.EmployeeID
       WHERE c.ComplaintID = ?`,
      [complaintId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'الشكوى غير موجودة' 
      });
    }

    const complaint = complaints[0];

    // جلب المرفقات
    const [attachments] = await pool.execute(
      `SELECT 
        AttachmentID,
        FileName,
        FilePath,
        FileSize,
        FileType
       FROM ComplaintAttachments
       WHERE ComplaintID = ?
       ORDER BY AttachmentID`,
      [complaintId]
    );

    // جلب سجل التاريخ للشكوى
    const [history] = await pool.execute(
      `SELECT 
        ch.Stage,
        ch.Remarks,
        ch.Timestamp,
        ch.OldStatus,
        ch.NewStatus,
        e.FullName as EmployeeName
       FROM ComplaintHistory ch
       LEFT JOIN Employees e ON ch.EmployeeID = e.EmployeeID
       WHERE ch.ComplaintID = ?
       ORDER BY ch.Timestamp DESC`,
      [complaintId]
    );

    res.json({
      success: true,
      data: {
        complaint: {
          ...complaint,
          attachments: attachments,
          history: history
        }
      }
    });

  } catch (error) {
    console.error('خطأ في جلب تفاصيل الشكوى:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// جلب جميع الشكاوى
const getAllComplaints = async (req, res) => {
  try {
    const { 
      dateFilter = 'all',
      search = '',
      status = '',
      department = '',
      complaintType = ''
    } = req.query;

    console.log('معاملات الطلب:', req.query); // إضافة رسالة تصحيح

    let whereConditions = [];
    let queryParams = [];

    // فلتر التاريخ
    if (dateFilter && dateFilter !== 'all') {
      const days = parseInt(dateFilter);
      if (!isNaN(days)) {
        whereConditions.push('c.ComplaintDate >= DATE_SUB(NOW(), INTERVAL ? DAY)');
        queryParams.push(days);
      }
    }

    // فلتر البحث
    if (search && search.trim() !== '') {
      whereConditions.push('(c.ComplaintID LIKE ? OR p.FullName LIKE ? OR p.NationalID_Iqama LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // فلتر الحالة
    if (status && status.trim() !== '') {
      whereConditions.push('c.CurrentStatus = ?');
      queryParams.push(status.trim());
    }

    // فلتر القسم
    if (department && department.trim() !== '') {
      whereConditions.push('d.DepartmentName LIKE ?');
      queryParams.push(`%${department.trim()}%`);
    }

    // فلتر نوع الشكوى
    if (complaintType && complaintType.trim() !== '') {
      whereConditions.push('ct.TypeName LIKE ?');
      queryParams.push(`%${complaintType.trim()}%`);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    console.log('استعلام SQL:', `SELECT ... FROM Complaints c ... ${whereClause}`); // إضافة رسالة تصحيح
    console.log('معاملات الاستعلام:', queryParams); // إضافة رسالة تصحيح

    // جلب الشكاوى مع البيانات المرتبطة
    const [complaints] = await pool.execute(
      `SELECT 
        c.ComplaintID,
        c.ComplaintDate,
        c.ComplaintDetails,
        c.CurrentStatus,
        c.Priority,
        p.FullName as PatientName,
        p.NationalID_Iqama,
        p.ContactNumber,
        d.DepartmentName,
        ct.TypeName as ComplaintTypeName,
        cst.SubTypeName
       FROM Complaints c
       JOIN Patients p ON c.PatientID = p.PatientID
       JOIN Departments d ON c.DepartmentID = d.DepartmentID
       JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
       LEFT JOIN ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
       ${whereClause}
       ORDER BY c.ComplaintDate DESC
       LIMIT 50`,
      queryParams
    );

    console.log('عدد الشكاوى المطابقة:', complaints.length); // إضافة رسالة تصحيح

    res.json({
      success: true,
      data: complaints
    });

  } catch (error) {
    console.error('خطأ في جلب الشكاوى:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

// حفظ شكوى جديدة مع المرفقات
const submitComplaint = async (req, res) => {
  try {
    const {
      patientName,
      nationalId,
      gender,
      contactNumber,
      departmentID,
      visitDate,
      complaintTypeID,
      subTypeID,
      complaintDetails,
      employeeID = 1 // افتراضياً موظف رقم 1
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!patientName || !nationalId || !gender || !contactNumber || 
        !departmentID || !visitDate || !complaintTypeID || !complaintDetails) {
      return res.status(400).json({ 
        success: false, 
        message: 'جميع الحقول المطلوبة يجب أن تكون مملوءة' 
      });
    }

    // التحقق من وجود المريض أو إضافته
    let patientID;
    const [existingPatients] = await pool.execute(
      'SELECT PatientID FROM Patients WHERE NationalID_Iqama = ?',
      [nationalId]
    );

    if (existingPatients.length > 0) {
      patientID = existingPatients[0].PatientID;
    } else {
      // إضافة مريض جديد
      const [newPatient] = await pool.execute(
        `INSERT INTO Patients (FullName, NationalID_Iqama, ContactNumber, Gender) 
         VALUES (?, ?, ?, ?)`,
        [patientName, nationalId, contactNumber, gender]
      );
      patientID = newPatient.insertId;
    }

    // إضافة الشكوى
    const [complaintResult] = await pool.execute(
      `INSERT INTO Complaints (
        PatientID, EmployeeID, ComplaintTypeID, SubTypeID, DepartmentID, 
        ComplaintDate, ComplaintDetails, CurrentStatus, Priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientID,
        employeeID,
        complaintTypeID,
        subTypeID,
        departmentID,
        new Date(),
        complaintDetails,
        'جديدة',
        'متوسطة'
      ]
    );

    const complaintID = complaintResult.insertId;

    // حفظ المرفقات إذا وجدت
    let attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const [attachmentResult] = await pool.execute(
          `INSERT INTO ComplaintAttachments (
            ComplaintID, FileName, FilePath, FileSize, FileType
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            complaintID,
            file.originalname,
            file.filename,
            file.size,
            file.mimetype
          ]
        );
        
        attachments.push({
          id: attachmentResult.insertId,
          name: file.originalname,
          path: file.filename,
          size: file.size,
          type: file.mimetype
        });
      }
    }

    // إضافة سجل في تاريخ الشكوى
    await pool.execute(
      `INSERT INTO ComplaintHistory (
        ComplaintID, EmployeeID, Stage, Remarks, OldStatus, NewStatus
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        complaintID,
        employeeID,
        'تم تقديم الشكوى',
        'تم استلام الشكوى بنجاح',
        '',
        'جديدة'
      ]
    );

    // الحصول على بيانات الشكوى المحدثة
    const [complaints] = await pool.execute(
      `SELECT c.*, p.FullName as PatientName, p.NationalID_Iqama, p.ContactNumber, p.Gender,
              d.DepartmentName, ct.TypeName as ComplaintTypeName, cst.SubTypeName
       FROM Complaints c
       JOIN Patients p ON c.PatientID = p.PatientID
       JOIN Departments d ON c.DepartmentID = d.DepartmentID
       JOIN ComplaintTypes ct ON c.ComplaintTypeID = ct.ComplaintTypeID
       LEFT JOIN ComplaintSubTypes cst ON c.SubTypeID = cst.SubTypeID
       WHERE c.ComplaintID = ?`,
      [complaintID]
    );

    if (complaints.length === 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'حدث خطأ أثناء حفظ الشكوى' 
      });
    }

    res.status(201).json({
      success: true,
      message: 'تم حفظ الشكوى بنجاح',
      data: {
        complaint: complaints[0],
        complaintID,
        attachments
      }
    });

  } catch (error) {
    console.error('خطأ في حفظ الشكوى:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم' 
    });
  }
};

module.exports = {
  getDepartments,
  getComplaintTypes,
  getSubTypes,
  getPatientComplaints,
  getComplaintDetails,
  getAllComplaints,
  submitComplaint,
  upload
}; 