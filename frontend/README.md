# MediMeet - Frontend Patient Portal

The MediMeet Frontend is a modern, responsive web application that serves as the primary interface for patients to access healthcare services, book appointments with doctors, and manage their medical needs.

## Features

### User Authentication
- **Secure Sign Up**: Easy registration process for new patients
  - Email and password registration
  - Social login options (Google, Facebook)
  - Email verification flow
  - Strong password requirements
- **Login System**: Secure authentication with JWT tokens
  - Remember me functionality
  - Session persistence across browser sessions
  - Automatic token refresh mechanism
  - Forced logout for security concerns
- **Password Recovery**: Self-service password reset functionality
  - Email-based recovery process
  - Secure time-limited reset links
  - Password strength validation
  - Multi-step verification process
- **Profile Management**: Update personal information and preferences
  - Personal details and contact information
  - Medical history and conditions
  - Insurance information storage
  - Communication preferences

### Doctor Discovery
- **Doctor Listings**: Browse through verified healthcare professionals
  - Comprehensive doctor profiles
  - Specialization and expertise details
  - Experience and qualification information
  - Patient reviews and ratings
- **Advanced Search**: Filter doctors by specialization, location, and availability
  - Multi-criteria search capabilities
  - Specialization-based filtering
  - Availability calendar filtering
  - Insurance compatibility search
- **Doctor Profiles**: Detailed information about each doctor's qualifications, experience, and ratings
  - Professional biography and education
  - Hospital and clinic affiliations
  - Languages spoken and special skills
  - Fees and insurance information
- **Top Doctors**: Featured section highlighting highly-rated specialists
  - Rating-based recommendations
  - Specialty distribution for diverse options
  - New doctor highlights
  - Special expertise indicators
- **Related Doctors**: Recommended specialists based on user preferences
  - Specialization-based recommendations
  - Location proximity suggestions
  - Previously consulted specialties
  - Personalized doctor suggestions

### Appointment Booking
- **Availability Calendar**: See real-time doctor availability
  - Interactive calendar interface
  - Color-coded availability indicators
  - Time slot filtering options
  - Timezone detection and adjustment
- **Slot Selection**: Choose convenient appointment times
  - 30-minute slot increments
  - Morning/afternoon/evening filtering
  - Next available slot suggestions
  - Multiple day view options
- **Appointment Details**: Specify reason for visit and symptoms
  - Structured symptom reporting
  - Visit reason categorization
  - Medical history inclusion
  - Special requirements indication
- **Appointment Confirmation**: Instant booking confirmation
  - Email confirmation delivery
  - SMS notification option
  - Printable confirmation page
  - Add to calendar functionality
- **Calendar Integration**: Add appointments to personal calendar
  - Google Calendar integration
  - Apple Calendar support
  - Outlook calendar compatibility
  - iCal format download option

### Video Consultations
- **Virtual Waiting Room**: Prepare for your scheduled appointment
  - Connection testing tools
  - Pre-appointment form filling
  - Waiting time indicators
  - Doctor availability status
- **Live Video Meetings**: Secure, high-quality video consultations
  - End-to-end encrypted communication
  - HD video quality with adaptive streaming
  - Bandwidth optimization
  - Reduced latency architecture
- **In-Meeting Chat**: Exchange messages during consultation
  - Text chat alongside video
  - Image sharing capabilities
  - Link sharing support
  - Chat history preservation
- **Screen Sharing**: Share medical reports or images
  - Full screen or application window sharing
  - Document camera integration
  - Collaborative annotation tools
  - High-resolution image sharing
- **Meeting Controls**: Audio/video settings and call management
  - Microphone and camera controls
  - Background noise suppression
  - Virtual background options
  - Device selection interface

### Payment Processing
- **Multiple Payment Options**: Support for various payment methods
  - Credit/debit card processing
  - UPI payments support
  - Net banking integration
  - Wallet-based payments
- **Secure Transactions**: PCI-compliant payment processing
  - Tokenized card storage
  - 3D Secure authentication
  - Fraud detection mechanisms
  - Encrypted payment details
- **Payment Confirmation**: Instant receipt generation
  - Digital receipt delivery
  - Payment confirmation notifications
  - Transaction reference generation
  - Tax information inclusion
- **Invoice History**: Access past payment details
  - Downloadable invoice PDFs
  - Payment history filtering
  - Receipt regeneration capability
  - GST/tax information display

### Appointment Management
- **My Appointments**: View all upcoming and past appointments
  - Timeline view of appointments
  - Calendar integration
  - List view with filtering options
  - Detailed appointment information
- **Appointment Status**: Track active, completed, and cancelled appointments
  - Status indicators and labels
  - Upcoming appointment countdown
  - Completion certificates for attended sessions
  - Cancellation reason tracking
- **Cancellation**: Option to cancel appointments when needed
  - Customizable cancellation reasons
  - Refund policy information
  - Rescheduling suggestions
  - Cancellation confirmation
- **Appointment Reminders**: Notifications for upcoming consultations
  - Email reminders (24h, 1h before)
  - SMS notifications
  - Push notifications (mobile app)
  - Preparation instructions
- **Medical History**: Access to past consultation notes and prescriptions
  - Chronological medical timeline
  - Doctor's notes and recommendations
  - Prescription download options
  - Follow-up tracking

### User Dashboard
- **Overview**: Quick access to appointments and notifications
  - Upcoming appointment highlights
  - Recent activity summary
  - Important notifications display
  - Quick action buttons
- **Health Records**: Store and manage personal health information
  - Medical condition tracking
  - Medication management
  - Allergy information storage
  - Vaccination records
- **Medical Documents**: Upload and store medical reports
  - Document categorization
  - OCR for searchable documents
  - Secure document sharing
  - Version history tracking
- **Prescriptions**: View and download digital prescriptions
  - E-prescription access
  - Medication instructions
  - Refill reminders
  - Pharmacy integration options

### Additional Features
- **Blog and Health Tips**: Informative articles on health topics
  - Categorized health articles
  - Doctor-authored content
  - Seasonal health advice
  - Preventive care information
- **FAQ Section**: Answers to common questions
  - Topic-based organization
  - Searchable question database
  - Interactive Q&A format
  - Guided troubleshooting
- **Contact & Support**: Easy access to customer support
  - Live chat support
  - Email ticket system
  - Phone support information
  - Knowledge base access
- **Notifications**: Email and in-app alerts for important updates
  - Customizable notification preferences
  - Important alerts highlighting
  - Notification history
  - Read/unread status tracking
- **Feedback System**: Rate and review doctor consultations
  - Post-appointment rating prompts
  - Detailed review submission
  - Anonymous feedback options
  - Service improvement suggestions
- **Careers Page**: Job opportunities within the healthcare network
  - Current openings listing
  - Job category filtering
  - Application submission system
  - Recruitment process information

## Directory Structure

```
frontend/
├── public/                  # Static files
│   ├── favicon.ico
│   ├── index.html
│   └── manifest.json
├── src/                     # Source code
│   ├── assets/              # Static assets
│   │   ├── images/          # Image files
│   │   │   ├── logo.png
│   │   │   ├── doctor_icon.svg
│   │   │   ├── appointment_img.png
│   │   │   └── ...
│   │   ├── icons/           # Icon files
│   │   └── styles/          # Global styles
│   ├── components/          # Reusable components
│   │   ├── common/          # Shared components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── ...
│   │   ├── DoctorCard.jsx   # Doctor information card
│   │   ├── AppointmentCard.jsx # Appointment display
│   │   ├── PaymentForm.jsx  # Payment input form
│   │   ├── ReviewForm.jsx   # Doctor review form
│   │   ├── TopDoctors.jsx   # Featured doctors section
│   │   ├── RelatedDoctors.jsx # Similar doctors component
│   │   ├── DoctorSkeleton.jsx # Loading placeholder
│   │   ├── JobApplicationForm.jsx # Career application
│   │   └── ...
│   ├── context/             # React Context providers
│   │   ├── AppContext.jsx   # Global application state
│   │   ├── AuthContext.jsx  # Authentication state
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js       # Authentication hook
│   │   ├── useFetch.js      # Data fetching hook
│   │   ├── useForm.js       # Form handling hook
│   │   └── ...
│   ├── layouts/             # Page layouts
│   │   ├── MainLayout.jsx   # Primary layout with header/footer
│   │   ├── AuthLayout.jsx   # Layout for auth pages
│   │   └── MeetingLayout.jsx # Video call layout
│   ├── pages/               # Application pages
│   │   ├── Home.jsx         # Landing page
│   │   ├── Login.jsx        # User login
│   │   ├── Register.jsx     # User registration
│   │   ├── Doctors.jsx      # Doctor listing
│   │   ├── Appointment.jsx  # Appointment booking
│   │   ├── MyAppointments.jsx # User appointments
│   │   ├── Profile.jsx      # User profile
│   │   ├── Meeting.jsx      # Video consultation
│   │   ├── Careers.jsx      # Job listings
│   │   ├── Payment.jsx      # Payment processing
│   │   ├── ForgotPassword.jsx # Password recovery
│   │   └── ...
│   ├── services/            # API services
│   │   ├── api.js           # Axios configuration
│   │   ├── authService.js   # Authentication API calls
│   │   ├── doctorService.js # Doctor data services
│   │   ├── appointmentService.js # Appointment APIs
│   │   └── ...
│   ├── utils/               # Utility functions
│   │   ├── dateUtils.js     # Date formatting helpers
│   │   ├── validators.js    # Form validation
│   │   ├── localStorage.js  # Local storage helpers
│   │   └── ...
│   ├── App.jsx              # Main application component
│   ├── main.jsx             # Application entry point
│   ├── routes.jsx           # Application routing
│   └── index.css            # Global CSS
├── .env                     # Environment variables
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
└── README.md                # Project documentation
```

## Key Files and Their Purposes

### Core Files
- **main.jsx**: Application entry point that renders the React app
- **App.jsx**: Main component that handles routing and global state providers
- **routes.jsx**: Defines all application routes and their corresponding components

### Important Context Providers
- **AppContext.jsx**: Provides global application state like user preferences, notifications, and settings
- **AuthContext.jsx**: Manages authentication state, login/logout functions, and token management

### Key Components
- **DoctorCard.jsx**: Reusable card component for displaying doctor information
- **AppointmentCard.jsx**: Component for rendering appointment details
- **TopDoctors.jsx**: Featured doctors section for the homepage
- **Navbar.jsx**: Global navigation header with authentication state
- **PaymentForm.jsx**: Form component for processing payments

### Main Pages
- **Home.jsx**: Landing page with featured doctors and services
- **Doctors.jsx**: Doctor listing page with search and filtering
- **Appointment.jsx**: Doctor profile and appointment booking interface
- **MyAppointments.jsx**: User's appointment management dashboard
- **Meeting.jsx**: Video consultation interface with chat and controls

### Service Modules
- **api.js**: Central API configuration with Axios and interceptors
- **authService.js**: Authentication API calls and token management
- **doctorService.js**: Doctor data fetching and manipulation
- **appointmentService.js**: Appointment creation and management APIs

## Technical Implementation
- **React.js**: Built with React for a dynamic, component-based UI
  - Functional components with hooks
  - Context API for global state management
  - Optimized rendering with memo and useCallback
  - Error boundaries for graceful error handling
- **Context API**: State management for user data and application state
  - Authentication context for user session
  - Application context for global settings
  - Custom context hooks for easy access
  - Optimized re-renders with context splitting
- **React Router**: Seamless navigation between different sections
  - Protected routes for authenticated users
  - Public routes for unauthenticated access
  - Nested routing for complex page hierarchies
  - Route-based code splitting
- **Tailwind CSS**: Modern, responsive design with utility-first CSS
  - Custom theme configuration
  - Responsive breakpoints for all devices
  - Component-specific styling
  - Dark mode support
- **Axios**: API integration with the backend services
  - Centralized API configuration
  - Request/response interceptors
  - Automatic token refresh
  - Error handling and retry logic
- **JWT Authentication**: Secure user sessions and protected routes
  - Token storage in HTTP-only cookies
  - Automatic token refresh mechanism
  - Role-based access control
  - Session timeout handling
- **LocalStorage**: Persistent user preferences and session management
  - Encrypted sensitive data storage
  - User preferences persistence
  - Form data recovery
  - Theme and language preferences
- **Form Validation**: Client-side validation for user inputs
  - Field-level validation rules
  - Real-time validation feedback
  - Form submission prevention for invalid data
  - Custom validation hooks
- **Responsive Design**: Optimized for mobile, tablet, and desktop
  - Mobile-first approach
  - Fluid layouts with Flexbox and Grid
  - Touch-friendly interface elements
  - Device-specific optimizations

## Key Pages

### Home
The landing page showcases the platform's key features and provides quick access to doctor search and appointment booking. It includes:
- Hero section with search functionality
- Featured doctors carousel
- Service category navigation
- Testimonials and reviews
- Health tips and blog preview

### Doctors
This page allows users to browse and search for doctors with advanced filtering options:
- Searchable doctor directory
- Multiple filter criteria (specialty, availability, ratings)
- Grid and list view options
- Quick appointment booking from the listing

### Appointment Booking
A multi-step process for scheduling appointments with doctors:
- Doctor profile with detailed information
- Interactive availability calendar
- Time slot selection
- Appointment reason and symptoms input
- Payment processing integration

### Video Meeting
The virtual consultation interface provides:
- Pre-meeting connection test
- Video/audio controls
- Screen sharing capability
- In-meeting chat
- Document sharing
- Recording options (with consent)

### My Appointments
A comprehensive dashboard for managing all patient appointments:
- Upcoming appointment cards with countdown
- Past appointment history
- Cancellation and rescheduling options
- Appointment filters (upcoming, completed, cancelled)
- Quick access to join virtual meetings

### Profile
User profile management with sections for:
- Personal information
- Medical history
- Saved doctors
- Payment methods
- Notification preferences
- Account settings

### Payment
Secure payment processing interface for appointment fees:
- Multiple payment method options
- Secure card information entry
- Payment confirmation
- Receipt generation
- Transaction history

## Getting Started
To run the frontend locally:
1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies with `npm install`
4. Create a `.env` file with required environment variables
5. Start the development server with `npm run dev`
6. Access the application at `http://localhost:5173` (or your configured port)

## Environment Configuration
The frontend requires a `.env` file with the following variables:
```
VITE_BACKEND_URL=http://localhost:8080
VITE_STRIPE_KEY=your_stripe_public_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_MEET_API_KEY=your_video_api_key
VITE_AUTH_TOKEN_KEY=auth_token
VITE_REFRESH_TOKEN_KEY=refresh_token
```

## Build and Deployment
To build the application for production:
1. Run `npm run build` to generate optimized assets
2. The build output will be in the `dist` directory
3. Deploy these files to your web server or hosting service

For containerized deployment, a Dockerfile is provided:
```
docker build -t medimeet-frontend .
docker run -p 80:80 medimeet-frontend
```

## Browser Compatibility
The application is optimized for:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Android Chrome)

## Accessibility
The application follows WCAG 2.1 AA guidelines:
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast
- Focus indicators for keyboard users
