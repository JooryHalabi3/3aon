const mysql = require('mysql2/promise');

// قائمة كلمات المرور المحتملة
const possiblePasswords = [
    '',           // بدون كلمة مرور
    'root',       // كلمة مرور root
    'password',   // كلمة مرور password
    '123456',     // كلمة مرور 123456
    'admin',      // كلمة مرور admin
    'mysql',      // كلمة مرور mysql
    'root123',    // كلمة مرور root123
    '1234',       // كلمة مرور 1234
    '0000',       // كلمة مرور 0000
    'root@123'    // كلمة مرور root@123
];

async function testConnection(password) {
    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: password,
        database: 'aounak',
        charset: 'utf8mb4'
    };

    try {
        console.log(`🔧 اختبار الاتصال بكلمة المرور: "${password}"`);
        const connection = await mysql.createConnection(dbConfig);
        
        // اختبار استعلام بسيط
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log(`✅ نجح الاتصال بكلمة المرور: "${password}"`);
        
        // فحص الجداول الموجودة
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`📋 عدد الجداول الموجودة: ${tables.length}`);
        
        await connection.end();
        return password;
        
    } catch (error) {
        console.log(`❌ فشل الاتصال بكلمة المرور: "${password}" - ${error.code}`);
        return null;
    }
}

async function findCorrectPassword() {
    console.log('🔍 البحث عن كلمة المرور الصحيحة...\n');
    
    for (const password of possiblePasswords) {
        const result = await testConnection(password);
        if (result) {
            console.log(`\n🎉 تم العثور على كلمة المرور الصحيحة: "${result}"`);
            return result;
        }
    }
    
    console.log('\n❌ لم يتم العثور على كلمة مرور صحيحة');
    console.log('💡 يرجى التحقق من إعدادات MySQL أو إدخال كلمة المرور يدوياً');
    return null;
}

// تشغيل الاختبار
findCorrectPassword();
