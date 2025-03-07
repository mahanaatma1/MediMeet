import React from 'react'

const PrivacyPolicy = () => {
  return (
    <div className="my-10">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">Introduction</h2>
          <p className="text-gray-600">
            At MediMeet, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
          <p className="text-gray-600">
            We collect personal information that you voluntarily provide to us when you register for the service, express interest in obtaining information about us or our products and services, or otherwise contact us.
          </p>
          <p className="text-gray-600 mt-2">
            The personal information we collect may include:
          </p>
          <ul className="list-disc ml-6 mt-2 text-gray-600">
            <li>Name, email address, and contact details</li>
            <li>Medical history and health information</li>
            <li>Appointment details and preferences</li>
            <li>Login information and password</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
          <ul className="list-disc ml-6 text-gray-600">
            <li>To provide and maintain our service</li>
            <li>To notify you about changes to our service</li>
            <li>To allow you to participate in interactive features</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information to improve our service</li>
            <li>To monitor the usage of our service</li>
            <li>To detect, prevent and address technical issues</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">Security of Your Information</h2>
          <p className="text-gray-600">
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no security measures are perfect or impenetrable, and we cannot guarantee the security of your information.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
          <p className="text-gray-600">
            If you have questions or concerns about this Privacy Policy, please contact us at:
          </p>
          <p className="text-gray-600 mt-2">
            Email: medimeet.in@gmail.com<br />
            Phone: +91-7549334598
          </p>
        </section>
      </div>
    </div>
  )
}

export default PrivacyPolicy 