import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import axios from 'axios';

const Careers = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/jobs`);
        setJobs(response.data.jobs);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('Failed to load job listings. Please try again later.');
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Fallback job listings in case API fails
  const fallbackJobs = [
    {
      id: 1,
      title: 'Registered Nurse',
      department: 'Emergency Department',
      location: 'New Delhi',
      description: 'We are looking for a compassionate Registered Nurse to join our Emergency Department team. The ideal candidate will have experience in emergency care and excellent patient communication skills.',
      requirements: 'BSc in Nursing, 2+ years of experience in emergency care, valid nursing license',
      contactEmail: 'nursing.careers@medimeet.in',
      contactPhone: '+91-7549334598'
    },
    {
      id: 2,
      title: 'Medical Receptionist',
      department: 'Front Desk',
      location: 'New Delhi',
      description: 'Join our front desk team as a Medical Receptionist. You will be the first point of contact for our patients, managing appointments, answering inquiries, and ensuring a smooth patient experience.',
      requirements: 'High school diploma, 1+ year of customer service experience, proficiency in MS Office',
      contactEmail: 'admin.careers@medimeet.in',
      contactPhone: '+91-7549334598'
    },
    {
      id: 3,
      title: 'Ambulance Driver',
      department: 'Emergency Services',
      location: 'New Delhi',
      description: 'We are seeking a reliable Ambulance Driver to transport patients safely and efficiently. The ideal candidate will have excellent driving skills and knowledge of local routes.',
      requirements: 'Valid commercial driver\'s license, clean driving record, basic life support certification',
      contactEmail: 'transport.careers@medimeet.in',
      contactPhone: '+91-7549334598'
    }
  ];

  // Use fallback jobs if API fails or returns empty
  const displayJobs = jobs.length > 0 ? jobs : fallbackJobs;

  return (
    <div className="py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800">Careers at <span className="text-blue-600">MediMeet</span></h1>
        <p className="text-gray-600 mt-2">Join our team of healthcare professionals making a difference</p>
      </div>

      <div className="flex flex-col md:flex-row mb-10">
        <div className="md:w-1/2 p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Why Work With Us?</h2>
          <p className="text-gray-600 mb-4">
            At MediMeet, we're dedicated to providing exceptional healthcare services to our community. 
            When you join our team, you become part of a supportive environment that values growth, 
            innovation, and compassionate care.
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>Competitive compensation and benefits</li>
            <li>Opportunities for professional development</li>
            <li>Work-life balance</li>
            <li>Collaborative and supportive work environment</li>
            <li>State-of-the-art facilities and technology</li>
          </ul>
        </div>
        <div className="md:w-1/2 p-6 flex items-center justify-center">
          <img 
            src={assets.contact_image} 
            alt="Healthcare professionals" 
            className="rounded-lg shadow-md max-w-full h-auto"
          />
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">Current Openings</h2>
        
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading job listings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-red-50 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayJobs.map((job) => (
              <div key={job._id || job.id} className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="bg-blue-50 p-4 border-b">
                  <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
                  <p className="text-gray-600">{job.department} | {job.location}</p>
                </div>
                <div className="p-4">
                  <p className="text-gray-700 mb-4">{job.description}</p>
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800">Requirements:</h4>
                    <p className="text-gray-600">{job.requirements}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="font-medium text-gray-800">Contact Information:</h4>
                    <p className="text-gray-600">Email: {job.contactEmail}</p>
                    <p className="text-gray-600">Phone: {job.contactPhone}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 border-t">
                  <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors duration-300">
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">How to Apply</h2>
        <p className="text-gray-600 text-center mb-6">
          To apply for any of the positions listed above, please send your resume and cover letter to the respective email address
          or contact us directly at the provided phone number. Please mention the position title in the subject line.
        </p>
        <div className="text-center">
          <p className="text-gray-700 font-medium">General Inquiries:</p>
          <p className="text-gray-600">careers@medimeet.in | +91-7549334598</p>
        </div>
      </div>
    </div>
  );
};

export default Careers; 