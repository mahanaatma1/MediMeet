# MediMeet - Backend API

The MediMeet Backend serves as the core server-side component of the MediMeet healthcare platform, providing robust APIs for patients, doctors, and administrators.

## Features

### User Management
- **Authentication**: Secure signup and login for patients and doctors
  - JWT-based authentication with refresh token mechanism
  - Password hashing with bcrypt for secure storage
  - Email verification for new accounts
  - Social authentication options (Google, Facebook)
- **Profile Management**: APIs to update and manage user profiles
  - Profile picture upload and management
  - Personal information updates with validation
  - Medical history and preferences management
  - Contact information verification
- **Password Recovery**: Secure password reset functionality
  - Time-limited password reset tokens
  - Email-based verification process
  - Secure reset link generation
  - Password strength validation
- **Session Management**: JWT-based authentication with token refresh
  - Configurable token expiration
  - Secure token storage recommendations
  - Device tracking for logged-in sessions
  - Forced logout capability for security incidents

### Doctor Management
- **Doctor Registration**: APIs for admin to add new doctors
  - Credential verification workflow
  - License and qualification validation
  - Professional history recording
  - Specialization assignment with validation
- **Doctor Profiles**: Endpoints to manage doctor information
  - Professional biography and credentials
  - Education and certification details
  - Languages spoken and special skills
  - Profile completeness scoring
- **Availability Control**: APIs to update doctor availability status
  - Working hours configuration
  - Time slot management with conflict prevention
  - Vacation mode with automatic rebooking options
  - Emergency unavailability handling
- **Specialization & Services**: Management of doctor specializations
  - Specialization taxonomy with hierarchical categories
  - Service pricing and duration configuration
  - Treatment types and procedure definitions
  - Special qualifications and equipment requirements

### Appointment System
- **Booking API**: Endpoints for scheduling appointments
  - Real-time availability checking
  - Slot reservation with temporary holds
  - Patient details validation
  - Conflict prevention and resolution
- **Slot Management**: APIs to check and manage available time slots
  - Custom scheduling rules per doctor
  - Buffer time configuration between appointments
  - Batch slot generation for recurring schedules
  - Holiday and special hours management
- **Cancellation & Rescheduling**: Support for modifying appointments
  - Cancellation policies with time-based rules
  - Automatic refund processing for eligible cancellations
  - Rescheduling with availability verification
  - Notification dispatching for affected parties
- **Appointment History**: Fetch past and upcoming appointments
  - Filtering by date range, doctor, status
  - Detailed appointment information retrieval
  - Medical notes and follow-up tracking
  - Patient attendance recording
- **Calendar Integration**: Generate calendar events for appointments
  - iCalendar format generation for cross-platform compatibility
  - Google Calendar and Outlook integration
  - Reminder settings configuration
  - Calendar sync status tracking

### Video Consultation
- **Meeting Creation**: APIs to initialize video consultations
  - Secure room creation with dynamic IDs
  - Participant authentication and authorization
  - Pre-meeting checks for connectivity
  - Recording settings configuration
- **Session Management**: Start, join, and end consultation sessions
  - Participant presence monitoring
  - Session duration tracking
  - Waiting room functionality
  - Technical quality metrics collection
- **Recording**: Optional recording of consultation sessions (with consent)
  - HIPAA-compliant storage of recordings
  - Access control for recorded sessions
  - Retention policy enforcement
  - Download and sharing capabilities

### Payment Processing
- **Multiple Payment Gateways**: Integration with Razorpay and Stripe
  - Seamless gateway switching based on region
  - Consistent API responses across providers
  - Payment method storage with tokenization
  - International currency support
- **Payment Verification**: Secure verification of payment status
  - Webhook handling for status updates
  - Idempotent transaction processing
  - Fraud detection measures
  - Receipt generation with tax information
- **Refund Processing**: APIs to handle refund requests
  - Full and partial refund support
  - Reason tracking and approval workflow
  - Automated refunds based on cancellation policies
  - Refund status tracking and notifications
- **Payment History**: Track all financial transactions
  - Detailed transaction records with metadata
  - Financial reporting endpoints
  - Reconciliation support
  - Export functionality for accounting

### Reviews & Ratings
- **Doctor Reviews**: Allow patients to rate and review doctors
  - Verified appointment check before review
  - Multiple category ratings (punctuality, bedside manner, etc.)
  - Text review moderation workflow
  - Photo/evidence upload capabilities
- **Rating Calculation**: Compute and update doctor ratings
  - Weighted average algorithm
  - Recent review prioritization
  - Statistical outlier handling
  - Rating aggregation across categories
- **Review Moderation**: Filter inappropriate content
  - Automated content filtering
  - Manual review flags
  - Reporter anonymity protection
  - Appeals process for rejected reviews

### Email Notifications
- **Appointment Confirmations**: Send booking confirmations to patients
  - Branded email templates
  - Dynamic content generation
  - Localization support
  - Delivery status tracking
- **Payment Receipts**: Email payment receipts and invoices
  - Detailed invoice generation
  - PDF attachment options
  - Tax and payment information inclusion
  - Digital signature for verification
- **Reminders**: Send appointment reminders before scheduled time
  - Configurable timing (24h, 1h before)
  - Multi-channel delivery (email, SMS)
  - Calendar attachment updates
  - Preparation instructions inclusion
- **System Notifications**: Administrative notifications and updates
  - Service announcements
  - Maintenance window notifications
  - New feature announcements
  - Security alert distribution

### Medical Records
- **Secure Storage**: APIs for managing patient medical records
  - Encrypted storage with access logging
  - Versioning and history tracking
  - Structured and unstructured data support
  - HIPAA and GDPR compliance measures
- **Document Upload**: Support for uploading medical documents
  - Multi-format support (PDF, DICOM, images)
  - Virus scanning and file validation
  - Metadata extraction and indexing
  - OCR for searchable document content
- **Access Control**: Restricted access to authorized personnel only
  - Role-based permissions system
  - Temporary access granting with expiration
  - Audit logging for all access events
  - Emergency access protocols with oversight

### Admin Operations
- **Dashboard Data**: Endpoints providing analytics and statistics
  - Real-time system metrics
  - Usage statistics aggregation
  - Performance indicators
  - Custom report generation
- **User Management**: APIs for managing all platform users
  - Bulk user operations
  - Account status management
  - Role and permission assignment
  - User verification workflows
- **Content Management**: Blog and information content endpoints
  - Content creation and publishing
  - Media management
  - Tagging and categorization
  - SEO metadata configuration
- **System Configuration**: Platform settings and configuration APIs
  - Feature flagging system
  - Environment-specific settings
  - Service connection parameters
  - Regional and localization settings

## Directory Structure

```
backend/
├── config/                  # Configuration files
│   ├── db.js                # Database connection setup
│   ├── emailConfig.js       # Email service configuration
│   ├── passport.js          # Authentication configuration
│   └── storage.js           # File storage configuration
├── controllers/             # Request handlers
│   ├── adminController.js   # Admin-specific operations
│   ├── appointmentController.js  # Appointment management
│   ├── doctorController.js  # Doctor-specific operations
│   ├── meetingController.js # Video consultation logic
│   ├── paymentController.js # Payment processing
│   └── userController.js    # User management and auth
├── middleware/              # Express middleware
│   ├── auth.js              # Authentication middleware
│   ├── authAdmin.js         # Admin authentication
│   ├── authDoctor.js        # Doctor authentication
│   ├── errorHandler.js      # Global error handling
│   ├── multer.js            # File upload handling
│   ├── rateLimit.js         # Rate limiting for API protection
│   └── validate.js          # Request validation
├── models/                  # Database models
│   ├── adminModel.js        # Admin user schema
│   ├── appointmentModel.js  # Appointment data schema
│   ├── doctorModel.js       # Doctor profile schema
│   ├── meetingModel.js      # Video meeting schema
│   ├── paymentModel.js      # Payment transaction schema
│   ├── reviewModel.js       # Doctor review schema
│   └── userModel.js         # Patient user schema
├── routes/                  # API route definitions
│   ├── adminRoute.js        # Admin endpoints
│   ├── appointmentRoute.js  # Appointment management routes
│   ├── doctorRoute.js       # Doctor-specific endpoints
│   ├── meetingRoute.js      # Video consultation endpoints
│   ├── paymentRoute.js      # Payment processing routes
│   └── userRoute.js         # User and auth endpoints
├── services/                # Business logic
│   ├── emailService.js      # Email composition and delivery
│   ├── paymentService.js    # Payment gateway integration
│   ├── storageService.js    # File storage operations
│   └── calendarService.js   # Calendar event generation
├── utils/                   # Utility functions
│   ├── asyncHandler.js      # Async function wrapper
│   ├── dateUtils.js         # Date manipulation helpers
│   ├── emailTemplates.js    # Email template definitions
│   ├── errorResponse.js     # Standardized error responses
│   ├── jwtUtils.js          # JWT token utilities
│   ├── logger.js            # Logging functionality
│   ├── validators.js        # Data validation functions
│   └── sendEmail.js         # Email sending utilities
├── uploads/                 # File upload directory
│   ├── doctors/             # Doctor profile pictures
│   ├── users/               # User profile pictures
│   └── documents/           # Medical document uploads
├── .env                     # Environment variables
├── .gitignore               # Git ignore file
├── index.js                 # Application entry point
├── package.json             # Dependencies and scripts
└── README.md                # Project documentation
```

## Key Files and Their Roles

### Core Files
- **index.js**: The main entry point that initializes the Express application, connects to MongoDB, and sets up routes and middleware
- **config/db.js**: Establishes and manages the MongoDB connection with error handling and retry logic
- **middleware/auth.js**: Implements JWT verification for protected routes and user identification

### Controller Examples
- **userController.js**: Handles user registration, authentication, profile management, and appointment booking
- **doctorController.js**: Manages doctor availability, profile updates, and slot management
- **paymentController.js**: Processes payments through Razorpay and Stripe, handles verification and refunds

### Model Examples
- **userModel.js**: Defines the patient schema with personal details, medical history, and authentication info
- **doctorModel.js**: Structures doctor profiles with credentials, availability, and specialized fields
- **appointmentModel.js**: Represents appointment data with relations to doctors, patients, and payment status

### Utility Highlights
- **emailTemplates.js**: Contains HTML templates for various system emails with dynamic content support
- **jwtUtils.js**: Handles token generation, verification, and refresh mechanisms
- **validators.js**: Provides validation functions for API inputs across the application

## Technical Implementation
- **Node.js & Express**: Robust and scalable server implementation
  - RESTful API design with consistent response formats
  - Modular routing with versioning support
  - Middleware pipeline for request processing
  - Error handling with appropriate HTTP status codes
- **MongoDB**: NoSQL database for flexible data storage
  - Mongoose schema validation and middleware
  - Indexing for performance optimization
  - Aggregation pipelines for complex queries
  - Transaction support for multi-document operations
- **Mongoose ODM**: Structured data models and validation
  - Pre/post hooks for data processing
  - Virtual fields for computed properties
  - Schema validation with custom validators
  - Population for relational data querying
- **JWT Authentication**: Secure user authentication and authorization
  - Access and refresh token mechanism
  - Role-based authorization checking
  - Token blacklisting for security
  - Payload encryption for sensitive data
- **Multer**: File upload handling for images and documents
  - File type validation and size limits
  - Storage strategy configuration
  - File naming and organization
  - Error handling for upload failures
- **Nodemailer**: Email service integration for notifications
  - Template-based email composition
  - HTML and plain text alternatives
  - Attachment support for documents
  - SMTP configuration with fallback options
- **Payment SDKs**: Razorpay and Stripe for payment processing
  - Webhook handlers for asynchronous updates
  - Payment intent creation and management
  - Customer and payment method storage
  - Subscription handling capabilities
- **Input Validation**: Request validation using Express-validator
  - Standardized validation chains
  - Custom validation rules
  - Sanitization for security
  - Localized error messages
- **Error Handling**: Comprehensive error management and logging
  - Centralized error middleware
  - Structured error responses
  - Error categorization and codes
  - Integration with logging systems

## API Documentation
The API follows RESTful principles with the following main routes:
- `/api/user` - Patient-related endpoints
  - POST `/register` - Register new patient account
  - POST `/login` - Authenticate patient
  - GET `/profile` - Retrieve patient profile
  - PUT `/profile` - Update patient information
  - POST `/book-appointment` - Schedule new appointment
  - GET `/my-appointments` - List patient appointments
- `/api/doctor` - Doctor-specific operations
  - POST `/login` - Doctor authentication
  - GET `/profile` - Retrieve doctor profile
  - PUT `/availability` - Update availability status
  - GET `/appointments` - List doctor's appointments
  - PUT `/slot-management` - Manage appointment slots
- `/api/admin` - Administrative functions
  - POST `/add-doctor` - Create new doctor profile
  - GET `/doctors` - List all doctors
  - GET `/users` - List all patients
  - GET `/dashboard` - Retrieve analytics data
  - PUT `/settings` - Update system settings
- `/api/appointments` - Appointment management
  - GET `/:id` - Get appointment details
  - PUT `/:id` - Update appointment status
  - DELETE `/:id` - Cancel appointment
  - POST `/:id/reschedule` - Reschedule appointment
- `/api/payments` - Payment processing and verification
  - POST `/create-payment` - Initialize payment
  - POST `/verify-razorpay` - Verify Razorpay payment
  - POST `/verify-stripe` - Verify Stripe payment
  - POST `/refund` - Process refund request
- `/api/meetings` - Video consultation management
  - POST `/create` - Create new meeting
  - GET `/:id` - Get meeting details
  - PUT `/:id/status` - Update meeting status
  - POST `/:id/recording` - Manage meeting recording

## Environment Variables
The backend requires several environment variables for configuration:
```
PORT=8080
MONGODB_URL=mongodb://localhost:27017/medimeet
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_EXPIRE=1d
JWT_REFRESH_EXPIRE=7d
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
STRIPE_SECRET_KEY=your_stripe_key
RAZORPAY_KEY_ID=your_razorpay_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
NODE_ENV=development
UPLOAD_PATH=./uploads
LOG_LEVEL=info
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## Getting Started
To run the backend locally:
1. Navigate to the backend directory
2. Install dependencies with `npm install`
3. Set up environment variables in a `.env` file
4. Start the server with `npm start` or `npm run dev` for development mode
5. Access the API at `http://localhost:8080/api`

## API Testing
Use Postman or similar tools to test API endpoints:
1. Import the provided Postman collection (available in the `/docs` folder)
2. Set up environment variables in Postman
3. Run requests against local or deployed environments

## Error Codes
The API uses standard HTTP status codes along with specific error codes:
- `AUTH_001`: Authentication required
- `AUTH_002`: Invalid credentials
- `AUTH_003`: Token expired
- `USER_001`: User not found
- `USER_002`: Email already registered
- `DOC_001`: Doctor not found
- `DOC_002`: Doctor not available
- `APPT_001`: Invalid appointment
- `APPT_002`: Slot not available
- `PAY_001`: Payment failed
- `PAY_002`: Invalid payment verification

## Security Considerations
- CORS configuration to prevent unauthorized access
  - Whitelisted origins for frontend applications
  - Pre-flight request handling
  - Credentials support for authenticated requests
- Rate limiting to protect against DDoS attacks
  - IP-based rate limiting
  - Endpoint-specific limits
  - Response headers for limit information
- Input sanitization to prevent injection attacks
  - MongoDB query injection protection
  - XSS prevention through output encoding
  - Content Security Policy implementation
- Encrypted storage of sensitive information
  - Hashed passwords with salt
  - Encrypted personal health information
  - Masked payment information
- Authorization middleware for protected routes
  - Role-based access control
  - Resource ownership verification
  - Principle of least privilege enforcement 