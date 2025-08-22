// Department Management JavaScript

// Global variables
let currentComplaintId = null;
let departmentEmployees = [];
let departmentComplaints = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    checkAdminPermissions();
    initializePage();
    setupLanguageToggle();
});

// التحقق من أن المستخدم Admin
async function checkAdminPermissions() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login/login.html';
            return;
        }

        const response = await fetch('http://localhost:3001/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get user info');
        }

        const userData = await response.json();
        
        // التحقق من أن المستخدم Admin أو Super Admin
        if (userData.data.roleID !== 1 && userData.data.roleID !== 3) {
            document.getElementById('accessDenied').style.display = 'flex';
            return;
        }

        // إخفاء نظام الحماية
        document.getElementById('accessDenied').style.display = 'none';
        
    } catch (error) {
        console.error('Error checking admin permissions:', error);
        document.getElementById('accessDenied').style.display = 'flex';
    }
}

// Initialize page data
async function initializePage() {
    showLoading(true);
    
    try {
        // Load department info and statistics
        await loadDepartmentInfo();
        await loadDepartmentEmployees();
        await loadDepartmentComplaints();
        updateStatistics();
        
        showLoading(false);
    } catch (error) {
        console.error('Error initializing page:', error);
        showLoading(false);
        showError('حدث خطأ في تحميل البيانات');
    }
}

// Load department information
async function loadDepartmentInfo() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Get user info from token to determine department
        const response = await fetch('http://localhost:3001/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get user info');
        }

        const userData = await response.json();
        
        if (userData.data.departmentID) {
            document.getElementById('departmentName').textContent = userData.data.departmentName || 'قسم غير محدد';
            document.getElementById('departmentDescription').textContent = `إدارة شكاوى وموظفي ${userData.data.departmentName || 'القسم'}`;
        } else {
            document.getElementById('departmentName').textContent = 'قسم غير محدد';
            document.getElementById('departmentDescription').textContent = 'يجب ربط المدير بقسم معين';
        }
    } catch (error) {
        console.error('Error loading department info:', error);
        document.getElementById('departmentName').textContent = 'خطأ في تحميل معلومات القسم';
    }
}

// Load department employees
async function loadDepartmentEmployees() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:3001/api/admin/department/employees', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load department employees');
        }

        const data = await response.json();
        departmentEmployees = data.data;
        
        displayEmployees(departmentEmployees);
        populateEmployeeSelect(departmentEmployees);
        
    } catch (error) {
        console.error('Error loading department employees:', error);
        showError('حدث خطأ في تحميل موظفي القسم');
    }
}

// Display employees in table
function displayEmployees(employees) {
    const tbody = document.getElementById('employeesTableBody');
    const noDataMessage = document.getElementById('noEmployeesMessage');
    
    if (employees.length === 0) {
        tbody.innerHTML = '';
        noDataMessage.style.display = 'block';
        return;
    }
    
    noDataMessage.style.display = 'none';
    
    tbody.innerHTML = employees.map(employee => `
        <tr>
            <td>${employee.FullName}</td>
            <td>${employee.Email || 'غير محدد'}</td>
            <td>${employee.PhoneNumber || 'غير محدد'}</td>
            <td>${employee.RoleName || 'غير محدد'}</td>
            <td>${formatDate(employee.HireDate)}</td>
            <td>
                <span class="status-badge active">نشط</span>
            </td>
        </tr>
    `).join('');
}

// Load department complaints
async function loadDepartmentComplaints() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:3001/api/admin/department/complaints', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load department complaints');
        }

        const data = await response.json();
        departmentComplaints = data.data;
        
        displayComplaints(departmentComplaints);
        
    } catch (error) {
        console.error('Error loading department complaints:', error);
        showError('حدث خطأ في تحميل شكاوى القسم');
    }
}

// Display complaints in table
function displayComplaints(complaints) {
    const tbody = document.getElementById('complaintsTableBody');
    const noDataMessage = document.getElementById('noComplaintsMessage');
    
    if (complaints.length === 0) {
        tbody.innerHTML = '';
        noDataMessage.style.display = 'block';
        return;
    }
    
    noDataMessage.style.display = 'none';
    
    tbody.innerHTML = complaints.map(complaint => `
        <tr>
            <td>${complaint.ComplaintID}</td>
            <td>${formatDate(complaint.ComplaintDate)}</td>
            <td>${complaint.PatientName || 'غير محدد'}</td>
            <td>${complaint.ComplaintType || 'غير محدد'}</td>
            <td>
                <span class="status-badge ${getStatusClass(complaint.CurrentStatus)}">
                    ${complaint.CurrentStatus}
                </span>
            </td>
            <td>${complaint.AssignedEmployeeName || 'غير معينة'}</td>
            <td>
                <button class="action-btn view" onclick="viewComplaintDetails(${complaint.ComplaintID})">
                    عرض التفاصيل
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter complaints by status
function filterComplaints() {
    const statusFilter = document.getElementById('statusFilter').value;
    
    if (!statusFilter) {
        displayComplaints(departmentComplaints);
        return;
    }
    
    const filteredComplaints = departmentComplaints.filter(complaint => 
        complaint.CurrentStatus === statusFilter
    );
    
    displayComplaints(filteredComplaints);
}

// View complaint details
async function viewComplaintDetails(complaintId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:3001/api/admin/complaints/${complaintId}/details`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load complaint details');
        }

        const data = await response.json();
        const complaint = data.data;
        
        // Populate modal with complaint details
        document.getElementById('modalComplaintId').textContent = complaint.ComplaintID;
        document.getElementById('modalPatientName').textContent = complaint.PatientName || 'غير محدد';
        document.getElementById('modalComplaintType').textContent = complaint.ComplaintType || 'غير محدد';
        document.getElementById('modalComplaintDetails').textContent = complaint.ComplaintDetails || 'لا توجد تفاصيل';
        document.getElementById('modalCurrentStatus').textContent = complaint.CurrentStatus || 'غير محدد';
        document.getElementById('modalAssignedTo').textContent = complaint.AssignedEmployeeName || 'غير معينة';
        
        // Load assignment history
        await loadAssignmentHistory(complaintId);
        
        // Store current complaint ID
        currentComplaintId = complaintId;
        
        // Show modal
        document.getElementById('complaintModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading complaint details:', error);
        showError('حدث خطأ في تحميل تفاصيل الشكوى');
    }
}

// Load assignment history
async function loadAssignmentHistory(complaintId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:3001/api/admin/complaints/${complaintId}/assignments`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load assignment history');
        }

        const data = await response.json();
        const assignments = data.data;
        
        displayAssignmentHistory(assignments);
        
    } catch (error) {
        console.error('Error loading assignment history:', error);
        document.getElementById('assignmentsHistory').innerHTML = '<p>حدث خطأ في تحميل سجل التعيينات</p>';
    }
}

// Display assignment history
function displayAssignmentHistory(assignments) {
    const historyContainer = document.getElementById('assignmentsHistory');
    
    if (assignments.length === 0) {
        historyContainer.innerHTML = '<p>لا يوجد سجل تعيينات</p>';
        return;
    }
    
    historyContainer.innerHTML = assignments.map(assignment => `
        <div class="history-item">
            <div class="history-item-header">
                <span class="history-item-date">${formatDate(assignment.AssignedAt)}</span>
                <span class="history-item-status ${assignment.Status}">${getStatusText(assignment.Status)}</span>
            </div>
            <div class="history-item-details">
                <strong>تم التعيين بواسطة:</strong> ${assignment.AssignedByName || 'غير محدد'}<br>
                <strong>تم التعيين إلى:</strong> ${assignment.AssignedToName || 'غير محدد'}<br>
                ${assignment.Reason ? `<strong>السبب:</strong> ${assignment.Reason}` : ''}
            </div>
        </div>
    `).join('');
}

// Assign complaint to employee
async function assignComplaint() {
    const employeeId = document.getElementById('employeeSelect').value;
    const reason = document.getElementById('assignmentReason').value;
    
    if (!employeeId) {
        showError('يرجى اختيار موظف');
        return;
    }
    
    if (!currentComplaintId) {
        showError('خطأ في معرف الشكوى');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:3001/api/admin/complaints/${currentComplaintId}/assign`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                employeeId: parseInt(employeeId),
                reason: reason || null
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to assign complaint');
        }

        const data = await response.json();
        
        // Show success message
        showSuccess(data.message);
        
        // Close modal
        closeComplaintModal();
        
        // Refresh data
        await loadDepartmentComplaints();
        updateStatistics();
        
    } catch (error) {
        console.error('Error assigning complaint:', error);
        showError(error.message || 'حدث خطأ في تعيين الشكوى');
    }
}

// Populate employee select dropdown
function populateEmployeeSelect(employees) {
    const select = document.getElementById('employeeSelect');
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="" data-ar="اختر موظف..." data-en="Select employee...">اختر موظف...</option>';
    
    // Add employee options
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.EmployeeID;
        option.textContent = `${employee.FullName} (${employee.RoleName || 'غير محدد'})`;
        select.appendChild(option);
    });
}

// Update statistics
function updateStatistics() {
    document.getElementById('totalEmployees').textContent = departmentEmployees.length;
    document.getElementById('totalComplaints').textContent = departmentComplaints.length;
    
    const pendingComplaints = departmentComplaints.filter(c => c.CurrentStatus === 'جديدة').length;
    document.getElementById('pendingComplaints').textContent = pendingComplaints;
    
    const assignedComplaints = departmentComplaints.filter(c => c.AssignedEmployeeName).length;
    document.getElementById('assignedComplaints').textContent = assignedComplaints;
}

// Tab functionality
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Refresh functions
async function refreshEmployees() {
    await loadDepartmentEmployees();
    updateStatistics();
}

async function refreshComplaints() {
    await loadDepartmentComplaints();
    updateStatistics();
}

// Modal functions
function closeComplaintModal() {
    document.getElementById('complaintModal').style.display = 'none';
    currentComplaintId = null;
    
    // Clear form
    document.getElementById('employeeSelect').value = '';
    document.getElementById('assignmentReason').value = '';
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusClass(status) {
    switch (status) {
        case 'جديدة':
            return 'new';
        case 'قيد المعالجة':
            return 'in-progress';
        case 'مغلقة':
            return 'closed';
        default:
            return 'default';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'assigned':
            return 'معينة';
        case 'reassigned':
            return 'إعادة تعيين';
        case 'accepted':
            return 'مقبولة';
        case 'rejected':
            return 'مرفوضة';
        case 'completed':
            return 'مكتملة';
        default:
            return status;
    }
}

// Loading and error handling
function showLoading(show) {
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.style.display = show ? 'block' : 'none';
}

function showError(message) {
    // You can implement a toast notification system here
    alert(message);
}

function showSuccess(message) {
    // You can implement a toast notification system here
    alert(message);
}

// Language toggle functionality
function setupLanguageToggle() {
    const langToggle = document.getElementById('langToggle');
    const langText = document.getElementById('langText');
    
    langToggle.addEventListener('click', function() {
        const currentLang = document.documentElement.lang;
        const newLang = currentLang === 'ar' ? 'en' : 'ar';
        
        // Update document language
        document.documentElement.lang = newLang;
        document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
        
        // Update language text
        langText.textContent = newLang === 'ar' ? 'العربية | English' : 'English | العربية';
        
        // Update all translatable elements
        updateLanguageElements(newLang);
    });
}

function updateLanguageElements(lang) {
    const elements = document.querySelectorAll('[data-ar][data-en]');
    elements.forEach(element => {
        element.textContent = element.getAttribute(`data-${lang}`);
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('complaintModal');
    if (event.target === modal) {
        closeComplaintModal();
    }
}
