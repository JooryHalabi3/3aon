-- إعداد نوع الشكوى لبلاغات سوء التعامل
-- قم بتشغيل هذا الملف في قاعدة البيانات الخاصة بك

-- التحقق من وجود نوع الشكوى وإضافته إذا لم يكن موجوداً
INSERT IGNORE INTO ComplaintTypes (TypeName, Description) 
VALUES ('الكوادر الصحية وسلوكهم', 'بلاغات تتعلق بسلوك الكوادر الصحية');

-- التحقق من وجود الأنواع الفرعية وإضافتها إذا لم تكن موجودة
INSERT IGNORE INTO ComplaintSubTypes (SubTypeName, ComplaintTypeID) 
SELECT 'سوء تعامل مع المريض', ComplaintTypeID 
FROM ComplaintTypes 
WHERE TypeName = 'الكوادر الصحية وسلوكهم';

INSERT IGNORE INTO ComplaintSubTypes (SubTypeName, ComplaintTypeID) 
SELECT 'إهمال في الرعاية', ComplaintTypeID 
FROM ComplaintTypes 
WHERE TypeName = 'الكوادر الصحية وسلوكهم';

INSERT IGNORE INTO ComplaintSubTypes (SubTypeName, ComplaintTypeID) 
SELECT 'عدم احترام خصوصية المريض', ComplaintTypeID 
FROM ComplaintTypes 
WHERE TypeName = 'الكوادر الصحية وسلوكهم';

INSERT IGNORE INTO ComplaintSubTypes (SubTypeName, ComplaintTypeID) 
SELECT 'سوء تعامل مع المرافقين', ComplaintTypeID 
FROM ComplaintTypes 
WHERE TypeName = 'الكوادر الصحية وسلوكهم';

INSERT IGNORE INTO ComplaintSubTypes (SubTypeName, ComplaintTypeID) 
SELECT 'عدم الالتزام بالبروتوكولات الطبية', ComplaintTypeID 
FROM ComplaintTypes 
WHERE TypeName = 'الكوادر الصحية وسلوكهم';

-- عرض النتائج
SELECT 'تم إعداد نوع الشكوى لبلاغات سوء التعامل بنجاح' as Status;

-- عرض الأنواع الفرعية المضافة
SELECT cst.SubTypeName, ct.TypeName
FROM ComplaintSubTypes cst
JOIN ComplaintTypes ct ON cst.ComplaintTypeID = ct.ComplaintTypeID
WHERE ct.TypeName = 'الكوادر الصحية وسلوكهم'; 