const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');

// جلب جميع الشكاوى
router.get('/all', complaintController.getAllComplaints);

// جلب جميع الأقسام
router.get('/departments', complaintController.getDepartments);

// جلب أنواع الشكاوى الرئيسية
router.get('/types', complaintController.getComplaintTypes);

// جلب التصنيفات الفرعية حسب النوع الرئيسي
router.get('/subtypes/:complaintTypeID', complaintController.getSubTypes);

// جلب جميع شكاوى المريض
router.get('/patient/:nationalId', complaintController.getPatientComplaints);

// جلب تفاصيل شكوى محددة
router.get('/details/:complaintId', complaintController.getComplaintDetails);

// حفظ شكوى جديدة مع المرفقات
router.post('/submit', complaintController.upload.array('attachments', 5), complaintController.submitComplaint);

module.exports = router; 