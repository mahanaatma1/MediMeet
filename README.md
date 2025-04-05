# MediMeet - Healthcare Telemedicine Platform

MediMeet is a comprehensive telemedicine platform that connects patients with healthcare professionals for online consultations, appointment booking, and medical services.

## Overview

MediMeet streamlines the healthcare experience by providing a digital platform where patients can discover doctors, book appointments, conduct video consultations, and manage their medical records—all in one place.

## Key Features

### For Patients
- **Doctor Discovery**: Browse and search for specialists by expertise, ratings, and availability
- **Appointment Booking**: Schedule in-person or virtual appointments with preferred doctors
- **Video Consultations**: Attend secure, high-quality video meetings with healthcare providers
- **Payment Processing**: Multiple payment options with secure transactions via Razorpay and Stripe
- **Medical Records**: Store and access personal health information and medical history
- **Appointment Management**: View, reschedule, or cancel upcoming appointments

### For Doctors
- **Patient Management**: Track and manage patient appointments and medical records
- **Availability Control**: Set working hours and manage available time slots
- **Virtual Consultations**: Conduct remote consultations through integrated video conferencing
- **Professional Profile**: Showcase qualifications, expertise, and patient reviews
- **Payment Tracking**: Monitor consultation fees and payments received

### For Administrators
- **Platform Management**: Comprehensive dashboard for monitoring and controlling the platform
- **User Administration**: Manage patient accounts and doctor profiles
- **Analytics Dashboard**: Track platform usage, appointments, and revenue metrics
- **Content Management**: Update service information, blog posts, and FAQs

## System Architecture

MediMeet consists of three main components:

1. **Frontend**: Patient-facing portal built with React.js and Tailwind CSS
   - Modern responsive interface for desktop and mobile devices
   - Secure authentication and user session management
   - Real-time video integration for consultations

2. **Backend**: API services built with Node.js and Express
   - RESTful API endpoints for all platform operations
   - MongoDB database for flexible data storage
   - JWT-based authentication and authorization
   - Email notification system for appointments and updates

3. **Admin Portal**: Administrative dashboard built with React.js
   - Doctor registration and management
   - Platform configuration and settings
   - Reporting and analytics tools

## Technologies Used

- **Frontend**: React.js, Tailwind CSS, Context API
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Authentication**: JWT, bcrypt
- **Video**: WebRTC-based video conferencing
- **Payments**: Razorpay and Stripe integration
- **Email**: SMTP-based notification system
- **Cloud Storage**: Image and document storage

## Getting Started

Each component of the system has its own setup instructions:

- See `frontend/README.md` for patient portal setup
- See `backend/README.md` for API server setup
- See `admin/README.md` for administrator dashboard setup

## License

MediMeet is a proprietary software solution. All rights reserved. 