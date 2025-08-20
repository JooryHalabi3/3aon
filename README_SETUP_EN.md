# Request Tracking System Setup Guide

## 📋 Requirements

1. **MySQL Database**
2. **Node.js** (Version 14 or later)
3. **npm** or **yarn**

## 🚀 Setup Steps

### 1. Database Setup

Run the `setup_database.sql` file on your MySQL database:

```sql
-- In MySQL Workbench or phpMyAdmin
-- Run the contents of setup_database.sql file
```

Or from command line:

```bash
mysql -u username -p database_name < setup_database.sql
```

### 2. Start the Server

```bash
cd backend
npm install
npm start
```

The server will run on port 3001

### 3. Access the Application

Open your browser and go to:
```
http://localhost:3001/admin/request-tracking.html
```

## 📊 Added Data

### Departments
- Emergency Department
- Surgery Department
- Internal Medicine Department
- Pediatrics Department
- Obstetrics & Gynecology Department
- Radiology Department
- Laboratory Department
- Pharmacy Department
- Nursing Department
- Administration Department
- Information Technology Department
- Housekeeping Department

### Employees
12 employees have been added distributed across different departments

### Sample Requests
5 sample requests have been added with different types

## 🔧 Available Features

### 1. Request Display
- Display all requests in a table
- Quick statistics (total, pending, urgent, completed)
- Filter by status and type
- Search in requests

### 2. Complaint Workflow
- Detailed display of each complaint's workflow
- Different stages (submission, receipt, processing, completion)
- Employee responsible for each stage

### 3. Request Transfer
- Transfer complaint to specific department
- Select employee from the specified department
- Add transfer notes
- Send notification to the assigned employee

### 4. Notification System
- Instant notifications when complaints are transferred
- Display notifications in dashboard
- Mark notification as read

## 🔐 Permissions

- **Admin (RoleID = 2)**: Can access all features
- **Super Admin (RoleID = 1)**: Can access all features
- **Employee (RoleID = 3)**: Cannot access this page

## 📱 Interface

- Responsive design
- Support for Arabic and English languages
- Easy-to-use interface
- Clear and eye-friendly colors

## 🐛 Troubleshooting

### If data doesn't appear:
1. Make sure the server is running
2. Ensure data has been added to the database
3. Check database connection settings

### If transfers don't work:
1. Ensure there are employees in departments
2. Check data validity in employees table
3. Verify Foreign Keys are correct

## 📞 Support

If you encounter any issues, check:
1. Server logs in Terminal
2. Browser Console (F12)
3. Network tab in Developer Tools

## 🔧 Technical Details

### Database Tables
- `requests`: Stores all complaint requests
- `request_workflow`: Tracks the workflow of each request
- `notifications`: Stores user notifications
- `departments`: Department information
- `employees`: Employee information

### API Endpoints
- `GET /api/admin/requests`: Get all requests
- `GET /api/admin/requests/stats`: Get request statistics
- `GET /api/admin/requests/:id/workflow`: Get request workflow
- `POST /api/admin/requests/:id/transfer`: Transfer request
- `GET /api/admin/departments`: Get all departments
- `GET /api/admin/departments/:id/employees`: Get department employees
- `GET /api/admin/notifications/unread`: Get unread notifications
- `PUT /api/admin/notifications/:id/mark-read`: Mark notification as read

### Frontend Features
- Real-time time remaining calculation
- Dynamic status badges
- Modal dialogs for workflow and transfer
- Responsive table design
- Language toggle functionality
