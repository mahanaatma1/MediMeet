# MediMeet - Admin Portal

The MediMeet Admin Portal provides a comprehensive dashboard for administrators and doctors to manage the healthcare platform efficiently.

## Features

### Admin Dashboard
- **Analytics Overview**: Track key metrics including total users, doctors, appointments, and revenue
  - Real-time charts for daily, weekly, and monthly statistics
  - Visual representation of appointment distribution by specialization
  - Revenue tracking with trend analysis
- **User Management**: Add, edit, and manage patient accounts with detailed activity tracking
  - View patient profiles, appointment history, and payment records
  - Verify patient information and medical history
  - Enable/disable user accounts when necessary
- **Doctor Management**: Add new doctors, manage profiles, and control doctor availability
  - Detailed onboarding process for healthcare professionals
  - Credential verification and specialization assignment
  - Schedule management and availability settings
- **Appointment Tracking**: Monitor all appointments across the platform with filtering capabilities
  - View upcoming, ongoing, completed, and cancelled appointments
  - Filter by date range, doctor, specialization, or status
  - Export appointment data for reporting
- **Revenue Management**: Track payments, issue refunds, and generate financial reports
  - Process refund requests from patients
  - Generate revenue reports by doctor, department, or time period
  - Export financial data for accounting purposes

### Doctor Management
- **Add New Doctors**: Complete onboarding process for healthcare professionals
  - Personal details and credentials
  - Specialization and experience
  - Availability settings
  - Fee structure
  - Educational background
  - License verification and certification upload
- **Doctor Listing**: View and manage all doctors with search and filter capabilities
  - Filter by specialization, availability, and ratings
  - Sort by experience, number of appointments, or revenue generated
  - Batch operations for multiple doctor profiles
- **Profile Editing**: Update doctor information, credentials, and availability
  - Update contact information and professional details
  - Manage photo uploads and profile visibility
  - Edit service descriptions and specialty information
- **Service Activation/Deactivation**: Control doctor visibility on the platform
  - Temporarily disable doctor profiles during leave periods
  - Set vacation modes with automatic reactivation
  - Emergency removal capabilities with audit logging

### Admin Authentication
- **Secure Login**: Admin-specific authentication system
  - Multi-factor authentication for increased security
  - Session management with automatic timeouts
  - Login attempt monitoring and suspicious activity alerts
- **Role-Based Access Control**: Different permissions for super admins and department admins
  - Customizable permission sets for different admin roles
  - Access control lists for sensitive operations
  - Department-specific view restrictions
- **Activity Logging**: Track administrative actions for security and accountability
  - Detailed audit logs of all administrative actions
  - User session tracking and IP logging
  - Exportable logs for compliance and security reviews

### Appointment Management
- **View All Appointments**: Monitor upcoming and past appointments
  - Detailed view with patient and doctor information
  - Status tracking throughout the appointment lifecycle
  - Notes and special requirements display
- **Filtering Options**: Sort by date, doctor, status, or patient
  - Advanced search functionality with multiple parameters
  - Quick filters for today's appointments and urgent cases
  - Calendar view for visual scheduling management
- **Appointment Details**: Access complete information about each appointment
  - Medical history access for relevant personnel
  - Payment status and method information
  - Communication history between patient and doctor
- **Manual Intervention**: Ability to cancel or reschedule appointments when needed
  - Admin override for scheduling conflicts
  - Emergency cancellation with notification system
  - Rescheduling tools with availability checking

### Content Management
- **Blog Management**: Add, edit, and publish healthcare articles
  - Rich text editor with image embedding capabilities
  - Category and tag management for content organization
  - Scheduled publishing and article visibility controls
- **Service Updates**: Manage available healthcare services
  - Add new specializations and service descriptions
  - Update service pricing and availability
  - Configure service-specific booking rules
- **FAQ Management**: Update frequently asked questions section
  - Category-based FAQ organization
  - Search functionality for quick answers
  - Usage analytics to identify popular questions
- **Notification System**: Send platform-wide announcements to users
  - Targeted notifications by user segment
  - Schedule announcements for future delivery
  - Template management for consistent messaging

### Financial Management
- **Payment Tracking**: Monitor all transactions on the platform
  - View payment details including method, amount, and status
  - Track payment failures and retry attempts
  - Generate transaction receipts and invoices
- **Refund Processing**: Handle patient refund requests
  - Review and approve/deny refund applications
  - Partial and full refund capabilities
  - Automatic refund processing for eligible cancellations
- **Revenue Reports**: Generate and export financial reports
  - Daily, weekly, monthly, and yearly financial summaries
  - Tax calculation and reporting assistance
  - Custom report generation with filterable parameters
- **Doctor Payments**: Manage compensation for healthcare providers
  - Configure commission and fee structures
  - Process payouts to healthcare providers
  - Track revenue sharing between platform and doctors

### Settings & Configuration
- **Platform Settings**: Configure general platform behavior
  - Working hours and holiday calendar management
  - Currency and language preferences
  - Default booking rules and cancellation policies
- **Notification Settings**: Manage email and in-app notification templates
  - Customize email templates for various events
  - Configure notification preferences and delivery methods
  - Test notification delivery from admin interface
- **Security Settings**: Control password policies and session timeouts
  - Password complexity requirements
  - Session duration and inactivity timeouts
  - IP restriction and access control settings
- **Backup & Maintenance**: Tools for database management and system maintenance
  - Schedule automatic backups
  - System health monitoring dashboard
  - Maintenance mode with user notification

## Directory Structure

```
admin/
├── public/              # Static files and assets
│   ├── favicon.ico
│   └── index.html
├── src/                 # Source code
│   ├── assets/          # Images, icons, and static resources
│   │   ├── doctor_icon.svg
│   │   ├── logo.png
│   │   └── ...
│   ├── components/      # Reusable UI components
│   │   ├── common/      # Shared components across pages
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── ...
│   │   ├── dashboard/   # Dashboard-specific components
│   │   │   ├── StatCard.jsx
│   │   │   ├── RevenueChart.jsx
│   │   │   └── ...
│   │   ├── forms/       # Form components
│   │   │   ├── DoctorForm.jsx
│   │   │   ├── SettingsForm.jsx
│   │   │   └── ...
│   │   └── tables/      # Table and data display components
│   │       ├── AppointmentsTable.jsx
│   │       ├── DoctorsTable.jsx
│   │       └── ...
│   ├── context/         # React Context providers
│   │   ├── AdminContext.jsx
│   │   ├── DoctorContext.jsx
│   │   └── AppContext.jsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── usePagination.js
│   │   └── ...
│   ├── layouts/         # Page layout templates
│   │   ├── AdminLayout.jsx
│   │   ├── DoctorLayout.jsx
│   │   └── AuthLayout.jsx
│   ├── pages/           # Application pages
│   │   ├── Admin/       # Admin-only pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DoctorsList.jsx
│   │   │   ├── AddDoctor.jsx
│   │   │   ├── PatientsList.jsx
│   │   │   ├── AllAppointments.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── ...
│   │   ├── Doctor/      # Doctor-specific pages
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── DoctorAppointments.jsx
│   │   │   ├── DoctorSettings.jsx
│   │   │   └── ...
│   │   └── Auth/        # Authentication pages
│   │       ├── Login.jsx
│   │       ├── ForgotPassword.jsx
│   │       └── ResetPassword.jsx
│   ├── services/        # API service functions
│   │   ├── adminService.js
│   │   ├── doctorService.js
│   │   ├── authService.js
│   │   └── ...
│   ├── utils/           # Utility functions and helpers
│   │   ├── dateFormatter.js
│   │   ├── validators.js
│   │   ├── notifications.js
│   │   └── ...
│   ├── App.jsx          # Main application component
│   ├── index.jsx        # Entry point
│   └── routes.jsx       # Application routing
├── .env                 # Environment variables
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── README.md            # Project documentation
```

## Key Files and Their Purposes

### Context Providers
- **AdminContext.jsx**: Manages admin authentication, state, and permissions
- **DoctorContext.jsx**: Handles doctor-specific data and operations
- **AppContext.jsx**: Provides application-wide state and configuration

### Important Pages
- **Dashboard.jsx**: Main analytics and overview dashboard
- **DoctorsList.jsx**: List of all doctors with management options
- **AddDoctor.jsx**: Form for adding new doctors to the platform
- **AllAppointments.jsx**: Comprehensive appointment management
- **Settings.jsx**: Platform configuration and settings

### Service Files
- **adminService.js**: API calls for admin-specific operations
- **doctorService.js**: API calls for doctor management
- **authService.js**: Authentication and authorization services

## Technical Implementation
- Built with React.js for responsive and dynamic user interface
- Context API for state management across the application
- Tailwind CSS for consistent and modern design components
- Axios for API communication with the backend services
- Chart.js for data visualization and analytics
- Protected routes with authentication middleware
- Responsive design for desktop and tablet access
- React Router for seamless navigation between sections
- Form validation using Formik and Yup

## Getting Started
To run the admin portal locally:
1. Navigate to the admin directory
2. Install dependencies with `npm install`
3. Create a `.env` file with required environment variables
4. Start the development server with `npm run dev`
5. Access the portal at `http://localhost:5173` (or your configured port)

## Environment Variables
```
VITE_BACKEND_URL=http://localhost:8080
VITE_AUTH_TOKEN_KEY=admin_auth_token
VITE_REFRESH_TOKEN_KEY=admin_refresh_token
```

## Security Notes
The admin portal implements several security features:
- JWT-based authentication with refresh token mechanism
- Session expiration and automatic logout
- Encrypted communication with the backend
- Input validation and sanitization to prevent injection attacks
- Role-based access control for different admin levels
- Audit logging for all sensitive operations
- XSS protection through React's inherent security features
